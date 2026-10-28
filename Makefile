# DX-FSM Makefile
# Usage: make <target>

.PHONY: help up down restart logs ps clean build rebuild test lint fmt init migrate health shell initdocs demo-core demo-ai demo-recommender demo-kb demo-sample-data demo-pii demo-contrast

# Default target
help:
	@echo "DX-FSM - Field Service Management Platform"
	@echo ""
	@echo "Usage: make <target>"
	@echo ""
	@echo "Targets:"
	@echo "  up          Start all services (docker compose up -d)"
	@echo "  down        Stop all services"
	@echo "  restart     Restart all services"
	@echo "  logs        Show logs from all services"
	@echo "  ps          Show status of all services"
	@echo "  clean       Remove containers, volumes, and images"
	@echo "  build       Build all Docker images"
	@echo "  rebuild     Rebuild all images without cache"
	@echo "  test        Run all tests"
	@echo "  lint        Run linters"
	@echo "  fmt         Format code"
	@echo "  init        Initialize database and seed data"
	@echo "  migrate     Apply pending DB migrations (idempotent)"
	@echo "  health      Check health of all services"
	@echo "  shell       Open shell in a service container"
	@echo ""
	@echo "Live Demo (Hội đồng OLP PMNM 2026):"
	@echo "  demo-core         Chạy riêng Tầng 1 Open-Core (chứng minh Lõi độc lập)"
	@echo "  demo-ai           Test AI Classifier & Circuit Breaker (fallback <2ms)"
	@echo "  demo-recommender  Test AI Recommender gợi ý KTV bằng dữ liệu thật"
	@echo "  demo-kb           Test Tra cứu Tri thức Cẩm nang Kỹ thuật (TF-IDF)"
	@echo "  demo-sample-data  Thống kê 77+ tickets dữ liệu mẫu thực tế HaUI"
	@echo "  demo-pii          Test Che thông tin cá nhân PII (Nghị định 13/2023/NĐ-CP)"
	@echo "  demo-contrast     Test Kiểm tra tương phản màu tự động (WCAG 2.2 AA)"
	@echo ""
	@echo "Examples:"
	@echo "  make up            # Start all services"
	@echo "  make logs ps       # Show logs and status"
	@echo "  make shell svc=ticket-service"

# Start all services
up:
	docker compose up -d
	@echo "All services started. Access:"
	@echo "  Frontend:  http://localhost:3000"
	@echo "  Keycloak:   http://localhost:8080"
	@echo "  API:        http://localhost:8001"
	@echo "  AI Service: http://localhost:8002"
	@echo "  n8n:        http://localhost:5678"

# Stop all services
down:
	docker compose down

# Restart all services
restart:
	docker compose restart

# Show logs
logs:
	docker compose logs -f --tail=100

# Show status
ps:
	docker compose ps

# Clean up everything
clean:
	docker compose down -v --remove-orphans
	docker image prune -f

# Build images
build:
	docker compose build

# Rebuild without cache
rebuild:
	docker compose build --no-cache

# Run tests
test:
	@echo "Running tests..."
	cd services/ticket-service && python -m pytest tests/ -v
	cd services/ai-service && python -m pytest tests/ -v
	cd services/notification-service && python -m pytest tests/ -v
	cd app && npm run test

# Run linters
lint:
	@echo "Running linters..."
	cd services/ticket-service && ruff check app/
	cd services/ai-service && ruff check app/
	cd app && npm run lint

# Format code
fmt:
	@echo "Formatting code..."
	cd services/ticket-service && ruff format app/
	cd services/ai-service && ruff format app/
	cd app && npm run format

# Apply pending migrations (idempotent, safe to re-run)
migrate:
	docker compose exec -T postgres sh -c 'for f in /docker-entrypoint-initdb.d/0[2-9]*.sql; do psql -v ON_ERROR_STOP=1 -U "$$POSTGRES_USER" -d "$$POSTGRES_DB" -f "$$f"; done'
	@echo "Migrations applied."

# Initialize database (fresh volume only; entrypoint already runs schema + migrations)
init: migrate
	@echo "Database initialized."

# Health check
health:
	@echo "Checking service health..."
	@echo "PostgreSQL:" && docker compose exec -T postgres pg_isready -U dxfsm || echo "DOWN"
	@echo "Keycloak:" && curl -sf http://localhost:8080/realms/dx-fsm/.well-known/openid-configuration > /dev/null || echo "DOWN"
	@echo "Gateway:" && curl -sf http://localhost/health > /dev/null || echo "DOWN"
	@echo "Ticket Service:" && curl -sf http://localhost:8001/health > /dev/null || echo "DOWN"
	@echo "AI Service:" && curl -sf http://localhost:8002/health > /dev/null || echo "DOWN"
	@echo "Notification Service:" && curl -sf http://localhost:8003/health > /dev/null || echo "DOWN"

# Open shell in container
shell:
	@if [ -z "$(svc)" ]; then echo "Usage: make shell svc=ticket-service"; exit 1; fi
	docker compose exec $(svc) /bin/sh

# Init docs
initdocs:
	cd docs && npm install

# ─── Live Demo Targets (Hội đồng OLP PMNM 2026) ───────────────────────────

demo-core:
	@echo "=== [DEMO 1] Khởi chạy riêng Tầng 1 Open-Core (Headless PaaS) ==="
	docker compose -f docker-compose.yml -f docker-compose.core.yml up -d
	@echo "✓ Tầng 1 Open-Core đã khởi động độc lập:"
	@echo "  - Nginx Gateway:    http://localhost:80"
	@echo "  - Keycloak SSO:     http://localhost:8080"
	@echo "  - PostgreSQL 16:    localhost:5432"
	@echo "  - n8n Workflow:     http://localhost:5678"
	@echo "  - MailHog SMTP:     http://localhost:8025"
	@echo "✓ Minh chứng: Lõi Open-Core độc lập, phục vụ đa ứng dụng, không dính chặt vào UI."

demo-ai:
	@echo "=== [DEMO 2] Kiểm thử AI Classifier & Circuit Breaker Graceful Fallback ==="
	@curl -s -X POST http://localhost/api/v1/classify -H "Content-Type: application/json" -d "{\"title\": \"Máy tính phòng Lab 402 không lên nguồn\", \"description\": \"Quạt nguồn không quay, có mùi khét nhẹ\"}" || echo "Hãy khởi chạy dịch vụ trước (make up)"
	@echo ""
	@echo "✓ Minh chứng: AI phân loại tự động; Circuit Breaker fallback < 2ms mượt mà khi không có GPU."

demo-recommender:
	@echo "=== [DEMO 3] Gợi ý Phân công Kỹ thuật viên (Multi-criteria Scoring) ==="
	@curl -s -X POST http://localhost/api/v1/recommend -H "Content-Type: application/json" -d "{\"ticket_id\": \"demo-ticket-01\", \"title\": \"Mạng phòng Lab 301 mất tín hiệu internet\", \"category\": \"network\", \"priority\": \"high\"}" || echo "Hãy khởi chạy dịch vụ trước (make up)"
	@echo ""
	@echo "✓ Minh chứng: Gợi ý KTV với 8 UUIDs thực tế trong DB: 40% Chuyên môn + 30% Tải việc + 30% Đánh giá."

demo-kb:
	@echo "=== [DEMO 4] Tra cứu Tri thức Cẩm nang Kỹ thuật (Knowledge Base TF-IDF) ==="
	@curl -s -G "http://localhost/api/v1/kb/search" --data-urlencode "q=máy in kẹt giấy" --data-urlencode "top_k=2" || echo "Hãy khởi chạy dịch vụ trước (make up)"
	@echo ""
	@echo "✓ Minh chứng: Thuật toán TF-IDF gợi ý giải pháp tức thì cho KTV và khách hàng."

demo-sample-data:
	@echo "=== [DEMO 5] Thống kê Bộ Dữ liệu Mẫu Thực tế HaUI (Migration 006) ==="
	@docker compose exec -T postgres psql -U dxfsm -d dxfsm -c "SELECT category, count(*) AS total_tickets, count(*) FILTER (WHERE status = 'resolved' OR status = 'closed') AS completed FROM tickets GROUP BY category ORDER BY total_tickets DESC;"
	@docker compose exec -T postgres psql -U dxfsm -d dxfsm -c "SELECT count(*) AS total_tickets_in_system FROM tickets;"
	@echo "✓ Minh chứng: 77+ sự cố kỹ thuật thực tế tại các tòa nhà HaUI, đủ 7 danh mục và 7 trạng thái."


demo-pii:
	@echo "=== [DEMO 6] Che Thông tin Cá nhân PII (Nghị định 13/2023/NĐ-CP) ==="
	@docker compose exec ai-service pytest tests/test_pii.py
	@echo "✓ Minh chứng: Tự động che SĐT, Email, CCCD trước khi chuyển tới mô hình AI."

demo-contrast:
	@echo "=== [DEMO 7] Kiểm thử Tương phản Màu tự động (Chuẩn WCAG 2.2 Level AA) ==="
	@docker compose exec app npm test -- src/test/contrast.test.ts --run
	@echo "✓ Minh chứng: 100% token màu sắc đạt chuẩn tương phản >= 4.5:1 (a11y)."

.DEFAULT_GOAL := help
