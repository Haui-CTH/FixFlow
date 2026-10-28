# SPDX-License-Identifier: Apache-2.0
# DX-FSM Ticket Service – FastAPI Application
# Tầng 2: H-P-D-I – Service Tier

import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
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


SWAGGER_HTML = """<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>FixFlow API Documentation — Swagger UI</title>
  <link rel="icon" type="image/svg+xml" href="/logo.svg">
  <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css">
  <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-standalone-preset.css">
  <style>
    body { margin: 0; background: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .ff-topbar {
      background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
      padding: 12px 24px;
      border-bottom: 2px solid #2563EB;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    .ff-topbar-wrapper {
      display: flex;
      align-items: center;
      gap: 14px;
      max-width: 1460px;
      margin: 0 auto;
    }
    .ff-topbar-wrapper img {
      width: 36px;
      height: 36px;
      border-radius: 8px;
    }
    .ff-brand {
      color: #FFFFFF;
      font-size: 20px;
      font-weight: 800;
      letter-spacing: -0.02em;
    }
    .ff-sub {
      color: #94A3B8;
      font-size: 13px;
      margin-left: 8px;
      font-weight: 500;
    }
    .ff-badge {
      background: rgba(37, 99, 235, 0.2);
      color: #60A5FA;
      border: 1px solid rgba(37, 99, 235, 0.4);
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      margin-left: auto;
    }
    .swagger-ui .topbar { display: none !important; }
    .swagger-ui .info { margin: 24px 0 16px !important; }
    .swagger-ui .info .title { color: #0F172A; }
    .swagger-ui .scheme-container { background: #FFFFFF; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .swagger-ui select { border-radius: 6px; padding: 6px 12px; font-weight: 600; border-color: #CBD5E1; }
  </style>
</head>
<body>
  <div class="ff-topbar">
    <div class="ff-topbar-wrapper">
      <img src="/logo.svg" alt="FixFlow Logo">
      <span class="ff-brand">FixFlow</span>
      <span class="ff-sub">Cổng Tài liệu & Thử nghiệm API (DX-OS Open-Core)</span>
      <span class="ff-badge">47 Endpoints • OpenAPI 3.1</span>
    </div>
  </div>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      window.ui = SwaggerUIBundle({
        urls: [
          { url: "/api/v1/openapi.json", name: "1. Core & Ticket Service API (30 endpoints)" },
          { url: "/api/v1/ai/openapi.json", name: "2. AI & Intelligence Service API (17 endpoints)" }
        ],
        "urls.primaryName": "1. Core & Ticket Service API (30 endpoints)",
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout",
        persistAuthorization: true,
        displayRequestDuration: true,
        docExpansion: "list",
        filter: true
      });
    };
  </script>
</body>
</html>
"""

@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui():
    return HTMLResponse(content=SWAGGER_HTML)


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
