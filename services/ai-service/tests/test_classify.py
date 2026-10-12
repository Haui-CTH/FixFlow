# SPDX-License-Identifier: Apache-2.0
# DX-FSM AI Service – Tests

import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_health():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/health")
        assert response.status_code == 200


@pytest.mark.asyncio
async def test_classify_hardware():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/classify",
            json={"title": "Máy in HP không hoạt động", "description": "Đèn báo nhấp nháy cam"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["category"] == "hardware"
        assert data["confidence"] > 0


@pytest.mark.asyncio
async def test_classify_network():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/classify",
            json={"title": "Mất kết nối WiFi tầng 3"}
        )
        assert response.status_code == 200
        assert response.json()["category"] == "network"


@pytest.mark.asyncio
async def test_recommend():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/recommend?ticket_id=abc&category=hardware&priority=high")
        assert response.status_code == 200
        data = response.json()
        assert "technician_id" in data
        assert data["score"] > 0
