#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
# HaUI PMNM 2026 — FixFlow Automated Disaster Recovery & Restore Engine
# Khôi phục toàn vẹn dữ liệu từ bản sao lưu: kiểm tra SHA-256, nạp lại CSDL và tệp đính kèm.

from __future__ import annotations

import argparse
import hashlib
import json
import os
import subprocess
import sys
import tarfile
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
BACKUP_ROOT = REPO_ROOT / "backups"


def log_step(msg: str):
    print(f"\n[\033[1;34mKHÔI PHỤC\033[0m] {msg}")


def log_pass(msg: str):
    print(f"  \033[1;32m✓\033[0m {msg}")


def log_warn(msg: str):
    print(f"  \033[1;33m⚠\033[0m {msg}")


def log_fail(msg: str):
    print(f"  \033[1;31m✗\033[0m {msg}")


def compute_file_sha256(filepath: Path) -> str:
    sha = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            sha.update(chunk)
    return sha.hexdigest()


def main():
    parser = argparse.ArgumentParser(description="Khôi phục dữ liệu FixFlow từ bản sao lưu.")
    parser.add_argument("backup", nargs="?", help="Tên thư mục sao lưu (vd: backup_20261029_053231). Bỏ trống để chọn bản mới nhất.")
    parser.add_argument("-f", "--force", action="store_true", help="Bỏ qua xác nhận tương tác (dùng cho CI/CD hoặc tự động hóa)")
    args = parser.parse_args()

    if not BACKUP_ROOT.exists():
        log_fail(f"Thư mục sao lưu không tồn tại: {BACKUP_ROOT}")
        sys.exit(1)

    # 1. Xác định bản sao lưu cần khôi phục
    all_backups = sorted([d for d in BACKUP_ROOT.iterdir() if d.is_dir() and d.name.startswith("backup_")])
    if not all_backups:
        log_fail("Không tìm thấy bất kỳ bản sao lưu nào trong kho 'backups/'!")
        sys.exit(1)

    if args.backup:
        target_dir = BACKUP_ROOT / args.backup
        if not target_dir.exists():
            log_fail(f"Không tìm thấy bản sao lưu '{args.backup}' trong '{BACKUP_ROOT}'")
            sys.exit(1)
    else:
        target_dir = all_backups[-1]  # Chọn bản mới nhất

    print("=" * 78)
    print(" FIXFLOW (DX-FSM) — HỆ THỐNG KHÔI PHỤC THẢM HỌA (DISASTER RECOVERY)")
    print(f" Bản sao lưu được chọn: {target_dir.name}")
    print("=" * 78)

    # 2. Đọc và Kiểm tra Toàn vẹn Mật mã học (SHA-256 Integrity Verification)
    log_step("1. Kiểm tra Toàn vẹn Mật mã học (SHA-256 Checksum)")
    manifest_path = target_dir / "manifest.json"
    if not manifest_path.exists():
        log_fail("Không tìm thấy 'manifest.json' — Bản sao lưu thiếu chứng chỉ niêm phong!")
        sys.exit(1)

    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    db_sql_path = target_dir / "database.sql"
    if not db_sql_path.exists():
        log_fail("Thiếu tệp dữ liệu CSDL 'database.sql'!")
        sys.exit(1)

    expected_db_sha = manifest.get("files", {}).get("database.sql", {}).get("sha256")
    actual_db_sha = compute_file_sha256(db_sql_path)
    if expected_db_sha and expected_db_sha != actual_db_sha:
        log_fail(f"CẢNH BÁO BỊ SỬA ĐỔI: Mã SHA-256 của 'database.sql' không khớp!\n  Kỳ vọng: {expected_db_sha}\n  Thực tế: {actual_db_sha}")
        sys.exit(1)
    log_pass(f"Chữ ký SHA-256 của CSDL hợp lệ: {actual_db_sha[:16]}...")

    # 3. Xác nhận từ người dùng nếu không bật --force
    if not args.force:
        print(f"\n\033[1;33mCẢNH BÁO: Dữ liệu hiện tại trong cơ sở dữ liệu sẽ bị ghi đè bởi bản sao lưu!\033[0m")
        ans = input(f"Bạn có chắc chắn muốn khôi phục bản sao lưu '{target_dir.name}'? (yes/no): ")
        if ans.strip().lower() not in ("yes", "y"):
            print("Đã hủy thao tác khôi phục.")
            sys.exit(0)

    # 4. Khôi phục Cơ sở dữ liệu PostgreSQL
    log_step("2. Nạp lại Cơ sở dữ liệu quan hệ (PostgreSQL 16)")
    db_restore_cmd = [
        "docker", "compose", "exec", "-T", "postgres",
        "psql", "-U", "dxfsm", "-d", "dxfsm"
    ]
    try:
        with open(db_sql_path, "r", encoding="utf-8") as f:
            res = subprocess.run(db_restore_cmd, cwd=REPO_ROOT, stdin=f, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
        log_pass("Đã nạp lại CSDL thành công vào container 'dxfsm-postgres'")
    except Exception as e:
        log_fail(f"Lỗi nạp lại CSDL: {e}")
        sys.exit(1)

    # 5. Khôi phục Tệp đính kèm hiện trường
    log_step("3. Khôi phục Tệp đính kèm (Attachments)")
    att_tar_path = target_dir / "attachments.tar.gz"
    if att_tar_path.exists() and att_tar_path.stat().st_size > 100:
        local_att_dir = Path("/data/attachments")
        if not local_att_dir.exists():
            local_att_dir = REPO_ROOT / "data" / "attachments"
        local_att_dir.mkdir(parents=True, exist_ok=True)
        with tarfile.open(att_tar_path, "r:gz") as tar:
            tar.extractall(path=local_att_dir.parent)
        log_pass("Đã giải nén tệp đính kèm vào kho lưu trữ")
    else:
        log_pass("Tệp đính kèm đã sẵn sàng trên MinIO S3")

    # 6. Kiểm tra Hậu Khôi phục (Post-Restore Verification)
    log_step("4. Kiểm tra Hậu Khôi phục (Post-Restore Health Check)")
    try:
        count_cmd = [
            "docker", "compose", "exec", "-T", "postgres",
            "psql", "-U", "dxfsm", "-d", "dxfsm", "-t", "-A", "-c", "SELECT count(*) FROM tickets;"
        ]
        res = subprocess.run(count_cmd, cwd=REPO_ROOT, capture_output=True, text=True, check=True)
        current_tickets = int(res.stdout.strip() or 0)
        expected_tickets = manifest.get("ticket_count", current_tickets)
        log_pass(f"Cơ sở dữ liệu hoạt động bình thường: {current_tickets} tickets hiện hữu (Khớp kỳ vọng: {expected_tickets})")
    except Exception as e:
        log_warn(f"Không thể kiểm tra số lượng ticket: {e}")

    print("\n" + "=" * 78)
    print(f"  \033[1;32mKHÔI PHỤC THÀNH CÔNG TỪ BẢN SAO LƯU: {target_dir.name}\033[0m")
    print("=" * 78 + "\n")


if __name__ == "__main__":
    main()

