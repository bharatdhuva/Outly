from __future__ import annotations

import re
from dataclasses import dataclass

from app.config import Settings, get_settings
from app.models.schemas import (
    AtsScoreResponse,
    CategoryScore,
    ExperienceAnalysis,
    FrontendBreakdown,
    LlmAtsAnalysis,
    MissingKeywords,
)
from app.services.parser import sanitise_text
from app.services.skills import (
    classify_skill,
    extract_jd_requirements,
    extract_skills,
    extract_years,
    skill_overlap_score,
)
from app.services.validator import validate_job_description_text, validate_resume_text

EMAIL_RE = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b")
PHONE_RE = re.compile(r"(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}")
LINK_RE = re.compile(r"linkedin\.com|github\.com", re.I)

SECTION_PATTERNS: dict[str, re.Pattern[str]] = {
    "summary": re.compile(
        r"\b(summary|professional summary|objective|career objective|profile|about me)\b",
        re.I,
    ),
    "skills": re.compile(
        r"\b(skills|technical skills|core competencies|technologies|programming languages)\b",
        re.I,
    ),
    "experience": re.compile(
        r"\b(experience|work history|employment|professional experience|work experience)\b",
        re.I,
    ),
    "education": re.compile(r"\b(education|academic|university|college|degree)\b", re.I),
    "projects": re.compile(r"\b(projects|personal projects|key projects)\b", re.I),
}

ACTION_VERBS = {
    "achieved",
    "architected",
    "automated",
    "built",
    "collaborated",
    "created",
    "delivered",
    "designed",
    "developed",
    "drove",
    "improved",
    "increased",
    "launched",
    "led",
    "optimized",
    "owned",
    "reduced",
    "implemented",
    "shipped",
    "scaled",
    "migrated",
    "refactored",
    "mentored",
    "deployed",
}

QUANT_RE = re.compile(r"\b\d+(\.\d+)?\s?(%|x|ms|s|k|m|b)?\b|\$\s?\d+", re.I)
BULLET_RE = re.compile(r"(?m)^\s*(?:[-*•●]|\d+[.)])\s+(.+)$")
SENTENCE_RE = re.compile(r"[.!?]+")


@dataclass
class DeterministicAts:
    overall: int
    detail: dict[str, CategoryScore]
    matched: list[str]
    missing: MissingKeywords
    formatting_issues: list[str]
    suggestions: list[str]
    warnings: list[str]
    seniority: ExperienceAnalysis
    notes: str


def _present_sections(text: str) -> dict[str, bool]:
    return {name: bool(pattern.search(text)) for name, pattern in SECTION_PATTERNS.items()}


def _score_contact(text: str) -> CategoryScore:
    reasons: list[str] = []
    score = 0.0
    if EMAIL_RE.search(text):
        score += 4
        reasons.append("Email address detected in the document body.")
    else:
        reasons.append("No email address found in the body (headers/footers may be invisible to ATS).")
    if PHONE_RE.search(text):
        score += 3
        reasons.append("Phone number detected.")
    else:
        reasons.append("No phone number detected.")
    if LINK_RE.search(text):
        score += 3
        reasons.append("LinkedIn or GitHub URL detected.")
    else:
        reasons.append("No LinkedIn/GitHub URL detected.")
    return CategoryScore(score=score, max=10, reasons=reasons)


def _score_sections(text: str) -> CategoryScore:
    present = _present_sections(text)
    weights = {"summary": 4, "skills": 5, "experience": 5, "education": 4, "projects": 2}
    score = 0.0
    reasons: list[str] = []
    for name, weight in weights.items():
        if present[name]:
            score += weight
            reasons.append(f"Found a {name} section.")
        else:
            reasons.append(f"Missing a clear {name} heading.")
    return CategoryScore(score=score, max=20, reasons=reasons)


def _score_length_format(text: str) -> tuple[CategoryScore, list[str]]:
    words = re.findall(r"\b\w+\b", text)
    n = len(words)
    reasons: list[str] = []
    issues: list[str] = []
    score = 10.0
    if n < 250:
        score -= 5
        reasons.append(f"Resume is short ({n} words); ATS parsers prefer 400–900 words.")
        issues.append("Resume appears shorter than a typical one-to-two page CV.")
    elif n > 1400:
        score -= 4
        reasons.append(f"Resume is long ({n} words); consider tightening to two pages.")
        issues.append("Length may exceed typical ATS/recruiter attention span.")
    else:
        reasons.append(f"Length looks reasonable ({n} words).")

    if re.search(r"\|.+\|", text) or text.count("\t") > 20:
        score -= 2
        issues.append("Table-like or multi-column markers detected; these often break ATS parsers.")
        reasons.append("Possible table/column layout.")
    if re.search(r"[\uE000-\uF8FF]", text):
        score -= 1
        issues.append("Private-use / icon glyphs detected; replace icons with plain text.")
    score = max(0.0, score)
    return CategoryScore(score=score, max=10, reasons=reasons), issues


def _score_bullets(text: str) -> CategoryScore:
    bullets = BULLET_RE.findall(text)
    reasons: list[str] = []
    if not bullets:
        # Fall back to line-like sentences in experience-ish blocks
        bullets = [ln.strip() for ln in text.splitlines() if 40 < len(ln.strip()) < 280][:20]
        reasons.append("No clear bullet list found; scoring longer lines as proxy bullets.")
    if not bullets:
        return CategoryScore(score=4, max=20, reasons=["Could not detect bullet points."])

    verb_hits = 0
    quant_hits = 0
    for bullet in bullets:
        first = bullet.strip().split(" ", 1)[0].lower().strip(".,:")
        if first in ACTION_VERBS:
            verb_hits += 1
        if QUANT_RE.search(bullet):
            quant_hits += 1
    verb_ratio = verb_hits / len(bullets)
    quant_ratio = quant_hits / len(bullets)
    score = 6 + (verb_ratio * 8) + (quant_ratio * 6)
    score = min(20.0, score)
    reasons.append(f"{verb_hits}/{len(bullets)} bullets start with an action verb.")
    reasons.append(f"{quant_hits}/{len(bullets)} bullets include a number or metric.")
    return CategoryScore(score=round(score, 2), max=20, reasons=reasons)


def _score_keywords(resume: str, jd: str | None) -> tuple[CategoryScore, list[str], MissingKeywords]:
    resume_skills = extract_skills(resume)
    if jd and jd.strip():
        req = extract_jd_requirements(jd)
        overlap, matched, missing_must, missing_nice = skill_overlap_score(
            resume_skills.set, req.must_have, req.nice_to_have
        )
        score = overlap * 25
        reasons = [
            f"Matched {len(matched)} of {len(req.must_have) + len(req.nice_to_have)} JD skills.",
            f"Missing must-have: {', '.join(missing_must[:8]) or 'none'}.",
        ]
        missing = MissingKeywords()
        for skill in missing_must + missing_nice:
            bucket = classify_skill(skill)
            getattr(missing, bucket).append(skill)
        return CategoryScore(score=round(score, 2), max=25, reasons=reasons), matched, missing

    matched = resume_skills.canonical
    density = min(1.0, len(matched) / 12)
    score = 10 + density * 15
    reasons = [f"No JD provided. Detected {len(matched)} taxonomy skills on the resume."]
    missing = MissingKeywords(
        hard_skills=["Role-specific keywords from a target JD"],
        tools_technologies=[],
        soft_skills=[],
    )
    return CategoryScore(score=round(score, 2), max=25, reasons=reasons), matched, missing


def _score_readability(text: str) -> CategoryScore:
    sentences = [s.strip() for s in SENTENCE_RE.split(text) if s.strip()]
    words = re.findall(r"\b\w+\b", text)
    reasons: list[str] = []
    score = 12.0
    if sentences:
        avg = len(words) / max(1, len(sentences))
        if avg > 32:
            score -= 4
            reasons.append(f"Average sentence length is high ({avg:.0f} words).")
        elif avg < 8:
            score -= 2
            reasons.append("Sentences look fragmented; check PDF extraction.")
        else:
            reasons.append(f"Sentence length is readable ({avg:.0f} words on average).")
    first_person = len(re.findall(r"\bI\b|\bmy\b", text))
    if first_person > 8:
        score -= 2
        reasons.append("Frequent first-person pronouns; ATS-friendly resumes usually omit 'I'.")
    score = max(0.0, min(15.0, score))
    return CategoryScore(score=score, max=15, reasons=reasons)


def _seniority(resume: str, jd: str | None) -> ExperienceAnalysis:
    resume_years = extract_years(resume)
    jd_years = extract_years(jd or "")
    if jd_years is None and resume_years is None:
        return ExperienceAnalysis(
            seniority_match="Fair",
            comments="Could not infer years of experience from the text.",
        )
    if jd_years is None:
        return ExperienceAnalysis(
            seniority_match="Good",
            comments=f"Resume indicates about {resume_years:.0f} years of experience.",
        )
    if resume_years is None:
        return ExperienceAnalysis(
            seniority_match="Fair",
            comments=f"JD asks for about {jd_years:.0f} years; resume does not state tenure clearly.",
        )
    delta = resume_years - jd_years
    if delta >= 0:
        match: str = "Good"
    elif delta >= -2:
        match = "Fair"
    else:
        match = "Poor"
    return ExperienceAnalysis(
        seniority_match=match,  # type: ignore[arg-type]
        comments=f"Resume ~{resume_years:.0f} years vs JD ~{jd_years:.0f} years.",
    )


def _to_100(category: CategoryScore) -> int:
    return int(round(100 * category.score / category.max))


def score_deterministic(resume: str, jd: str | None, settings: Settings) -> DeterministicAts:
    resume = sanitise_text(resume, settings.max_text_chars)
    jd_clean = sanitise_text(jd, settings.max_text_chars) if jd else ""

    contact = _score_contact(resume)
    sections = _score_sections(resume)
    length, format_issues = _score_length_format(resume)
    bullets = _score_bullets(resume)
    keywords, matched, missing = _score_keywords(resume, jd_clean or None)
    readability = _score_readability(resume)
    seniority = _seniority(resume, jd_clean or None)

    detail = {
        "contact_info": contact,
        "sections": sections,
        "length_format": length,
        "bullet_quality": bullets,
        "keyword_coverage": keywords,
        "readability": readability,
    }
    overall = int(round(sum(item.score for item in detail.values())))
    overall = max(0, min(100, overall))

    suggestions: list[str] = []
    warnings: list[str] = []
    if contact.score < 7:
        suggestions.append("Place email, phone, and LinkedIn/GitHub as plain text at the top of the resume.")
    if sections.score < 16:
        missing_heads = [r for r in sections.reasons if r.startswith("Missing")]
        suggestions.extend(missing_heads[:3])
    if bullets.score < 14:
        suggestions.append("Start bullets with action verbs and add quantified outcomes (%, time, scale).")
    if keywords.score < 18 and jd_clean:
        hard = missing.hard_skills[:5]
        if hard:
            suggestions.append(
                "If you have used them, add these JD keywords in Skills or Experience: "
                + ", ".join(hard)
                + "."
            )
    if not suggestions:
        suggestions.append("Keep section headings standard (Experience, Education, Skills) and metrics in bullets.")

    if not EMAIL_RE.search(resume):
        format_issues.append("Ensure email is in the main body, not only in a header/footer.")
        warnings.append("Contact email missing from extracted text.")

    notes = "; ".join(
        f"{name}: {int(cat.score)}/{int(cat.max)}" for name, cat in detail.items()
    )
    return DeterministicAts(
        overall=overall,
        detail=detail,
        matched=matched,
        missing=missing,
        formatting_issues=format_issues,
        suggestions=suggestions[:5],
        warnings=warnings,
        seniority=seniority,
        notes=notes,
    )


def invalid_resume_response(error: str) -> AtsScoreResponse:
    zero = FrontendBreakdown(
        skills_match=0,
        experience_match=0,
        formatting_readability=0,
        impact_metrics=0,
    )
    return AtsScoreResponse(
        score=0,
        overall_score=0,
        isValidResume=False,
        breakdown=zero,
        breakdown_detail={},
        matched_keywords=[],
        missing_keywords=MissingKeywords(),
        experience_analysis=ExperienceAnalysis(
            seniority_match="Poor",
            comments="The uploaded document is not a valid resume/CV.",
        ),
        formatting_issues=["The document structure is invalid for resume analysis."],
        suggestions=[
            "Please upload a valid resume/CV containing standard sections like Experience, Education, or Skills."
        ],
        warnings=[error],
        llm_analysis=None,
        error=error,
    )


def build_score_response(
    det: DeterministicAts,
    llm: LlmAtsAnalysis | None,
) -> AtsScoreResponse:
    breakdown = FrontendBreakdown(
        skills_match=_to_100(det.detail["keyword_coverage"]),
        experience_match=_to_100(det.detail["sections"]),
        formatting_readability=int(
            round(
                (
                    _to_100(det.detail["contact_info"])
                    + _to_100(det.detail["length_format"])
                    + _to_100(det.detail["readability"])
                )
                / 3
            )
        ),
        impact_metrics=_to_100(det.detail["bullet_quality"]),
    )
    suggestions = list(det.suggestions)
    missing = det.missing
    seniority = det.seniority
    if llm:
        for item in llm.rewrite_suggestions:
            line = f"{item.section}: {item.suggested}"
            if line not in suggestions:
                suggestions.append(line)
        suggestions = suggestions[:8]
        if llm.seniority_comments:
            seniority = ExperienceAnalysis(
                seniority_match=llm.seniority_match,
                comments=llm.seniority_comments,
            )
        if llm.inferred_hard_skills:
            missing = MissingKeywords(
                hard_skills=list(dict.fromkeys([*missing.hard_skills, *llm.inferred_hard_skills])),
                soft_skills=list(dict.fromkeys([*missing.soft_skills, *llm.inferred_soft_skills])),
                tools_technologies=list(dict.fromkeys([*missing.tools_technologies, *llm.inferred_tools])),
            )
    return AtsScoreResponse(
        score=det.overall,
        overall_score=det.overall,
        isValidResume=True,
        breakdown=breakdown,
        breakdown_detail=det.detail,
        matched_keywords=det.matched,
        missing_keywords=missing,
        experience_analysis=seniority,
        formatting_issues=det.formatting_issues,
        suggestions=suggestions,
        warnings=det.warnings,
        llm_analysis=llm,
    )


async def score_resume(
    resume: str,
    jd: str | None,
    llm_client: object | None = None,
    settings: Settings | None = None,
) -> AtsScoreResponse:
    settings = settings or get_settings()
    resume = sanitise_text(resume, settings.max_text_chars)
    jd_clean = sanitise_text(jd, settings.max_text_chars) if jd else ""

    valid, error = validate_resume_text(resume)
    if not valid:
        return invalid_resume_response(error or "Invalid resume.")

    if jd_clean:
        jd_ok, jd_error = validate_job_description_text(jd_clean)
        if not jd_ok:
            raise ValueError(jd_error or "Invalid job description.")

    det = score_deterministic(resume, jd_clean or None, settings)
    llm_result: LlmAtsAnalysis | None = None
    if llm_client is not None and getattr(llm_client, "available", False):
        llm_result = await llm_client.analyse_resume(resume, jd_clean, det.notes)  # type: ignore[union-attr]
        if llm_result is None:
            det.warnings.append("LLM analysis unavailable; returning deterministic score only.")
    elif llm_client is not None:
        det.warnings.append("GEMINI_API_KEY not set; llm_analysis is null.")
    return build_score_response(det, llm_result)
