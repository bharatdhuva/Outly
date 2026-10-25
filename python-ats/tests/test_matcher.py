from __future__ import annotations

import pytest

from app.config import Settings
from app.services.embeddings import TfidfEmbeddingProvider, CachedEmbeddingService
from app.services.matcher import match_resume_to_jd
from app.services.skills import extract_jd_requirements


@pytest.mark.asyncio
async def test_strong_partial_poor_ordering(
    strong_resume: str,
    partial_resume: str,
    poor_resume: str,
    strong_jd: str,
) -> None:
    embeddings = CachedEmbeddingService(TfidfEmbeddingProvider())
    strong = await match_resume_to_jd(strong_resume, strong_jd, embeddings)
    partial = await match_resume_to_jd(partial_resume, strong_jd, embeddings)
    poor = await match_resume_to_jd(poor_resume, strong_jd, embeddings)
    assert strong.match_score > partial.match_score > poor.match_score
    assert strong.missing_must_have == [] or len(strong.missing_must_have) < len(poor.missing_must_have)
    assert "advisory" in strong.explanation.lower()


@pytest.mark.asyncio
async def test_offline_tfidf_without_api_key(partial_resume: str, partial_jd: str) -> None:
    result = await match_resume_to_jd(partial_resume, partial_jd, embeddings=None)
    assert result.embedding_provider == "tfidf"
    assert 0 <= result.match_score <= 100
    assert result.section_similarity.overall >= 0


@pytest.mark.asyncio
async def test_monotonic_must_have_skill(partial_resume: str, partial_jd: str) -> None:
    embeddings = CachedEmbeddingService(TfidfEmbeddingProvider())
    req = extract_jd_requirements(partial_jd)
    missing = None
    base = await match_resume_to_jd(partial_resume, partial_jd, embeddings)
    for skill in req.must_have:
        if skill not in base.matched_skills:
            missing = skill
            break
    assert missing is not None, "fixture should leave at least one must-have unmatched"
    improved_resume = partial_resume + f"\nSkills: {missing}\nUsed {missing} in production for 2 years."
    improved = await match_resume_to_jd(improved_resume, partial_jd, embeddings)
    assert improved.match_score >= base.match_score
    assert missing in improved.matched_skills
    assert missing not in improved.missing_must_have


@pytest.mark.asyncio
async def test_weights_are_configurable(strong_resume: str, strong_jd: str) -> None:
    embeddings = CachedEmbeddingService(TfidfEmbeddingProvider())
    skill_heavy = Settings(match_skill_weight=0.9, match_semantic_weight=0.05, match_seniority_weight=0.05)
    semantic_heavy = Settings(match_skill_weight=0.1, match_semantic_weight=0.8, match_seniority_weight=0.1)
    a = await match_resume_to_jd(strong_resume, strong_jd, embeddings, skill_heavy)
    b = await match_resume_to_jd(strong_resume, strong_jd, embeddings, semantic_heavy)
    assert a.breakdown.technicalSkillsScore == b.breakdown.technicalSkillsScore
    assert a.match_score != b.match_score or a.embeddingSimilarity == b.embeddingSimilarity
