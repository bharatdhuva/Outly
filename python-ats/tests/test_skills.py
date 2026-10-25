from __future__ import annotations

from app.services.skills import extract_jd_requirements, extract_skills, skill_overlap_score


def test_alias_javascript_and_k8s() -> None:
    text = "Stack: JS, k8s, and py scripts."
    skills = extract_skills(text).set
    assert "JavaScript" in skills
    assert "Kubernetes" in skills
    assert "Python" in skills


def test_jd_must_vs_nice() -> None:
    jd = """
    Backend role
    Requirements / Must have
    - Python
    - Docker
    - Kubernetes
    Nice to have / Preferred
    - GraphQL
    - Terraform
    """
    req = extract_jd_requirements(jd)
    assert "Python" in req.must_have
    assert "Kubernetes" in req.must_have
    assert "GraphQL" in req.nice_to_have
    assert "GraphQL" not in req.must_have


def test_overlap_increases_when_must_have_added() -> None:
    must = ["Python", "Kubernetes", "Docker"]
    nice = ["GraphQL"]
    before, *_ = skill_overlap_score({"Python"}, must, nice)
    after, *_ = skill_overlap_score({"Python", "Kubernetes"}, must, nice)
    assert after > before
