from __future__ import annotations

import re
from dataclasses import dataclass, field

# Canonical skill -> aliases. Matching is case-insensitive and uses strict word boundaries.
SKILL_ALIASES: dict[str, tuple[str, ...]] = {
    # Programming Languages
    "JavaScript": ("javascript", "js", "ecmascript"),
    "TypeScript": ("typescript", "ts"),
    "Python": ("python", "py"),
    "Java": ("java",),
    "C++": ("c++", "cpp"),
    "C#": ("c#", "csharp", "c-sharp"),
    "C": (" c ", "ansi c"),
    "Go": ("golang", "go lang"),
    "Rust": ("rust",),
    "Ruby": ("ruby", "ruby on rails", "rails"),
    "PHP": ("php",),
    "Kotlin": ("kotlin",),
    "Swift": ("swift",),
    "Scala": ("scala",),
    "R": (" r ",),
    "SQL": ("sql", "t-sql", "plsql", "pl/sql"),
    # Web & App Frameworks
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
    # Databases & Storage
    "MongoDB": ("mongodb", "mongo"),
    "PostgreSQL": ("postgresql", "postgres", "psql"),
    "MySQL": ("mysql",),
    "Redis": ("redis",),
    "Elasticsearch": ("elasticsearch", "elastic search", "opensearch"),
    "Kafka": ("kafka", "apache kafka"),
    "RabbitMQ": ("rabbitmq", "rabbit mq"),
    "GraphQL": ("graphql",),
    "REST API": ("rest api", "rest apis", "restful", "restful api", "restful apis"),
    "gRPC": ("grpc",),
    # DevOps, Cloud & Infra
    "Docker": ("docker",),
    "Kubernetes": ("kubernetes", "k8s"),
    "AWS": ("aws", "amazon web services"),
    "GCP": ("gcp", "google cloud", "google cloud platform"),
    "Azure": ("azure", "microsoft azure"),
    "Terraform": ("terraform",),
    "CI/CD": ("ci/cd", "cicd", "continuous integration", "github actions", "gitlab ci"),
    "Git": ("git", "github", "gitlab", "bitbucket"),
    "Linux": ("linux", "unix"),
    # Data Science & AI
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
    # Mechanical & Hardware Engineering
    "Mechanical Engineering": ("mechanical engineering",),
    "SolidWorks": ("solidworks",),
    "CAD": ("cad", "computer-aided design", "computer aided design", "autocad"),
    "Pneumatics": ("pneumatics", "pneumatic systems", "industrial pneumatics", "pneumatic"),
    "Robotics": ("robotics", "robotic systems", "automated systems"),
    "Sensors": ("sensors", "transducers"),
    "Electro-Mechanical": ("electro-mechanical", "electromechanical"),
    "Fluid Systems": ("fluid systems", "hydraulics", "fluid mechanics"),
    "Servo Systems": ("servo systems", "servos", "servo motors"),
    "Prototyping": ("prototyping", "rapid prototyping"),
    "FMEA": ("fmea", "failure modes and effects analysis"),
    "DFA": ("dfa", "design for automation", "dfm", "design for manufacturing"),
    "PLC": ("plc", "programmable logic controller"),
    "Vendor Management": ("vendor management", "supplier management"),
    # Electrical & Embedded
    "PCB Design": ("pcb design", "pcb", "altium", "kicad"),
    "Embedded Systems": ("embedded systems", "firmware", "embedded c"),
    "Microcontrollers": ("microcontrollers", "arduino", "raspberry pi", "stm32"),
    "FPGA": ("fpga", "verilog", "vhdl"),
    # Business, Marketing & Finance
    "SEO": ("seo", "search engine optimization"),
    "Product Management": ("product management", "product roadmap", "roadmapping"),
    "Financial Modeling": ("financial modeling", "financial analysis"),
    "Data Analysis": ("data analysis", "business intelligence", "tableau", "power bi", "powerbi"),
}

SOFT_SKILLS = {
    "Leadership",
    "Communication",
    "Problem Solving",
    "Agile",
    "Vendor Management",
    "Product Management",
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
    "SolidWorks",
    "CAD",
    "Figma",
    "Excel",
}

SHORT_TOKENS = {"js", "ts", "py", "k8s", "go", "r", "c", "ml", "sql", "css", "html", "nlp", "qa", "cad", "dfa", "plc", "seo"}

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
    # Always enforce strict word boundaries so "interest" never matches "rest"
    pattern = rf"(?<![A-Za-z0-9]){re.escape(alias)}(?![A-Za-z0-9])"
    return re.search(pattern, haystack) is not None


def is_skill_in_text(skill: str, text: str) -> bool:
    """Check if a canonical or dynamic skill exists in the text using word boundaries."""
    haystack = f" {text.lower()} "
    if skill in SKILL_ALIASES:
        for alias in SKILL_ALIASES[skill]:
            if _token_present(haystack, alias):
                return True
        return False
    # Dynamic skill phrase: match case-insensitively with boundary
    clean_skill = skill.strip().lower()
    if not clean_skill:
        return False
    pattern = rf"(?<![A-Za-z0-9]){re.escape(clean_skill)}(?![A-Za-z0-9])"
    return re.search(pattern, haystack) is not None


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
    name_lower = name.lower()
    if any(t in name_lower for t in ["software", "tool", "cad", "solidworks", "platform", "app"]):
        return "tools_technologies"
    if any(s in name_lower for s in ["management", "leadership", "communication", "collaborat", "team"]):
        return "soft_skills"
    return "hard_skills"


JD_STOP_TERMS = {
    "experience", "years", "degree", "field", "practical", "ability", "knowledge", "skills",
    "responsibilities", "qualifications", "minimum", "preferred", "related", "equivalent",
    "working", "demonstrated", "using", "growing", "managing", "improving", "building",
    "testing", "breaking", "wide", "variety", "changing", "environment", "teams", "team",
    "full", "development", "lifecycle", "concept", "scale", "applicable", "standards",
    "small", "close-knit", "responsible", "various", "processes", "products", "central",
    "ongoing", "improvements", "breadth", "collaborating", "across", "primary", "technical",
    "point-of-contact", "resolve", "foundational", "issues", "requiring", "unique", "creative",
    "solutions", "collaboratively", "real-world", "users", "use", "cases", "released",
    "verify", "compliance", "specifications", "investigate", "involving", "performance",
    "equipment", "determine", "establish", "through", "calculations", "layouts", "appropriate",
    "such", "etc", "including", "well", "cost", "strategy", "about", "job", "company", "location",
    "equal", "opportunity", "employer", "applicant", "applicants", "role", "position"
}


def extract_dynamic_jd_skills(jd: str) -> list[str]:
    """Dynamically extracts specialized domain skills and technical terms from ANY Job Description."""
    lines = jd.splitlines()
    dynamic = set()

    # 1. Capitalized acronyms in parentheses: (CAD), (FMEA), (DFA), (SEO), (CRM), (AWS), etc.
    for line in lines:
        for m in re.finditer(r"\(([A-Za-z0-9\s/+-]{2,30})\)", line):
            term = m.group(1).strip()
            if term.lower() not in JD_STOP_TERMS and len(term) >= 2:
                dynamic.add(term)

    # 2. Capitalized compounds & technical terminology
    for line in lines:
        for m in re.finditer(r"\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\b", line):
            phrase = m.group(1).strip()
            words = phrase.split()
            if not any(w.lower() in {"experience", "bachelor", "master", "degree", "responsibilities", "qualifications", "minimum", "preferred"} for w in words):
                dynamic.add(phrase)

    # 3. CamelCase software & technical tools (e.g. SolidWorks, AutoCAD, PowerPoint, QuickBooks, etc.)
    for line in lines:
        for m in re.finditer(r"\b([A-Z][a-zA-Z0-9]+[A-Z][a-zA-Z0-9]*)\b", line):
            term = m.group(1).strip()
            if term.lower() not in JD_STOP_TERMS and len(term) > 3:
                dynamic.add(term)

    # 4. Domain noun patterns (e.g., fluid systems, pneumatic systems, vendor management, etc.)
    domain_patterns = [
        r"\b([a-z]+(?:-[a-z]+)?\s+(?:systems?|equipment|tools?|components?|techniques?|management|modeling|analysis|design))\b",
        r"\b(pneumatics?|robotics?|sensors?|servo systems?|fluid systems?|automated systems?|electro-mechanical)\b",
        r"\b(mechanical engineering|electrical engineering|civil engineering|biomedical engineering|data science|financial modeling|content strategy)\b",
    ]
    for line in lines:
        for pat in domain_patterns:
            for m in re.finditer(pat, line, re.I):
                term = m.group(1).strip()
                w = [p for p in term.split() if p.lower() not in JD_STOP_TERMS]
                if w:
                    clean_phrase = " ".join(w).title()
                    if len(clean_phrase) > 3:
                        dynamic.add(clean_phrase)

    PREPOSITIONS_LEAD = ("with ", "to ", "the ", "and ", "for ", "in ", "on ", "by ", "from ", "of ", "such ", "across ", "as ")
    filtered = []
    for s in dynamic:
        s_clean = s.strip()
        lower_s = s_clean.lower()
        for prep in PREPOSITIONS_LEAD:
            if lower_s.startswith(prep):
                s_clean = s_clean[len(prep):].strip()
                lower_s = s_clean.lower()
        if (
            len(s_clean) >= 3
            and lower_s not in JD_STOP_TERMS
            and not any(lower_s.startswith(p) for p in PREPOSITIONS_LEAD)
            and lower_s not in {"production", "design", "development", "ability", "experience"}
        ):
            filtered.append(s_clean)
    return sorted(list(set(filtered)), key=lambda s: s.lower())


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
    standard_skills = extract_skills(jd).canonical
    dynamic_skills = extract_dynamic_jd_skills(jd)

    # Merge both standard dictionary hits + dynamic domain skills
    all_skills = sorted(list(dict.fromkeys(standard_skills + dynamic_skills)), key=lambda s: s.lower())

    must = extract_skills(sections["must"]).canonical if sections["must"] else []
    dynamic_must = extract_dynamic_jd_skills(sections["must"]) if sections["must"] else []
    must = sorted(list(dict.fromkeys(must + dynamic_must)), key=lambda s: s.lower())

    nice = extract_skills(sections["nice"]).canonical if sections["nice"] else []
    dynamic_nice = extract_dynamic_jd_skills(sections["nice"]) if sections["nice"] else []
    nice = sorted(list(dict.fromkeys(nice + dynamic_nice)), key=lambda s: s.lower())

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
    resume_text: str | None = None,
) -> tuple[float, list[str], list[str], list[str]]:
    """Return (0-1 overlap, matched, missing_must, missing_nice). Non-decreasing in matched must-haves."""
    matched: list[str] = []
    missing_must: list[str] = []
    missing_nice: list[str] = []

    for skill in must_have:
        if skill in resume_skills or (resume_text and is_skill_in_text(skill, resume_text)):
            matched.append(skill)
        else:
            missing_must.append(skill)
    for skill in nice_to_have:
        if skill in resume_skills or (resume_text and is_skill_in_text(skill, resume_text)):
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
