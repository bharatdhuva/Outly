from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, field_validator

SeniorityMatch = Literal["Good", "Fair", "Poor"]


class ScoreTextRequest(BaseModel):
    resume: str = Field(..., min_length=1)
    jd: str | None = None

    @field_validator("resume", "jd", mode="before")
    @classmethod
    def _coerce_str(cls, value: object) -> object:
        if value is None:
            return value
        return str(value)


class MatchTextRequest(BaseModel):
    resume: str = Field(..., min_length=1)
    jd: str = Field(..., min_length=1)


class TailorTextRequest(BaseModel):
    resume: str = Field(..., min_length=1)
    jd: str = Field(..., min_length=1)


class ParseFileResponse(BaseModel):
    filename: str
    content: str


class CategoryScore(BaseModel):
    score: float = Field(..., ge=0)
    max: float = Field(..., gt=0)
    reasons: list[str] = Field(default_factory=list)


class MissingKeywords(BaseModel):
    hard_skills: list[str] = Field(default_factory=list)
    soft_skills: list[str] = Field(default_factory=list)
    tools_technologies: list[str] = Field(default_factory=list)


class ExperienceAnalysis(BaseModel):
    seniority_match: SeniorityMatch = "Fair"
    comments: str = ""


class FrontendBreakdown(BaseModel):
    skills_match: int = Field(..., ge=0, le=100)
    experience_match: int = Field(..., ge=0, le=100)
    formatting_readability: int = Field(..., ge=0, le=100)
    impact_metrics: int = Field(..., ge=0, le=100)


class RewriteSuggestion(BaseModel):
    section: str
    current: str = ""
    suggested: str
    rationale: str


class LlmAtsAnalysis(BaseModel):
    """Gemini structured output. Facts must come from the resume only."""

    strengths: list[str] = Field(default_factory=list)
    weaknesses: list[str] = Field(default_factory=list)
    rewrite_suggestions: list[RewriteSuggestion] = Field(default_factory=list)
    seniority_match: SeniorityMatch = "Fair"
    seniority_comments: str = ""
    inferred_hard_skills: list[str] = Field(default_factory=list)
    inferred_soft_skills: list[str] = Field(default_factory=list)
    inferred_tools: list[str] = Field(default_factory=list)


class AtsScoreResponse(BaseModel):
    """Frontend-compatible ATS payload plus additive explainability fields."""

    score: int = Field(..., ge=0, le=100)
    overall_score: int = Field(..., ge=0, le=100)
    isValidResume: bool = True
    breakdown: FrontendBreakdown
    breakdown_detail: dict[str, CategoryScore] = Field(default_factory=dict)
    matched_keywords: list[str] = Field(default_factory=list)
    missing_keywords: MissingKeywords = Field(default_factory=MissingKeywords)
    experience_analysis: ExperienceAnalysis = Field(default_factory=ExperienceAnalysis)
    formatting_issues: list[str] = Field(default_factory=list)
    suggestions: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    llm_analysis: LlmAtsAnalysis | None = None
    error: str | None = None


class MatchBreakdown(BaseModel):
    technicalSkillsScore: int = Field(..., ge=0, le=100)
    experienceAlignmentScore: int = Field(..., ge=0, le=100)
    roleReadinessScore: int = Field(..., ge=0, le=100)


class SectionSimilarity(BaseModel):
    summary: int = Field(..., ge=0, le=100)
    skills: int = Field(..., ge=0, le=100)
    experience: int = Field(..., ge=0, le=100)
    overall: int = Field(..., ge=0, le=100)


class MatchResponse(BaseModel):
    matchScore: int = Field(..., ge=0, le=100)
    match_score: int = Field(..., ge=0, le=100)
    embeddingSimilarity: int = Field(..., ge=0, le=100)
    matchedSkills: list[str] = Field(default_factory=list)
    matched_skills: list[str] = Field(default_factory=list)
    missingSkills: list[str] = Field(default_factory=list)
    missing_must_have: list[str] = Field(default_factory=list)
    missing_nice_to_have: list[str] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)
    summary: str = ""
    explanation: str = ""
    breakdown: MatchBreakdown
    section_similarity: SectionSimilarity
    embedding_provider: str = "tfidf"


class TailoredSections(BaseModel):
    summary: str = ""
    skills: list[str] = Field(default_factory=list)
    experienceBullets: list[str] = Field(default_factory=list)
    projects: list[str] = Field(default_factory=list)


class TailorResponse(BaseModel):
    tailoredResume: str
    matchedKeywords: list[str] = Field(default_factory=list)
    matchCount: int = 0
    missingKeywords: MissingKeywords = Field(default_factory=MissingKeywords)
    sources: list[dict[str, str]] = Field(default_factory=list)
    sections: TailoredSections | None = None
    modificationsSummary: list[str] = Field(default_factory=list)


class ErrorResponse(BaseModel):
    error: str


class LlmTailorResult(BaseModel):
    tailoredResume: str
    matchedKeywords: list[str] = Field(default_factory=list)
    missingKeywords: MissingKeywords = Field(default_factory=MissingKeywords)
    sections: TailoredSections = Field(default_factory=TailoredSections)
    modificationsSummary: list[str] = Field(default_factory=list)
