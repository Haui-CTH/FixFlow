# SPDX-License-Identifier: Apache-2.0
# DX-FSM Notification Service – Notify endpoint tests
# B5.1 acceptance: 8+ tests cho channel routing, validation, error.

import pytest
from unittest.mock import AsyncMock, patch
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.routes.notify import _format_email_body, _format_sms_body, NotifyRequest


# ─── Request validation ──────────────────────────────────


class TestNotifyRequestValidation:
    def test_valid_request(self):
        req = NotifyRequest(
            user_id="u1", title="Test", message="Hello",
            channels=["email"], email="test@example.com",
        )
        assert req.type == "info"  # default
        assert req.channels == ["email"]

    def test_empty_channels_rejected(self):
        with pytest.raises(ValueError):
            NotifyRequest(
                user_id="u1", title="T", message="M",
                channels=[], email="t@e.com",
            )

    def test_too_many_channels_rejected(self):
        with pytest.raises(ValueError):
            NotifyRequest(
                user_id="u1", title="T", message="M",
                channels=["email", "sms", "push", "email"],
                email="t@e.com",
            )

    def test_invalid_type_rejected(self):
        with pytest.raises(ValueError):
            NotifyRequest(
                user_id="u1", title="T", message="M",
                type="urgent",  # not in Literal
                email="t@e.com",
            )

    def test_title_too_long(self):
        with pytest.raises(ValueError):
            NotifyRequest(
                user_id="u1", title="x" * 201, message="M",
                email="t@e.com",
            )

    def test_message_too_long(self):
        with pytest.raises(ValueError):
            NotifyRequest(
                user_id="u1", title="T", message="x" * 5001,
                email="t@e.com",
            )

    def test_invalid_email_rejected(self):
        with pytest.raises(ValueError):
            NotifyRequest(
                user_id="u1", title="T", message="M",
                email="not-an-email",
            )


# ─── Body formatters ─────────────────────────────────────


class TestBodyFormatters:
    def test_email_body_basic(self):
        req = NotifyRequest(
            user_id="u1", title="Hello", message="World",
            email="t@e.com",
        )
        body = _format_email_body(req)
        assert "Hello" in body
        assert "World" in body
        assert "DX-FSM" in body

    def test_email_body_with_metadata(self):
        req = NotifyRequest(
            user_id="u1", title="T", message="M",
            email="t@e.com",
            metadata={"ticket_id": "TKT-001", "status": "open"},
        )
        body = _format_email_body(req)
        assert "ticket_id: TKT-001" in body
        assert "status: open" in body

    def test_sms_body_short(self):
        req = NotifyRequest(
            user_id="u1", title="T", message="M",
            phone="+84901234567",
        )
        body = _format_sms_body(req)
        assert "T: M" in body
        assert len(body) <= 160

    def test_sms_body_truncated(self):
        req = NotifyRequest(
            user_id="u1",
            title="T",
            message="x" * 200,  # longer than 160
            phone="+84901234567",
        )
        body = _format_sms_body(req)
        assert len(body) == 160
        assert body.endswith("...")


# ─── Channel routing logic (pure) ────────────────────────


def route_to_channels(req: NotifyRequest) -> list[str]:
    """Pure logic: filter channels that have required target info."""
    available = []
    for ch in req.channels:
        if ch == "email" and req.email:
            available.append("email")
        elif ch == "sms" and req.phone:
            available.append("sms")
        elif ch == "push" and req.device_token:
            available.append("push")
    return available


class TestChannelRouting:
    def test_email_only(self):
        req = NotifyRequest(
            user_id="u1", title="T", message="M",
            channels=["email"], email="t@e.com",
        )
        assert route_to_channels(req) == ["email"]

    def test_sms_missing_phone_excluded(self):
        req = NotifyRequest(
            user_id="u1", title="T", message="M",
            channels=["sms"],  # no phone
        )
        assert route_to_channels(req) == []

    def test_push_missing_token_excluded(self):
        req = NotifyRequest(
            user_id="u1", title="T", message="M",
            channels=["push"],  # no device_token
        )
        assert route_to_channels(req) == []

    def test_multi_channel_all_present(self):
        req = NotifyRequest(
            user_id="u1", title="T", message="M",
            channels=["email", "sms", "push"],
            email="t@e.com", phone="+84901234567", device_token="abc",
        )
        assert route_to_channels(req) == ["email", "sms", "push"]


# ─── Status aggregation (pure) ──────────────────────────


def aggregate_status(success_count: int, total: int) -> str:
    """Pure: aggregate channel results thành status."""
    if success_count == total:
        return "sent"
    if success_count == 0:
        return "failed"
    return "partial"


class TestStatusAggregation:
    def test_all_success(self):
        assert aggregate_status(2, 2) == "sent"

    def test_all_fail(self):
        assert aggregate_status(0, 2) == "failed"

    def test_partial(self):
        assert aggregate_status(1, 2) == "partial"

    def test_zero_channels_edge(self):
        # 0 success / 0 total → không thể xảy ra (validation reject empty)
        # nhưng logic: success == total → "sent"
        assert aggregate_status(0, 0) == "sent"


# ─── Channel mocks (avoid real SMTP) ─────────────────────


class TestChannelResults:
    """Mock channel functions to avoid real network calls."""

    @pytest.mark.asyncio
    async def test_email_success_mocked(self):
        from app.channels.email import EmailPayload, EmailResult, send_email

        with patch("app.channels.email.aiosmtplib.send", new_callable=AsyncMock) as mock_send:
            mock_send.return_value = None
            payload = EmailPayload(
                to="test@example.com", subject="Hi", body="Hello"
            )
            result = await send_email(payload)
            assert result.success is True
            assert result.recipient == "test@example.com"
            mock_send.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_email_failure_mocked(self):
        from app.channels.email import EmailPayload, send_email
        import aiosmtplib

        with patch("app.channels.email.aiosmtplib.send", new_callable=AsyncMock) as mock_send:
            mock_send.side_effect = aiosmtplib.SMTPException("Connection refused")
            payload = EmailPayload(
                to="test@example.com", subject="Hi", body="Hello"
            )
            result = await send_email(payload)
            assert result.success is False
            assert "Connection refused" in result.error

    @pytest.mark.asyncio
    async def test_sms_stub_disabled(self):
        """sms_enabled=False → stub returns success."""
        from app.channels.sms import SMSPayload, send_sms
        from app.config import settings

        # Ensure disabled
        original = settings.sms_enabled
        settings.sms_enabled = False
        try:
            result = await send_sms(SMSPayload(to="+84901234567", body="test"))
            assert result.success is True
            assert result.provider == "stub"
        finally:
            settings.sms_enabled = original

    @pytest.mark.asyncio
    async def test_sms_invalid_phone_rejected(self):
        from app.channels.sms import SMSPayload, send_sms

        result = await send_sms(SMSPayload(to="0901234567", body="test"))  # no +
        assert result.success is False
        assert "E.164" in result.error

    @pytest.mark.asyncio
    async def test_push_stub_disabled(self):
        from app.channels.push import PushPayload, send_push
        from app.config import settings

        original = settings.push_enabled
        settings.push_enabled = False
        try:
            result = await send_push(PushPayload(
                device_token="abc123", title="T", body="M"
            ))
            assert result.success is True
            assert result.provider == "stub"
        finally:
            settings.push_enabled = original

    @pytest.mark.asyncio
    async def test_push_missing_token_rejected(self):
        from app.channels.push import PushPayload, send_push

        result = await send_push(PushPayload(
            device_token="", title="T", body="M"
        ))
        assert result.success is False
        assert "device_token" in result.error


# ─── Endpoint integration (mocked channels) ──────────────


class TestNotifyEndpoint:
    """Test POST /notify với channels mocked."""

    @pytest.mark.asyncio
    async def test_notify_email_success(self):
        from app.routes.notify import EmailResult

        with patch("app.routes.notify.send_email", new_callable=AsyncMock) as mock_email:
            mock_email.return_value = EmailResult(
                success=True, recipient="test@example.com"
            )

            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.post("/notify", json={
                    "user_id": "u1",
                    "title": "Test",
                    "message": "Hello",
                    "type": "info",
                    "channels": ["email"],
                    "email": "test@example.com",
                })

            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "sent"
            assert "email" in data["channels_used"]
            assert "notification_id" in data

    @pytest.mark.asyncio
    async def test_notify_partial_success(self):
        """email thành công, sms fail → status=partial."""
        from app.routes.notify import EmailResult, SMSResult

        with patch("app.routes.notify.send_email", new_callable=AsyncMock) as mock_email, \
             patch("app.routes.notify.send_sms", new_callable=AsyncMock) as mock_sms:
            mock_email.return_value = EmailResult(
                success=True, recipient="t@e.com"
            )
            mock_sms.return_value = SMSResult(
                success=False, recipient="+84901234567",
                error="No SMS provider",
            )

            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.post("/notify", json={
                    "user_id": "u1",
                    "title": "Test",
                    "message": "Hi",
                    "channels": ["email", "sms"],
                    "email": "t@e.com",
                    "phone": "+84901234567",
                })

            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "partial"
            assert data["channels_used"] == ["email"]
            assert len(data["results"]) == 2

    @pytest.mark.asyncio
    async def test_notify_missing_target_for_channel(self):
        """email không có địa chỉ → fail với error message."""

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post("/notify", json={
                "user_id": "u1",
                "title": "Test",
                "message": "Hi",
                "channels": ["email"],
                # no email
            })

        assert response.status_code == 200  # still 200, channel result shows error
        data = response.json()
        assert data["status"] == "failed"
        assert data["results"][0]["error"] == "Missing email address"

    @pytest.mark.asyncio
    async def test_notify_validation_error_422(self):
        """Invalid input → 422 Pydantic validation."""
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post("/notify", json={
                "user_id": "u1",
                "title": "",  # too short
                "message": "Hi",
                "email": "t@e.com",
            })

        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_health_endpoint(self):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get("/health")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "channels" in data


# ─── Auth (service token) ────────────────────────────────


class TestServiceTokenAuth:
    """Khi SERVICE_TOKEN set, require Bearer token."""

    @pytest.mark.asyncio
    async def test_no_token_rejected_when_required(self):
        from app.config import settings
        from app.routes.notify import _format_email_body
        from unittest.mock import patch, AsyncMock
        from app.routes.notify import EmailResult

        original = settings.service_token
        settings.service_token = "secret-token-xyz"

        try:
            with patch("app.routes.notify.send_email", new_callable=AsyncMock) as mock_email:
                mock_email.return_value = EmailResult(
                    success=True, recipient="t@e.com"
                )
                transport = ASGITransport(app=app)
                async with AsyncClient(transport=transport, base_url="http://test") as client:
                    response = await client.post("/notify", json={
                        "user_id": "u1", "title": "T", "message": "M",
                        "channels": ["email"], "email": "t@e.com",
                    })

                assert response.status_code == 401
        finally:
            settings.service_token = original

    @pytest.mark.asyncio
    async def test_valid_token_accepted(self):
        from app.config import settings
        from unittest.mock import patch, AsyncMock
        from app.routes.notify import EmailResult

        original = settings.service_token
        settings.service_token = "secret-token-xyz"

        try:
            with patch("app.routes.notify.send_email", new_callable=AsyncMock) as mock_email:
                mock_email.return_value = EmailResult(
                    success=True, recipient="t@e.com"
                )
                transport = ASGITransport(app=app)
                async with AsyncClient(transport=transport, base_url="http://test") as client:
                    response = await client.post(
                        "/notify",
                        json={
                            "user_id": "u1", "title": "T", "message": "M",
                            "channels": ["email"], "email": "t@e.com",
                        },
                        headers={"Authorization": "Bearer secret-token-xyz"},
                    )

                assert response.status_code == 200
        finally:
            settings.service_token = original
