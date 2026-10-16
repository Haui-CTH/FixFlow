# SPDX-License-Identifier: Apache-2.0
"""DX-FSM AI Service — Classifier unit tests (A5.1)."""

import pytest
from app.services.rule_classifier import rule_based_classify, Classification
from app.services.ai_classifier import classify, cache_clear, cache_size


class TestRuleClassifier:
    """Unit tests for rule_based_classify."""

    def setup_method(self):
        """Clear cache before each test."""
        cache_clear()

    def test_classify_hardware_máy_in(self):
        result = rule_based_classify("Máy in HP không hoạt động", "Đèn báo nhấp nháy cam")
        assert result.category == "hardware"
        assert result.method == "rule_based"
        assert result.confidence > 50

    def test_classify_network_wifi(self):
        result = rule_based_classify("Mất kết nối WiFi toàn bộ tầng 3")
        assert result.category == "network"
        assert result.priority in ("high", "critical")

    def test_classify_software_office(self):
        result = rule_based_classify("Microsoft Word không mở được", "Báo lỗi corrupted")
        assert result.category == "software"

    def test_classify_electrical_mất_điện(self):
        result = rule_based_classify("Mất điện toàn bộ tầng 5", "Khẩn cấp")
        assert result.category == "electrical"
        assert result.priority == "critical"

    def test_classify_access_control_thẻ_từ(self):
        result = rule_based_classify("Thẻ từ không mở được cửa văn phòng")
        assert result.category == "access_control"
        assert result.priority in ("high", "medium")

    def test_classify_service_request_yêu_cầu(self):
        result = rule_based_classify("Yêu cầu cấp laptop mới", "Phòng marketing")
        assert result.category == "service_request"
        assert result.priority == "low"

    def test_empty_input_returns_other(self):
        result = rule_based_classify("", "")
        assert result.category == "other"
        assert result.confidence == 10.0

    def test_confidence_in_range(self):
        result = rule_based_classify("Máy in hỏng", "Cần sửa gấp")
        assert 10 <= result.confidence <= 99

    def test_method_is_rule_based(self):
        result = rule_based_classify("Test", "Input")
        assert result.method == "rule_based"


class TestAIClassifier:
    """Unit tests for classify() (hybrid)."""

    def setup_method(self):
        cache_clear()

    def test_classify_uses_cache(self):
        """Second call should use cache."""
        r1 = classify("Máy in hỏng", "Test", use_ai=False)
        r2 = classify("Máy in hỏng", "Test", use_ai=False)
        assert r1.category == r2.category
        assert r2.method == "cached"

    def test_cache_size_increments(self):
        assert cache_size() == 0
        classify("A", "B", use_ai=False)
        assert cache_size() == 1
        classify("A", "B", use_ai=False)
        assert cache_size() == 1  # same key, no increment

    def test_cache_clear(self):
        classify("X", "Y", use_ai=False)
        classify("Z", "W", use_ai=False)
        assert cache_size() == 2
        n = cache_clear()
        assert n == 2
        assert cache_size() == 0

    def test_classify_without_ai_uses_rules(self):
        """When use_ai=False, fallback to rule-based."""
        result = classify("Màn hình laptop bị sọc", use_ai=False)
        assert result.method == "rule_based"
        assert result.category == "hardware"
