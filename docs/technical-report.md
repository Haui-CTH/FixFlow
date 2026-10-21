# DX-FSM Technical Report

## Project Overview

**DX-FSM (Digital Transformation Field Service Management)** là hệ thống quản lý dịch vụ Field Service với kiến trúc Open-Core. Dự án được phát triển cho cuộc thi PMNM HaUI 2026.

### Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Zustand, TanStack Query |
| Backend | FastAPI (Python), SQLAlchemy (async) |
| Database | PostgreSQL 16 |
| Auth | Keycloak 24 |
| AI | FastAPI + custom ML (TF-IDF, collaborative filtering) |
| Workflow | n8n |
| Container | Docker Compose (9 services, MinIO optional/disabled) |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Browser (React SPA)                     │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Nginx Gateway (Port 80)                  │
│              API Routes + SPA Fallback                       │
└─────────────────────────────┬───────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
    │   Ticket    │  │     AI      │  │Notification│
    │  Service    │  │  Service    │  │  Service   │
    │ (FastAPI)   │  │ (FastAPI)   │  │ (FastAPI)  │
    │  Port 8001  │  │  Port 8002  │  │  Port 8003 │
    └──────┬──────┘  └──────┬──────┘  └──────┬──────┘
           │                 │                 │
           └───────────────┬┴─────────────────┘
                           ▼
              ┌─────────────────────────┐
              │     PostgreSQL (Port 5432) │
              └─────────────────────────┘
```

---

## AI Features

### 1. Ticket Classifier (A5.1)

**Hybrid Classifier** với 3 tiers:
- **Cache**: SHA256 hash, 256 entries, 1h TTL
- **Ollama LLM**: `llama3.2:3b`, JSON output, 5s timeout
- **Rule-based**: Weighted keyword scoring

**Categories**: hardware, software, network, electrical, other  
**Priorities**: low, medium, high, critical  
**Accuracy**: 85% (200 test samples)

### 2. Knowledge Base Search (A5.2)

- **Algorithm**: Pure Python TF-IDF + Cosine Similarity
- **Title weight**: 3x
- **Thread-safe**: RLock implementation
- **20 seed articles** pre-loaded

### 3. Technician Recommender (A5.3)

**Multi-factor scoring**:
- Specialty match: 40%
- Skill coverage: 15%
- Performance history: 20%
- Workload: 15%
- Level: 5%
- Recency: 5%
- Collaborative filter boost: up to 0.4 (TF-IDF on ticket history)

**8 technician profiles** pre-loaded

### 4. Outbox Event Consumer (A5.4)

- **Interval**: 30s scan
- **Backoff**: Exponential (5s, 25s, 125s, 625s, 3125s)
- **Circuit breaker**: After 5 consecutive failures
- **DLQ**: After max_attempts

---

## API Endpoints

### Ticket Service (Port 8001)

| Endpoint | Method | Description |
|---|---|---|
| `/health` | GET | Liveness check |
| `/tickets` | GET/POST | List/create tickets |
| `/tickets/{id}` | GET/PATCH/DELETE | CRUD |
| `/tickets/{id}/assign` | POST | Assign technician |
| `/tickets/{id}/comments` | GET/POST | Comments |
| `/tickets/{id}/notes` | GET/POST | Internal notes (staff) |
| `/tickets/{id}/history` | GET | Audit log |
| `/notifications` | GET | User notifications |
| `/notifications/{id}/read` | PATCH | Mark read |
| `/admin/metrics` | GET | Dashboard stats |
| `/admin/outbox` | GET | Outbox events |

### AI Service (Port 8002)

| Endpoint | Method | Description |
|---|---|---|
| `/health` | GET | Liveness |
| `/classify` | POST | Classify ticket |
| `/recommend` | GET/POST | Recommend technician |
| `/kb/search` | GET | Search articles |
| `/kb/articles` | GET/POST | CRUD articles |

### Notification Service (Port 8003)

| Endpoint | Method | Description |
|---|---|---|
| `/health` | GET | Liveness |
| `/notify` | POST | Send notification |

---

## Security

### Authentication
- **Keycloak** JWT-based
- **Roles**: admin, manager, technician, customer
- **Token validation**: JWK Set from Keycloak

### API Security
- Bearer token authentication
- Role-based access control (RBAC)
- CORS configured for localhost

### Secrets Management
- Environment variables only
- `.env.example` for development
- `.gitignore` for `.env`

---

## Deployment

### Docker Compose Services

```yaml
Services:
- dxfsm-postgres      # PostgreSQL 16
- dxfsm-keycloak      # Keycloak 24
- dxfsm-n8n           # Workflow automation
- dxfsm-gateway       # Nginx API gateway
- dxfsm-ticket-service # Backend API
- dxfsm-ai-service    # AI processing
- dxfsm-notification-service # Notifications
- dxfsm-mailhog        # SMTP dev server (Mailhog UI :8025)
- dxfsm-app           # Frontend (React)
# dxfsm-minio        # Optional, disabled via profile "disabled"
```

### Running the Project

```bash
# Start all services
docker compose up -d

# Check health
curl http://localhost:8001/health
curl http://localhost:8002/health
curl http://localhost:8003/health

# Frontend
http://localhost:3000

# Keycloak Admin
http://localhost:8080 (xem KEYCLOAK_ADMIN / KEYCLOAK_ADMIN_PASSWORD trong .env)
```

If the frontend port is changed (e.g. `APP_PORT=3001`), add the matching redirect URI
to the `dx-fsm-frontend` client in Keycloak.

---

## Test Coverage

| Service | Tests |
|---|---|
| Frontend (Vitest) | 321 tests / 41 files |
| AI Service (pytest) | 72 tests |
| Ticket Service (pytest) | 139 passed, 16 skipped |
| Notification Service (pytest) | 32 tests |
| E2E | Not wired into CI yet |

---

## Future Improvements

1. **LiveKit Integration** - Video call cho technician
2. **Mobile App** - React Native wrapper
3. **Rate Limiting** - Prevent abuse
4. **WebSocket** - Real-time updates
5. **Automated deployment (CD)** - CI already runs lint/test/secret-scan

---

## License

Licensed under **Apache License 2.0**

---

## Contributors

- **Backend Developer**: Ticket Service, Database, Auth
- **Frontend Developer**: React SPA, Dashboard, Components
- **AI Developer**: Classifier, KB Search, Recommender

---

*Generated: October 2026*
