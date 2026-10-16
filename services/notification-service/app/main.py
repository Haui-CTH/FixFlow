# SPDX-License-Identifier: Apache-2.0
# DX-FSM Notification Service – FastAPI Application
# Tầng 2: H-P-D-I – Service Tier

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routes import notify, health

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.service_name,
    description="Multi-channel notification service (email, sms, push) for DX-FSM",
    version=settings.service_version,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
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
app.include_router(notify.router, tags=["Notifications"])


@app.get("/")
async def root():
    return {
        "service": settings.service_name,
        "version": settings.service_version,
        "status": "running",
        "endpoints": ["/notify", "/health", "/docs"],
    }
