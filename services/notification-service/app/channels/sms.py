# SPDX-License-Identifier: Apache-2.0
# DX-FSM Notification Service – SMS Channel
# Stub implementation. Production: integrate Twilio / ESMS / VNP.

import logging
from pydantic import BaseModel

from app.config import settings

logger = logging.getLogger(__name__)


class SMSPayload(BaseModel):
    to: str  # E.164 format: +84901234567
    body: str


class SMSResult(BaseModel):
    channel: str = "sms"
    success: bool
    recipient: str
    error: str | None = None
    provider: str = "stub"


async def send_sms(payload: SMSPayload) -> SMSResult:
    """
    Stub: log + return success.
    Production: switch on settings.sms_provider, call real API.
    """
    if not payload.to or not payload.to.startswith("+"):
        return SMSResult(
            success=False,
            recipient=payload.to,
            error="Phone must be E.164 format (+84xxx)",
        )

    if not settings.sms_enabled:
        logger.info(f"[STUB SMS] to={payload.to} body={payload.body[:80]}")
        return SMSResult(
            success=True,
            recipient=payload.to,
            provider="stub",
        )

    # Real provider branch — implement when integrating
    logger.warning(f"sms_enabled=True but provider={settings.sms_provider} not implemented")
    return SMSResult(
        success=False,
        recipient=payload.to,
        error=f"SMS provider '{settings.sms_provider}' not implemented",
        provider=settings.sms_provider,
    )
