from __future__ import annotations

import re
from dataclasses import dataclass, field

# Canonical skill -> aliases. Matching is case-insensitive and uses word boundaries
# unless the alias is a short token handled specially below.
SKILL_ALIASES: dict[str, tuple[str, ...]] = {
    "JavaScript": ("javascript", "js", "ecmascript"),
    "TypeScript": ("typescript", "ts"),
    "Python": ("python", "py"),
    "Java": ("java",),
    "C++": ("c++", "cpp"),
    "C#": ("c#", "csharp", "c-sharp"),
    "Go": ("golang", "go lang"),
    "Rust": ("rust",),
    "Ruby": ("ruby", "ruby on rails", "rails"),
    "PHP": ("php",),
    "Kotlin": ("kotlin",),
    "Swift": ("swift",),
    "Scala": ("scala",),
    "R": (" r ",),
    "SQL": ("sql", "t-sql", "plsql", "pl/sql"),
    "React": ("react", "react.js", "reactjs"),
    "Next.js": ("next.js", "nextjs", "next js"),
    "Vue": ("vue", "vue.js", "vuejs"),
    "Angular": ("angular", "angularjs"),
    "Node.js": ("node.js", "nodejs", "node js"),
    "Express": ("express", "express.js", "expressjs"),
    "NestJS": ("nestjs", "nest.js"),
    "Django": ("django",),
    "Flask": ("flask",),
    "FastAPI": ("fastapi", "fast api"),
    "Spring": ("spring", "spring boot", "springboot"),
    "LangChain": ("langchain", "lang chain"),
    "Gemini": ("gemini", "google gemini", "gemini api"),
    "OpenAI": ("openai", "gpt-4", "gpt-4o", "chatgpt"),
    "MongoDB": ("mongodb", "mongo"),
    "PostgreSQL": ("postgresql", "postgres", "psql"),
    "MySQL": ("mysql",),
    "Redis": ("redis",),
    "Elasticsearch": ("elasticsearch", "elastic search", "opensearch"),
    "Kafka": ("kafka", "apache kafka"),
    "RabbitMQ": ("rabbitmq", "rabbit mq"),
    "GraphQL": ("graphql",),
    "REST": ("rest", "restful", "rest api", "rest apis"),
    "gRPC": ("grpc",),
    "Docker": ("docker",),
    "Kubernetes": ("kubernetes", "k8s"),
    "AWS": ("aws", "amazon web services"),
    "GCP": ("gcp", "google cloud", "google cloud platform"),
    "Azure": ("azure", "microsoft azure"),
    "Terraform": ("terraform",),
    "CI/CD": ("ci/cd", "cicd", "continuous integration", "github actions", "gitlab ci"),
    "Git": ("git", "github", "gitlab", "bitbucket"),
    "Linux": ("linux", "unix"),
    "Pandas": ("pandas",),
    "NumPy": ("numpy",),
    "scikit-learn": ("scikit-learn", "sklearn", "scikit learn"),
    "PyTorch": ("pytorch", "torch"),
    "TensorFlow": ("tensorflow", "tf"),
    "Machine Learning": ("machine learning", "ml"),
    "Deep Learning": ("deep learning",),
    "NLP": ("nlp", "natural language processing"),
    "Data Structures": ("data structures", "dsa", "algorithms"),
    "System Design": ("system design", "distributed systems", "microservices"),
    "Microservices": ("microservices", "micro-services"),
    "HTML": ("html", "html5"),
    "CSS": ("css", "css3", "sass", "scss", "tailwind"),
    "Svelte": ("svelte", "sveltekit"),
    "Redux": ("redux", "rtk"),
    "Jest": ("jest", "vitest"),
    "Cypress": ("cypress", "playwright"),
    "Playwright": ("playwright",),
    "JIRA": ("jira",),
    "Agile": ("agile", "scrum", "kanban"),
    "Leadership": ("leadership", "mentoring", "mentorship"),
    "Communication": ("communication", "stakeholder", "cross-functional"),
    "Problem Solving": ("problem solving", "problem-solving"),
    "Testing": ("unit testing", "tdd", "qa", "test automation"),
    "Security": ("security", "oauth", "jwt", "owasp"),
    "Nginx": ("nginx",),
    "Prometheus": ("prometheus",),
    "Grafana": ("grafana",),
    "Spark": ("spark", "pyspark", "apache spark"),
    "Airflow": ("airflow", "apache airflow"),
    "Snowflake": ("snowflake",),
    "BigQuery": ("bigquery", "big query"),
    "S3": ("s3", "amazon s3"),
    "Lambda": ("aws lambda", "lambda"),
    "EC2": ("ec2",),
    "EKS": ("eks",),
    "Helm": ("helm",),
    "Ansible": ("ansible",),
    "Webpack": ("webpack", "vite"),
    "Vite": ("vite",),
    "Figma": ("figma",),
    "Excel": ("excel", "spreadsheets"),
}

SOFT_SKILLS = {
    "Leadership",
    "Communication",
    "Problem Solving",
    "Agile",
}

TOOLS = {
    "Docker",
    "Kubernetes",
    "Git",
    "JIRA",
    "Redis",
    "Kafka",
    "Terraform",
    "Nginx",
    "Prometheus",
    "Grafana",
    "Jenkins",
    "Helm",
    "Ansible",
    "Playwright",
    "Cypress",
    "Jest",
}

SHORT_TOKENS = {"js", "ts", "py", "k8s", "go", "r", "ml", "sql", "css", "html", "nlp", "qa"}

MUST_HAVE_HEADERS = re.compile(
    r"(must[\s-]?have|required|requirements|qualifications|you must|minimum qualifications|"
    r"what you.?ll need|what we.?re looking for)",
    re.I,
)
NICE_HAVE_HEADERS = re.compile(
    r"(nice[\s-]?to[\s-]?have|preferred|bonus|plus|good to have|optional)",
    re.I,
)
SECTION_HEADER = re.compile(r"^[A-Z][A-Za-z0-9 /&+]{2,40}:?\s*$")
YEAR_RE = re.compile(r"(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?)", re.I)
SENIORITY_RE = re.compile(
    r"\b(intern|junior|mid[\s-]?level|mid[\s-]?senior|senior|staff|principal|lead|manager|director)\b",
    re.I,
)

SENIORITY_RANK = {
    "intern": 0,
    "junior": 1,
    "mid-level": 2,
    "midlevel": 2,
    "mid senior": 3,
    "mid-senior": 3,
    "senior": 4,
    "staff": 5,
    "lead": 5,
    "principal": 6,
    "manager": 6,
    "director": 7,
}


@dataclass
class ExtractedSkills:
    canonical: list[str] = field(default_factory=list)
    raw_hits: dict[str, str] = field(default_factory=dict)

    @property
    def set(self) -> set[str]:
        return set(self.canonical)


def _token_present(haystack: str, alias: str) -> bool:
    alias = alias.strip().lower()
    if not alias:
        return False
    if alias in SHORT_TOKENS or len(alias) <= 3:
        return re.search(rf"(?<![A-Za-z0-9]){re.escape(alias)}(?![A-Za-z0-9])", haystack) is not None
    return alias in haystack


def extract_skills(text: str) -> ExtractedSkills:
    haystack = f" {text.lower()} "
    hits: dict[str, str] = {}
    for canonical, aliases in SKILL_ALIASES.items():
        for alias in aliases:
            if _token_present(haystack, alias):
                hits[canonical] = alias
                break
    canonical = sorted(hits.keys(), key=lambda s: s.lower())
    return ExtractedSkills(canonical=canonical, raw_hits=hits)


def classify_skill(name: str) -> str:
    if name in SOFT_SKILLS:
        return "soft_skills"
    if name in TOOLS:
        return "tools_technologies"
    return "hard_skills"


def _split_sections(text: str) -> dict[str, str]:
    lines = text.splitlines()
    buckets = {"must": [], "nice": [], "other": []}
    current = "other"
    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
        if NICE_HAVE_HEADERS.search(stripped):
            current = "nice"
            continue
        if MUST_HAVE_HEADERS.search(stripped):
            current = "must"
            continue
        buckets[current].append(stripped)
    return {k: "\n".join(v) for k, v in buckets.items()}


@dataclass
class JdRequirements:
    must_have: list[str]
    nice_to_have: list[str]
    all_skills: list[str]


def extract_jd_requirements(jd: str) -> JdRequirements:
    sections = _split_sections(jd)
    all_skills = extract_skills(jd).canonical
    must = extract_skills(sections["must"]).canonical if sections["must"] else []
    nice = extract_skills(sections["nice"]).canonical if sections["nice"] else []

    if not must and not nice:
        must = all_skills
    else:
        leftover = [s for s in all_skills if s not in must and s not in nice]
        must = sorted(set(must + leftover))

    nice = [s for s in nice if s not in must]
    return JdRequirements(must_have=must, nice_to_have=nice, all_skills=all_skills)


def extract_years(text: str) -> float | None:
    values = [float(m.group(1)) for m in YEAR_RE.finditer(text)]
    if not values:
        return None
    return max(values)


def extract_seniority_rank(text: str) -> int | None:
    matches = SENIORITY_RE.findall(text)
    ranks: list[int] = []
    for match in matches:
        key = match.lower().replace("_", "-")
        ranks.append(SENIORITY_RANK.get(key, SENIORITY_RANK.get(key.replace(" ", "-"), 2)))
    if not ranks:
        return None
    return max(ranks)


def skill_overlap_score(
    resume_skills: set[str],
    must_have: list[str],
    nice_to_have: list[str],
    must_weight: float = 2.0,
    nice_weight: float = 1.0,
) -> tuple[float, list[str], list[str], list[str]]:
    """Return (0-1 overlap, matched, missing_must, missing_nice). Non-decreasing in matched must-haves."""
    matched: list[str] = []
    missing_must: list[str] = []
    missing_nice: list[str] = []

    for skill in must_have:
        if skill in resume_skills:
            matched.append(skill)
        else:
            missing_must.append(skill)
    for skill in nice_to_have:
        if skill in resume_skills:
            matched.append(skill)
        else:
            missing_nice.append(skill)

    denom = (len(must_have) * must_weight) + (len(nice_to_have) * nice_weight)
    if denom <= 0:
        return 0.5, sorted(set(matched)), missing_must, missing_nice

    numer = (len(must_have) - len(missing_must)) * must_weight + (
        len(nice_to_have) - len(missing_nice)
    ) * nice_weight
    return numer / denom, sorted(set(matched)), missing_must, missing_nice
