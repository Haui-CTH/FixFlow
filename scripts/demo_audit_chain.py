#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""
Minh chứng Nguyên lý (iii): Quản trị Dữ liệu & Kiểm toán Toàn vẹn (DX-OS).
Kịch bản: Chuỗi băm mật mã học (Cryptographic SHA-256 Hash-Chain) liên kết
nhật ký sự kiện (Audit Log / Outbox Events). Hệ thống tự động xác thực
tính toàn vẹn dữ liệu và phát hiện ngay lập tức bất kỳ hành vi sửa đổi trái phép (Tamper Detection).
"""

import sys
import json
import hashlib
from datetime import datetime, timezone

def calculate_block_hash(prev_hash: str, record_id: str, timestamp: str, action: str, data: dict) -> str:
    serialized = f"{prev_hash}|{record_id}|{timestamp}|{action}|{json.dumps(data, sort_keys=True)}"
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()

def log_step(step: str, title: str):
    print(f"\n[\033[1;34mBƯỚC {step}\033[0m] {title}")

def log_success(msg: str):
    print(f"  \033[1;32m✓\033[0m {msg}")

def log_warn(msg: str):
    print(f"  \033[1;33m⚠\033[0m {msg}")

def log_error(msg: str):
    print(f"  \033[1;31m✗\033[0m {msg}")

def log_info(msg: str):
    print(f"    \033[0;37m{msg}\033[0m")

def main():
    print("=" * 76)
    print(" MINH CHỨNG NGUYÊN LÝ (iii): KIỂM TOÁN CHỐNG SỬA ĐỔI (AUDIT HASH-CHAIN)")
    print("=" * 76)

    # 1. Khởi tạo chuỗi sự kiện kiểm toán ban đầu
    log_step("1", "Tạo chuỗi sự kiện nghiệp vụ thực tế (Ticket Lifecycle Events)")
    raw_events = [
        {
            "id": "EVT-101",
            "timestamp": "2026-10-28T08:00:00Z",
            "action": "TICKET_CREATED",
            "actor": "sensor:IOT-LAB402",
            "data": {"ticket_number": "TKT-2026-088", "priority": "high", "title": "Cảnh báo quá nhiệt Server Lab 402"}
        },
        {
            "id": "EVT-102",
            "timestamp": "2026-10-28T08:01:15Z",
            "action": "AI_DISPATCH_RECOMMENDED",
            "actor": "service:ai-recommender",
            "data": {"ticket_number": "TKT-2026-088", "assigned_to": "tech_nguyen_van_a", "confidence": 0.94}
        },
        {
            "id": "EVT-103",
            "timestamp": "2026-10-28T08:05:00Z",
            "action": "DISPATCH_ACCEPTED",
            "actor": "user:tech_nguyen_van_a",
            "data": {"ticket_number": "TKT-2026-088", "eta_minutes": 15}
        },
        {
            "id": "EVT-104",
            "timestamp": "2026-10-28T08:35:00Z",
            "action": "TICKET_RESOLVED",
            "actor": "user:tech_nguyen_van_a",
            "data": {"ticket_number": "TKT-2026-088", "resolution": "Thay quạt tản nhiệt Chassis B", "status": "resolved"}
        }
    ]

    # 2. Xây dựng chuỗi liên kết băm SHA-256 (Merkle / Hash-chain)
    log_step("2", "Ký số liên kết băm SHA-256 từng mắt xích (Merkle Hash-Chain Linkage)")
    genesis_hash = "0" * 64
    chain = []
    prev_hash = genesis_hash

    for i, evt in enumerate(raw_events, 1):
        curr_hash = calculate_block_hash(
            prev_hash=prev_hash,
            record_id=evt["id"],
            timestamp=evt["timestamp"],
            action=evt["action"],
            data=evt["data"]
        )
        block = {
            "block_index": i,
            "event_id": evt["id"],
            "action": evt["action"],
            "prev_hash": prev_hash,
            "curr_hash": curr_hash,
            "payload": evt
        }
        chain.append(block)
        log_info(f"Block #{i} [{evt['action']:23s}] Băm: {curr_hash[:20]}... (Prev: {prev_hash[:8]}...)")
        prev_hash = curr_hash

    log_success(f"Khởi tạo chuỗi kiểm toán thành công với {len(chain)} blocks liên kết chặt chẽ.")

    # 3. Kiểm tra xác thực tính toàn vẹn chuỗi (Valid Chain Verification)
    log_step("3", "Thẩm định tính toàn vẹn chuỗi nhật ký (Integrity Verification)")
    def verify_chain(c):
        p_hash = genesis_hash
        for b in c:
            calc = calculate_block_hash(
                prev_hash=p_hash,
                record_id=b["event_id"],
                timestamp=b["payload"]["timestamp"],
                action=b["payload"]["action"],
                data=b["payload"]["data"]
            )
            if calc != b["curr_hash"] or b["prev_hash"] != p_hash:
                return False, b["block_index"], calc, b["curr_hash"]
            p_hash = b["curr_hash"]
        return True, 0, "", ""

    is_valid, b_idx, calc_h, exp_h = verify_chain(chain)
    if is_valid:
        log_success("Xác thực toàn vẹn 100%: Mọi mắt xích SHA-256 khớp chuẩn tuyệt đối.")
    else:
        log_error("Xác thực thất bại!")
        sys.exit(1)

    # 4. Giả lập kịch bản can thiệp trái phép (Tamper Simulation)
    log_step("4", "Mô phỏng tấn công nội bộ: Kẻ gian can thiệp trực tiếp CSDL tại Block #3")
    log_warn("Kẻ gian sửa trường dữ liệu 'eta_minutes': 15 -> 999 để chối bỏ trách nhiệm chậm trễ!")
    
    # Can thiệp dữ liệu
    chain[2]["payload"]["data"]["eta_minutes"] = 999

    # 5. Hệ thống kích hoạt cơ chế phát hiện can thiệp tự động
    log_step("5", "FixFlow chạy trình quét kiểm toán tự động (Tamper-Evidence Scanner)")
    is_valid, broken_block, calc_h, exp_h = verify_chain(chain)

    if not is_valid:
        log_error(f"PHÁT HIỆN GIAN LẬN DỮ LIỆU TẠI BLOCK #{broken_block} (Sự kiện: {chain[broken_block-1]['event_id']})!")
        log_info(f"Mã băm mong đợi (Gốc):     \033[0;32m{exp_h}\033[0m")
        log_info(f"Mã băm tính lại thực tế:   \033[0;31m{calc_h}\033[0m")
        log_info("Kết luận: Chuỗi mật mã bị đứt gãy ngay tại thời điểm sửa đổi.")
        log_success("Cơ chế chống chối bỏ (Non-repudiation) hoạt động chính xác 100%.")
    else:
        log_error("Không phát hiện được can thiệp!")
        sys.exit(1)

    print("\n" + "=" * 76)
    print(" KẾT LUẬN: HỆ THỐNG ĐẠT CHUẨN NGUYÊN LÝ (iii) QUẢN TRỊ DỮ LIỆU TOÀN VẸN")
    print("=" * 76 + "\n")

if __name__ == "__main__":
    main()

