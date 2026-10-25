# Outly Python ATS & Resume-to-JD Matcher

Python 3.11 FastAPI service that owns **ATS scoring** (with tailoring suggestions) and **resume-to-JD matching**. Scoring is deterministic first; Gemini is optional. Matching is a hybrid of taxonomy overlap + embeddings + seniority. There is **no accept/reject decision**.

Node.js is not used inside these algorithms. The Express app authenticates the user, enforces plan limits, writes activity logs, then **proxies** `/api/ats/*` here.

## Current Node contract (what the React app already calls)

| Method | Path | Body | Frontend |
| --- | --- | --- | --- |
| POST | `/api/ats/parse-file` | `multipart/form-data` field `file` | `{ filename, content }` |
| POST | `/api/ats/score` | `{ resume, jd? }` | `{ score, breakdown.{skills_match,experience_match,formatting_readability,impact_metrics}, matched_keywords, missing_keywords.{hard_skills,soft_skills,tools_technologies}, experience_analysis, formatting_issues, suggestions }` |
| POST | `/api/ats/tailor` | `{ resume, jd }` | `{ tailoredResume, matchedKeywords, missingKeywords, sources, sections?, modificationsSummary? }` |
| POST | `/api/ats/match` | `{ resume, jd }` | Exists in Node; **not wired in React yet** |

Old Node ATS score was **LLM-judged** (Gemini structured output, Groq/Claude fallbacks). Matcher was **embedding cosine + LLM**. Neither persisted score documents in Mongo (only `ActivityLog`). Jobs were not used.

## Setup

```bash
cd python-ats
python -m venv .venv
# Windows: .venv\Scripts\activate
# Unix:    source .venv/bin/activate
pip install -r requirements.txt
copy .env.example .env   # or cp
uvicorn app.main:app --reload --port 8000
```

Health: `GET http://localhost:8000/health`

Tests (no API key required):

```bash
pytest -q
```

Docker:

```bash
docker build -t outly-python-ats .
docker run --rm -p 8000:8000 --env-file .env outly-python-ats
```

Point Node at the service (`backend/.env`):

```
PYTHON_ATS_URL=http://localhost:8000
```

Then run the Express API as usual (`PORT=3001`). The Vite frontend still talks to `/api` on Node.

## Environment variables

See `.env.example`. Important:

| Variable | Default | Meaning |
| --- | --- | --- |
| `GEMINI_API_KEY` | empty | Without it, `llm_analysis` is `null` and embeddings use TF-IDF |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Chat model |
| `GEMINI_EMBEDDING_MODEL` | `models/gemini-embedding-001` | Gemini embeddings |

| `MAX_FILE_BYTES` | 5242880 | 5 MB, same as Node multer |
| `MAX_TEXT_CHARS` | 80000 | Truncate extracted text |
| `MATCH_SKILL_WEIGHT` | 0.55 | Hybrid matcher |
| `MATCH_SEMANTIC_WEIGHT` | 0.30 | Hybrid matcher |
| `MATCH_SENIORITY_WEIGHT` | 0.15 | Hybrid matcher |
| `INTERNAL_API_KEY` | empty | If set, require `X-Internal-Key` |
| `LLM_TIMEOUT_SECONDS` | 45 | Gemini timeout |
| `LLM_MAX_RETRIES` | 3 | Exponential backoff |

Mongo/Motor is **not** used: the legacy flow did not store ATS result documents. Activity logging stays in Express.

Background jobs are **not** used: both features were synchronous in Node.

## curl examples

```bash
# Score (JD optional)
curl -s http://localhost:8000/api/ats/score \
  -H "Content-Type: application/json" \
  -d "{\"resume\":\"$(sed 's/"/\\"/g' tests/fixtures/resumes/strong_match.txt)\",\"jd\":\"$(sed 's/"/\\"/g' tests/fixtures/jds/strong_match.txt)\"}"

# Match
curl -s http://localhost:8000/api/ats/match \
  -H "Content-Type: application/json" \
  -d @- <<'JSON'
{ "resume": "see tests/fixtures/resumes/strong_match.txt", "jd": "see tests/fixtures/jds/strong_match.txt" }
JSON

# Parse
curl -s http://localhost:8000/api/ats/parse-file -F "file=@tests/fixtures/resumes/strong_match.txt;filename=resume.txt"
```

On Windows PowerShell, prefer posting JSON from a file:

```powershell
$body = @{ resume = Get-Content -Raw tests\fixtures\resumes\strong_match.txt; jd = Get-Content -Raw tests\fixtures\jds\strong_match.txt } | ConvertTo-Json
Invoke-RestMethod http://localhost:8000/api/ats/score -Method POST -Body $body -ContentType "application/json"
```

## How scores are computed

### ATS (`overall_score` / `score`, 0–100)

Sum of explainable category points (also exposed as `breakdown_detail`):

| Category | Max | What it checks |
| --- | --- | --- |
| `contact_info` | 10 | Email, phone, LinkedIn/GitHub in the **extracted body** |
| `sections` | 20 | Summary, skills, experience, education, projects headings |
| `length_format` | 10 | Word count, table/column markers, icon glyphs |
| `bullet_quality` | 20 | Action verbs + quantified results |
| `keyword_coverage` | 25 | Taxonomy overlap vs JD (or skill density if no JD) |
| `readability` | 15 | Sentence length, first-person “I/my” |

Frontend `breakdown.*` fields are those categories **rescaled to 0–100** so `AtsScore.tsx` does not need a rewrite:

- `skills_match` ← keyword coverage
- `experience_match` ← sections
- `formatting_readability` ← average of contact, length, readability
- `impact_metrics` ← bullet quality

**LLM layer (optional):** Gemini structured output (`LlmAtsAnalysis`) adds strengths, weaknesses, and per-section rewrites. The model is told the resume/JD are data, wrapped in `<resume>` / `<job_description>`, and **must not invent facts**. If the key is missing or the call fails, `llm_analysis` is `null` and the deterministic payload is still returned.

### Matcher (`match_score`, 0–100)

Advisory hybrid (weights configurable, renormalized to 1):

`match = skill_weight * skill_overlap + semantic_weight * cosine + seniority_weight * seniority_fit`

- **Skill overlap:** must-have skills count 2× nice-to-have. Aliases: `JS`→JavaScript, `k8s`→Kubernetes, etc. (`app/services/skills.py`).
- **Semantic:** Gemini embeddings when a key is present, otherwise **TF-IDF cosine** (offline/tests). Vectors are cached by SHA-256 of `(provider, text)`.
- **Seniority:** years-of-experience and title rank vs the JD.
- Output includes `matched_skills`, `missing_must_have`, `missing_nice_to_have`, `section_similarity`, and a plain-English `explanation`.

Adding a previously missing **must-have** skill never decreases the skill-overlap term; regression tests assert the overall score does not drop.

## API contract changes

**Kept (no React change required for score/parse/tailor):**

- Paths under `/api/ats/score`, `/tailor`, `/parse-file`, `/match`
- Field names the UI already reads (`score`, `breakdown.skills_match`, `missing_keywords.hard_skills`, `tailoredResume`, …)
- Invalid resume on `/score` still returns **200** with `score: 0` and `isValidResume: false` (Node behaviour)
- Invalid JD still **400** `{ "error": "..." }`
- Parse errors **400** `{ "error": "..." }` (Python uses `error` rather than FastAPI `detail`)

**Additive (safe to ignore):**

- ATS: `overall_score`, `breakdown_detail`, `warnings`, `llm_analysis`
- Match: `match_score`, `matched_skills`, `missing_must_have`, `missing_nice_to_have`, `section_similarity`, `explanation`, `embedding_provider` (camelCase Node fields still present)
- `/api/ats/match/upload` for file+text hybrid input

**Removed from the Node scoring path:** Groq and Claude fallbacks, hardcoded “score 72” Gemini-failure stub, and all LangChain ATS chains in Express.

**Behaviour change:** `/score` is no longer an LLM black box. Numbers will **not** match old Gemini scores. `/tailor` without `GEMINI_API_KEY` returns the original resume plus a modifications note instead of a fabricated stub resume.

## What to edit in Express and React

### Express (`backend`)

1. Set `PYTHON_ATS_URL` (see `backend/.env.example`).
2. `backend/src/api/routes/ats.routes.ts` now proxies to Python after `requireAuth` + plan limits + activity logs.
3. You can delete unused `backend/src/ai/atsScoreChain.ts` and `resumeJdMatcher.ts` once no other file imports them. `resumeTailorChain.ts` is unused after the proxy; `prompts.ts` still has cold-mail prompts — do not delete the whole file.
4. Gemini keys can stay on Node for cold mail; this service needs its **own** `GEMINI_API_KEY` if you want LLM analysis/tailoring/Gemini embeddings.

### React (`frontend`)

No required change for ATS page or tailor page.

Optional: call the matcher from the UI:

```ts
api.ats.match(resume, jd)
```

(`frontend/src/lib/api.ts` includes `ats.match`.)

## Parity script

```bash
# terminals: Node :3001, Python :8000
set NODE_COMPARE_TOKEN=your_jwt
python scripts/compare_with_node.py
```

Large gaps (`|delta| >= 35`) are expected until you accept the new deterministic scale; the script prints both columns.

## Known limitations

- Scanned/image PDFs have no text layer — we return a clear error, not OCR.
- Skill taxonomy is curated, not exhaustive; unknown JD phrases will not match unless aliased.
- TF-IDF is lexical, not semantic. Gemini embeddings are better but need a key and network.
- LLM rewrites can still be imperfect; the integrity rule is prompt-only, not a fact database.
- Auth and free-tier limits remain on Node; hitting Python directly skips them unless `INTERNAL_API_KEY` is set.
- Scores are advisory. Do not use them as automated hiring decisions.

## Risks

1. **Score distribution shift** vs Gemini-era numbers may confuse users who saved old results in `localStorage`.
2. **Taxonomy gaps** can under-score niche stacks until aliases are extended.
3. **Proxy availability:** if Python is down, `/api/ats/*` returns 503 even though the rest of Outly is up.
