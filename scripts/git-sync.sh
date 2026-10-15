#!/usr/bin/env bash
# SPDX-License-Identifier: Apache-2.0
# DX-FSM Git sync helper
# Đồng bộ develop branch giữa local và origin, xử lý divergence tự động.
#
# Usage:
#   ./scripts/git-sync.sh pull   # fetch + rebase develop lên origin
#   ./scripts/git-sync.sh push   # push develop, xử lý divergence
#   ./scripts/git-sync.sh status # xem trạng thái local vs origin
#   ./scripts/git-sync.sh sync   # pull + push liên tiếp
#
# Designed cho team workflow: feature → merge develop → push gọn.

set -euo pipefail

# ─── Config ───────────────────────────────────────────────
BRANCH="${BRANCH:-develop}"
REMOTE="${REMOTE:-origin}"
SCRIPT_NAME="$(basename "$0")"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ─── Helpers ──────────────────────────────────────────────
log()  { echo -e "${BLUE}ℹ${NC}  $*"; }
ok()   { echo -e "${GREEN}✓${NC}  $*"; }
warn() { echo -e "${YELLOW}⚠${NC}  $*"; }
err()  { echo -e "${RED}✗${NC}  $*" >&2; }

usage() {
    cat <<EOF
$SCRIPT_NAME — Sync develop branch với origin

Usage:
  $SCRIPT_NAME pull     Fetch + rebase $BRANCH lên $REMOTE
  $SCRIPT_NAME push     Push $BRANCH lên $REMOTE (xử lý divergence)
  $SCRIPT_NAME status   So sánh local vs origin
  $SCRIPT_NAME sync     pull + push liên tiếp

Environment:
  BRANCH   Target branch (default: develop)
  REMOTE   Remote name (default: origin)

Examples:
  $SCRIPT_NAME pull
  BRANCH=main $SCRIPT_NAME push
EOF
}

require_git() {
    if ! command -v git >/dev/null 2>&1; then
        err "git chưa được cài đặt"
        exit 1
    fi
}

require_clean_tree() {
    if ! git diff --quiet HEAD 2>/dev/null || ! git diff --cached --quiet HEAD 2>/dev/null; then
        err "Working tree có thay đổi chưa commit. Commit hoặc stash trước:"
        git status --short
        exit 1
    fi
}

require_branch() {
    local current
    current="$(git branch --show-current)"
    if [ "$current" != "$BRANCH" ]; then
        err "Đang ở branch '$current', cần chuyển sang '$BRANCH' trước:"
        echo "  git checkout $BRANCH"
        exit 1
    fi
}

# ─── Commands ─────────────────────────────────────────────
cmd_pull() {
    require_git
    require_clean_tree

    log "Fetching from $REMOTE..."
    git fetch "$REMOTE" "$BRANCH" --prune

    local local_sha origin_sha
    local_sha="$(git rev-parse HEAD)"
    origin_sha="$(git rev-parse "$REMOTE/$BRANCH" 2>/dev/null || echo '')"

    if [ -z "$origin_sha" ]; then
        err "Branch $REMOTE/$BRANCH không tồn tại"
        exit 1
    fi

    if [ "$local_sha" = "$origin_sha" ]; then
        ok "Local đã sync với $REMOTE/$BRANCH"
        return 0
    fi

    # Check if local is ancestor of origin → can fast-forward
    if git merge-base --is-ancestor HEAD "$REMOTE/$BRANCH"; then
        log "Local behind origin → fast-forward merge"
        git merge --ff-only "$REMOTE/$BRANCH"
        ok "Pulled $REMOTE/$BRANCH"
        return 0
    fi

    # Check if origin is ancestor of local → no pull needed
    if git merge-base --is-ancestor "$REMOTE/$BRANCH" HEAD; then
        ok "Local ahead of $REMOTE/$BRANCH (sẵn sàng push)"
        return 0
    fi

    # Diverged → rebase
    log "Local và $REMOTE/$BRANCH đã diverge → rebase local lên origin"
    if git rebase "$REMOTE/$BRANCH"; then
        ok "Rebase thành công"
    else
        err "Rebase conflict. Xử lý thủ công:"
        echo "  git rebase --abort    # hủy"
        echo "  git status            # xem conflicts"
        echo "  # sửa conflicts, sau đó:"
        echo "  git add <files>"
        echo "  git rebase --continue"
        exit 1
    fi
}

cmd_push() {
    require_git
    require_branch
    require_clean_tree

    log "Fetching from $REMOTE..."
    git fetch "$REMOTE" "$BRANCH" --prune

    local local_sha origin_sha
    local_sha="$(git rev-parse HEAD)"
    origin_sha="$(git rev-parse "$REMOTE/$BRANCH" 2>/dev/null || echo '')"

    if [ -z "$origin_sha" ]; then
        err "Branch $REMOTE/$BRANCH không tồn tại. Tạo trước:"
        echo "  git push --set-upstream $REMOTE $BRANCH"
        exit 1
    fi

    # Case 1: same SHA → nothing to do
    if [ "$local_sha" = "$origin_sha" ]; then
        ok "Đã sync với $REMOTE/$BRANCH. Không có gì để push."
        return 0
    fi

    # Case 2: local ahead of origin → simple push
    if git merge-base --is-ancestor "$REMOTE/$BRANCH" HEAD; then
        local ahead
        ahead="$(git rev-list --count "$REMOTE/$BRANCH"..HEAD)"
        log "Local ahead $ahead commit(s) → push bình thường"
        git push "$REMOTE" "$BRANCH"
        ok "Pushed $ahead commit(s) to $REMOTE/$BRANCH"
        return 0
    fi

    # Case 3: origin ahead of local → need to pull first
    if git merge-base --is-ancestor HEAD "$REMOTE/$BRANCH"; then
        err "Local behind $REMOTE/$BRANCH. Chạy pull trước:"
        echo "  $SCRIPT_NAME pull"
        exit 1
    fi

    # Case 4: diverged
    local ahead behind
    ahead="$(git rev-list --count "$REMOTE/$BRANCH"..HEAD)"
    behind="$(git rev-list --count HEAD.."$REMOTE/$BRANCH")"

    warn "Local và $REMOTE/$BRANCH đã diverge"
    warn "  Local ahead:  $ahead commit(s)"
    warn "  Local behind: $behind commit(s)"

    if [ "$behind" -eq 0 ]; then
        log "Tuy nhiên behind=0, force-push an toàn với --force-with-lease"
        git push "$REMOTE" "$BRANCH" --force-with-lease
        ok "Force-pushed $ahead commit(s) to $REMOTE/$BRANCH"
        return 0
    fi

    # Có commits ở origin chưa có ở local → rebase trước
    log "Rebase local lên $REMOTE/$BRANCH trước..."
    if ! git rebase "$REMOTE/$BRANCH"; then
        err "Rebase conflict. Xử lý thủ công:"
        echo "  git rebase --abort"
        echo "  git status"
        exit 1
    fi

    log "Push sau khi rebase..."
    git push "$REMOTE" "$BRANCH" --force-with-lease
    ok "Force-pushed after rebase"
}

cmd_status() {
    require_git

    log "Local vs $REMOTE/$BRANCH:"
    git fetch "$REMOTE" "$BRANCH" --prune 2>/dev/null || true

    local local_sha origin_sha
    local_sha="$(git rev-parse HEAD)"
    origin_sha="$(git rev-parse "$REMOTE/$BRANCH" 2>/dev/null || echo '<no-origin>')"

    echo ""
    echo -e "  Local:  ${BLUE}$local_sha${NC}"
    echo -e "  Origin: ${BLUE}$origin_sha${NC}"
    echo ""

    if [ "$local_sha" = "$origin_sha" ]; then
        ok "Synced"
    elif git merge-base --is-ancestor "$REMOTE/$BRANCH" HEAD 2>/dev/null; then
        local ahead
        ahead="$(git rev-list --count "$REMOTE/$BRANCH"..HEAD)"
        echo -e "  ${YELLOW}Local ahead: $ahead commit(s)${NC}"
    elif git merge-base --is-ancestor HEAD "$REMOTE/$BRANCH" 2>/dev/null; then
        local behind
        behind="$(git rev-list --count HEAD.."$REMOTE/$BRANCH")"
        echo -e "  ${YELLOW}Local behind: $behind commit(s)${NC}"
    else
        local ahead behind
        ahead="$(git rev-list --count "$REMOTE/$BRANCH"..HEAD)"
        behind="$(git rev-list --count HEAD.."$REMOTE/$BRANCH")"
        echo -e "  ${RED}Diverged (ahead=$ahead, behind=$behind)${NC}"
    fi

    echo ""
    log "Working tree:"
    git status --short || true
}

cmd_sync() {
    log "=== Pull ==="
    cmd_pull
    echo ""
    log "=== Push ==="
    cmd_push
}

# ─── Main ─────────────────────────────────────────────────
case "${1:-}" in
    pull)   cmd_pull ;;
    push)   cmd_push ;;
    status) cmd_status ;;
    sync)   cmd_sync ;;
    -h|--help|help|"") usage ;;
    *)
        err "Unknown command: $1"
        usage
        exit 1
        ;;
esac
