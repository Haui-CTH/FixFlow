#!/usr/bin/env bash
# SPDX-License-Identifier: Apache-2.0
# FixFlow (DX-FSM) Backup Wrapper Script
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$REPO_ROOT"
python3 scripts/backup.py "$@"

