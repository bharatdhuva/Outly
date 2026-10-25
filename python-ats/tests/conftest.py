from __future__ import annotations

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.config import get_settings
from app.services.llm import get_llm_client

FIXTURES = Path(__file__).parent / "fixtures"


@pytest.fixture(autouse=True)
def _clear_settings_cache(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.setenv("GEMINI_API_KEY", "")
    get_settings.cache_clear()
    get_llm_client.cache_clear()
    yield
    get_settings.cache_clear()
    get_llm_client.cache_clear()


@pytest.fixture
def client() -> TestClient:
    from app.main import app

    return TestClient(app)


def load_fixture(kind: str, name: str) -> str:
    return (FIXTURES / kind / name).read_text(encoding="utf-8")


@pytest.fixture
def strong_resume() -> str:
    return load_fixture("resumes", "strong_match.txt")


@pytest.fixture
def partial_resume() -> str:
    return load_fixture("resumes", "partial_match.txt")


@pytest.fixture
def poor_resume() -> str:
    return load_fixture("resumes", "poor_match.txt")


@pytest.fixture
def strong_jd() -> str:
    return load_fixture("jds", "strong_match.txt")


@pytest.fixture
def partial_jd() -> str:
    return load_fixture("jds", "partial_match.txt")


@pytest.fixture
def poor_jd() -> str:
    return load_fixture("jds", "poor_match.txt")
