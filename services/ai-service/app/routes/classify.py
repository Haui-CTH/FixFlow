# SPDX-License-Identifier: Apache-2.0
# DX-FSM AI Service – Ticket Classification (A5.1)
# Hybrid: cache → Ollama LLM → rule-based fallback

from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Optional

from app.services.ai_classifier import classify, cache_clear, cache_size

router = APIRouter()


class ClassifyRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=5000)


class ClassifyResponse(BaseModel):
    category: str
    priority: str
    confidence: float
    method: str  # "ai" | "rule_based" | "cached"
    recommendation: Optional[str] = None
    reasoning: Optional[str] = None


@router.post("", response_model=ClassifyResponse)
async def classify_ticket(request: ClassifyRequest):
    result = classify(request.title, request.description)
    return ClassifyResponse(
        category=result.category,
        priority=result.priority,
        confidence=result.confidence,
        method=result.method,
        recommendation=f"Gửi ticket đến bộ phận {result.category}",
        reasoning=(result.details or {}).get("reasoning"),
    )


@router.post("/cache/clear")
async def clear_cache():
    """Clear in-memory classification cache."""
    n = cache_clear()
    return {"cleared": n}


@router.get("/cache/size")
async def get_cache_size():
    return {"size": cache_size()}
