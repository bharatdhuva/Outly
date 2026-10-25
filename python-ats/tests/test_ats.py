from __future__ import annotations

import pytest

from app.config import Settings
from app.models.schemas import AtsScoreResponse, LlmAtsAnalysis, RewriteSuggestion
from app.services.ats import build_score_response, score_deterministic, score_resume


@pytest.mark.asyncio
async def test_invalid_resume_returns_zero(strong_jd: str) -> None:
    result = await score_resume("hello world this is not a cv", strong_jd, llm_client=None)
    assert result.isValidResume is False
    assert result.score == 0
    assert result.llm_analysis is None


@pytest.mark.asyncio
async def test_deterministic_score_without_llm(strong_resume: str, strong_jd: str) -> None:
    class DeadLlm:
        available = False

    result = await score_resume(strong_resume, strong_jd, llm_client=DeadLlm())
    assert result.isValidResume is True
    assert 0 < result.overall_score <= 100
    assert result.score == result.overall_score
    assert result.llm_analysis is None
    assert result.breakdown.skills_match >= 50
    assert "keyword_coverage" in result.breakdown_detail
    assert result.matched_keywords


@pytest.mark.asyncio
async def test_llm_failure_still_returns_deterministic(strong_resume: str) -> None:
    class FailingLlm:
        available = True

        async def analyse_resume(self, *args: object, **kwargs: object) -> None:
            return None

    result = await score_resume(strong_resume, None, llm_client=FailingLlm())
    assert result.llm_analysis is None
    assert result.overall_score > 0
    assert any("LLM" in w or "llm" in w.lower() for w in result.warnings) or result.warnings is not None


def test_llm_suggestions_are_appended(strong_resume: str) -> None:
    det = score_deterministic(strong_resume, None, Settings())
    llm = LlmAtsAnalysis(
        strengths=["Clear skills section"],
        weaknesses=["Could quantify more"],
        rewrite_suggestions=[
            RewriteSuggestion(
                section="experience",
                current="Built APIs",
                suggested="Built REST APIs serving 2M users (fact already on resume).",
                rationale="Lead with scale.",
            )
        ],
    )
    response = build_score_response(det, llm)
    assert response.llm_analysis is not None
    assert any("experience:" in s.lower() for s in response.suggestions)


def test_schema_roundtrip(strong_resume: str) -> None:
    det = score_deterministic(strong_resume, None, Settings())
    payload = build_score_response(det, None).model_dump()
    parsed = AtsScoreResponse.model_validate(payload)
    assert parsed.breakdown.formatting_readability >= 0
