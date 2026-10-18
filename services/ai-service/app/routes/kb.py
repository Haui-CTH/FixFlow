# SPDX-License-Identifier: Apache-2.0
"""DX-FSM AI Service — Knowledge base search API (A5.2)"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional

from app.services.kb_search import (
    KBSearchIndex,
    KBArticle,
    SearchResult,
    get_index,
    reset_index,
)
from app.services.ai_classifier import classify

router = APIRouter()


# ─── Request/Response models ──────────────────────────

class ArticleCreate(BaseModel):
    id: str = Field(..., min_length=1, max_length=100)
    title: str = Field(..., min_length=1, max_length=300)
    body: str = Field(..., min_length=1, max_length=10000)
    category: str = Field(default="general", max_length=50)
    tags: list[str] = Field(default_factory=list)


class SearchHit(BaseModel):
    id: str
    title: str
    category: str
    score: float
    matched_terms: list[str]
    snippet: str


class SearchResponse(BaseModel):
    query: str
    top_k: int
    total_articles: int
    hits: list[SearchHit]


class IndexStats(BaseModel):
    size: int
    unique_terms: int


# ─── Routes ────────────────────────────────────────────

@router.post("/articles", response_model=dict, status_code=201)
async def create_article(article: ArticleCreate):
    """Add an article to the KB index."""
    idx = get_index()
    if idx.get(article.id):
        raise HTTPException(409, detail=f"Article {article.id} already exists")
    idx.add(KBArticle(**article.dict()))
    idx.build()
    return {"id": article.id, "status": "created"}


@router.put("/articles/{article_id}", response_model=dict)
async def update_article(article_id: str, article: ArticleCreate):
    """Update an existing article."""
    if article_id != article.id:
        raise HTTPException(400, detail="ID mismatch")
    idx = get_index()
    idx.remove(article_id)
    idx.add(KBArticle(**article.dict()))
    idx.build()
    return {"id": article_id, "status": "updated"}


@router.delete("/articles/{article_id}", response_model=dict)
async def delete_article(article_id: str):
    """Remove article from index."""
    idx = get_index()
    if not idx.remove(article_id):
        raise HTTPException(404, detail=f"Article {article_id} not found")
    idx.build()
    return {"id": article_id, "status": "deleted"}


@router.get("/articles/{article_id}", response_model=dict)
async def get_article(article_id: str):
    """Get single article by ID."""
    idx = get_index()
    art = idx.get(article_id)
    if not art:
        raise HTTPException(404, detail=f"Article {article_id} not found")
    return art.to_dict()


@router.get("/search", response_model=SearchResponse)
async def search(
    q: str = Query(..., min_length=1, max_length=500),
    top_k: int = Query(5, ge=1, le=50),
    min_score: float = Query(0.0, ge=0.0, le=1.0),
    category: Optional[str] = Query(None, max_length=50),
):
    """
    Semantic search KB by query.

    Uses TF-IDF + cosine similarity. Returns top-k results sorted by score.
    """
    idx = get_index()
    results = idx.search(q, top_k=top_k, min_score=min_score, category=category)
    return SearchResponse(
        query=q,
        top_k=top_k,
        total_articles=idx.size(),
        hits=[SearchHit(**r.to_dict()) for r in results],
    )


@router.post("/search/suggest", response_model=SearchResponse)
async def search_with_classification(
    q: str = Query(..., min_length=1, max_length=500),
    top_k: int = Query(5, ge=1, le=50),
):
    """
    Search KB with auto-classification of query.
    Auto-filter by predicted category nếu confidence đủ cao.
    """
    idx = get_index()
    cls = classify(q, use_ai=False)
    # Auto-filter by category if confidence high
    category_filter = None
    if cls.confidence >= 70 and cls.category != "other":
        category_filter = cls.category
    results = idx.search(q, top_k=top_k, category=category_filter)
    return SearchResponse(
        query=q,
        top_k=top_k,
        total_articles=idx.size(),
        hits=[SearchHit(**r.to_dict()) for r in results],
    )


@router.post("/rebuild", response_model=IndexStats)
async def rebuild_index():
    """Rebuild the search index (re-compute IDF)."""
    idx = get_index()
    idx.build()
    return IndexStats(size=idx.size(), unique_terms=len(idx._idf))


@router.get("/stats", response_model=IndexStats)
async def get_stats():
    """Get index statistics."""
    idx = get_index()
    return IndexStats(size=idx.size(), unique_terms=len(idx._idf))


@router.post("/reset", response_model=dict)
async def reset_and_seed():
    """
    Reset index và seed với default KB articles.
    Useful cho dev/testing.
    """
    import json
    from pathlib import Path

    reset_index()
    idx = get_index()
    seed_path = Path(__file__).parent.parent / "data" / "kb_seed.json"
    if seed_path.exists():
        n = idx.load(seed_path)
        return {"status": "seeded", "articles": n}
    return {"status": "empty", "articles": 0}
