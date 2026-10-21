# SPDX-License-Identifier: Apache-2.0
# DX-FSM Notification Service – Notify Endpoint
# Nhận request từ n8n workflows (qua outbox dispatcher) hoặc từ
# ticket-service internal. Route theo channel được yêu cầu.

import logging
import uuid
from typing import Literal, Optional

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, Field, EmailStr, field_validator

from app.channels.email import EmailPayload, send_email
from app.channels.sms import SMSPayload, send_sms
from app.channels.push import PushPayload, send_push
from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()


# ─── Request/Response models ─────────────────────────────


ChannelType = Literal["email", "sms", "push"]


class NotifyRequest(BaseModel):
    """Generic notify payload. Dispatcher sẽ route theo channels list."""

    user_id: str
    title: str = Field(..., min_length=1, max_length=200)
    message: str = Field(..., min_length=1, max_length=5000)
    type: Literal["info", "warning", "error", "success"] = "info"
    channels: list[ChannelType] = Field(default_factory=lambda: ["email"])

    # Optional target info (cho routing đúng channel)
    email: Optional[EmailStr] = None
    phone: Optional[str] = None         # E.164: +84xxx
    device_token: Optional[str] = None

    # Optional context (cho template)
    metadata: dict = Field(default_factory=dict)

    @field_validator("channels")
    @classmethod
    def validate_channels(cls, v):
        if not v:
            raise ValueError("channels must not be empty")
        if len(v) > 3:
            raise ValueError("max 3 channels per request")
        return v


class ChannelResult(BaseModel):
    channel: str
    success: bool
    recipient: str
    error: Optional[str] = None
    provider: Optional[str] = None


class NotifyResponse(BaseModel):
    status: Literal["sent", "partial", "failed"]
    notification_id: str
    channels_used: list[str]
    results: list[ChannelResult]
    timestamp: str


# ─── Auth helper ──────────────────────────────────────────


def verify_service_token(authorization: Optional[str] = Header(None)) -> None:
    """
    Service-to-service auth. N8n / ticket-service phải gửi:
      Authorization: Bearer <service_token>
    Token này set qua SERVICE_TOKEN env var.
    Local dev: SERVICE_TOKEN="" → skip verify (chỉ dùng khi test).
    """
    if not settings.service_token:
        # Local dev mode: no token required
        return

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")

    token = authorization.replace("Bearer ", "", 1).strip()
    if token != settings.service_token:
        raise HTTPException(status_code=401, detail="Invalid service token")


# ─── POST /notify ─────────────────────────────────────────


@router.post(
    "/notify",
    response_model=NotifyResponse,
    dependencies=[Depends(verify_service_token)],
)
async def send_notification(req: NotifyRequest) -> NotifyResponse:
    """
    Route notification qua các channels yêu cầu.

    Flow:
    1. Validate channels (email/sms/push)
    2. Cho mỗi channel: gọi channel-specific handler
    3. Aggregate results → trả về status (sent/partial/failed)

    Permission: service-to-service (Bearer token) hoặc local dev.
    """
    notification_id = str(uuid.uuid4())
    results: list[ChannelResult] = []

    for channel in req.channels:
        if channel == "email":
            if not req.email:
                results.append(ChannelResult(
                    channel="email", success=False, recipient="",
                    error="Missing email address",
                ))
                continue
            r = await send_email(EmailPayload(
                to=req.email,
                subject=f"[{req.type.upper()}] {req.title}",
                body=_format_email_body(req),
                html=False,
            ))
            results.append(ChannelResult(
                channel=r.channel, success=r.success,
                recipient=r.recipient, error=r.error,
            ))

        elif channel == "sms":
            if not req.phone:
                results.append(ChannelResult(
                    channel="sms", success=False, recipient="",
                    error="Missing phone (E.164)",
                ))
                continue
            r = await send_sms(SMSPayload(
                to=req.phone, body=_format_sms_body(req),
            ))
            results.append(ChannelResult(
                channel=r.channel, success=r.success,
                recipient=r.recipient, error=r.error,
                provider=r.provider,
            ))

        elif channel == "push":
            if not req.device_token:
                results.append(ChannelResult(
                    channel="push", success=False, recipient="",
                    error="Missing device_token",
                ))
                continue
            r = await send_push(PushPayload(
                device_token=req.device_token,
                title=req.title,
                body=req.message,
                data=req.metadata or None,
            ))
            results.append(ChannelResult(
                channel=r.channel, success=r.success,
                recipient=r.recipient, error=r.error,
                provider=r.provider,
            ))

    # Aggregate
    sent_count = sum(1 for r in results if r.success)
    if sent_count == len(results):
        status = "sent"
    elif sent_count == 0:
        status = "failed"
    else:
        status = "partial"

    from datetime import datetime, timezone
    response = NotifyResponse(
        status=status,
        notification_id=notification_id,
        channels_used=[r.channel for r in results if r.success],
        results=results,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )

    logger.info(
        f"Notify {notification_id}: status={status} "
        f"channels={req.channels} user={req.user_id}"
    )
    return response


# ─── Body formatters ──────────────────────────────────────


def _format_email_body(req: NotifyRequest) -> str:
    """Format plain text email body."""
    lines = [
        req.title,
        "=" * min(60, len(req.title)),
        "",
        req.message,
    ]
    if req.metadata:
        lines.append("")
        lines.append("Details:")
        for k, v in req.metadata.items():
            lines.append(f"  - {k}: {v}")
    lines.append("")
    lines.append("--")
    lines.append("DX-FSM Notification Service")
    lines.append("This is an automated message. Please do not reply.")
    return "\n".join(lines)


def _format_sms_body(req: NotifyRequest) -> str:
    """SMS body — short, no formatting."""
    # SMS limit 160 chars; truncate if needed
    body = f"{req.title}: {req.message}"
    if len(body) > 160:
        body = body[:157] + "..."
    return body
