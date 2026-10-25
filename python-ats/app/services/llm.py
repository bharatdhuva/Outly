from __future__ import annotations

import asyncio
import logging
from functools import lru_cache
from pathlib import Path

from pydantic import BaseModel

from app.config import Settings, get_settings
from app.models.schemas import LlmAtsAnalysis, LlmTailorResult

logger = logging.getLogger("outly.llm")
PROMPTS_DIR = Path(__file__).resolve().parent.parent / "prompts"


def _read_prompt(name: str) -> str:
    return (PROMPTS_DIR / name).read_text(encoding="utf-8")


class LlmClient:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    @property
    def available(self) -> bool:
        return self.settings.has_gemini_key

    async def _invoke_structured(
        self,
        schema: type[BaseModel],
        system_prompt: str,
        human_prompt: str,
        variables: dict[str, str],
        temperature: float,
    ) -> BaseModel | None:
        if not self.available:
            return None

        from langchain_core.prompts import ChatPromptTemplate
        from langchain_google_genai import ChatGoogleGenerativeAI

        model = ChatGoogleGenerativeAI(
            model=self.settings.gemini_model,
            google_api_key=self.settings.gemini_api_key,
            temperature=temperature,
            max_retries=0,
        )
        structured = model.with_structured_output(schema)
        prompt = ChatPromptTemplate.from_messages(
            [
                ("system", system_prompt),
                ("human", human_prompt),
            ]
        )
        chain = prompt | structured
        delay = 0.6
        last_error: Exception | None = None
        for attempt in range(self.settings.llm_max_retries):
            try:
                result = await asyncio.wait_for(
                    chain.ainvoke(variables),
                    timeout=self.settings.llm_timeout_seconds,
                )
                if isinstance(result, schema):
                    return result
                return schema.model_validate(result)
            except Exception as exc:  # noqa: BLE001
                last_error = exc
                logger.warning(
                    "llm_call_failed attempt=%s error=%s",
                    attempt + 1,
                    type(exc).__name__,
                )
                await asyncio.sleep(delay)
                delay *= 2
        logger.error("llm_call_exhausted error=%s", type(last_error).__name__ if last_error else "unknown")
        return None

    async def analyse_resume(
        self,
        resume: str,
        jd: str,
        deterministic_notes: str,
    ) -> LlmAtsAnalysis | None:
        return await self._invoke_structured(  # type: ignore[return-value]
            LlmAtsAnalysis,
            _read_prompt("ats_system.txt"),
            _read_prompt("ats_human.txt"),
            {
                "resume": resume[: self.settings.max_text_chars],
                "jd": jd[: self.settings.max_text_chars] or "No target job description provided.",
                "deterministic_notes": deterministic_notes[:4000],
            },
            temperature=0.1,
        )

    async def tailor_resume(self, resume: str, jd: str) -> LlmTailorResult | None:
        return await self._invoke_structured(  # type: ignore[return-value]
            LlmTailorResult,
            _read_prompt("tailor_system.txt"),
            _read_prompt("tailor_human.txt"),
            {
                "resume": resume[: self.settings.max_text_chars],
                "jd": jd[: self.settings.max_text_chars],
            },
            temperature=0.25,
        )


@lru_cache
def get_llm_client() -> LlmClient:
    return LlmClient(get_settings())
