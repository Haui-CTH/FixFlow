# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Frontend (UI overhaul, phases 01–10)

#### Added
- **Design system**: token ngữ nghĩa light/dark, primitives `components/ui/*` (Button, Badge, Card, Field, Modal, Tabs, Pagination, FileDropzone, ...), font Plus Jakarta Sans, icon lucide.
- **Auth & app shell**: SSO check-sso + silent-check-sso, token tự làm mới, `RoleGuard`, trang Login 2 cột, Sidebar thu gọn / drawer mobile, TopBar (chuông, đổi theme, đổi ngôn ngữ, menu người dùng), skip link, `document.title` theo trang.
- **Ticket list**: tìm/lọc/sắp xếp/phân trang phía server, trạng thái trên URL, bảng ↔ card, đếm SLA, "Ticket của tôi".
- **Create ticket**: form `react-hook-form`, gợi ý AI, đính kèm kéo-thả, nháp `sessionStorage`, cảnh báo rời trang.
- **Ticket detail**: tabs (Tổng quan, Bình luận, Ghi chú nội bộ, Đính kèm, Lịch sử), hành động theo role, phân công KTV, thanh SLA, AI Insights.
- **Dashboard**: KPI, gauge SLA, hoạt động 24h, Outbox, top KTV (sắp xếp được), tự làm mới 30s.
- **Notifications**: chuông + dropdown, trang `/notifications` (nhóm theo ngày), toast khi có thông báo mới.
- **i18n vi/en** với bộ chuyển ngôn ngữ; **a11y/responsive** (axe 0 lỗi, touch target ≥ 44px, không scroll ngang 360–1440px).
- ESLint (`.eslintrc.cjs`), coverage v8 với ngưỡng, `app/README.md`, ảnh trong `docs/screenshots/`, `docs/demo-script.md`.

#### Changed
- `app/nginx.conf`: gzip, cache bất biến cho `assets/`, `index.html` luôn kiểm tra lại.
- Priority chuẩn hoá theo BE/DB: `critical` (`urgent` chỉ là bí danh).

#### Fixed
- Gateway không chuyển query string tới ticket-service (lọc/phân trang/sắp xếp bị bỏ qua).
- Upload file: header JSON mặc định của axios làm `multipart` bị gửi sai (422).
- Upload treo khi MinIO tắt (kiểm tra kết nối 1 giây trước khi thử, rồi lưu cục bộ).
- Đổi ngôn ngữ thất bại khi `localStorage` bị chặn.

### Backend (phục vụ frontend)

- `GET /users/me`, `GET /users/technicians` (trước đây là hàm giả trả rỗng).
- `GET/PATCH/POST /notifications`, `/notifications/{id}/read`, `/notifications/mark-all-read` (ticket-service) + tự tạo thông báo khi có ticket mới / phân công / đổi trạng thái / bình luận công khai.
- `GET /tickets?mine=true` (technician → ticket được giao, customer → ticket của mình).
- `POST /tickets`: `customer_*` lấy từ JWT nếu bỏ trống; `category`/`priority` do người dùng chọn thắng AI; SLA tính theo ưu tiên cuối cùng.
- `GET /tickets/{id}/attachments/{att}/download`; khách hàng chủ ticket được tự đóng ticket đã giải quyết.
- Volume `ticket_attachments` cho file đính kèm khi MinIO tắt.

## [v1.2.0-sprint5] – 2026-01-16

Sprint 5 — notification service, outbox dead-letter alerting, security hardening, E2E tests, secrets rotation, **frontend integration (Dashboard/Notifications/Notes/History/Responsive/Error UX)**.

### Added

- **Notification Service (B5.1)** — multi-channel provider
  - `POST /notify` — email/sms/push dispatch với channel routing
  - Channels: email (aiosmtplib, production-ready), sms (stub), push (stub)
  - Service-to-service auth: Bearer `SERVICE_TOKEN`
  - Validation: 1-200 chars title, 1-5000 chars message, max 3 channels
  - 25+ tests covering routing, validation, status aggregation, auth
  - Local dev: mailhog SMTP (port 1025, Web UI 8025)

- **Outbox Dead-Letter Alerting (B5.3)** — webhook for failed events
  - Background worker scan mỗi 60s
  - POST failed events tới `ALERT_WEBHOOK_URL` (Slack/PagerDuty/email gateway)
  - Idempotent qua `last_alerted_at` column
  - `POST /admin/alert/scan` — manual trigger (manager/admin only)
  - 17 tests covering scan, send, retry, idempotency
  - Migration: `002_outbox_alerting.sql` (idempotent)

- **Dashboard wired to `/admin/metrics` (F5.1)**
  - `metricsApi.get(window_days=30)` — full KPI payload
  - 4 MetricCard components: tickets / SLA breach rate / open / avg resolution
  - 4 Panel components: SLA breakdown, status distribution, outbox health,
    top assignees
  - Auto-refresh 60s, manual refresh button
  - 30 tests (MetricCard, OutboxPanel, SLAPanel, DistributionBar, AssigneeTable)

- **Notifications center page (F5.2)**
  - `/notifications` route với sidebar nav link
  - Mock data store (6 mẫu) — BE chưa có list endpoint
  - Filter tabs: All / Unread (với count badge)
  - Mark single as read (optimistic update + rollback)
  - Mark all as read
  - Click row → mark read + navigate to ticket
  - Pagination, loading/error/empty states
  - 34 tests (helpers + NotificationItem + Notifications page)

- **Notes viewer (staff) + composer (F5.3)**
  - `<NotesPanel ticketId={id} />` tích hợp vào TicketDetail
  - Auto-hide cho customer role (logic inside component)
  - Composer: textarea + char count + Cmd/Ctrl+Enter shortcut
  - Client-side validation: empty/whitespace/5000 chars (matches BE)
  - Optimistic insert + rollback on error
  - 48 tests (helpers + NoteItem + NoteComposer)

- **History timeline (F5.4)**
  - `<HistoryTimeline ticketId={id} />` — visible to all roles
  - Vertical timeline với icon circles + colors per action
  - 14 action types: created/status_changed/assigned/sla_breached/...
  - Vietnamese descriptions ("Alice tạo ticket", "đổi status: new → in_progress")
  - Old → new value tags cho transitions
  - Relative time + tooltip full timestamp
  - 33 tests (helpers + component)

- **Responsive mobile breakpoints (F5.5)**
  - Sidebar → drawer on mobile (≤768px) với backdrop + slide animation
  - Hamburger button (sticky top bar, ARIA proper)
  - Close on route change / Esc / backdrop click
  - Body scroll lock khi drawer open
  - Tickets: table → card list on mobile (line-clamp 2 title)
  - Global: `--bp-sm/md/lg/xl` CSS vars, font scaling (14/13px)
  - `prefers-reduced-motion` respect
  - Touch target min 2.5rem; iOS font-zoom prevention (16px input)
  - 8 tests (Layout hamburger/close/Esc)

- **Error boundary + toast notification (F5.6)**
  - `<ErrorBoundary>` wraps entire App — catches render errors
  - Default fallback: red title, error details, "Thử lại" + "Về trang chủ"
  - Custom fallback prop + onError callback
  - Auto-reset on children change (route change)
  - Toast system: 4 types (info/success/warning/error), auto-dismiss 4-6s
  - Module-level store (axios interceptor compatible)
  - `useToast()` hook + fallback khi outside provider
  - Axios interceptor hooks:
    - 401 → logout + warning toast
    - 403 → error "không có quyền"
    - 500 → error "lỗi máy chủ"
    - network → error "không kết nối"
  - 15 tests (toast API + useToast + ErrorBoundary)

### Security

- **Secrets Hardening (B5.6)** — no more hardcoded passwords
  - All passwords qua env var với `${VAR:?must be set in .env}` syntax
  - Removed from: `docker-compose.yml`, `core/keycloak/realm-export.json`
  - `.env.example` rewritten với Security Notice + rotation policy
  - Rotation policy: 90 days (passwords), 30 days (API keys), 180 days (svc accounts)
  - Updated `docs/SECURITY.md` với setup guide

### Changed

- **docker-compose.yml**
  - Added `mailhog` service (SMTP 1025, Web UI 8025)
  - Added 9 notification env vars (SMTP/SMS/PUSH/SERVICE_TOKEN)
  - Added 2 alert env vars (ALERT_WEBHOOK_URL, ALERT_INTERVAL_SEC)

- **Database schema** — `outbox_events`:
  - Added `last_alerted_at TIMESTAMP WITH TIME ZONE` column
  - Added partial index `ix_outbox_failed_unalerted`

- **Frontend (app/)** — refactor to CSS modules
  - `Layout.tsx` — inline styles → Layout.module.css (responsive drawer)
  - `Tickets.tsx` — inline styles → Tickets.module.css (table + mobile cards)
  - `TicketDetail.tsx` — inline styles → TicketDetail.module.css (responsive grid)
  - `Login.module.css` — fix `min-width: 360px` overflow on mobile
  - `index.css` — added CSS vars, font scaling, reduced-motion, touch targets
  - `lib/api.ts` — added toast hooks trong response interceptor

- **Version bumps**:
  - ticket-service: 1.1.0 → 1.2.0
  - ai-service: 1.1.0 → 1.2.0
  - notification-service: 1.0.0 → 1.2.0
  - frontend: 1.1.0 → 1.2.0

### Documentation

- `RELEASE-NOTES-v1.2.0-sprint5.md` — full release notes với migration guide
- `docs/sprint/backend-sprint5.md` — sprint planning
- `docs/sprint/frontend-sprint5.md` — frontend sprint planning
- `docs/SECURITY.md` — rotation policy + setup steps + rotation log
- `.env.example` — security notice + all new env vars

### Tests

- **E2E backend (B5.2)** — 15 tests, 4 files
  - `test_ticket_lifecycle.py` — 7-step flow (create→assign→in_progress→pending→resolved→closed)
  - `test_outbox_flow.py` — outbox events emitted on create/status change
  - `test_sla_breach.py` — backdate deadline → breach detection
  - `test_metrics_aggregate.py` — counts, categories, activity window
  - Auto-skip khi Postgres không có sẵn ở localhost:5432

- **Frontend (vitest)** — **168 tests across 16 files** (0 → 168)
  - `lib/notifications.test.ts` (20) — F5.2 helpers + API mock
  - `lib/notes.test.ts` (24) — F5.3 helpers (validation, normalize, format)
  - `lib/history.test.ts` (26) — F5.4 helpers (action colors/icons, descriptions)
  - `lib/toast.test.tsx` (10) — F5.6 toast API + useToast hook
  - `components/Notifications/NotificationItem.test.tsx` (8) — F5.2
  - `components/Notes/NoteItem.test.tsx` (7) — F5.3
  - `components/Notes/NoteComposer.test.tsx` (17) — F5.3
  - `components/History/HistoryTimeline.test.tsx` (7) — F5.4
  - `components/Dashboard/MetricCard.test.tsx` (5) — F5.1
  - `components/Dashboard/OutboxPanel.test.tsx` (6) — F5.1
  - `components/Dashboard/DistributionBar.test.tsx` (5) — F5.1
  - `components/Dashboard/SLAPanel.test.tsx` (6) — F5.1
  - `components/Dashboard/AssigneeTable.test.tsx` (8) — F5.1
  - `components/Layout.test.tsx` (8) — F5.5 responsive
  - `components/ErrorBoundary.test.tsx` (5) — F5.6
  - `pages/Notifications.test.tsx` (6) — F5.2

### Tooling (B5.5)

- **`scripts/rotate-secrets.sh`** — rotate 4 passwords (postgres, keycloak, minio, n8n)
  - Dry-run mode
  - Per-service rotation
  - Auto backup `.env.bak.<timestamp>`
  - Generate qua `openssl rand -base64 32`

## [v1.1.0-sprint4] – 2026-01-15

Sprint 4 — ticket workflow completion, audit trail, outbox pattern, test coverage, dashboard metrics.

### Added

- **Internal Notes (A5)** — staff-only note API for ticket
  - `POST /tickets/{id}/notes` — create note (technician/manager/admin only)
  - `GET /tickets/{id}/notes` — list notes (staff only, customer 403)
  - Validation: empty/whitespace/5000 chars (422)
  - Body strip whitespace, audit logged to ticket_history
  - Author auto-provisioned from Keycloak sub (user_resolver)

- **Dashboard Metrics (A10)** — manager/admin KPI endpoint
  - `GET /admin/metrics?window_days=30` — counts, distributions, SLA stats
  - Sections: by_status, by_priority, by_category, sla, activity (24h),
    outbox health, top 5 assignees
  - Breach rate = (breached + not_met) / total_scored
  - 28 unit tests

- **CI Pipeline** — 6 jobs (lint-python, lint-frontend, test-ticket-service
  với Postgres, test-ai-service, test-frontend, secret-scan TruffleHog)

- **Version bump** 1.0.0 → 1.1.0 (ticket-service + ai-service)

- **RELEASE-NOTES-v1.1.0-sprint4.md** — release summary với highlights,
  migration guide, known limitations

- **SLA Monitor (A7)** — background loop + admin trigger
  - `POST /admin/sla/check` — manual trigger (admin/manager)
  - SLA rules: critical=15min, high=1h, medium=4h, low=24h
  - Idempotent: skip tickets already marked `sla_met=false`
  - Logs scanned/breached/dispatched summary
  - Background loop runs every 5min (configurable via `SCAN_INTERVAL_SEC`)

- **Outbox Pattern (A8)** — n8n webhook delivery with retry/backoff
  - Outbox table: event_type, payload, status, attempts, next_retry_at
  - Backoff schedule: 5s → 25s → 125s → 625s → 3125s (5x per attempt)
  - Max 5 attempts → status `failed`
  - Atomic claim via `UPDATE ... WHERE status='pending'`
  - `POST /admin/outbox/run` — manual trigger
  - `GET /admin/outbox?status=pending` — list events
  - Integrated with ticket status changes (auto-enqueue)

- **Ticket History (A9)** — audit trail endpoint
  - `GET /tickets/{id}/history?limit&offset` — chronological audit log
  - Customer: own tickets only (403 for others)
  - Staff: all tickets
  - Batch actor lookup (1 query, no N+1)
  - Pagination: limit max 500, default 100

- **AI Classifier (A6)** — cache + rule-based + AI fallback
  - In-memory cache: key = hash(title+description)
  - Cache hit returns `method='cached'`
  - Rule-based fallback when AI service down
  - Hybrid: tries AI first (5s timeout), falls back to rule-based
  - Confidence: 0-100 (AI scale) or 0-1 (rule-based scale)

- **Test Coverage** — 97 unit tests (69 → 97)
  - test_ai_classifier.py (16): category, priority, cache, fallback
  - test_outbox.py (7): backoff schedule, call_n8n with mocked httpx
  - test_notes.py (10): Pydantic validation, STAFF_ROLES constant
  - test_sla_monitor.py (9): SLA rules, deadline computation
  - test_admin.py (9): auth/role checks on admin endpoints
  - test_history.py (15): response shape, permission matrix, pagination
  - test_metrics.py (28): A10 dashboard KPI endpoint
  - test_tickets.py (3): health, list, create with role
  - conftest.py: AsyncClient + ASGITransport, mock get_current_user

### Changed

- **comments.py + attachments.py** — dedup user-resolver logic
  - Inline keycloak_id lookup + legacy fallback + auto-provision moved to
    `app/services/user_resolver.py` (resolve_or_create_user)
  - Net -87 dòng duplicate code, +10 dòng helper call

- **TicketHistory model** — column rename
  - `extra_data` (Python attr) → `metadata_json` mapped to DB column "metadata"
  - DB schema already used "metadata"; Python attr was misnamed

### Fixed

- **init.sql** — ticket_history column mismatch
  - DB had column "metadata" but model declared "extra_data"
  - Caused 500 on any history query

- **pre-commit hook** — secret scanner
  - Catches accidental API keys, tokens, passwords before commit
  - Allowlist in `.secrets.allowlist` for test fixtures

### Security

- Internal notes: customer cannot list, view, or create (403 enforced)
- Admin endpoints: explicit role guard (admin/manager only, customer 403)
- JWT verification: all routes through Keycloak JWKS
- Tracemalloc warnings cleaned up (test runtime)

### Documentation

- `docs/api-specification.md` — full Sprint 4 coverage
  - New endpoints documented (notes, history, admin)
  - Role matrix: 13 endpoints × 4 roles
  - Error responses + 422 added
- `docs/SECURITY.md` — secret scanner rationale, incident response
- `CHANGELOG.md` (this file) — Sprint 4 deliverables

### Known Limitations

- 2 tests skipped in pytest (event loop mismatch with SQLAlchemy async engine
  when pytest-asyncio creates new loop per test). Workaround: explicit
  try/except + comment; integration tests run in E2E pipeline.
- Outbox retries forever-failed events don't notify (silent — needs ops alerting)

### Migration

From v1.0.0 → v1.1.0-sprint4:
- No breaking API changes
- New tables: `outbox_events` (auto-created via init.sql)
- New columns: `tickets.sla_met` (nullable boolean)
- Run `core/postgres/init.sql` if fresh DB

---

## [v1.0.0] – 2025-12-20

### Added

- Initial release
- DX-OS Open-Core architecture (3-tier)
  - Keycloak for Identity/SSO
  - Apache APISIX for API Gateway
  - PostgreSQL for structured data
  - MinIO for file storage
  - n8n for workflow automation
- Ticket Service API (FastAPI)
  - CRUD operations for tickets
  - User management integration
  - File upload via MinIO
- AI Service
  - Ticket classification (Ollama/Llama 3.2)
  - Technician recommendation
  - Rule-based fallback
- Vue 3 Frontend Application
  - Customer portal (create/track tickets)
  - Technician portal (process tickets)
  - Manager dashboard (KPI/analytics)
- H-P-D-I implementation
  - H: User profiles and authentication
  - P: Complete ticket workflow
  - D: Real-time dashboard and reports
  - I: AI-powered classification and recommendations
- Docker Compose orchestration
- Documentation (Docusaurus)
- GitHub Actions CI/CD pipeline
- Open-source compliance (Apache-2.0)

### Features

- [x] SSO authentication via Keycloak
- [x] Role-based access control (customer/technician/manager/admin)
- [x] Ticket lifecycle management
- [x] Automatic ticket classification using AI
- [x] Technician recommendation engine
- [x] File attachment upload
- [x] Real-time dashboard
- [x] SLA monitoring
- [x] Notification system
- [x] Fallback for AI service unavailability

---

## [v0.0.1] – 2025-11-15

### Added

- Project scaffolding
- Initial repository structure
- Development environment setup
