# SPDX-License-Identifier: Apache-2.0
# DX-FSM AI Service Configuration

from functools import lru_cache
import os

try:
    from pydantic_settings import BaseSettings

    class Settings(BaseSettings):
        ollama_base_url: str = "http://localhost:11434"
        ollama_model: str = "llama3.2:3b"
        request_timeout: int = 30
        ollama_connect_timeout: float = 2.0  # Fast fail if Ollama daemon is offline
        enable_ai: bool = True

        class Config:
            env_file = ".env"
            extra = "ignore"
except ImportError:
    # Lightweight fallback when running outside virtualenv/container
    class Settings:  # type: ignore
        def __init__(self):
            self.ollama_base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
            self.ollama_model = os.getenv("OLLAMA_MODEL", "llama3.2:3b")
            self.request_timeout = int(os.getenv("REQUEST_TIMEOUT", "30"))
            self.ollama_connect_timeout = float(os.getenv("OLLAMA_CONNECT_TIMEOUT", "2.0"))
            self.enable_ai = os.getenv("ENABLE_AI", "true").lower() in ("true", "1", "yes")


@lru_cache()
def get_settings() -> Settings:
    return Settings()
