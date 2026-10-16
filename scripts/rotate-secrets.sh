#!/usr/bin/env bash
# SPDX-License-Identifier: Apache-2.0
# DX-FSM Secrets Rotation Script
# B5.5: Generate 4 passwords mới và update .env.
#
# Usage:
#   ./scripts/rotate-secrets.sh           # rotate all
#   ./scripts/rotate-secrets.sh postgres  # rotate only postgres
#   ./scripts/rotate-secrets.sh --dry-run # show changes without writing
#
# Yêu cầu: openssl, .env file tồn tại.
# KHÔNG commit .env — script này tạo backup, modify, không touch git.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$REPO_ROOT/.env"
BACKUP_FILE="$ENV_FILE.bak.$(date +%Y%m%d-%H%M%S)"

# ─── Args ─────────────────────────────────────────────────────────────

DRY_RUN=false
TARGET=""

for arg in "$@"; do
    case "$arg" in
        --dry-run) DRY_RUN=true ;;
        --help|-h)
            echo "Usage: $0 [--dry-run] [target]"
            echo ""
            echo "Targets:"
            echo "  postgres   — POSTGRES_PASSWORD"
            echo "  keycloak   — KEYCLOAK_ADMIN_PASSWORD"
            echo "  minio      — MINIO_ROOT_PASSWORD"
            echo "  n8n        — N8N_BASIC_AUTH_PASSWORD"
            echo "  (no arg)   — rotate all 4"
            echo ""
            echo "Flags:"
            echo "  --dry-run  Show what would change without writing"
            exit 0
            ;;
        *) TARGET="$arg" ;;
    esac
done

# ─── Check preconditions ─────────────────────────────────────────────

if [ ! -f "$ENV_FILE" ]; then
    echo "❌ $ENV_FILE not found."
    echo "   Run: cp .env.example .env  then edit manually first."
    exit 1
fi

if ! command -v openssl >/dev/null 2>&1; then
    echo "❌ openssl not found. Install OpenSSL first."
    exit 1
fi

# ─── Generate password ────────────────────────────────────────────────

generate_password() {
    # 32 chars base64 (≈ 192 bits entropy)
    openssl rand -base64 32 | tr -d '\n'
}

# ─── Update .env (preserves comments) ────────────────────────────────

update_env_var() {
    local key="$1"
    local new_value="$2"
    local env_file="$3"

    if grep -qE "^${key}=" "$env_file"; then
        # Replace existing
        if [ "$DRY_RUN" = true ]; then
            local old_value
            old_value=$(grep -E "^${key}=" "$env_file" | cut -d= -f2-)
            echo "  [DRY-RUN] $key: ${old_value:0:8}... → ${new_value:0:8}..."
        else
            # Backup
            cp "$env_file" "$env_file.tmp.bak"
            # Use sed to replace the line
            sed -i.bak "s|^${key}=.*|${key}=${new_value}|" "$env_file"
            echo "  ✓ $key rotated (${new_value:0:8}...)"
        fi
    else
        echo "  ⚠️  $key not found in .env — appending"
        if [ "$DRY_RUN" = false ]; then
            echo "${key}=${new_value}" >> "$env_file"
        fi
    fi
}

# ─── Rotation targets ───────────────────────────────────────────────

rotate_target() {
    local target="$1"
    case "$target" in
        postgres)
            echo "→ Rotating POSTGRES_PASSWORD"
            update_env_var "POSTGRES_PASSWORD" "$(generate_password)" "$ENV_FILE"
            ;;
        keycloak)
            echo "→ Rotating KEYCLOAK_ADMIN_PASSWORD"
            update_env_var "KEYCLOAK_ADMIN_PASSWORD" "$(generate_password)" "$ENV_FILE"
            ;;
        minio)
            echo "→ Rotating MINIO_ROOT_PASSWORD"
            update_env_var "MINIO_ROOT_PASSWORD" "$(generate_password)" "$ENV_FILE"
            ;;
        n8n)
            echo "→ Rotating N8N_BASIC_AUTH_PASSWORD"
            update_env_var "N8N_BASIC_AUTH_PASSWORD" "$(generate_password)" "$ENV_FILE"
            ;;
        *)
            echo "❌ Unknown target: $target"
            echo "   Valid: postgres, keycloak, minio, n8n"
            exit 1
            ;;
    esac
}

# ─── Main ─────────────────────────────────────────────────────────────

echo "════════════════════════════════════════════════════"
echo "  DX-FSM Secrets Rotation"
echo "════════════════════════════════════════════════════"
echo ""
echo "Env file: $ENV_FILE"
echo "Mode: $([ "$DRY_RUN" = true ] && echo "DRY-RUN (no changes)" || echo "LIVE")"
echo "Target: ${TARGET:-all}"
echo ""

if [ "$DRY_RUN" = false ]; then
    cp "$ENV_FILE" "$BACKUP_FILE"
    echo "📋 Backup: $BACKUP_FILE"
    echo ""
fi

if [ -n "$TARGET" ]; then
    rotate_target "$TARGET"
else
    rotate_target "postgres"
    rotate_target "keycloak"
    rotate_target "minio"
    rotate_target "n8n"
fi

echo ""
if [ "$DRY_RUN" = true ]; then
    echo "✓ Dry-run complete. No files modified."
    echo "  Run without --dry-run to apply."
else
    echo "════════════════════════════════════════════════════"
    echo "  ✓ Rotation complete"
    echo "════════════════════════════════════════════════════"
    echo ""
    echo "Next steps:"
    echo "  1. Update Keycloak admin password (see docs/SECURITY.md)"
    echo "  2. Restart affected services:"
    echo "     docker compose restart postgres keycloak minio n8n"
    echo "  3. Verify all services healthy:"
    echo "     docker compose ps"
    echo "  4. Log rotation in docs/SECURITY.md → Rotation log"
    echo ""
    echo "Old passwords saved in: $BACKUP_FILE"
    echo "Delete backup after verifying: rm $BACKUP_FILE"
fi
