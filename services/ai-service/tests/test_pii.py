# SPDX-License-Identifier: Apache-2.0
"""
Tests for PII Anonymization & Data Protection (Decree 13/2023/ND-CP compliance).
Inspired by HIT-Champion/Signet privacy engineering.
"""
from app.services.pii import anonymize_pii, mask_pii, has_pii


def test_mask_vietnamese_phone_numbers():
    text = "Máy chiếu P.305 A1 hỏng, liên hệ thầy Hùng 0912345678 hoặc 098.765.4321"
    masked = mask_pii(text)
    assert "0912345678" not in masked
    assert "098.765.4321" not in masked
    assert "[SĐT-1]" in masked
    assert "[SĐT-2]" in masked
    assert "Máy chiếu P.305 A1 hỏng" in masked


def test_mask_international_format_phone():
    text = "Hỗ trợ khẩn cấp qua số +84988776655 gặp kỹ thuật viên"
    masked = mask_pii(text)
    assert "+84988776655" not in masked
    assert "[SĐT-1]" in masked


def test_mask_email_addresses():
    text = "Vui lòng gửi file cấu hình qua email giaovien@haui.edu.vn để kiểm tra"
    masked = mask_pii(text)
    assert "giaovien@haui.edu.vn" not in masked
    assert "[EMAIL-1]" in masked


def test_mask_citizen_id_cccd():
    text = "Bàn giao thiết bị cho nhân sự mang số CCCD 001200001234 tại phòng tài vụ"
    masked = mask_pii(text)
    assert "001200001234" not in masked
    assert "[CCCD-1]" in masked


def test_multiple_pii_combination():
    raw = "Thầy Tuấn (CCCD: 036199002345, SĐT: 0976123456, mail: tuan.nv@haui.vn) báo mất mạng"
    masked, mapping = anonymize_pii(raw)

    assert "[CCCD-1]" in masked
    assert "[SĐT-1]" in masked
    assert "[EMAIL-1]" in masked
    assert mapping["[CCCD-1]"] == "036199002345"
    assert mapping["[SĐT-1]"] == "0976123456"
    assert mapping["[EMAIL-1]"] == "tuan.nv@haui.vn"
    assert "báo mất mạng" in masked


def test_clean_text_without_pii():
    clean = "Máy in HP LaserJet 1020 tại phòng văn thư bị kẹt giấy và nháy đèn đỏ"
    assert has_pii(clean) is False
    masked = mask_pii(clean)
    assert masked == clean


def test_has_pii_detection():
    assert has_pii("Gọi số 0903123456 ngay") is True
    assert has_pii("Email: test@domain.com") is True
    assert has_pii("Số căn cước 012345678901") is True
    assert has_pii("Lỗi switch tầng 4 phòng lab 201") is False


if __name__ == "__main__":
    test_mask_vietnamese_phone_numbers()
    test_mask_international_format_phone()
    test_mask_email_addresses()
    test_mask_citizen_id_cccd()
    test_multiple_pii_combination()
    test_clean_text_without_pii()
    test_has_pii_detection()
    print("ALL 7 PII TESTS PASSED 100%!")

