# Vercel Python Serverless Entry Point for python-ats (FastAPI / ASGI)
#
# Vercel discovers this file as an ASGI function because it exports a variable
# named `app` that is an ASGI application.
#
# URL mapping (see vercel.json rewrites):
#   /python-ats/:path*  →  this handler  →  FastAPI router  →  /api/ats/:path*
#
# Vercel rewrites lose the original path, so we use a middleware below to
# reconstruct it from the `originalPath` query parameter — identical to how
# api/index.js handles the Node.js side.

import sys
import os
from urllib.parse import urlparse, parse_qs, urlencode

# Make python-ats/ importable as the root package directory
_PYTHON_ATS_DIR = os.path.join(os.path.dirname(__file__), "..", "python-ats")
sys.path.insert(0, os.path.abspath(_PYTHON_ATS_DIR))

from app.main import app as _base_app  # noqa: E402

from fastapi import FastAPI, Request
from fastapi.responses import Response
from starlette.types import ASGIApp, Receive, Send, Scope


class PathRestoreMiddleware:
    """
    Vercel rewrites all /python-ats/* requests to /api/python_ats?originalPath=/python-ats/...
    This middleware restores the original path so FastAPI routes match correctly.
    e.g. /python-ats/api/ats/score  →  /api/ats/score  (the FastAPI prefix)
    """

    def __init__(self, app_: ASGIApp) -> None:
        self._app = app_

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] == "http":
            query_string = scope.get("query_string", b"").decode("utf-8")
            params = parse_qs(query_string)
            original_paths = params.pop("originalPath", None)
            if original_paths:
                # Reconstruct path: strip /python-ats prefix so FastAPI sees /api/ats/...
                original = original_paths[0]
                # e.g.  /python-ats/api/ats/score  →  /api/ats/score
                if original.startswith("/python-ats"):
                    original = original[len("/python-ats"):]
                # Split path and leftover query
                if "?" in original:
                    new_path, extra_qs = original.split("?", 1)
                else:
                    new_path, extra_qs = original, ""
                # Merge remaining params back into query string
                remaining = urlencode(params, doseq=True)
                new_qs = "&".join(filter(None, [remaining, extra_qs]))
                scope = {**scope, "path": new_path, "query_string": new_qs.encode("utf-8")}
        await self._app(scope, receive, send)


# Wrap the base FastAPI app with the path-restore middleware
app = PathRestoreMiddleware(_base_app)
