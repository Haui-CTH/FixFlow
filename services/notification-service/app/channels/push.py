# SPDX-License-Identifier: Apache-2.0
# DX-FSM Notification Service – Push Channel
# Stub implementation. Production: integrate FCM / APNs.

import logging
from pydantic import BaseModel

from app.config import settings

logger = logging.getLogger(__name__)


class PushPayload(BaseModel):
    device_token: str
    title: str
    body: str
    data: dict | None = None


class PushResult(BaseModel):
    channel: str = "push"
    success: bool
    recipient: str
    error: str | None = None
    provider: str = "stub"


async def send_push(payload: PushPayload) -> PushResult:
    """
    Stub: log + return success.
    Production: switch on settings.push_provider, call FCM/APNs.
    """
    if not payload.device_token:
        return PushResult(
            success=False,
            recipient="",
            error="Missing device_token",
        )

    if not settings.push_enabled:
        logger.info(
            f"[STUB PUSH] token={payload.device_token[:16]}... "
            f"title={payload.title}"
        )
        return PushResult(
            success=True,
            recipient=payload.device_token,
            provider="stub",
        )

    logger.warning(f"push_enabled=True but provider={settings.push_provider} not implemented")
    return PushResult(
        success=False,
        recipient=payload.device_token,
        error=f"Push provider '{settings.push_provider}' not implemented",
        provider=settings.push_provider,
    )
