# SPDX-License-Identifier: Apache-2.0
# DX-FSM Ticket Service – Tests for Cryptographic Work Order Seal & Verification

from datetime import datetime, timezone
from unittest.mock import MagicMock
import pytest

from app.services.seal import (
    compute_work_order_seal,
    mask_technician_name,
    verify_ticket_seal,
)


def test_mask_technician_name():
    # 3 parts: Hoàng Minh Tuấn -> Hoàng M. T.
    assert mask_technician_name("Hoàng Minh Tuấn") == "Hoàng M. T."
    # 2 parts: Nguyễn An -> Nguyễn A.
    assert mask_technician_name("Nguyễn An") == "Nguyễn A."
    # 1 part: tech01 -> t***1
    assert mask_technician_name("tech01") == "t***1"
    # Empty
    assert mask_technician_name(None) == "Kỹ thuật viên HaUI"
    assert mask_technician_name("") == "Kỹ thuật viên HaUI"


def test_compute_work_order_seal_deterministic():
    now = datetime(2026, 10, 29, 10, 0, 0, tzinfo=timezone.utc)
    full_hash1, code1 = compute_work_order_seal(
        ticket_number="TKT-2026-000003",
        status="resolved",
        technician_id="c0a80101-0000-0000-0000-000000000001",
        resolved_at=now,
        sla_met=True,
    )
    full_hash2, code2 = compute_work_order_seal(
        ticket_number="TKT-2026-000003",
        status="resolved",
        technician_id="c0a80101-0000-0000-0000-000000000001",
        resolved_at=now,
        sla_met=True,
    )
    assert full_hash1 == full_hash2
    assert code1 == code2
    assert len(full_hash1) == 64
    assert len(code1) == 19  # XXXX-XXXX-XXXX-XXXX (16 chars + 3 hyphens)


def test_verify_unresolved_ticket():
    ticket = MagicMock()
    ticket.status = "in_progress"
    ticket.ticket_number = "TKT-2026-000100"
    ticket.title = "Sự cố điều hòa Lab 204"
    ticket.category = "hardware"
    ticket.customer_location = "Nhà A10"
    ticket.technician_name = "Hoàng Minh Tuấn"
    ticket.sla_met = None
    ticket.resolved_at = None

    result = verify_ticket_seal(ticket)
    assert result["valid"] is False
    assert result["status_label"] == "Chưa hoàn tất nghiệm thu"
    assert result["technician_name"] == "Hoàng M. T."


def test_verify_resolved_ticket_success_and_tamper_detection():
    now = datetime(2026, 10, 29, 11, 30, 0, tzinfo=timezone.utc)
    ticket = MagicMock()
    ticket.id = "c0a80101-0000-0000-0000-000000000099"
    ticket.ticket_number = "TKT-2026-000003"
    ticket.title = "Máy chiếu không nhận tín hiệu Lab 301"
    ticket.category = "hardware"
    ticket.priority = "high"
    ticket.status = "resolved"
    ticket.customer_location = "Tầng 3 Nhà A10"
    ticket.technician_id = "c0a80101-0000-0000-0000-000000000001"
    ticket.technician_name = "Hoàng Minh Tuấn"
    ticket.resolved_at = now
    ticket.sla_met = True

    # 1. Verification without provided code -> returns authentic seal
    res1 = verify_ticket_seal(ticket)
    assert res1["valid"] is True
    assert res1["seal_code"] is not None
    code = res1["seal_code"]

    # 2. Verification with correct code -> Valid
    res2 = verify_ticket_seal(ticket, provided_code=code)
    assert res2["valid"] is True

    # 3. Verification with tampered code -> Invalid
    res3 = verify_ticket_seal(ticket, provided_code="FFFF-FFFF-FFFF-FFFF")
    assert res3["valid"] is False
    assert "không khớp" in res3["status_label"]

    # 4. Tampered ticket attribute (e.g. Someone altered sla_met in DB from True to False)
    ticket.sla_met = False
    res4 = verify_ticket_seal(ticket, provided_code=code)
    assert res4["valid"] is False
