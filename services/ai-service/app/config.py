# DX-FSM AI Service Configuration

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3.2:3b"
    request_timeout: int = 60
    enable_ai: bool = True

    class Config:
        env_file = ".env"
