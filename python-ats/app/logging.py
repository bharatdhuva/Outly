from __future__ import annotations

import logging
import uuid
from collections.abc import Awaitable, Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

REQUEST_ID_HEADER = "X-Request-ID"


def configure_logging(level: str = "INFO") -> None:
    root = logging.getLogger()
    handler = logging.StreamHandler()
    handler.addFilter(RequestIdFilter())
    formatter = logging.Formatter(
        "%(asctime)s %(levelname)s request_id=%(request_id)s %(name)s %(message)s"
    )
    handler.setFormatter(formatter)
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(getattr(logging, level.upper(), logging.INFO))
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)


class RequestIdFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        if not hasattr(record, "request_id"):
            record.request_id = "-"
        return True



class RequestIdMiddleware(BaseHTTPMiddleware):
    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        request_id = request.headers.get(REQUEST_ID_HEADER) or str(uuid.uuid4())
        request.state.request_id = request_id
        logger = logging.getLogger("outly.request")
        extra = {"request_id": request_id}
        logger.info(
            "request_started method=%s path=%s",
            request.method,
            request.url.path,
            extra=extra,
        )
        response = await call_next(request)
        response.headers[REQUEST_ID_HEADER] = request_id
        logger.info(
            "request_finished status=%s path=%s",
            response.status_code,
            request.url.path,
            extra=extra,
        )
        return response


def get_request_id(request: Request) -> str:
    return getattr(request.state, "request_id", "-")
