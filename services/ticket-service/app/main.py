# SPDX-License-Identifier: Apache-2.0
# DX-FSM Ticket Service – FastAPI Application
# Tầng 2: H-P-D-I – Service Tier

import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_swagger_ui_html, get_redoc_html

from app.config import settings
from app.db.database import init_db
from app.routes import tickets, users, auth, health, comments, attachments, admin, notes, history, metrics, notifications
from app.services.sla_monitor import sla_monitor_loop, SCAN_INTERVAL_SEC
from app.services.outbox_dispatcher import outbox_worker_loop, WORKER_INTERVAL_SEC
from app.services.alert_dispatcher import alert_worker_loop, WORKER_INTERVAL_SEC as ALERT_INTERVAL_SEC

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Quản lý startup/shutdown: init DB + start background tasks."""
    await init_db()

    # Start SLA monitor
    sla_stop = asyncio.Event()
    sla_task = asyncio.create_task(
        sla_monitor_loop(sla_stop, interval_sec=SCAN_INTERVAL_SEC)
    )
    app.state.sla_stop = sla_stop
    app.state.sla_task = sla_task
    logger.info(f"SLA monitor scheduled (interval={SCAN_INTERVAL_SEC}s)")

    # Start Outbox worker
    outbox_stop = asyncio.Event()
    outbox_task = asyncio.create_task(
        outbox_worker_loop(outbox_stop, interval_sec=WORKER_INTERVAL_SEC)
    )
    app.state.outbox_stop = outbox_stop
    app.state.outbox_task = outbox_task
    logger.info(f"Outbox worker scheduled (interval={WORKER_INTERVAL_SEC}s)")

    # Start Alert dispatcher (B5.3)
    alert_stop = asyncio.Event()
    alert_task = asyncio.create_task(
        alert_worker_loop(alert_stop)
    )
    app.state.alert_stop = alert_stop
    app.state.alert_task = alert_task
    logger.info(f"Alert dispatcher scheduled (interval={ALERT_INTERVAL_SEC}s)")

    try:
        yield
    finally:
        # Graceful shutdown
        sla_stop.set()
        outbox_stop.set()
        alert_stop.set()
        for task in (sla_task, outbox_task, alert_task):
            try:
                await asyncio.wait_for(task, timeout=5.0)
            except asyncio.TimeoutError:
                task.cancel()
                logger.warning("Background task force-cancelled")
        logger.info("Background workers stopped")


app = FastAPI(
    title="FixFlow Core & Ticket Service API",
    description="Hệ sinh thái API mở (Open-Core) Quản lý Dịch vụ Thực địa FixFlow: Vòng đời Ticket FSM 7 trạng thái, Phân công KTV, Tra cứu SLA, Outbox Pattern, và Kiểm toán",
    version="1.2.0",
    docs_url=None,
    redoc_url=None,
    openapi_url="/openapi.json",
    root_path="/api/v1",
    lifespan=lifespan,
)


@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui():
    return get_swagger_ui_html(
        openapi_url="/api/v1/openapi.json",
        title="FixFlow API Documentation — Swagger UI",
        swagger_favicon_url="/logo.svg",
        swagger_ui_parameters={
            "urls": [
                {"url": "/api/v1/openapi.json", "name": "1. FixFlow Core & Ticket API (30 endpoints)"},
                {"url": "/api/v1/ai/openapi.json", "name": "2. FixFlow AI & Intelligence API (17 endpoints)"}
            ],
            "urls.primaryName": "1. FixFlow Core & Ticket API (30 endpoints)",
            "persistAuthorization": True,
            "displayRequestDuration": True,
            "docExpansion": "list",
            "filter": True,
        }
    )


@app.get("/redoc", include_in_schema=False)
async def custom_redoc():
    return get_redoc_html(
        openapi_url="/api/v1/openapi.json",
        title="FixFlow Core API — ReDoc",
        redoc_favicon_url="/logo.svg"
    )

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(health.router, prefix="/health", tags=["Health"])
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(tickets.router, prefix="/tickets", tags=["Tickets"])
app.include_router(comments.router, tags=["Comments"])
app.include_router(attachments.router, tags=["Attachments"])
app.include_router(notes.router, tags=["Internal Notes"])
app.include_router(history.router, tags=["History"])
app.include_router(metrics.router, tags=["Metrics"])
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(admin.router, tags=["Admin"])
app.include_router(notifications.router, tags=["Notifications"])


@app.get("/")
async def root():
    return {
        "service": "DX-FSM Ticket Service",
        "version": "1.2.0",
        "status": "running",
    }
