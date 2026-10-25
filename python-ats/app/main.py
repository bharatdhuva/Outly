from __future__ import annotations

import logging
from collections.abc import Awaitable, Callable

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api.routes_ats import router as ats_router
from app.api.routes_match import router as match_router
from app.config import get_settings
from app.logging import RequestIdMiddleware, configure_logging, get_request_id

settings = get_settings()
configure_logging(settings.log_level)
logger = logging.getLogger("outly.main")

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Outly Python ATS",
    version="1.0.0",
    description="Deterministic ATS scoring and hybrid resume-to-JD matching.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(RequestIdMiddleware)



@app.middleware("http")
async def enforce_internal_key(
    request: Request,
    call_next: Callable[[Request], Awaitable],
) -> JSONResponse:
    if settings.internal_api_key:
        provided = request.headers.get("X-Internal-Key", "")
        public = request.url.path in {"/health", "/docs", "/openapi.json", "/redoc"}
        if not public and provided != settings.internal_api_key:
            return JSONResponse(status_code=401, content={"error": "Unauthorized"})
    return await call_next(request)


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    detail = exc.detail
    message = detail if isinstance(detail, str) else "Request failed."
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": message},
        headers={"X-Request-ID": get_request_id(request)},
    )


@app.exception_handler(RequestValidationError)
async def validation_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(
        status_code=400,
        content={"error": "Invalid request. Check required fields and file type."},
        headers={"X-Request-ID": get_request_id(request)},
    )


@app.exception_handler(Exception)
async def unhandled_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("unhandled_error type=%s", type(exc).__name__, extra={"request_id": get_request_id(request)})
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error."},
        headers={"X-Request-ID": get_request_id(request)},
    )


@app.get("/health")
async def health() -> dict[str, str]:
    return {
        "status": "ok",
        "service": settings.app_name,
        "gemini": "configured" if settings.has_gemini_key else "missing",
    }


app.include_router(ats_router, prefix="/api/ats")
app.include_router(match_router, prefix="/api/ats")
