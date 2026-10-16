# SPDX-License-Identifier: Apache-2.0
# DX-FSM Notification Service – Health Check

from fastapi import APIRouter
from datetime import datetime, timezone

from app.config import settings

router = APIRouter()


@router.get("/health")
async def health():
    """Liveness + readiness check."""
    return {
        "status": "healthy",
        "service": settings.service_name,
        "version": settings.service_version,
        "channels": {
            "email": True,                # always available (SMTP)
            "sms": settings.sms_enabled,
            "push": settings.push_enabled,
        },
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
