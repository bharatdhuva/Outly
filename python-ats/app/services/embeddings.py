from __future__ import annotations

import asyncio
import hashlib
import logging
import math
import re
from abc import ABC, abstractmethod
from collections import Counter
from collections.abc import Sequence
from functools import lru_cache

from app.config import Settings, get_settings

logger = logging.getLogger("outly.embeddings")

_STOP_WORDS = frozenset({
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and",
    "any", "are", "as", "at", "be", "because", "been", "before", "being", "below",
    "between", "both", "but", "by", "can", "could", "did", "do", "does", "doing",
    "down", "during", "each", "few", "for", "from", "further", "had", "has", "have",
    "having", "he", "her", "here", "hers", "herself", "him", "himself", "his", "how",
    "i", "if", "in", "into", "is", "it", "its", "itself", "just", "me", "more",
    "most", "my", "myself", "no", "nor", "not", "now", "of", "off", "on", "once",
    "only", "or", "other", "our", "ours", "ourselves", "out", "over", "own", "s",
    "same", "she", "should", "so", "some", "such", "t", "than", "that", "the",
    "their", "theirs", "them", "themselves", "then", "there", "these", "they",
    "this", "those", "through", "to", "too", "under", "until", "up", "very", "was",
    "we", "were", "what", "when", "where", "which", "while", "who", "whom", "why",
    "will", "with", "you", "your", "yours", "yourself", "yourselves",
})
_TOKEN_RE = re.compile(r"(?u)\b\w\w+\b")


def _tokenize_ngrams(text: str) -> list[str]:
    tokens = [t for t in _TOKEN_RE.findall(text.lower()) if t not in _STOP_WORDS]
    bigrams = [f"{tokens[i]} {tokens[i + 1]}" for i in range(len(tokens) - 1)]
    return tokens + bigrams


def _tfidf_vectors(texts: list[str], max_features: int = 4096) -> list[list[float]]:
    doc_counts = [Counter(_tokenize_ngrams(t)) for t in texts]
    n_docs = len(doc_counts)
    df: Counter[str] = Counter()
    for counts in doc_counts:
        for term in counts:
            df[term] += 1

    vocab = [term for term, _ in df.most_common(max_features)]
    if not vocab:
        return [[0.0] for _ in texts]

    idf = {term: math.log((1 + n_docs) / (1 + df[term])) + 1.0 for term in vocab}
    vectors: list[list[float]] = []
    for counts in doc_counts:
        vec = [counts[term] * idf[term] for term in vocab]
        norm = math.sqrt(sum(v * v for v in vec))
        if norm > 0:
            vec = [v / norm for v in vec]
        vectors.append(vec)
    return vectors


_CACHE: dict[str, list[float]] = {}
_CACHE_MAX = 256


def _content_hash(text: str, model: str) -> str:
    digest = hashlib.sha256(f"{model}\n{text}".encode("utf-8")).hexdigest()
    return digest


def cosine_similarity(vec_a: Sequence[float], vec_b: Sequence[float]) -> float:
    if len(vec_a) == 0 or len(vec_a) != len(vec_b):
        return 0.0
    dot = sum(a * b for a, b in zip(vec_a, vec_b))
    norm_a = math.sqrt(sum(a * a for a in vec_a))
    norm_b = math.sqrt(sum(b * b for b in vec_b))
    denom = norm_a * norm_b
    if denom == 0.0:
        return 0.0
    return max(0.0, min(1.0, dot / denom))


class EmbeddingProvider(ABC):
    name: str

    @abstractmethod
    async def embed(self, texts: list[str]) -> list[list[float]]:
        raise NotImplementedError


class TfidfEmbeddingProvider(EmbeddingProvider):
    """Local fallback so matcher and tests work without an API key."""

    name = "tfidf"

    async def embed(self, texts: list[str]) -> list[list[float]]:
        cleaned = [t if t.strip() else "empty" for t in texts]
        return await asyncio.to_thread(_tfidf_vectors, cleaned)


class GeminiEmbeddingProvider(EmbeddingProvider):
    name = "gemini"

    def __init__(self, api_key: str, model: str, timeout: float, retries: int) -> None:
        self.api_key = api_key
        self.model = model
        self.timeout = timeout
        self.retries = retries

    async def embed(self, texts: list[str]) -> list[list[float]]:
        from langchain_google_genai import GoogleGenerativeAIEmbeddings

        embeddings = GoogleGenerativeAIEmbeddings(
            model=self.model,
            google_api_key=self.api_key,
        )
        last_error: Exception | None = None
        delay = 0.5
        for attempt in range(self.retries):
            try:
                return await asyncio.wait_for(
                    asyncio.to_thread(embeddings.embed_documents, texts),
                    timeout=self.timeout,
                )
            except Exception as exc:  # noqa: BLE001
                last_error = exc
                logger.warning(
                    "gemini_embed_failed attempt=%s error=%s",
                    attempt + 1,
                    type(exc).__name__,
                )
                await asyncio.sleep(delay)
                delay *= 2
        raise RuntimeError("Gemini embeddings failed") from last_error


class CachedEmbeddingService:
    def __init__(self, provider: EmbeddingProvider) -> None:
        self.provider = provider

    @property
    def name(self) -> str:
        return self.provider.name

    async def embed_texts(self, texts: list[str]) -> list[list[float]]:
        results: list[list[float] | None] = [None] * len(texts)
        missing_idx: list[int] = []
        missing_texts: list[str] = []
        for i, text in enumerate(texts):
            key = _content_hash(text, self.provider.name)
            cached = _CACHE.get(key)
            if cached is not None:
                results[i] = cached
            else:
                missing_idx.append(i)
                missing_texts.append(text)

        if missing_texts:
            try:
                fresh = await self.provider.embed(missing_texts)
            except Exception as exc:
                logger.warning(
                    "embedding_provider_failed provider=%s falling_back=tfidf error=%s",
                    self.provider.name,
                    exc,
                )
                self.provider = TfidfEmbeddingProvider()
                fresh = await self.provider.embed(missing_texts)

            for i, vector in zip(missing_idx, fresh, strict=True):
                key = _content_hash(texts[i], self.provider.name)
                if len(_CACHE) >= _CACHE_MAX:
                    _CACHE.pop(next(iter(_CACHE)))
                _CACHE[key] = vector
                results[i] = vector

        return [v if v is not None else [] for v in results]


    async def similarity(self, a: str, b: str) -> float:
        vectors = await self.embed_texts([a[:10000], b[:10000]])
        return cosine_similarity(vectors[0], vectors[1])


def build_embedding_service(settings: Settings | None = None) -> CachedEmbeddingService:
    settings = settings or get_settings()
    if settings.has_gemini_key:
        try:
            provider: EmbeddingProvider = GeminiEmbeddingProvider(
                api_key=settings.gemini_api_key,
                model=settings.gemini_embedding_model,
                timeout=settings.embedding_timeout_seconds,
                retries=settings.llm_max_retries,
            )
            return CachedEmbeddingService(provider)
        except Exception:  # noqa: BLE001
            logger.warning("gemini_embed_init_failed falling_back=tfidf")
    return CachedEmbeddingService(TfidfEmbeddingProvider())


@lru_cache
def get_default_embedding_service() -> CachedEmbeddingService:
    return build_embedding_service()


def clear_embedding_cache() -> None:
    _CACHE.clear()


def tfidf_similarity(a: str, b: str) -> float:
    """Synchronous helper used by unit tests and as a last-resort semantic score."""
    if not a.strip() or not b.strip():
        return 0.0
    va, vb = _tfidf_vectors([a, b])
    return cosine_similarity(va, vb)


def clamp_percent(value: float) -> int:
    return int(max(0, min(100, math.floor(value * 100 + 0.5))))
