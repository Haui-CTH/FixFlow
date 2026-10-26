# SPDX-License-Identifier: Apache-2.0
# DX-FSM Ticket Service Configuration

import os
from functools import lru_cache

try:
    from pydantic_settings import BaseSettings

    class Settings(BaseSettings):
        # Database
        database_url: str = "postgresql://dxfsm:<DEMO_PASSWORD>@postgres:5432/dxfsm"

        # Keycloak
        keycloak_public_url: str = "http://localhost:8080"
        keycloak_internal_url: str = "http://keycloak:8080"
        keycloak_realm: str = "dx-fsm"
        keycloak_client_id: str = "dx-fsm-api"

        # MinIO
        minio_endpoint: str = "minio:9000"
        minio_access_key: str = "minioadmin"
        minio_secret_key: str = "<DEMO_PASSWORD>"
        minio_bucket: str = "attachments"

        # AI Service
        ai_service_url: str = "http://ai-service:8002"
        ai_classify_timeout: float = 10.0

        # n8n
        n8n_webhook_url: str = "http://n8n:5678/webhook"

        # CORS
        cors_origins: list[str] = [
            "http://localhost:3000",
            "http://localhost:9180",
        ]

        class Config:
            env_file = ".env"
            env_file_encoding = "utf-8"
            extra = "ignore"
except ImportError:
    class Settings:  # type: ignore
        def __init__(self):
            self.database_url = os.getenv("DATABASE_URL", "postgresql://dxfsm:<DEMO_PASSWORD>@postgres:5432/dxfsm")
            self.keycloak_public_url = os.getenv("KEYCLOAK_PUBLIC_URL", "http://localhost:8080")
            self.keycloak_internal_url = os.getenv("KEYCLOAK_INTERNAL_URL", "http://keycloak:8080")
            self.keycloak_realm = os.getenv("KEYCLOAK_REALM", "dx-fsm")
            self.keycloak_client_id = os.getenv("KEYCLOAK_CLIENT_ID", "dx-fsm-api")
            self.minio_endpoint = os.getenv("MINIO_ENDPOINT", "minio:9000")
            self.minio_access_key = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
            self.minio_secret_key = os.getenv("MINIO_SECRET_KEY", "<DEMO_PASSWORD>")
            self.minio_bucket = os.getenv("MINIO_BUCKET", "attachments")
            self.ai_service_url = os.getenv("AI_SERVICE_URL", "http://ai-service:8002")
            self.ai_classify_timeout = float(os.getenv("AI_CLASSIFY_TIMEOUT", "10.0"))
            self.n8n_webhook_url = os.getenv("N8N_WEBHOOK_URL", "http://n8n:5678/webhook")
            self.cors_origins = ["http://localhost:3000", "http://localhost:9180"]


@lru_cache()
def get_settings() -> Settings:
    return Settings()


# Module-level singleton – dùng trực tiếp trong các file import
settings = get_settings()
