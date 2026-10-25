#!/usr/bin/env python3
"""Compare Python ATS/match scores with the legacy Node endpoints.

Usage (from python-ats/):
  python scripts/compare_with_node.py

Both services must already be running. Node still requires a JWT if auth is on.
Set NODE_COMPARE_TOKEN to a valid Bearer token.
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

import httpx

ROOT = Path(__file__).resolve().parents[1]
FIXTURES = ROOT / "tests" / "fixtures"

NODE = os.environ.get("NODE_ATS_BASE_URL", "http://localhost:3001/api/ats")
PYTHON = os.environ.get("PYTHON_ATS_BASE_URL", "http://localhost:8000/api/ats")
TOKEN = os.environ.get("NODE_COMPARE_TOKEN", "")

PAIRS = [
    ("strong_match.txt", "strong_match.txt", "strong"),
    ("partial_match.txt", "partial_match.txt", "partial"),
    ("poor_match.txt", "poor_match.txt", "poor"),
]


def _load(kind: str, name: str) -> str:
    return (FIXTURES / kind / name).read_text(encoding="utf-8")


def _headers(for_node: bool) -> dict[str, str]:
    headers = {"Content-Type": "application/json"}
    if for_node and TOKEN:
        headers["Authorization"] = f"Bearer {TOKEN}"
    return headers


def _call(base: str, path: str, payload: dict, for_node: bool) -> dict:
    url = f"{base.rstrip('/')}{path}"
    try:
        response = httpx.post(url, json=payload, headers=_headers(for_node), timeout=60.0)
    except httpx.HTTPError as exc:
        return {"error": f"request failed: {exc}"}
    try:
        data = response.json()
    except json.JSONDecodeError:
        return {"error": f"HTTP {response.status_code} non-JSON"}
    if response.status_code >= 400:
        return {"error": data.get("error") or data, "status": response.status_code}
    return data


def _score_of(kind: str, body: dict) -> object:
    if "error" in body and "score" not in body and "matchScore" not in body:
        return body["error"]
    if kind == "score":
        return body.get("overall_score", body.get("score"))
    return body.get("match_score", body.get("matchScore"))


def main() -> int:
    print(f"Node:    {NODE}")
    print(f"Python:  {PYTHON}")
    print(f"{'case':<10} {'endpoint':<8} {'node':<8} {'python':<8} {'delta'}")
    print("-" * 50)
    failures = 0
    for resume_name, jd_name, label in PAIRS:
        payload = {
            "resume": _load("resumes", resume_name),
            "jd": _load("jds", jd_name),
        }
        for endpoint in ("/score", "/match"):
            node_body = _call(NODE, endpoint, payload, for_node=True)
            py_body = _call(PYTHON, endpoint, payload, for_node=False)
            node_score = _score_of(endpoint.strip("/"), node_body)
            py_score = _score_of(endpoint.strip("/"), py_body)
            delta: object = "-"
            if isinstance(node_score, (int, float)) and isinstance(py_score, (int, float)):
                delta = abs(int(node_score) - int(py_score))
                if int(delta) >= 35:
                    failures += 1
            print(f"{label:<10} {endpoint.strip('/'):<8} {str(node_score):<8} {str(py_score):<8} {delta}")
    print()
    print("Scores are not expected to match: Node is LLM-judged; Python is hybrid/deterministic.")
    print("Investigate rows with |delta| >= 35 and no obvious fixture reason.")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
