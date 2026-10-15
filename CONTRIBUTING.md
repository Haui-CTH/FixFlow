# Hướng dẫn đóng góp — DX-FSM

> Workflow chuẩn cho team. Đọc trước khi commit/push.

## TL;DR — Quy trình nhanh

```bash
# 1. Bắt đầu task
git checkout develop
./scripts/git-sync.sh pull                    # sync local với origin
git checkout -b feature/<task-id>             # tạo branch mới

# 2. Làm việc
git add -p                                    # stage có chọn lọc
git commit -m "feat(ticket): add A10 metrics" # commit message đúng format

# 3. Merge local + push
git checkout develop
git merge --ff-only feature/<task-id>         # FF-merge vào develop
./scripts/git-sync.sh push                    # push thẳng lên origin
```

**Lưu ý:** KHÔNG dùng cherry-pick. KHÔNG tạo `temp/push-*` branch. Mọi push
đều qua `git-sync.sh push` để xử lý divergence tự động.

## Branch Strategy

```
main              ← production, chỉ merge từ develop qua release PR
  │
develop           ← branch chính, mọi người push vào đây
  │
  ├── feature/*   ← tính năng mới
  ├── fix/*       ← bug fix
  ├── docs/*      ← documentation
  ├── chore/*     ← maintenance (deps, configs)
  └── refactor/*  ← refactor code (không đổi behavior)
```

**Quy tắc:**
- `main` là protected — chỉ merge qua PR
- `develop` là branch mặc định cho mọi người
- Feature branches từ `develop`, merge lại `develop` khi xong
- Xóa feature branch sau khi merge (`git branch -d`)

## Commit Message Convention

Theo [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

[optional body — wrap at 72 chars]

[optional footer — refs, breaking changes]
```

**Type:**
- `feat` — tính năng mới
- `fix` — bug fix
- `docs` — documentation
- `style` — format (không thay đổi logic)
- `refactor` — refactor code
- `test` — thêm/sửa tests
- `chore` — build, deps, configs

**Scope** (cho project này):
- `ticket` — ticket-service
- `ai` — ai-service
- `auth` — authentication
- `frontend` — React app
- `infra` — docker, nginx, k8s
- (bỏ trống nếu multi-service)

**Ví dụ:**
```bash
git commit -m "feat(ticket): add A10 dashboard metrics endpoint"
git commit -m "fix(auth): handle null email in JWT token"
git commit -m "docs: update API spec v1.1.0"
git commit -m "chore(infra): bump postgres to 16"
```

## Quy trình Push (quan trọng!)

### ❌ KHÔNG làm thế này

```bash
# Sai: tạo temp branch cherry-pick từng commit
git checkout -b temp/push origin/develop
git cherry-pick abc def ghi
git push origin temp/push:develop
```

Lý do: tạo history rối, SHA khác, merge conflicts sau này, debug khó.

### ✅ Làm thế này

```bash
# Đúng: merge local rồi push qua script
git checkout develop
git merge --ff-only feature/my-feature
./scripts/git-sync.sh push
```

Script `git-sync.sh push` sẽ tự động:
1. Fetch origin
2. Nếu local ahead origin → push bình thường
3. Nếu divergence (cùng code, SHA khác) → rebase local rồi push
4. Nếu conflict thật sự → báo lỗi, hướng dẫn xử lý

## Xử lý Divergence (khi 2 người cùng push)

Khi origin đã có commits mới mà local chưa có:

```bash
$ git push origin develop
! [rejected] develop -> develop (non-fast-forward)
```

**Cách xử lý:**

```bash
# Cách 1: dùng script (khuyến nghị)
$ ./scripts/git-sync.sh push
# Tự động rebase + push

# Cách 2: thủ công
$ git fetch origin
$ git rebase origin/develop
$ git push origin develop

# Cách 3: nếu chắc chắn local đúng (đã review)
$ git push origin develop --force-with-lease
```

## Setup ban đầu (chạy 1 lần)

```bash
# Cấu hình git local
git config --global user.name "Tên Của Bạn"
git config --global user.email "email@example.com"

# Tự động rebase khi pull
git config --global pull.rebase true
git config --global rebase.autoStash true

# Fetch tất cả remotes khi pull
git config --global fetch.prune true

# Tạo symlink cho script (Git Bash / WSL)
ln -s ../../scripts/git-sync.sh /usr/local/bin/git-sync
```

## Author / Committer

- KHÔNG set author là AI bot (claude, copilot, etc.)
- Mặc định lấy từ `git config user.name` + `user.email`
- Pre-commit hook (nếu có) sẽ từ chối commit có author là bot

## Tags & Releases

```bash
# Tạo tag annotated (có message + author)
git tag -a v1.2.0 -m "v1.2.0 — Sprint 5 release"

# Push tag
git push origin v1.2.0

# Xem tags
git tag -l
```

**Quy ước version:** `v<MAJOR>.<MINOR>.<PATCH>-<sprint>`
- `v1.0.0` — initial release
- `v1.1.0-sprint4` — Sprint 4
- `v1.2.0-sprint5` — Sprint 5

## Pull Request Workflow (khi có GitHub PR)

1. Tạo feature branch từ develop
2. Commit + push feature branch: `git push origin feature/X`
3. Tạo PR trên GitHub: `feature/X` → `develop`
4. CI pass + review approve
5. Merge PR (squash nếu có nhiều WIP commits)
6. Pull develop về local: `./scripts/git-sync.sh pull`
7. Xóa feature branch: `git branch -d feature/X`

## Quy tắc chung

1. **Test trước khi commit** — `pytest tests/` phải pass
2. **Một commit = một thay đổi logic** — không nhét 3 fix vào 1 commit
3. **Không commit secrets** — dùng `.env` + pre-commit hook
4. **Không commit binary** — `.gitignore` đã có sẵn
5. **Review diff trước khi push** — `git diff origin/develop`
6. **Pull trước khi bắt đầu ngày mới** — `./scripts/git-sync.sh pull`

## Tiêu chuẩn code

### Python (Services)

- Tuân thủ [PEP 8](https://pep8.org/)
- Dùng `ruff` để lint và format
- Type hints cho tất cả function public
- Docstring cho public functions

```bash
ruff check services/
ruff format services/
```

### TypeScript (Frontend)

- ESLint + Prettier
- TypeScript strict mode
- Functional components + hooks

```bash
cd app && npm run lint
```

### Git

- Không commit: `.env`, secrets, passwords, API keys
- Không commit: `node_modules/`, `__pycache__/`, `.venv/`, `*.pyc`
- Mỗi commit nên là một đơn vị thay đổi logic có ý nghĩa

## Troubleshooting

### "Your branch and 'origin/develop' have diverged"

```bash
./scripts/git-sync.sh push
```

### Cherry-pick conflict

```bash
git cherry-pick --abort    # hủy cherry-pick
# Sau đó merge develop vào feature branch
git checkout feature/my-feature
git merge develop
```

### Accidentally pushed secrets

```bash
# Bước 1: rotate secret NGAY
# Bước 2: xóa khỏi git history
git filter-repo --path <file-with-secret> --invert-paths
git push origin --force --all
# Bước 3: báo team để monitor compromised secret
```

### Muốn undo commit cuối (chưa push)

```bash
git reset --soft HEAD~1   # giữ changes trong staging
git reset HEAD~1          # giữ changes trong working dir
git reset --hard HEAD~1   # XÓA HẲN (cẩn thận!)
```

### Muốn undo commit đã push

```bash
git revert <commit-sha>   # tạo commit mới undo
git push origin develop
```

## Báo cáo lỗi

Tạo GitHub Issue với:
- Mô tả rõ vấn đề
- Các bước tái hiện
- Kết quả mong đợi vs thực tế
- Environment (OS, Docker version, browser...)

## Liên hệ

Mọi thắc mắc → tạo GitHub Discussion hoặc email team.

---

**Cảm ơn bạn đã đóng góp!**
