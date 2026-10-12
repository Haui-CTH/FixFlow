# SPDX-License-Identifier: Apache-2.0
# DX-FSM Ticket Service – Ticket Tests

import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_health_check():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"


@pytest.mark.asyncio
async def test_list_tickets():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/tickets")
        assert response.status_code == 200
        assert isinstance(response.json(), list)


@pytest.mark.asyncio
async def test_create_ticket():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {
            "title": "Test ticket",
            "description": "Test description",
            "category": "hardware",
            "priority": "medium",
            "customer_id": "test-id",
            "customer_name": "Test User",
            "customer_email": "test@example.com",
        }
        response = await client.post("/tickets", json=payload)
        assert response.status_code == 200
