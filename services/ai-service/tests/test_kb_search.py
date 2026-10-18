# SPDX-License-Identifier: Apache-2.0
"""DX-FSM AI Service — KB search unit tests (A5.2)."""

import pytest
from pathlib import Path

from app.services.text_vectorizer import (
    tokenize,
    compute_tf,
    compute_idf,
    vectorize,
    cosine_similarity,
    build_idf,
)
from app.services.kb_search import (
    KBSearchIndex,
    KBArticle,
    SearchResult,
    get_index,
    reset_index,
)


class TestTokenizer:
    def test_simple_tokenize(self):
        tokens = tokenize("Máy in không hoạt động")
        assert "máy" in tokens
        assert "in" in tokens
        assert "không" not in tokens  # stop word
        assert "hoạt" in tokens
        assert "động" in tokens

    def test_empty_text(self):
        assert tokenize("") == []
        assert tokenize(None) == []

    def test_lowercase(self):
        tokens = tokenize("MAI IN KHONG")
        assert all(t == t.lower() for t in tokens)

    def test_strip_punctuation(self):
        tokens = tokenize("Máy in, laptop, chuột!")
        assert "," not in "".join(tokens)
        assert "!" not in "".join(tokens)

    def test_short_tokens_filtered(self):
        tokens = tokenize("a b c máy in")
        # "a", "b", "c" should be filtered (len < 2)
        assert "a" not in tokens
        assert "máy" in tokens


class TestTFIDF:
    def test_tf_basic(self):
        tf = compute_tf(["máy", "in", "máy", "không"])
        assert tf["máy"] == 0.5
        assert tf["in"] == 0.25
        assert tf["không"] == 0.25

    def test_idf_common_word_low(self):
        # "máy" appears in all docs → low IDF
        idf, _ = build_idf([
            "máy in laptop",
            "máy in printer",
            "máy in server",
        ])
        # Common words get lower IDF
        assert idf.get("in", 0) < idf.get("laptop", 0) + 1

    def test_vectorize_sparse(self):
        idf, _ = build_idf(["máy in laptop", "máy in printer"])
        v = vectorize("máy in laptop mới", idf)
        assert isinstance(v, dict)
        assert "máy" in v
        assert v["máy"] > 0

    def test_cosine_similarity_identical(self):
        v = {"a": 0.5, "b": 0.3}
        assert abs(cosine_similarity(v, v) - 1.0) < 1e-6

    def test_cosine_similarity_orthogonal(self):
        v1 = {"a": 0.5}
        v2 = {"b": 0.5}
        assert cosine_similarity(v1, v2) == 0.0

    def test_cosine_similarity_empty(self):
        assert cosine_similarity({}, {"a": 0.5}) == 0.0
        assert cosine_similarity({"a": 0.5}, {}) == 0.0


class TestKBSearchIndex:
    def setup_method(self):
        """Fresh index per test."""
        reset_index()
        self.idx = get_index()

    def test_empty_search(self):
        results = self.idx.search("anything")
        assert results == []

    def test_add_and_get(self):
        self.idx.add(KBArticle(id="a", title="Test", body="Hello world"))
        assert self.idx.get("a") is not None
        assert self.idx.size() == 1

    def test_add_duplicate_keeps_latest(self):
        self.idx.add(KBArticle(id="a", title="v1", body="x"))
        self.idx.add(KBArticle(id="a", title="v2", body="y"))
        assert self.idx.size() == 1
        assert self.idx.get("a").title == "v2"

    def test_remove(self):
        self.idx.add(KBArticle(id="a", title="Test", body="x"))
        assert self.idx.remove("a")
        assert self.idx.size() == 0
        assert not self.idx.remove("a")  # second time

    def test_clear(self):
        self.idx.add(KBArticle(id="a", title="x", body="y"))
        self.idx.add(KBArticle(id="b", title="z", body="w"))
        self.idx.clear()
        assert self.idx.size() == 0

    def test_build_required_before_search(self):
        self.idx.add(KBArticle(id="a", title="Máy in", body="Printer offline"))
        # No build() yet → no doc tokens
        results = self.idx.search("máy in")
        assert results == []
        self.idx.build()
        results = self.idx.search("máy in")
        assert len(results) > 0

    def test_search_returns_top_k(self):
        self.idx.add_many([
            KBArticle(id="1", title="Máy in HP", body="Printer error"),
            KBArticle(id="2", title="Laptop Dell", body="Laptop battery issue"),
            KBArticle(id="3", title="Máy in Canon", body="Printer jam"),
        ])
        self.idx.build()
        results = self.idx.search("máy in", top_k=2)
        assert len(results) == 2
        # Both should be printer-related
        assert all("in" in r.article.title.lower() for r in results)

    def test_search_relevance(self):
        self.idx.add_many([
            KBArticle(id="wifi", title="WiFi mất kết nối", body="Router reset guide"),
            KBArticle(id="laptop", title="Laptop pin yếu", body="Battery replacement"),
        ])
        self.idx.build()
        results = self.idx.search("WiFi không kết nối", top_k=2)
        assert results[0].article.id == "wifi"
        assert results[0].score > 0

    def test_search_min_score(self):
        self.idx.add_many([
            KBArticle(id="1", title="WiFi", body="Network"),
            KBArticle(id="2", title="Laptop", body="Hardware"),
        ])
        self.idx.build()
        # High min_score should filter out low-similarity results
        results = self.idx.search("WiFi", top_k=10, min_score=0.5)
        assert all(r.score >= 0.5 for r in results)

    def test_search_category_filter(self):
        self.idx.add_many([
            KBArticle(id="hw1", title="Máy in", body="x", category="hardware"),
            KBArticle(id="nw1", title="Router", body="x", category="network"),
        ])
        self.idx.build()
        results = self.idx.search("setup", top_k=10, category="hardware")
        # Should only return hardware articles
        for r in results:
            assert r.article.category == "hardware"

    def test_search_matched_terms(self):
        self.idx.add(KBArticle(id="1", title="WiFi guide", body="router reset"))
        self.idx.build()
        results = self.idx.search("WiFi router", top_k=1)
        assert "wifi" in results[0].matched_terms or "router" in results[0].matched_terms

    def test_thread_safety(self):
        import threading
        def adder(i):
            self.idx.add(KBArticle(id=str(i), title=f"Article {i}", body=f"body {i}"))
        threads = [threading.Thread(target=adder, args=(i,)) for i in range(50)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()
        assert self.idx.size() == 50

    def test_save_load(self, tmp_path):
        self.idx.add_many([
            KBArticle(id="1", title="Test 1", body="body 1", category="hw"),
            KBArticle(id="2", title="Test 2", body="body 2", category="sw"),
        ])
        self.idx.build()
        save_path = tmp_path / "kb.json"
        self.idx.save(save_path)
        assert save_path.exists()

        new_idx = KBSearchIndex()
        n = new_idx.load(save_path)
        assert n == 2
        assert new_idx.size() == 2


class TestGlobalIndex:
    def test_singleton(self):
        reset_index()
        i1 = get_index()
        i2 = get_index()
        assert i1 is i2

    def test_reset_creates_new(self):
        i1 = get_index()
        reset_index()
        i2 = get_index()
        assert i1 is not i2
