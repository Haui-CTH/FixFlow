# SPDX-License-Identifier: Apache-2.0
# DX-FSM Ticket Service – FastAPI Application
# Tầng 2: H-P-D-I – Service Tier

import asyncio
import json
import logging
import urllib.request
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.openapi.docs import get_redoc_html
from fastapi.openapi.utils import get_openapi

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
    title="FixFlow Field Service Management API",
    description="Hệ sinh thái API mở (Open-Core) Quản lý Dịch vụ Thực địa FixFlow: Vòng đời Ticket FSM 7 trạng thái, Phân công KTV, Tra cứu SLA, Outbox Pattern, và Kiểm toán",
    version="1.2.0",
    docs_url=None,
    redoc_url=None,
    openapi_url="/openapi.json",
    root_path="/api/v1",
    lifespan=lifespan,
)


def custom_openapi():
    """Hợp nhất OpenAPI 3.1 cho toàn bộ hệ thống FixFlow (47 endpoints).

    Hiển thị trực tiếp URL máy chủ (port 8080/80) dưới dạng Servers selector chuẩn,
    thay vì bắt người dùng chọn qua dropdown menu phân mảnh giữa các microservices.
    """
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title="FixFlow Field Service Management API",
        version="1.2.0",
        description=(
            "### FixFlow API — Cổng Tài liệu & Thử nghiệm API Hợp nhất\n\n"
            "Tích hợp toàn diện **47 endpoints** dịch vụ thực địa (DX-OS Open-Core):\n\n"
            "- **Core & Ticket Service (30 endpoints)**: Vòng đời Ticket FSM 7 trạng thái, Phân công kỹ thuật viên, Tra cứu SLA, Bình luận, Tệp đính kèm, Ghi chú nội bộ, Người dùng & Giám sát Outbox.\n"
            "- **AI & Intelligence Service (17 endpoints)**: Phân loại sự cố tự động, Đề xuất kỹ thuật viên & linh kiện thay thế, Cẩm nang kỹ thuật KB (TF-IDF & Cosine search), và Giám sát AI.\n"
            "- **Xác thực & Bảo mật**: Tích hợp Keycloak SSO JWT (Bearer Token) và X-Service-Api-Key cho phân hệ nội bộ."
        ),
        routes=app.routes,
    )

    # Cấu hình danh sách Servers hiển thị trực tiếp trên giao diện Swagger
    openapi_schema["servers"] = [
        {
            "url": "http://localhost:8080/api/v1",
            "description": "FixFlow Local Gateway / Proxy (Cổng 8080)",
        },
        {
            "url": "http://localhost/api/v1",
            "description": "FixFlow Nginx Gateway (Cổng 80)",
        },
        {
            "url": "/api/v1",
            "description": "Cổng máy chủ hiện tại (Tự động thích ứng Host / Quick Tunnel)",
        },
    ]

    # Security Schemes: Bearer Auth & Service API Key
    openapi_schema.setdefault("components", {})
    openapi_schema["components"].setdefault("securitySchemes", {})
    openapi_schema["components"]["securitySchemes"]["bearerAuth"] = {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "JWT",
        "description": "Nhập JWT token Keycloak từ SSO (/realms/dx-fsm/protocol/openid-connect/token)",
    }
    openapi_schema["components"]["securitySchemes"]["serviceApiKey"] = {
        "type": "apiKey",
        "in": "header",
        "name": "X-Service-Api-Key",
        "description": "Khóa xác thực dịch vụ nội bộ (FixFlow Internal Microservices)",
    }
    openapi_schema["security"] = [{"bearerAuth": []}]

    # Hợp nhất 17 endpoints từ AI Service (nội bộ Docker mạng dxfsm-net)
    try:
        req = urllib.request.Request(
            "http://ai-service:8002/openapi.json",
            headers={"User-Agent": "FixFlow-Doc-Aggregator/1.0"}
        )
        with urllib.request.urlopen(req, timeout=3.0) as resp:
            ai_data = json.loads(resp.read().decode("utf-8"))

            # Merge components.schemas
            if "components" in ai_data and "schemas" in ai_data["components"]:
                for s_name, s_def in ai_data["components"]["schemas"].items():
                    if s_name not in openapi_schema["components"]["schemas"]:
                        openapi_schema["components"]["schemas"][s_name] = s_def

            # Merge paths
            for path, path_item in ai_data.get("paths", {}).items():
                if path == "/":
                    continue
                target_path = "/ai/health" if path == "/health" else path

                # Phân nhóm tag AI trực quan
                for method, op in path_item.items():
                    if isinstance(op, dict):
                        tags = op.get("tags", [])
                        new_tags = []
                        for t in tags:
                            if t == "Classification":
                                new_tags.append("AI: Phân loại sự cố (Classification)")
                            elif t == "Recommendation":
                                new_tags.append("AI: Đề xuất KTV & Linh kiện (Recommendation)")
                            elif t == "Knowledge Base":
                                new_tags.append("AI: Cẩm nang kỹ thuật (Knowledge Base)")
                            elif t == "Health":
                                new_tags.append("AI: Giám sát trí tuệ nhân tạo (AI Health)")
                            else:
                                new_tags.append(f"AI: {t}")
                        op["tags"] = new_tags

                openapi_schema["paths"][target_path] = path_item
        logger.info("Successfully merged 17 AI Service endpoints into unified OpenAPI schema")
    except Exception as exc:
        logger.warning(f"Could not reach AI Service for OpenAPI merge: {exc}")

    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi


SWAGGER_HTML = """<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>FixFlow API Documentation — Swagger UI</title>
  <link rel="icon" type="image/svg+xml" href="/logo.svg">
  <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css">
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
    .ff-actions {
      display: flex;
      gap: 10px;
      margin-left: auto;
    }
    .ff-link {
      color: #93C5FD;
      text-decoration: none;
      font-size: 13px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 6px;
      background: rgba(255,255,255,0.06);
      transition: background 0.2s;
    }
    .ff-link:hover {
      background: rgba(255,255,255,0.15);
      color: #FFFFFF;
    }
    .ff-badge {
      background: rgba(37, 99, 235, 0.2);
      color: #60A5FA;
      border: 1px solid rgba(37, 99, 235, 0.4);
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }
    .swagger-ui .topbar { display: none !important; }
    .swagger-ui .info { margin: 24px 0 16px !important; }
    .swagger-ui .info .title { color: #0F172A; font-weight: 800; }
    .swagger-ui .scheme-container {
      background: #FFFFFF;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      border-radius: 8px;
      padding: 16px 20px !important;
      margin-bottom: 20px;
    }
    .swagger-ui select {
      border-radius: 6px;
      padding: 6px 12px;
      font-weight: 600;
      border: 1px solid #CBD5E1;
      background: #F8FAFC;
    }
  </style>
</head>
<body>
  <div class="ff-topbar">
    <div class="ff-topbar-wrapper">
      <img src="/logo.svg" alt="FixFlow Logo">
      <span class="ff-brand">FixFlow</span>
      <span class="ff-sub">Cổng Tài liệu & Thử nghiệm API Hợp nhất (DX-OS Open-Core)</span>
      <div class="ff-actions">
        <a class="ff-link" href="/api/v1/openapi.json" target="_blank">📄 OpenAPI JSON</a>
        <a class="ff-link" href="/redoc" target="_blank">📖 ReDoc</a>
        <a class="ff-link" href="/" target="_blank">🌐 App Portal</a>
      </div>
      <span class="ff-badge">47 Endpoints • Cổng 8080 / 80</span>
    </div>
  </div>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    window.onload = function() {
      window.ui = SwaggerUIBundle({
        url: "/api/v1/openapi.json",
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis
        ],
        layout: "BaseLayout",
        persistAuthorization: true,
        displayRequestDuration: true,
        docExpansion: "list",
        filter: true,
        defaultModelsExpandDepth: 1,
        defaultModelExpandDepth: 1,
        showExtensions: true,
        showCommonExtensions: true,
        tryItOutEnabled: true
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
        title="FixFlow API Documentation — ReDoc",
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
