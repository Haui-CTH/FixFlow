# SPDX-License-Identifier: Apache-2.0

import logging
from fastapi import APIRouter
import httpx
from app.config import get_settings

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("")
async def health_check():
    settings = get_settings()
    ollama_available = False
    available_models: list[str] = []

    if settings.enable_ai:
        tags_url = f"{settings.ollama_base_url.rstrip('/')}/api/tags"
        try:
            async with httpx.AsyncClient(timeout=1.0) as client:
                resp = await client.get(tags_url)
                if resp.status_code == 200:
                    ollama_available = True
                    data = resp.json()
                    available_models = [
                        m.get("name")
                        for m in data.get("models", [])
                        if isinstance(m, dict) and m.get("name")
                    ]
        except Exception:
            ollama_available = False

    return {
        "status": "healthy",
        "service": "ai-service",
        "ollama_available": ollama_available,
        "ollama_model": settings.ollama_model,
        "available_models": available_models,
        "engine_fallback": "rule_based_active",
        "features": {
            "classification": "hybrid_llm_and_rules",
            "knowledge_base": "tf_idf_cosine_active",
            "recommender": "multi_factor_heuristic_active",
        },
    }
