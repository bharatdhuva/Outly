from __future__ import annotations

import io
import zipfile

from docx import Document


def minimal_pdf_with_text(text: str) -> bytes:
    """Build a tiny uncompressed PDF containing `text` as a single Tj string."""
    safe = text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
    stream = f"BT /F1 12 Tf 72 720 Td ({safe}) Tj ET".encode("latin-1", errors="replace")
    objects = [
        b"1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj",
        b"2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj",
        b"3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>endobj",
        b"4 0 obj<< /Length %d >>stream\n" % len(stream) + stream + b"\nendstream endobj",
        b"5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj",
    ]
    header = b"%PDF-1.4\n"
    body = b"\n".join(objects) + b"\n"
    offsets = []
    cursor = len(header)
    for obj in objects:
        offsets.append(cursor)
        cursor += len(obj) + 1
    xref = [b"xref", b"0 6", b"0000000000 65535 f "]
    for offset in offsets:
        xref.append(f"{offset:010d} 00000 n ".encode("ascii"))
    trailer = (
        b"\n".join(xref)
        + b"\ntrailer<< /Size 6 /Root 1 0 R >>\nstartxref\n"
        + str(cursor).encode("ascii")
        + b"\n%%EOF"
    )
    return header + body + trailer


def empty_page_pdf() -> bytes:
    return minimal_pdf_with_text("")


def corrupt_pdf() -> bytes:
    return b"%PDF-1.4\nthis is not a valid pdf xref"


def docx_with_text(text: str) -> bytes:
    document = Document()
    for line in text.splitlines():
        document.add_paragraph(line)
    buffer = io.BytesIO()
    document.save(buffer)
    return buffer.getvalue()


def corrupt_docx() -> bytes:
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w") as archive:
        archive.writestr("not_a_document.txt", "nope")
    return buffer.getvalue()
