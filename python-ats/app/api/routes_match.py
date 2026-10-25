from __future__ import annotations

import logging

from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile

from app.config import get_settings
from app.logging import get_request_id
from app.models.schemas import MatchResponse, MatchTextRequest
from app.services.embeddings import build_embedding_service
from app.services.matcher import match_resume_to_jd
from app.services.parser import ParseError, parse_bytes, sanitise_text
from app.services.validator import validate_job_description_text, validate_resume_text

router = APIRouter(tags=["match"])
logger = logging.getLogger("outly.api.match")


@router.post("/match", response_model=MatchResponse)
async def match_json(payload: MatchTextRequest, request: Request) -> MatchResponse:
    settings = get_settings()
    resume = sanitise_text(payload.resume, settings.max_text_chars)
    jd = sanitise_text(payload.jd, settings.max_text_chars)
    if not resume or not jd:
        raise HTTPException(status_code=400, detail="Both resume and jd are required.")
    valid, error = validate_resume_text(resume)
    if not valid:
        raise HTTPException(status_code=400, detail=error)
    jd_ok, jd_error = validate_job_description_text(jd)
    if not jd_ok:
        raise HTTPException(status_code=400, detail=jd_error)

    embeddings = build_embedding_service(settings)
    result = await match_resume_to_jd(resume, jd, embeddings=embeddings, settings=settings)
    logger.info(
        "match_ok score=%s provider=%s",
        result.match_score,
        result.embedding_provider,
        extra={"request_id": get_request_id(request)},
    )
    return result


@router.post("/match/upload", response_model=MatchResponse)
async def match_upload(
    request: Request,
    resume_file: UploadFile | None = File(default=None),
    jd_file: UploadFile | None = File(default=None),
    resume: str | None = Form(default=None),
    jd: str | None = Form(default=None),
) -> MatchResponse:
    settings = get_settings()
    resume_text = resume or ""
    jd_text = jd or ""
    try:
        if resume_file is not None and resume_file.filename:
            parsed = parse_bytes(
                await resume_file.read(),
                resume_file.filename,
                resume_file.content_type,
                settings.max_file_bytes,
                settings.max_text_chars,
            )
            resume_text = parsed.content
        if jd_file is not None and jd_file.filename:
            parsed_jd = parse_bytes(
                await jd_file.read(),
                jd_file.filename,
                jd_file.content_type,
                settings.max_file_bytes,
                settings.max_text_chars,
            )
            jd_text = parsed_jd.content
    except ParseError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc

    payload = MatchTextRequest(resume=resume_text, jd=jd_text)
    return await match_json(payload, request)
