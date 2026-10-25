from __future__ import annotations

import logging

from fastapi import APIRouter, File, HTTPException, Request, UploadFile

from app.config import get_settings
from app.logging import get_request_id
from app.models.schemas import (
    AtsScoreResponse,
    ParseFileResponse,
    ScoreTextRequest,
    TailorResponse,
    TailorTextRequest,
)
from app.services.ats import score_resume
from app.services.llm import get_llm_client
from app.services.parser import ParseError, parse_bytes, sanitise_text
from app.services.skills import classify_skill, extract_jd_requirements, extract_skills, is_skill_in_text
from app.services.validator import validate_job_description_text, validate_resume_text

router = APIRouter(tags=["ats"])
logger = logging.getLogger("outly.api.ats")


def _log(request: Request, message: str) -> None:
    logger.info(message, extra={"request_id": get_request_id(request)})


@router.post("/parse-file", response_model=ParseFileResponse)
async def parse_file(request: Request, file: UploadFile = File(...)) -> ParseFileResponse:
    settings = get_settings()
    data = await file.read()
    try:
        parsed = parse_bytes(
            data=data,
            filename=file.filename or "upload.bin",
            content_type=file.content_type,
            max_bytes=settings.max_file_bytes,
            max_chars=settings.max_text_chars,
        )
    except ParseError as exc:
        _log(request, f"parse_failed reason={type(exc).__name__}")
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc
    _log(request, f"parse_ok chars={len(parsed.content)} ext={parsed.extension}")
    return ParseFileResponse(filename=parsed.filename, content=parsed.content)


@router.post("/score", response_model=AtsScoreResponse)
async def score(payload: ScoreTextRequest, request: Request) -> AtsScoreResponse:
    settings = get_settings()
    resume = sanitise_text(payload.resume, settings.max_text_chars)
    jd = sanitise_text(payload.jd, settings.max_text_chars) if payload.jd else ""
    if not resume:
        raise HTTPException(status_code=400, detail="Resume is required.")
    try:
        result = await score_resume(resume, jd or None, llm_client=get_llm_client(), settings=settings)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    _log(request, f"score_ok overall={result.overall_score} llm={result.llm_analysis is not None}")
    return result


@router.post("/tailor", response_model=TailorResponse)
async def tailor(payload: TailorTextRequest, request: Request) -> TailorResponse:
    settings = get_settings()
    resume = sanitise_text(payload.resume, settings.max_text_chars)
    jd = sanitise_text(payload.jd, settings.max_text_chars)
    if not resume:
        raise HTTPException(status_code=400, detail="Resume content is required.")
    valid, error = validate_resume_text(resume)
    if not valid:
        raise HTTPException(status_code=400, detail=error)
    if not jd:
        raise HTTPException(status_code=400, detail="Job description is required.")
    jd_ok, jd_error = validate_job_description_text(jd)
    if not jd_ok:
        raise HTTPException(status_code=400, detail=jd_error)

    client = get_llm_client()
    llm = await client.tailor_resume(resume, jd) if client.available else None
    if llm is None:
        req = extract_jd_requirements(jd)
        matched = [s for s in req.all_skills if is_skill_in_text(s, resume)]
        missing_hard: list[str] = []
        missing_soft: list[str] = []
        missing_tools: list[str] = []
        for skill in [*req.must_have, *req.nice_to_have]:
            if is_skill_in_text(skill, resume):
                continue
            bucket = classify_skill(skill)
            if bucket == "soft_skills":
                missing_soft.append(skill)
            elif bucket == "tools_technologies":
                missing_tools.append(skill)
            else:
                missing_hard.append(skill)
        _log(request, "tailor_fallback_no_llm")
        from app.models.schemas import MissingKeywords, TailoredSections

        return TailorResponse(
            tailoredResume=resume,
            matchedKeywords=matched,
            matchCount=len(matched),
            missingKeywords=MissingKeywords(
                hard_skills=missing_hard,
                soft_skills=missing_soft,
                tools_technologies=missing_tools,
            ),
            sources=[],
            sections=TailoredSections(),
            modificationsSummary=[
                "LLM unavailable; returned the original resume without fabricated edits.",
                "Add GEMINI_API_KEY to enable Gemini tailoring.",
            ],
        )

    _log(request, f"tailor_ok keywords={len(llm.matchedKeywords)}")
    return TailorResponse(
        tailoredResume=llm.tailoredResume,
        matchedKeywords=llm.matchedKeywords,
        matchCount=len(llm.matchedKeywords),
        missingKeywords=llm.missingKeywords,
        sources=[],
        sections=llm.sections,
        modificationsSummary=llm.modificationsSummary,
    )
