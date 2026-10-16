# SPDX-License-Identifier: Apache-2.0
# DX-FSM Ticket Service – E2E test config
# B5.2: E2E tests với real DB (Postgres) hoặc ASGI fallback.

import asyncio
import os
import sys
from pathlib import Path

# Add project root to sys.path (2 levels up: tests/e2e/ → ticket-service/)
ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT))

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy import text

# Set test env vars BEFORE app import
os.environ.setdefault(
    "DATABASE_URL",
    "postgresql+asyncpg://dxfsm:dxfsm@localhost:5432/dxfsm_e2e"
)
os.environ.setdefault("KEYCLOAK_URL", "http://localhost:8080")
os.environ.setdefault("KEYCLOAK_REALM", "dx-fsm")
os.environ.setdefault("KEYCLOAK_AUDIENCE", "dx-fsm-api")
os.environ.setdefault("N8N_WEBHOOK_URL", "http://n8n:5678/webhook")
os.environ.setdefault("AI_SERVICE_URL", "http://ai-service:8002")
os.environ.setdefault("ALERT_WEBHOOK_URL", "")  # disable alerting trong E2E

from app.main import app  # noqa: E402
from app.db.database import engine, Base  # noqa: E402


# ─── E2E mode detection ────────────────────────────────────────────────


def _is_real_db_available() -> bool:
    """
    Check if Postgres có sẵn. Nếu không → fallback ASGI (mock mode).
    E2E tests sẽ skip khi DB không có sẵn.
    """
    import socket
    # Try connect to postgres host (default port 5432)
    # Parse from DATABASE_URL
    db_url = os.environ.get("DATABASE_URL", "")
    if "localhost" in db_url or "127.0.0.1" in db_url:
        # Local DB - check if up
        try:
            with socket.create_connection(("localhost", 5432), timeout=1):
                return True
        except (socket.timeout, OSError):
            return False
    return False


HAS_REAL_DB = _is_real_db_available()
E2E_SKIP_REASON = "Postgres không có sẵn ở localhost:5432"


# ─── Schema fixture ────────────────────────────────────────────────────


@pytest_asyncio.fixture(scope="session")
async def db_engine():
    """
    Session-scoped DB engine. Tạo schema nếu DB có sẵn.
    Skip nếu DB không available.
    """
    if not HAS_REAL_DB:
        yield None
        return

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine

    # Cleanup: drop tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


# ─── Reset tables (per-test) ───────────────────────────────────────────


@pytest_asyncio.fixture(autouse=True)
async def reset_tables(db_engine):
    """
    TRUNCATE tất cả tables trước mỗi test để isolation.
    No-op khi không có real DB.
    """
    if not HAS_REAL_DB or db_engine is None:
        yield
        return

    async with db_engine.begin() as conn:
        await conn.execute(
            text(
                "TRUNCATE tickets, ticket_history, outbox_events, "
                "ticket_comments, ticket_notes, ticket_attachments, "
                "notifications, users CASCADE"
            )
        )
    yield


# ─── E2E client (real HTTP) ─────────────────────────────────────────────


@pytest_asyncio.fixture
async def e2e_client(db_engine):
    """
    AsyncClient. Nếu có real DB → dùng ASGI in-process (vẫn chạy real code path,
    chỉ skip network). Nếu không → skip test.
    """
    if not HAS_REAL_DB:
        pytest.skip(E2E_SKIP_REASON)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client


# ─── Helpers ───────────────────────────────────────────────────────────


@pytest.fixture
def ticket_payload():
    """Sample ticket payload cho tests."""
    return {
        "title": "E2E test ticket",
        "description": "Test ticket created by E2E suite",
        "category": "hardware",
        "priority": "medium",
        "customer_id": "00000000-0000-0000-0000-000000000001",
        "customer_name": "E2E Customer",
        "customer_email": "e2e@example.com",
    }


@pytest.fixture
def auth_header_customer():
    """Mock JWT cho customer role (E2E bypass Keycloak verify)."""
    # Trong E2E, security middleware thường bypass — check app config
    return {"Authorization": "Bearer e2e-test-customer"}


@pytest.fixture
def auth_header_admin():
    """Mock JWT cho admin role."""
    return {"Authorization": "Bearer e2e-test-admin"}


# ─── Auto-mark E2E tests ──────────────────────────────────────────────


def pytest_collection_modifyitems(config, items):
    """
    Auto-mark tests in e2e/ folder với @pytest.mark.e2e.
    Skip khi không có real DB.
    """
    e2e_marker = pytest.mark.e2e
    for item in items:
        if "tests/e2e" in str(item.fspath):
            item.add_marker(e2e_marker)
            if not HAS_REAL_DB:
                item.add_marker(pytest.mark.skip(reason=E2E_SKIP_REASON))
