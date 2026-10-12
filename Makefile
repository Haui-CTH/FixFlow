# DX-FSM Makefile
# Usage: make <target>

.PHONY: help up down restart logs ps clean build test lint fmt initdocs

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
	@echo "  health      Check health of all services"
	@echo "  shell       Open shell in a service container"
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

# Initialize database
init:
	docker compose exec postgres psql -U dxfsm -d dxfsm -f /docker-entrypoint-initdb.d/init.sql
	@echo "Database initialized."

# Health check
health:
	@echo "Checking service health..."
	@echo "PostgreSQL:" && docker compose exec postgres pg_isready -U dxfsm || echo "DOWN"
	@echo "Keycloak:" && curl -sf http://localhost:8080/health || echo "DOWN"
	@echo "Ticket Service:" && curl -sf http://localhost:8001/health || echo "DOWN"
	@echo "AI Service:" && curl -sf http://localhost:8002/health || echo "DOWN"
	@echo "MinIO:" && curl -sf http://localhost:9000/minio/health/live || echo "DOWN"

# Open shell in container
shell:
	@if [ -z "$(svc)" ]; then echo "Usage: make shell svc=ticket-service"; exit 1; fi
	docker compose exec $(svc) /bin/sh

# Init docs
initdocs:
	cd docs && npm install

.DEFAULT_GOAL := help
