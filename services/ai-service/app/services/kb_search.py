# SPDX-License-Identifier: Apache-2.0
"""
DX-FSM AI Service — Knowledge Base semantic search (A5.2)
TF-IDF + cosine similarity, in-memory index.
"""
from __future__ import annotations

import json
import logging
import threading
from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import Optional

from .text_vectorizer import (
    build_idf,
    vectorize,
    cosine_similarity,
)

logger = logging.getLogger(__name__)


@dataclass
class KBArticle:
    """Knowledge base article."""
    id: str
    title: str
    body: str
    category: str = "general"
    tags: list[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return asdict(self)

    @classmethod
    def from_dict(cls, d: dict) -> "KBArticle":
        return cls(
            id=d["id"],
            title=d["title"],
            body=d["body"],
            category=d.get("category", "general"),
            tags=d.get("tags", []),
        )


@dataclass
class SearchResult:
    article: KBArticle
    score: float
    matched_terms: list[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "id": self.article.id,
            "title": self.article.title,
            "category": self.article.category,
            "score": round(self.score, 4),
            "matched_terms": self.matched_terms,
            "snippet": self.article.body[:200],
        }


class KBSearchIndex:
    """
    In-memory KB search index. Thread-safe.

    Usage:
        idx = KBSearchIndex()
        idx.add(KBArticle(...))
        idx.build()  # call after bulk add
        results = idx.search("máy in không hoạt động", top_k=5)
    """

    def __init__(self) -> None:
        self._articles: dict[str, KBArticle] = {}
        self._idf: dict[str, float] = {}
        self._doc_tokens: list[list[str]] = []
        self._doc_ids: list[str] = []
        self._lock = threading.RLock()

    def add(self, article: KBArticle) -> None:
        with self._lock:
            self._articles[article.id] = article

    def add_many(self, articles: list[KBArticle]) -> None:
        with self._lock:
            for a in articles:
                self._articles[a.id] = a

    def remove(self, article_id: str) -> bool:
        with self._lock:
            return self._articles.pop(article_id, None) is not None

    def clear(self) -> None:
        with self._lock:
            self._articles.clear()
            self._idf.clear()
            self._doc_tokens.clear()
            self._doc_ids.clear()

    def size(self) -> int:
        return len(self._articles)

    def build(self) -> None:
        """Rebuild IDF + tokenized docs. Call after bulk updates."""
        with self._lock:
            self._doc_ids = list(self._articles.keys())
            corpus = []
            for aid in self._doc_ids:
                art = self._articles[aid]
                # Combine title (3x weight) + body + tags
                text = f"{art.title} {art.title} {art.title} {art.body} {' '.join(art.tags)}"
                corpus.append(text)
            self._idf, self._doc_tokens = build_idf(corpus)
            logger.info(
                "KBSearchIndex built: %d articles, %d unique terms",
                len(self._doc_ids),
                len(self._idf),
            )

    def get(self, article_id: str) -> Optional[KBArticle]:
        return self._articles.get(article_id)

    def all_articles(self) -> list[KBArticle]:
        return list(self._articles.values())

    def search(
        self,
        query: str,
        top_k: int = 5,
        min_score: float = 0.0,
        category: Optional[str] = None,
    ) -> list[SearchResult]:
        """
        Search KB by query. Returns top-k results by cosine similarity.

        Args:
            query: search query text
            top_k: max results to return
            min_score: filter results below this score
            category: optional category filter
        """
        with self._lock:
            if not self._doc_ids:
                return []
            q_vec = vectorize(query, self._idf)
            if not q_vec:
                return []
            results: list[SearchResult] = []
            q_terms = set(q_vec.keys())
            for aid, tokens in zip(self._doc_ids, self._doc_tokens):
                art = self._articles[aid]
                if category and art.category != category:
                    continue
                # Vectorize doc on the fly
                doc_text = f"{art.title} {art.title} {art.title} {art.body} {' '.join(art.tags)}"
                d_vec = vectorize(doc_text, self._idf)
                score = cosine_similarity(q_vec, d_vec)
                if score < min_score:
                    continue
                matched = sorted(q_terms & set(tokens))
                results.append(
                    SearchResult(
                        article=art,
                        score=score,
                        matched_terms=matched,
                    )
                )
            results.sort(key=lambda r: r.score, reverse=True)
            return results[:top_k]

    def save(self, path: Path) -> None:
        """Save articles to JSON (for persistence)."""
        with self._lock:
            data = [a.to_dict() for a in self._articles.values()]
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

    def load(self, path: Path) -> int:
        """Load articles from JSON. Returns count loaded."""
        data = json.loads(path.read_text(encoding="utf-8"))
        articles = [KBArticle.from_dict(d) for d in data]
        self.add_many(articles)
        self.build()
        return len(articles)


# ─── Global instance ──────────────────────────────────

_global_index: KBSearchIndex | None = None


def get_index() -> KBSearchIndex:
    """Get or create global KB index."""
    global _global_index
    if _global_index is None:
        _global_index = KBSearchIndex()
    return _global_index


def reset_index() -> None:
    """Reset global index (for testing)."""
    global _global_index
    _global_index = None
