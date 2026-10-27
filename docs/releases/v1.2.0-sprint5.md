# DX-FSM v1.2.0-sprint5 — Release Notes

> **Release date:** 2026-01-16
> **Tag:** `v1.2.0-sprint5`
> **Sprint:** 5 (Backend hardening + Notification service + Outbox alerting)
> **Git tag commit:** see `git show v1.2.0-sprint5`

---

## 🎯 Tổng quan

Sprint 5 tập trung vào **3 trụ cột**:

1. **Notification service** — Multi-channel (email/SMS/push) infrastructure
2. **Outbox alerting** — Dead-letter detection + webhook notifications
3. **Security hardening** — Secrets rotation policy + env var only

Tất cả production services giờ có alerting, secrets management chuẩn,
và notification backbone sẵn sàng cho n8n workflows.

---

## ✨ New Features

### B5.1 — Notification Service (full)

Multi-channel notification provider cho outbox dispatcher + n8n.

**Endpoints:**
- `POST /notify` — Multi-channel dispatch (email/sms/push)
- `GET /health` — Liveness + channel status

**Channels:**
| Channel | Status | Provider |
|---|---|---|
| Email | ✅ Production-ready | SMTP (aiosmtplib) |
| SMS | 🟡 Stub | Twilio / ESMS (TODO) |
| Push | 🟡 Stub | FCM / APNs (TODO) |

**Features:**
- Validation: title 1-200, message 1-5000, max 3 channels/request
- Service-to-service auth: Bearer `SERVICE_TOKEN`
- Idempotent: per-channel result aggregation (sent/partial/failed)
- Local dev: mailhog SMTP server (port 1025, Web UI 8025)

**Files:**
```
services/notification-service/
├── app/
│   ├── main.py                (FastAPI + CORS)
│   ├── config.py              (Settings: SMTP/SMS/PUSH/SERVICE_TOKEN)
│   ├── channels/
│   │   ├── email.py           (aiosmtplib)
│   │   ├── sms.py             (stub + E.164 validation)
│   │   └── push.py            (stub)
│   └── routes/
│       ├── health.py
│       └── notify.py          (multi-channel dispatch)
├── tests/
│   ├── conftest.py
│   ├── test_notify.py         (25+ tests)
│   └── pytest.ini
└── requirements.txt           (aiosmtplib, httpx)
```

### B5.3 — Outbox Dead-Letter Alerting

Background loop detect failed outbox events → POST tới webhook để ops biết.

**How:**
1. `outbox_events.status = 'failed'` (sau 5 retry attempts)
2. Alert worker scan mỗi 60s
3. POST tới `ALERT_WEBHOOK_URL` (Slack/PagerDuty/email gateway)
4. Set `last_alerted_at` (idempotent — không re-alert)
5. Manual trigger qua `POST /admin/alert/scan` (admin/manager only)

**Payload (POST to webhook):**
```json
{
  "service": "dx-fsm-ticket-service",
  "alert_type": "outbox_event_failed",
  "event_id": "uuid",
  "event_type": "ticket.created",
  "attempts": 5,
  "max_attempts": 5,
  "last_error": "n8n timeout",
  "created_at": "2026-01-15T10:30:00Z",
  "payload_summary": {"ticket_id": "TKT-001"},
  "fingerprint": "uuid"  // dedup key
}
```

**New admin endpoint:**
- `POST /admin/alert/scan` — Trigger scan immediately

**Migration:**
- `core/postgres/migrations/002_outbox_alerting.sql` (idempotent)
- Adds `last_alerted_at` column + partial index

---

## 🔒 Security

### B5.6 — Secrets Hardening

**Removed hardcoded passwords from:**
- `docker-compose.yml` — All passwords now use `${VAR:?error}` syntax
- `core/keycloak/realm-export.json` — Placeholder + `temporary: true` flag

**New env vars (required):**
- `POSTGRES_PASSWORD` (was: `changeme_postgres_123`)
- `KEYCLOAK_ADMIN_PASSWORD` (was: `admin123`)
- `MINIO_ROOT_PASSWORD` (was: `changeme_minio_123`)
- `N8N_BASIC_AUTH_PASSWORD` (was: `changeme_n8n_123`)

**Rotation policy** (`docs/SECURITY.md`):
- Passwords: mỗi 90 ngày
- API keys: mỗi 30 ngày
- Service accounts: mỗi 180 ngày
- Ngay khi có compromise

**`.env.example` rewritten** với:
- Security Notice header
- `<CHANGE_ME_xxx>` placeholders
- Generation instructions (`openssl rand -base64 32`)
- All notification env vars (B5.1)

---

## 🛠️ Infrastructure Changes

### docker-compose.yml

**New service:**
- `mailhog` — SMTP test server (SMTP 1025, Web UI 8025)
  - Web UI: http://localhost:8025 để xem email test

**New env vars (notification-service):**
```
NOTIFICATION_SMTP_HOST=mailhog
NOTIFICATION_SMTP_PORT=1025
NOTIFICATION_SMTP_USER=
NOTIFICATION_SMTP_PASSWORD=
NOTIFICATION_SMTP_FROM=noreply@dx-fsm.local
NOTIFICATION_SMTP_USE_TLS=false
NOTIFICATION_SMS_ENABLED=false
NOTIFICATION_PUSH_ENABLED=false
NOTIFICATION_SERVICE_TOKEN=
```

**New env vars (ticket-service):**
```
ALERT_WEBHOOK_URL=<set_in_production>
ALERT_INTERVAL_SEC=60
```

### Database (PostgreSQL)

**New column:** `outbox_events.last_alerted_at TIMESTAMP WITH TIME ZONE`

**New index:** `ix_outbox_failed_unalerted` (partial, WHERE status='failed' AND last_alerted_at IS NULL)

---

## 📦 Version Bumps

| Service | Old | New |
|---|---|---|
| ticket-service | 1.1.0 | **1.2.0** |
| ai-service | 1.1.0 | **1.2.0** |
| notification-service | 1.0.0 | **1.2.0** |

---

## 🧪 Tests

**New test files:**
- `services/notification-service/tests/test_notify.py` — 25+ tests
  - Request validation (7)
  - Body formatters (4)
  - Channel routing logic (4)
  - Status aggregation (4)
  - Channel mocks with httpx (6)
  - Endpoint integration (5)
  - Service token auth (2)

- `services/ticket-service/tests/test_alert_dispatcher.py` — 17 tests
  - Payload summary (4)
  - Send alert HTTP responses (5)
  - Scan failed events (4)
  - Manual trigger (1)
  - Worker loop control (2)
  - Model column (1)

**Total:** 42+ new tests covering all B5.1 + B5.3 + B5.6 paths.

---

## 🚀 Setup lần đầu (cho team mới)

```bash
# 1. Clone
git clone https://github.com/truong-newbie/PMNM_2026_DX_FSM.git
cd PMNM_2026_DX_FSM
git checkout v1.2.0-sprint5

# 2. Tạo .env từ template
cp .env.example .env

# 3. Generate 4 passwords mạnh
echo "POSTGRES_PASSWORD=$(openssl rand -base64 32)" >> .env
echo "KEYCLOAK_ADMIN_PASSWORD=$(openssl rand -base64 32)" >> .env
echo "MINIO_ROOT_PASSWORD=$(openssl rand -base64 32)" >> .env
echo "N8N_BASIC_AUTH_PASSWORD=$(openssl rand -base64 32)" >> .env

# 4. (Optional) Set webhook alerts
echo "ALERT_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK" >> .env

# 5. Start services
docker compose up -d

# 6. Verify
docker compose ps
curl http://localhost:8001/health
curl http://localhost:8002/health
curl http://localhost:8003/health
curl http://localhost:8025  # mailhog web UI
```

---

## 🔄 Migration từ v1.1.0-sprint4

**Database:**
```bash
# Apply B5.3 migration
docker compose exec postgres psql -U dxfsm -d dxfsm \
  -f /docker-entrypoint-initdb.d/../migrations/002_outbox_alerting.sql
```
*Note: docker-compose volume init.sql mount ở `/docker-entrypoint-initdb.d/`,
cần access migration file qua path tương đối hoặc copy vào container.*

**Hoặc đơn giản hơn:** drop + recreate DB nếu là dev:
```bash
docker compose down -v
docker compose up -d
```

**Environment:**
- Bắt buộc update `.env` với 4 passwords mới (xem Setup lần đầu)
- Optional: thêm `ALERT_WEBHOOK_URL`

---

## 📊 Stats

| Metric | Value |
|---|---|
| Commits | 4 (B5.6, B5.1, B5.3, version bumps) |
| Files added | 17 |
| Files modified | 9 |
| Lines added | ~2,000 |
| New tests | 42+ |
| Services | 4 (postgres, keycloak, gateway, ticket, ai, notification, mailhog) |

---

## 🎯 Sprint 5 Done — What's Next

**Sprint 6 candidates** (xem `docs/sprint/backend-sprint5.md`):
- B5.2 — E2E test với httpx + real DB (3h, khó)
- F5.1 — Frontend Dashboard wire /admin/metrics (4h)
- A5.2 — AI embeddings + semantic search (6h)

**Long term:**
- E2E tests với Playwright
- Kubernetes manifests
- Production secrets management (Vault/AWS Secrets Manager)
- Multi-tenant support

---

## 📞 Support

- **Issues:** https://github.com/truong-newbie/PMNM_2026_DX_FSM/issues
- **Docs:** `docs/` directory
- **Sprint planning:** `docs/sprint/backend-sprint5.md`

---

**Generated:** 2026-01-16
**Sprint:** 5 (Backend hardening + Notification)
**Tag:** `v1.2.0-sprint5`
