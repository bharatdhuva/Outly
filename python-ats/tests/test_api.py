from __future__ import annotations

from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

from app.models.schemas import LlmAtsAnalysis
from tests.helpers import corrupt_pdf, docx_with_text, minimal_pdf_with_text


def test_health(client: TestClient) -> None:
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_score_success(client: TestClient, strong_resume: str, strong_jd: str) -> None:
    res = client.post("/api/ats/score", json={"resume": strong_resume, "jd": strong_jd})
    assert res.status_code == 200
    body = res.json()
    assert body["score"] == body["overall_score"]
    assert "skills_match" in body["breakdown"]
    assert body["llm_analysis"] is None
    assert "X-Request-ID" in res.headers


def test_score_missing_resume(client: TestClient) -> None:
    res = client.post("/api/ats/score", json={"jd": "not enough"})
    assert res.status_code == 400
    assert "error" in res.json()


def test_score_invalid_jd(client: TestClient, strong_resume: str) -> None:
    res = client.post("/api/ats/score", json={"resume": strong_resume, "jd": "Ingredients: sugar flour butter recipe"})
    assert res.status_code == 400


def test_match_success(client: TestClient, strong_resume: str, strong_jd: str) -> None:
    res = client.post("/api/ats/match", json={"resume": strong_resume, "jd": strong_jd})
    assert res.status_code == 200
    body = res.json()
    assert body["matchScore"] == body["match_score"]
    assert "missing_must_have" in body
    assert body["embedding_provider"] in {"tfidf", "gemini"}


def test_match_missing_fields(client: TestClient) -> None:
    res = client.post("/api/ats/match", json={"resume": "only resume"})
    assert res.status_code == 400


def test_parse_file_txt(client: TestClient, strong_resume: str) -> None:
    res = client.post(
        "/api/ats/parse-file",
        files={"file": ("resume.txt", strong_resume.encode("utf-8"), "text/plain")},
    )
    assert res.status_code == 200
    assert "Priya" in res.json()["content"]


def test_parse_file_pdf(client: TestClient) -> None:
    data = minimal_pdf_with_text("Contact jane@email.com Experience Education Skills")
    res = client.post(
        "/api/ats/parse-file",
        files={"file": ("resume.pdf", data, "application/pdf")},
    )
    assert res.status_code == 200


def test_parse_file_docx(client: TestClient) -> None:
    data = docx_with_text("Experience Education Skills jane@email.com")
    res = client.post(
        "/api/ats/parse-file",
        files={
            "file": (
                "resume.docx",
                data,
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            )
        },
    )
    assert res.status_code == 200
    assert "Experience" in res.json()["content"]


def test_parse_bad_file(client: TestClient) -> None:
    res = client.post(
        "/api/ats/parse-file",
        files={"file": ("bad.pdf", corrupt_pdf(), "application/pdf")},
    )
    assert res.status_code == 400
    assert "error" in res.json()


def test_parse_oversize_file(client: TestClient, monkeypatch) -> None:  # type: ignore[no-untyped-def]
    from app.config import Settings

    monkeypatch.setattr(
        "app.api.routes_ats.get_settings",
        lambda: Settings(max_file_bytes=32),
    )
    res = client.post(
        "/api/ats/parse-file",
        files={"file": ("big.txt", b"x" * 200, "text/plain")},
    )
    assert res.status_code == 400
    assert "large" in res.json()["error"].lower()


def test_score_with_mocked_llm(client: TestClient, strong_resume: str, strong_jd: str) -> None:
    analysis = LlmAtsAnalysis(strengths=["Solid stack"], weaknesses=["Add metrics in summary"])
    mock_client = type(
        "MockLlm",
        (),
        {"available": True, "analyse_resume": AsyncMock(return_value=analysis)},
    )()
    with patch("app.api.routes_ats.get_llm_client", return_value=mock_client):
        res = client.post("/api/ats/score", json={"resume": strong_resume, "jd": strong_jd})
    assert res.status_code == 200
    assert res.json()["llm_analysis"]["strengths"] == ["Solid stack"]


def test_tailor_without_key_does_not_invent(client: TestClient, strong_resume: str, strong_jd: str) -> None:
    res = client.post("/api/ats/tailor", json={"resume": strong_resume, "jd": strong_jd})
    assert res.status_code == 200
    body = res.json()
    assert body["tailoredResume"] == strong_resume.strip()
    assert any("LLM unavailable" in line or "GEMINI" in line for line in body["modificationsSummary"])
