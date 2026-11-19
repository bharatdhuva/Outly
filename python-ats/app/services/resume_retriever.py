from __future__ import annotations

import asyncio
import logging
import re

from app.config import Settings

logger = logging.getLogger("outly.resume_retriever")


def _lexical_retrieve(chunks: list[str], query: str, limit: int = 6) -> list[str]:
    terms = {term for term in re.findall(r"[a-zA-Z0-9+#.-]{2,}", query.lower())}
    ranked = sorted(
        chunks,
        key=lambda chunk: sum(1 for term in terms if re.search(rf"(?<!\w){re.escape(term)}(?!\w)", chunk.lower())),
        reverse=True,
    )
    return [chunk for chunk in ranked[:limit] if chunk.strip()]


async def retrieve_resume_evidence(resume: str, jd: str, settings: Settings) -> tuple[str, str]:
    """Index resume chunks with LangChain, then retrieve evidence relevant to this JD."""
    from langchain_core.documents import Document
    from langchain_text_splitters import RecursiveCharacterTextSplitter

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=900,
        chunk_overlap=120,
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    chunks = splitter.split_text(resume)
    documents = [
        Document(page_content=chunk, metadata={"chunk": index})
        for index, chunk in enumerate(chunks)
    ]
    if not documents:
        return "", "empty"

    if not settings.has_gemini_key:
        return "\n\n".join(_lexical_retrieve(chunks, jd)), "lexical_fallback"

    try:
        from langchain_core.vectorstores import InMemoryVectorStore
        from langchain_google_genai import GoogleGenerativeAIEmbeddings

        embeddings = GoogleGenerativeAIEmbeddings(
            model=settings.gemini_embedding_model,
            google_api_key=settings.gemini_api_key,
        )
        store = InMemoryVectorStore(embeddings)
        await asyncio.wait_for(store.aadd_documents(documents), timeout=settings.embedding_timeout_seconds)
        matches = await asyncio.wait_for(
            store.asimilarity_search(jd[: settings.max_text_chars], k=min(6, len(documents))),
            timeout=settings.embedding_timeout_seconds,
        )
        return "\n\n".join(doc.page_content for doc in matches), "gemini_embeddings"
    except Exception as exc:  # noqa: BLE001
        logger.warning("Resume semantic retrieval failed; using lexical retrieval: %s", type(exc).__name__)
        matches = _lexical_retrieve(chunks, jd)
        return "\n\n".join(matches), "lexical_fallback"
