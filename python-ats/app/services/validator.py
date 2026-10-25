from __future__ import annotations

import re

RESUME_MIN_CHARS = 150
JD_MIN_CHARS = 80


def validate_resume_text(text: str) -> tuple[bool, str | None]:
    if not text or len(text.strip()) < RESUME_MIN_CHARS:
        return False, "The uploaded document is too short to be a valid resume."

    lower = text.lower()
    has_experience = bool(
        re.search(
            r"experience|work\s+history|employment|professional\s+experience|"
            r"professional\s+history|job\s+history",
            lower,
        )
    )
    has_education = bool(
        re.search(r"education|academic|university|college|degree|qualification", lower)
    )
    has_skills = bool(
        re.search(
            r"skills|technical\s+skills|expertise|technologies|core\s+competencies|"
            r"competencies|programming\s+languages",
            lower,
        )
    )
    has_projects = bool(
        re.search(r"projects|personal\s+projects|academic\s+projects|key\s+projects", lower)
    )
    has_summary = bool(
        re.search(
            r"summary|professional\s+summary|objective|career\s+objective|profile|about\s+me",
            lower,
        )
    )
    has_certs = bool(re.search(r"certifications|certificates|awards|interests", lower))

    has_email = bool(re.search(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b", text))
    has_phone = bool(
        re.search(r"(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}", text)
    )
    has_links = bool(re.search(r"linkedin\.com|github\.com", lower))
    has_contact = has_email or has_phone or has_links or bool(re.search(r"email|phone|contact", lower))

    section_count = sum(
        [has_experience, has_education, has_skills, has_projects, has_summary, has_certs]
    )
    is_invoice = bool(
        re.search(
            r"invoice|bill\s+to|amount\s+due|payment\s+due|total\s+due|receipt|subtotal|"
            r"tax\s+invoice|transaction\s+id",
            lower,
        )
    ) and section_count < 2
    is_tax = bool(re.search(r"form\s+\d{4}|tax\s+return|internal\s+revenue|irs|w-2|form\s+w2|1040", lower)) and section_count < 2
    is_recipe = bool(re.search(r"ingredients|instructions|cook\s+time|prep\s+time|servings|recipe", lower)) and not has_experience and not has_education
    is_code = bool(re.search(r"import\s+.*\s+from|const\s+.*=|function\s+.*\(|class\s+.*\s*\{", lower)) and not has_experience and not has_education and not has_skills

    if section_count < 2 or not has_contact or is_invoice or is_tax or is_recipe or is_code:
        return (
            False,
            "The uploaded file does not appear to be a resume/CV. Please upload a valid resume containing standard sections (e.g., Experience, Education, Skills, or Projects) and contact information.",
        )
    return True, None


def validate_job_description_text(text: str) -> tuple[bool, str | None]:
    if not text or len(text.strip()) < JD_MIN_CHARS:
        return False, "The job description is too short to be valid."

    lower = text.lower()
    has_requirements = bool(
        re.search(
            r"requirements|qualifications|skills|experience|must\s+have|nice\s+to\s+have|"
            r"who\s+you\s+are|what\s+you\s+need|competencies|profile",
            lower,
        )
    )
    has_responsibilities = bool(
        re.search(
            r"responsibilities|duties|what\s+you\s+will\s+do|role|about\s+the\s+role|"
            r"tasks|job\s+description|position|responsabilities",
            lower,
        )
    )
    has_company = bool(
        re.search(
            r"about\s+us|our\s+team|company|culture|benefits|perks|"
            r"we\s+are\s+looking\s+for|we\s+are\s+hiring",
            lower,
        )
    )
    has_phrases = bool(
        re.search(
            r"years\s+of\s+experience|ability\s+to|degree\s+in|knowledge\s+of|"
            r"background\s+in|proven\s+track\s+record|responsibilities\s+include",
            lower,
        )
    )
    match_count = sum([has_requirements, has_responsibilities, has_company, has_phrases])
    is_invoice = bool(
        re.search(
            r"invoice|bill\s+to|amount\s+due|payment\s+due|total\s+due|receipt|subtotal|"
            r"tax\s+invoice|transaction\s+id",
            lower,
        )
    ) and match_count < 2
    is_tax = bool(re.search(r"form\s+\d{4}|tax\s+return|internal\s+revenue|irs|w-2|form\s+w2|1040", lower)) and match_count < 2
    is_recipe = bool(re.search(r"ingredients|instructions|cook\s+time|prep\s+time|servings|recipe", lower)) and not has_requirements and not has_responsibilities
    is_code = bool(re.search(r"import\s+.*\s+from|const\s+.*=|function\s+.*\(|class\s+.*\s*\{", lower)) and not has_requirements and not has_responsibilities

    if match_count < 1 or is_invoice or is_tax or is_recipe or is_code:
        return (
            False,
            "The provided text does not appear to be a valid job description. Please make sure to paste/upload a valid job description containing responsibilities, requirements, or role details.",
        )
    return True, None
