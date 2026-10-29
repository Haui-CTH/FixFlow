# SPDX-License-Identifier: Apache-2.0
# DX-FSM Ticket Service – Cryptographic Work Order Seal & Verification
# Ký số HMAC-SHA256 lên Biên bản Nghiệm thu Dịch vụ Kỹ thuật Hiện trường (Work Order)
# Chống giả mạo, chống sửa lén thời gian xử lý hoặc trạng thái SLA.

from __future__ import annotations

import hashlib
import hmac
import os
from datetime import datetime
from typing import Any, Optional


def get_seal_secret() -> str:
    # Lấy khóa ký HMAC từ cấu hình môi trường (hoặc fallback dev an toàn)
    val = os.environ.get("SEAL_SECRET") or os.environ.get("SECRET_KEY")
    if val:
        return val
    return "fixflow-hmac-seal-" + "authority-dev-signing-token"


def mask_technician_name(full_name: Optional[str]) -> str:
    """
    Che bớt thông tin họ tên Kỹ thuật viên (Nghị định 13/2023/NĐ-CP) khi hiển thị công khai.
    Ví dụ: 'Hoàng Minh Tuấn' -> 'Hoàng M. T.'
           'Nguyễn Văn A' -> 'Nguyễn V. A.'
    """
    if not full_name or not full_name.strip():
        return "Kỹ thuật viên HaUI"

    parts = full_name.strip().split()
    if len(parts) == 1:
        name = parts[0]
        if len(name) > 2:
            return f"{name[0]}***{name[-1]}"
        return name

    # Giữ họ, viết tắt các chữ lót và tên
    family_name = parts[0]
    initials = [f"{p[0].upper()}." for p in parts[1:] if p]
    return f"{family_name} {' '.join(initials)}"


def compute_work_order_seal(
    ticket_number: str,
    status: str,
    technician_id: Optional[str],
    resolved_at: Optional[datetime],
    sla_met: Optional[bool],
) -> tuple[str, str]:
    """
    Tính toán chữ ký số HMAC-SHA256 trên các trường bất biến của Biên bản Nghiệm thu:
    - ticket_number
    - status
    - technician_id
    - resolved_at (ISO formatted)
    - sla_met ('met' / 'breached' / 'pending')
    
    Trả về: (full_hash_hex_64, short_display_code_16)
    """
    secret = get_seal_secret().encode("utf-8")
    resolved_iso = resolved_at.isoformat() if resolved_at else "unresolved"
    sla_str = "met" if sla_met is True else ("breached" if sla_met is False else "unknown")
    tech_str = str(technician_id or "unassigned")

    canonical_payload = f"{ticket_number}|{status}|{tech_str}|{resolved_iso}|{sla_str}"
    full_hash = hmac.new(secret, canonical_payload.encode("utf-8"), hashlib.sha256).hexdigest().upper()

    # Định dạng mã hiển thị 16 ký tự chia thành 4 khối: XXXX-XXXX-XXXX-XXXX
    raw16 = full_hash[:16]
    formatted_code = f"{raw16[0:4]}-{raw16[4:8]}-{raw16[8:12]}-{raw16[12:16]}"
    return full_hash, formatted_code


def verify_ticket_seal(
    ticket: Any,
    provided_code: Optional[str] = None,
) -> dict[str, Any]:
    """
    Xác thực tính toàn vẹn của Biên bản Nghiệm thu cho một ticket.
    - Nếu ticket chưa nghiệm thu (chưa resolved/closed) -> trạng thái 'pending_resolution'
    - Nếu ticket đã nghiệm thu: tính lại HMAC seal và so sánh với mã cung cấp (nếu có)
    """
    is_completed = ticket.status in ("resolved", "closed")
    if not is_completed:
        return {
            "valid": False,
            "status_label": "Chưa hoàn tất nghiệm thu",
            "reason": "Phiếu sự cố đang trong quá trình xử lý hoặc chưa được kỹ thuật viên hoàn tất nghiệm thu hiện trường.",
            "ticket_number": ticket.ticket_number,
            "title": ticket.title,
            "category": ticket.category,
            "status": ticket.status,
            "location": ticket.customer_location or "Khuôn viên HaUI Campus",
            "technician_name": mask_technician_name(ticket.technician_name),
            "seal_code": None,
            "full_hash": None,
            "sla_met": ticket.sla_met,
            "resolved_at": ticket.resolved_at.isoformat() if ticket.resolved_at else None,
        }

    full_hash, formatted_code = compute_work_order_seal(
        ticket_number=ticket.ticket_number,
        status=ticket.status,
        technician_id=str(ticket.technician_id) if ticket.technician_id else None,
        resolved_at=ticket.resolved_at,
        sla_met=ticket.sla_met,
    )

    is_valid = True
    if provided_code:
        cleaned_prov = provided_code.strip().replace("-", "").upper()
        # So sánh an toàn chống timing attack
        if len(cleaned_prov) == 16:
            is_valid = hmac.compare_digest(cleaned_prov, full_hash[:16])
        elif len(cleaned_prov) == 64:
            is_valid = hmac.compare_digest(cleaned_prov, full_hash)
        else:
            is_valid = False

    return {
        "valid": is_valid,
        "status_label": "Biên bản hợp lệ & Đã niêm phong mật mã" if is_valid else "Chữ ký mật mã không khớp (nghi vấn bị sửa lén)",
        "ticket_number": ticket.ticket_number,
        "ticket_id": str(ticket.id),
        "title": ticket.title,
        "category": ticket.category,
        "priority": ticket.priority,
        "status": ticket.status,
        "location": ticket.customer_location or "Khuôn viên HaUI Campus",
        "technician_name": mask_technician_name(ticket.technician_name),
        "resolved_at": ticket.resolved_at.isoformat() if ticket.resolved_at else None,
        "sla_met": ticket.sla_met,
        "seal_code": formatted_code,
        "full_hash": full_hash,
        "issued_by": "HaUI ICT Center — FixFlow Digital Authority",
        "algorithm": "HMAC-SHA256 (RFC 2104)",
    }
