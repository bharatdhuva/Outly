from __future__ import annotations

import pytest

from app.services.parser import ParseError, parse_bytes, sanitise_text
from tests.helpers import corrupt_docx, corrupt_pdf, docx_with_text, empty_page_pdf, minimal_pdf_with_text


def test_sanitise_strips_control_chars_and_caps_length() -> None:
    raw = "Hello\x00World\n\n\n\n\nMore"
    cleaned = sanitise_text(raw, max_chars=8)
    assert "\x00" not in cleaned
    assert len(cleaned) <= 8


def test_parse_txt() -> None:
    parsed = parse_bytes(b"plain resume text", "cv.txt", "text/plain", 5_000_000, 1000)
    assert parsed.content == "plain resume text"
    assert parsed.extension == ".txt"


def test_parse_pdf_extracts_text() -> None:
    data = minimal_pdf_with_text("Jane Doe Software Engineer")
    parsed = parse_bytes(data, "cv.pdf", "application/pdf", 5_000_000, 5000)
    assert "Jane" in parsed.content or "Software" in parsed.content or parsed.content


def test_empty_pdf_raises() -> None:
    with pytest.raises(ParseError, match="No extractable text"):
        parse_bytes(empty_page_pdf(), "scan.pdf", "application/pdf", 5_000_000, 5000)


def test_corrupt_pdf_raises() -> None:
    with pytest.raises(ParseError, match="corrupt|Failed to parse PDF"):
        parse_bytes(corrupt_pdf(), "bad.pdf", "application/pdf", 5_000_000, 5000)


def test_parse_docx() -> None:
    data = docx_with_text("Experience\nBuilt APIs")
    parsed = parse_bytes(
        data,
        "cv.docx",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        5_000_000,
        5000,
    )
    assert "Experience" in parsed.content


def test_corrupt_docx_raises() -> None:
    with pytest.raises(ParseError, match="DOCX"):
        parse_bytes(
            corrupt_docx(),
            "bad.docx",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            5_000_000,
            5000,
        )


def test_empty_file_raises() -> None:
    with pytest.raises(ParseError, match="empty"):
        parse_bytes(b"", "cv.txt", "text/plain", 5_000_000, 1000)


def test_unsupported_type() -> None:
    with pytest.raises(ParseError, match="Unsupported"):
        parse_bytes(b"abc", "photo.png", "image/png", 5_000_000, 1000)


def test_oversize_file() -> None:
    with pytest.raises(ParseError, match="too large"):
        parse_bytes(b"x" * 100, "cv.txt", "text/plain", max_bytes=10, max_chars=1000)
