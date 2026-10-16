# SPDX-License-Identifier: Apache-2.0
# DX-FSM Notification Service – Configuration

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Service
    service_name: str = "DX-FSM Notification Service"
    service_version: str = "1.2.0"

    # SMTP (email channel)
    smtp_host: str = "mailhog"          # mailhog for local dev
    smtp_port: int = 1025
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = "noreply@dx-fsm.local"
    smtp_use_tls: bool = False

    # SMS (stub channel) — set real provider in production
    sms_enabled: bool = False
    sms_provider: str = "stub"          # stub | twilio | esms
    sms_api_key: str = ""

    # Push (stub channel) — set real provider in production
    push_enabled: bool = False
    push_provider: str = "stub"         # stub | fcm | apns
    push_api_key: str = ""

    # Service-to-service auth (n8n ticket-service gọi vào đây)
    # Token dùng để verify request từ internal services
    service_token: str = ""

    # CORS
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:9180",
    ]

    class Config:
        env_file = ".env"
        env_prefix = ""
        case_sensitive = False


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
