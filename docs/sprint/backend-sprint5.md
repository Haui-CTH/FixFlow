# Backend Sprint 5 — Kế hoạch chi tiết

> **Owner:** Backend Dev
> **Phạm vi sở hữu:** `services/ticket-service/**`, `services/notification-service/**`, `core/postgres/**`, `core/n8n/**`, `docker-compose.yml`
> **Trạng thái tham chiếu:** sau Sprint 4 (tag `v1.1.0-sprint4`, develop HEAD `f2a911b`)

---

## 0. Quy tắc cá nhân

- Mỗi commit có test đi kèm (pytest ≥ 1 happy + 1 edge case).
- API mới/đổi contract → cập nhật `docs/api-specification.md` cùng commit.
- KHÔNG hardcode secret. Mọi secret qua env + Keycloak.
- Push qua `./scripts/git-sync.sh push` (xem CONTRIBUTING.md).
- Cuối ngày có 1 commit `chore(backend): daily-log ngày N`.

---

## 1. Tổng quan Sprint 5

| Mục tiêu | Loại | Effort |
|---|---|---|
| B5.1 Hoàn thiện notification-service | Feature | 4h |
| B5.2 E2E test với httpx (TestClient + real DB) | Test | 3h |
| B5.3 Outbox dead-letter alerting | Feature | 2h |
| B5.4 Tag `v1.2.0-sprint5` | Release | 1h |
| B5.5 Secrets rotation (admin123, customer123) | Security | 2h |
| B5.6 Cleanup secrets còn hardcoded | Security | 1h |

Tổng: ~13h (≈ 2 ngày làm việc)

---

## 2. Backlog chi tiết

### B5.1 — Hoàn thiện notification-service

**Hiện trạng:** `services/notification-service/main.py` chỉ có skeleton FastAPI, chưa có routes.

**Mục tiêu:** Nhận webhook từ outbox dispatcher, gửi email/SMS/push.

**Cấu trúc file cần tạo:**

```
services/notification-service/app/
├── main.py
├── config.py
├── routes/
│   ├── __init__.py
│   ├── health.py
│   └── notify.py            # POST /notify
├── channels/
│   ├── __init__.py
│   ├── email.py             # SMTP via env
│   ├── sms.py               # stub (Twilio/ESMS)
│   └── push.py              # stub (FCM)
└── tests/
    ├── test_notify.py
    └── test_channels.py
```

**Endpoints cần implement:**

| Method | Path | Auth | Mô tả |
|---|---|---|---|
| POST | `/notify` | service token | Nhận payload từ outbox |
| GET | `/health` | none | Health check |
| GET | `/channels` | admin | List channels enabled |

**Payload schema (`POST /notify`):**

```json
{
  "user_id": "uuid",
  "title": "Ticket assigned",
  "message": "TKT-2026-000123 assigned to you",
  "type": "info | warning | error",
  "channels": ["email"],     // hoặc ["sms", "push"]
  "metadata": {}              // optional context
}
```

**Response:**

```json
{ "status": "sent", "notification_id": "uuid", "channels_used": ["email"] }
```

**Acceptance criteria:**

- [ ] `POST /notify` validate channels (email/sms/push)
- [ ] Email channel dùng SMTP env vars (host, port, user, pass)
- [ ] SMS/Push là stub (log + return success)
- [ ] Test ≥ 8 (channel routing, validation, error)
- [ ] Khi n8n gọi `/notify` thì email thực sự gửi (test với mailhog local)

---

### B5.2 — E2E test với httpx + real DB

**Mục tiêu:** Test toàn bộ flow thật (DB, HTTP, outbox, SLA) thay vì mock.

**File mới:** `services/ticket-service/tests/e2e/`

```
tests/e2e/
├── conftest_e2e.py          # session-scoped DB reset
├── test_ticket_lifecycle.py  # create → assign → resolve → close
├── test_outbox_flow.py       # status change → outbox event
├── test_sla_breach.py        # advance time → SLA trigger
└── test_metrics_aggregate.py # metrics endpoint reflects DB state
```

**Pattern conftest:**

```python
@pytest_asyncio.fixture(scope="session")
async def db_engine():
    from app.db.database import engine
    yield engine
    await engine.dispose()

@pytest_asyncio.fixture(autouse=True)
async def reset_tables(db_engine):
    async with db_engine.begin() as conn:
        await conn.execute(text("TRUNCATE tickets, ticket_history, outbox_events CASCADE"))
    yield
```

**Acceptance criteria:**

- [ ] E2E tests chạy được khi `DATABASE_URL` trỏ vào test DB
- [ ] Test ticket lifecycle: 7 steps (create/assign/in_progress/pending/resolved/closed)
- [ ] Test outbox flow: thay đổi status → row xuất hiện trong outbox_events
- [ ] Test SLA breach: `UPDATE tickets SET sla_deadline = NOW() - INTERVAL '1 hour'` → background loop mark breach
- [ ] Test metrics: tạo 10 tickets → `/admin/metrics` đếm đúng 10

---

### B5.3 — Outbox dead-letter alerting

**Hiện trạng:** Khi outbox event fail 5 lần → status `failed`, không có ai biết.

**Mục tiêu:** Webhook/PagerDuty/email khi có event rơi vào `failed`.

**Approach:**

1. Thêm `last_alerted_at` column vào `outbox_events`
2. Background loop mới: `alert_failed_events`
3. Webhook URL qua env: `ALERT_WEBHOOK_URL`
4. Idempotent: chỉ alert 1 lần/event

**File thay đổi:**

- `services/ticket-service/app/services/alert_dispatcher.py` (new)
- `core/postgres/init.sql` — thêm column
- `docker-compose.yml` — thêm env var

**Acceptance criteria:**

- [ ] Failed event → POST tới `ALERT_WEBHOOK_URL` với payload
- [ ] `last_alerted_at` set sau alert (không re-alert)
- [ ] Test với `httpx.MockTransport` (không gọi URL thật)
- [ ] Log rõ: `alerted: event_id=... status=failed`

---

### B5.4 — Tag `v1.2.0-sprint5`

**Sau khi B5.1, B5.2, B5.3 merge xong:**

```bash
git checkout develop
./scripts/git-sync.sh pull
# verify all tests pass
docker compose exec ticket-service pytest tests/
# bump version
# edit services/ticket-service/app/main.py: 1.1.0 → 1.2.0
# edit services/ai-service/app/main.py: 1.1.0 → 1.2.0
# edit services/notification-service/app/main.py: 1.0.0 → 1.2.0
# create RELEASE-NOTES-v1.2.0-sprint5.md
git commit -am "chore(release): v1.2.0-sprint5"
./scripts/git-sync.sh push
git tag -a v1.2.0-sprint5 -m "v1.2.0-sprint5 — notification service + e2e + alerting"
git push origin v1.2.0-sprint5
```

---

### B5.5 — Secrets rotation

**Hiện trạng:** `admin123`, `customer123` hardcoded trong scripts + .env.

**Cần rotate:**

- `KEYCLOAK_ADMIN_PASSWORD` trong docker-compose
- `POSTGRES_PASSWORD` trong .env
- `N8N_BASIC_AUTH_PASSWORD`

**Bước:**

1. Sinh passwords mới qua `openssl rand -base64 32`
2. Update `.env.example` (KHÔNG commit `.env` thật)
3. Update `docker-compose.yml` defaults
4. Update keycloak realm config (CLI: `kc.sh config`)
5. Document trong `docs/SECURITY.md` — "rotation policy: mỗi 90 ngày"

---

### B5.6 — Cleanup secrets còn hardcoded

**Tìm kiếm:**

```bash
# Trong source code
grep -rn "password\s*=\s*['\"]" services/ --include="*.py" | grep -v ".pyc"
grep -rn "admin123\|customer123" services/ docs/ --include="*.py" --include="*.md"
```

**Kết quả dự kiến (từ Sprint 3-4):**

- `services/ticket-service/app/seed_data.py` (nếu có)
- `docs/api-specification.md` (test examples)
- `scripts/install-hooks.sh` (test fixtures)

**Xử lý:**

- Thay bằng `os.getenv("TEST_ADMIN_PASSWORD", "<test-only>")`
- Move test data vào `tests/fixtures/`
- Update `.secrets.allowlist` nếu là fixture hợp lệ

---

## 3. Dependencies cần biết

**Service đang consume:**

- `ai-service` (port 8002) — classifier fallback
- `postgres` (port 5432) — primary DB
- `n8n` (port 5678) — outbox webhook
- `keycloak` (port 8080) — JWT verify
- `minio` (port 9000) — attachments (hiện disabled)

**Service đang được consume bởi:**

- Frontend (port 5173) — REST API
- n8n — webhook callbacks

---

## 4. Sprint 4 deliverables cần duy trì

| Module | Tests | Owner | Status |
|---|---|---|---|
| ticket-service (12 routes) | 97 pass | Backend | ✅ |
| ai-service (3 routes) | 16 pass | AI | ✅ |
| Outbox dispatcher | 7 pass | Backend | ✅ |
| SLA monitor | 9 pass | Backend | ✅ |
| Notes (staff-only) | 10 pass | Backend | ✅ |
| History audit | 15 pass | Backend | ✅ |
| Metrics dashboard | 28 pass | Backend | ✅ |

**Regression check mỗi commit:** `./scripts/run-tests.sh ticket` phải 97/97 pass.

---

## 5. Tài liệu tham chiếu

- `docs/api-specification.md` — REST contracts
- `docs/architecture.md` — outbox pattern, AI hybrid
- `CONTRIBUTING.md` — git workflow
- `services/ticket-service/app/routes/` — 12 route files
- `core/postgres/init.sql` — 9 tables schema
