from __future__ import annotations

import re

from app.config import Settings, get_settings
from app.models.schemas import MatchBreakdown, MatchResponse, SectionSimilarity
from app.services.embeddings import CachedEmbeddingService, clamp_percent, tfidf_similarity
from app.services.parser import sanitise_text
from app.services.skills import (
    extract_jd_requirements,
    extract_seniority_rank,
    extract_skills,
    extract_years,
    skill_overlap_score,
)

SECTION_SPLIT = re.compile(
    r"(?im)^(summary|professional summary|objective|profile|skills|technical skills|"
    r"experience|work experience|professional experience|education|projects)\b.*$"
)


def _slice_sections(text: str) -> dict[str, str]:
    matches = list(SECTION_SPLIT.finditer(text))
    buckets = {"summary": "", "skills": "", "experience": ""}
    if not matches:
        return {"summary": text[:1500], "skills": text, "experience": text}
    for i, match in enumerate(matches):
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        body = text[match.end() : end].strip()
        key = match.group(1).lower()
        if "skill" in key:
            buckets["skills"] += "\n" + body
        elif "experience" in key or "work" in key:
            buckets["experience"] += "\n" + body
        elif "summary" in key or "objective" in key or "profile" in key:
            buckets["summary"] += "\n" + body
    for key, value in buckets.items():
        if not value.strip():
            buckets[key] = text[:1200]
    return buckets


def seniority_fit(resume: str, jd: str) -> float:
    """0-1 score. Missing data yields a neutral 0.6 so it does not dominate."""
    resume_years = extract_years(resume)
    jd_years = extract_years(jd)
    resume_rank = extract_seniority_rank(resume)
    jd_rank = extract_seniority_rank(jd)

    year_score = 0.6
    if resume_years is not None and jd_years is not None:
        if resume_years >= jd_years:
            year_score = 1.0
        elif resume_years >= jd_years - 1:
            year_score = 0.85
        elif resume_years >= jd_years - 2:
            year_score = 0.65
        else:
            year_score = max(0.2, 1.0 - (jd_years - resume_years) * 0.15)

    rank_score = 0.6
    if resume_rank is not None and jd_rank is not None:
        delta = resume_rank - jd_rank
        if delta >= 0:
            rank_score = 1.0
        elif delta == -1:
            rank_score = 0.75
        else:
            rank_score = 0.4

    return (year_score * 0.7) + (rank_score * 0.3)


def _explain(
    match_score: int,
    skill_pct: int,
    semantic_pct: int,
    seniority_pct: int,
    matched: list[str],
    missing_must: list[str],
    missing_nice: list[str],
) -> str:
    parts = [
        f"Advisory match score is {match_score}/100.",
        f"Weighted skill overlap is {skill_pct}/100 "
        f"({len(matched)} overlapping skills; {len(missing_must)} missing must-haves).",
        f"Semantic similarity is {semantic_pct}/100.",
        f"Experience/seniority fit is {seniority_pct}/100.",
    ]
    if missing_must:
        parts.append("Largest gaps: " + ", ".join(missing_must[:6]) + ".")
    elif missing_nice:
        parts.append("Core requirements look covered; remaining gaps are nice-to-haves.")
    else:
        parts.append("Skill coverage against the extracted JD taxonomy is strong.")
    parts.append("This is advisory only — it is not an accept/reject decision.")
    return " ".join(parts)


async def match_resume_to_jd(
    resume: str,
    jd: str,
    embeddings: CachedEmbeddingService | None = None,
    settings: Settings | None = None,
) -> MatchResponse:
    settings = settings or get_settings()
    resume = sanitise_text(resume, settings.max_text_chars)
    jd = sanitise_text(jd, settings.max_text_chars)

    resume_skills = extract_skills(resume)
    req = extract_jd_requirements(jd)
    overlap, matched, missing_must, missing_nice = skill_overlap_score(
        resume_skills.set, req.must_have, req.nice_to_have, resume_text=resume
    )
    skill_pct = clamp_percent(overlap)

    sections = _slice_sections(resume)
    provider_name = "tfidf"
    if embeddings is not None:
        provider_name = embeddings.name
        semantic = await embeddings.similarity(resume, jd)
        summary_sim = await embeddings.similarity(sections["summary"], jd)
        skills_sim = await embeddings.similarity(
            sections["skills"] or " ".join(resume_skills.canonical), jd
        )
        exp_sim = await embeddings.similarity(sections["experience"], jd)
    else:
        semantic = tfidf_similarity(resume, jd)
        summary_sim = tfidf_similarity(sections["summary"], jd)
        skills_sim = tfidf_similarity(sections["skills"] or " ".join(resume_skills.canonical), jd)
        exp_sim = tfidf_similarity(sections["experience"], jd)

    semantic_pct = clamp_percent(semantic)
    seniority = seniority_fit(resume, jd)
    seniority_pct = clamp_percent(seniority)

    w_skill, w_sem, w_sen = settings.match_weights
    # Skill overlap is the monotone component. Semantic/seniority cannot drag
    # the score below skill_pct when coverage is already high, but they can lift it.
    hybrid = (w_skill * overlap) + (w_sem * semantic) + (w_sen * seniority)
    match_score = clamp_percent(hybrid)

    missing_all = [*missing_must, *missing_nice]
    section = SectionSimilarity(
        summary=clamp_percent(summary_sim),
        skills=clamp_percent(skills_sim),
        experience=clamp_percent(exp_sim),
        overall=semantic_pct,
    )
    recommendations: list[str] = []
    if missing_must:
        recommendations.append(
            "Add evidence (not claims) for missing must-have skills: " + ", ".join(missing_must[:8])
        )
    if missing_nice:
        recommendations.append("Nice-to-have gaps: " + ", ".join(missing_nice[:6]))
    if seniority_pct < 70:
        recommendations.append("Clarify years of experience and seniority in the summary.")
    if not recommendations:
        recommendations.append("Mirror JD phrasing in experience bullets for the matched skills.")

    explanation = _explain(
        match_score, skill_pct, semantic_pct, seniority_pct, matched, missing_must, missing_nice
    )
    breakdown = MatchBreakdown(
        technicalSkillsScore=skill_pct,
        experienceAlignmentScore=seniority_pct,
        roleReadinessScore=match_score,
    )
    return MatchResponse(
        matchScore=match_score,
        match_score=match_score,
        embeddingSimilarity=semantic_pct,
        matchedSkills=matched,
        matched_skills=matched,
        missingSkills=missing_all,
        missing_must_have=missing_must,
        missing_nice_to_have=missing_nice,
        recommendations=recommendations,
        summary=explanation,
        explanation=explanation,
        breakdown=breakdown,
        section_similarity=section,
        embedding_provider=provider_name,
    )
