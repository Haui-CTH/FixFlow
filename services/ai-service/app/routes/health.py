# SPDX-License-Identifier: Apache-2.0

from fastapi import APIRouter

router = APIRouter()


@router.get("")
async def health_check():
    return {
        "status": "healthy",
        "service": "ai-service",
        "ollama_available": False,  # Placeholder
    }
