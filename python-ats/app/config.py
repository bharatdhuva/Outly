from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "outly-python-ats"
    host: str = "0.0.0.0"
    port: int = 8000
    log_level: str = "INFO"

    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"
    gemini_embedding_model: str = "models/gemini-embedding-001"


    llm_timeout_seconds: float = 45.0
    llm_max_retries: int = 3
    embedding_timeout_seconds: float = 20.0

    max_file_bytes: int = 5 * 1024 * 1024
    max_text_chars: int = 80_000

    match_skill_weight: float = Field(default=0.55, ge=0.0, le=1.0)
    match_semantic_weight: float = Field(default=0.30, ge=0.0, le=1.0)
    match_seniority_weight: float = Field(default=0.15, ge=0.0, le=1.0)

    internal_api_key: str = ""

    @field_validator("gemini_api_key", mode="before")
    @classmethod
    def _strip_key(cls, value: object) -> str:
        return str(value or "").strip()

    @property
    def has_gemini_key(self) -> bool:
        return bool(self.gemini_api_key)

    @property
    def match_weights(self) -> tuple[float, float, float]:
        total = (
            self.match_skill_weight
            + self.match_semantic_weight
            + self.match_seniority_weight
        )
        if total <= 0:
            return (0.55, 0.30, 0.15)
        return (
            self.match_skill_weight / total,
            self.match_semantic_weight / total,
            self.match_seniority_weight / total,
        )


@lru_cache
def get_settings() -> Settings:
    return Settings()
