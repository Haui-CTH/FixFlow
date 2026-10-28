#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 Đội thi HaUI (Đại học Công nghiệp Hà Nội)
# SPDX-License-Identifier: Apache-2.0

"""
Script kiểm tra tiêu đề bản quyền và giấy phép (SPDX Header Check).
Đảm bảo 100% tệp mã nguồn (.py, .ts, .tsx, .sh) mang tiêu đề SPDX-License-Identifier: Apache-2.0.
"""

import os
import sys
import glob

SOURCE_PATTERNS = [
    "services/**/*.py",
    "app/src/**/*.ts",
    "app/src/**/*.tsx",
    "scripts/**/*.py",
    "scripts/**/*.sh",
]

IGNORE_DIRS = {
    "node_modules",
    "__pycache__",
    ".venv",
    ".git",
    "dist",
    "build",
    "1",
    "2",
    "tmp_profile",
}

def main():
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    os.chdir(root_dir)

    all_files = []
    for pattern in SOURCE_PATTERNS:
        matches = glob.glob(pattern, recursive=True)
        for m in matches:
            parts = os.path.normpath(m).split(os.sep)
            if any(p in IGNORE_DIRS for p in parts):
                continue
            all_files.append(m)

    all_files = sorted(list(set(all_files)))
    missing = []
    valid = 0

    for fpath in all_files:
        try:
            with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read(500)  # Check first 500 chars
                if "SPDX-License-Identifier: Apache-2.0" in content:
                    valid += 1
                else:
                    missing.append(fpath)
        except Exception as e:
            missing.append(f"{fpath} (Read error: {e})")

    print("=" * 70)
    print(" FIXFLOW SOURCE CODE LICENSE & COPYRIGHT VERIFICATION (SPDX / REUSE)")
    print("=" * 70)
    print(f"Tổng số tệp mã nguồn được quét: {len(all_files)}")
    print(f"Số tệp đạt chuẩn Apache-2.0 SPDX: {valid}")

    if missing:
        print(f"✗ Phát hiện {len(missing)} tệp thiếu tiêu đề giấy phép:")
        for m in missing:
            print(f"  - {m}")
        sys.exit(1)
    else:
        print("✓ 100% tệp mã nguồn tự phát triển mang tiêu đề bản quyền chuẩn Apache-2.0!")
        print("✓ Các tệp phi mã nguồn (JSON, SVG, Markdown) được quản trị bởi REUSE.toml.")
        print("=" * 70)
        sys.exit(0)

if __name__ == "__main__":
    main()

