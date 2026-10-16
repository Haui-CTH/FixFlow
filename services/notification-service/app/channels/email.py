# SPDX-License-Identifier: Apache-2.0
# DX-FSM Notification Service – Email Channel
# SMTP qua aiosmtplib (async). Local dev dùng mailhog.

import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

import aiosmtplib
from pydantic import BaseModel, EmailStr

from app.config import settings

logger = logging.getLogger(__name__)


class EmailPayload(BaseModel):
    to: EmailStr
    subject: str
    body: str
    html: bool = False


class EmailResult(BaseModel):
    channel: str = "email"
    success: bool
    recipient: str
    error: str | None = None


async def send_email(payload: EmailPayload) -> EmailResult:
    """
    Send email qua SMTP. Local dev dùng mailhog (port 1025, no auth).
    Production: set SMTP_HOST/USER/PASSWORD/USE_TLS qua env.
    """
    if not payload.to:
        return EmailResult(success=False, recipient="", error="Missing recipient")

    msg = MIMEMultipart("alternative" if payload.html else "mixed")
    msg["Subject"] = payload.subject
    msg["From"] = settings.smtp_from
    msg["To"] = payload.to

    if payload.html:
        msg.attach(MIMEText(payload.body, "html"))
    else:
        msg.attach(MIMEText(payload.body, "plain"))

    try:
        await aiosmtplib.send(
            msg,
            hostname=settings.smtp_host,
            port=settings.smtp_port,
            username=settings.smtp_user or None,
            password=settings.smtp_password or None,
            use_tls=settings.smtp_use_tls,
        )
        logger.info(f"Email sent to {payload.to}: {payload.subject}")
        return EmailResult(success=True, recipient=payload.to)
    except aiosmtplib.SMTPException as e:
        logger.error(f"SMTP error sending to {payload.to}: {e}")
        return EmailResult(success=False, recipient=payload.to, error=str(e))
    except Exception as e:
        logger.exception(f"Unexpected error sending email to {payload.to}")
        return EmailResult(success=False, recipient=payload.to, error=str(e))
