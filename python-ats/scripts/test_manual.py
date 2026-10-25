"""Quick manual testing script for ATS Score and Resume-to-JD Matcher.

Usage:
    python scripts/test_manual.py [strong|partial|poor]
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
import httpx

ROOT = Path(__file__).resolve().parents[1]
FIXTURES = ROOT / "tests" / "fixtures"

def run_test(case: str = "strong") -> None:
    resume_file = FIXTURES / "resumes" / f"{case}_match.txt"
    jd_file = FIXTURES / "jds" / f"{case}_match.txt"

    if not resume_file.exists() or not jd_file.exists():
        print(f"Unknown fixture case: {case}. Choose 'strong', 'partial', or 'poor'.")
        sys.exit(1)

    resume_text = resume_file.read_text(encoding="utf-8")
    jd_text = jd_file.read_text(encoding="utf-8")

    print(f"\n=======================================================")
    print(f" TESTING CASE: [{case.upper()} MATCH]")
    print(f"=======================================================")

    with httpx.Client(base_url="http://127.0.0.1:8000", timeout=30.0) as client:
        # 1. Health
        try:
            health = client.get("/health").json()
            print(f"[Health Check] OK: {health}\n")
        except Exception as e:
            print(f"[Error] Python ATS service is not reachable on http://127.0.0.1:8000: {e}")
            print("Please ensure 'uvicorn app.main:app --port 8000' is running.")
            return

        payload = {"resume": resume_text, "jd": jd_text}

        # 2. ATS Score
        print("--- Calling POST /api/ats/score ---")
        score_res = client.post("/api/ats/score", json=payload)
        if score_res.status_code == 200:
            data = score_res.json()
            print(f"Overall ATS Score: {data['overall_score']} / 100")
            print(f"Breakdown (Frontend rescaled): {data['breakdown']}")
            print(f"Matched Skills ({len(data['matched_keywords'])}): {data['matched_keywords'][:10]}...")
            print(f"Missing Hard Skills: {data['missing_keywords']['hard_skills']}")
            print(f"Formatting Issues: {data['formatting_issues']}")
            print(f"Actionable Suggestions: {data['suggestions']}")
            if data.get("warnings"):
                print(f"Warnings/Notes: {data['warnings']}")
        else:
            print(f"Error {score_res.status_code}: {score_res.text}")

        # 3. Resume-to-JD Match
        print("\n--- Calling POST /api/ats/match ---")
        match_res = client.post("/api/ats/match", json=payload)
        if match_res.status_code == 200:
            m = match_res.json()
            print(f"Hybrid Match Score: {m['match_score']} / 100 (Advisory)")
            print(f"Embedding Cosine Similarity: {m['embeddingSimilarity']}% (Provider: {m['embedding_provider']})")
            print(f"Matched Skills Count: {len(m['matched_skills'])}")
            print(f"Missing Must-Have: {m['missing_must_have']}")
            print(f"Missing Nice-To-Have: {m['missing_nice_to_have']}")
            print(f"Section Similarities: {m['section_similarity']}")
            print(f"Plain-English Explanation:\n  \"{m['explanation']}\"")
        else:
            print(f"Error {match_res.status_code}: {match_res.text}")

        print("\nDone!")

if __name__ == "__main__":
    case = sys.argv[1] if len(sys.argv) > 1 else "strong"
    run_test(case)
