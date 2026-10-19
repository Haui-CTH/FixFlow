# SPDX-License-Identifier: Apache-2.0
# DX-FSM E2E – Metrics aggregate test
# B5.2: Tạo nhiều tickets với status/priority/category khác nhau → verify
# /admin/metrics đếm đúng.

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio(loop_scope="session")
async def test_metrics_counts_match_tickets(
    e2e_client: AsyncClient,
    ticket_payload: dict,
    auth_header_customer: dict,
    auth_header_admin: dict,
):
    """
    Tạo 5 tickets với các priority khác nhau → verify total_tickets = 5
    và by_priority có counts đúng.
    """
    # Create 5 tickets
    for i, priority in enumerate(["low", "medium", "high", "low", "medium"]):
        payload = {
            **ticket_payload,
            "title": f"Test {i}",
            "priority": priority,
        }
        resp = await e2e_client.post(
            "/tickets",
            json=payload,
            headers=auth_header_customer,
        )
        assert resp.status_code == 201

    # Get metrics
    metrics_resp = await e2e_client.get(
        "/admin/metrics",
        headers=auth_header_admin,
    )
    assert metrics_resp.status_code == 200
    metrics = metrics_resp.json()

    assert metrics["total_tickets"] == 5
    by_priority = {p["priority"]: p["count"] for p in metrics["by_priority"]}
    assert by_priority.get("low", 0) == 2
    assert by_priority.get("medium", 0) == 2
    assert by_priority.get("high", 0) == 1


@pytest.mark.asyncio(loop_scope="session")
async def test_metrics_by_category(
    e2e_client: AsyncClient,
    ticket_payload: dict,
    auth_header_customer: dict,
    auth_header_admin: dict,
):
    """3 tickets với 2 categories → by_category count đúng."""
    for category in ["hardware", "software", "hardware"]:
        payload = {**ticket_payload, "category": category}
        await e2e_client.post(
            "/tickets",
            json=payload,
            headers=auth_header_customer,
        )

    metrics_resp = await e2e_client.get(
        "/admin/metrics",
        headers=auth_header_admin,
    )
    metrics = metrics_resp.json()
    by_category = {c["category"]: c["count"] for c in metrics["by_category"]}
    assert by_category.get("hardware", 0) == 2
    assert by_category.get("software", 0) == 1


@pytest.mark.asyncio(loop_scope="session")
async def test_metrics_activity_window(
    e2e_client: AsyncClient,
    ticket_payload: dict,
    auth_header_customer: dict,
    auth_header_admin: dict,
):
    """Tạo 3 tickets → activity.last_24h_created = 3."""
    for i in range(3):
        await e2e_client.post(
            "/tickets",
            json={**ticket_payload, "title": f"Test {i}"},
            headers=auth_header_customer,
        )

    metrics_resp = await e2e_client.get(
        "/admin/metrics?window_days=1",
        headers=auth_header_admin,
    )
    metrics = metrics_resp.json()
    assert metrics["activity"]["last_24h_created"] >= 3


@pytest.mark.asyncio(loop_scope="session")
async def test_metrics_outbox_health(
    e2e_client: AsyncClient,
    auth_header_admin: dict,
):
    """Outbox health fields present trong response."""
    metrics_resp = await e2e_client.get(
        "/admin/metrics",
        headers=auth_header_admin,
    )
    metrics = metrics_resp.json()
    assert "outbox" in metrics
    outbox = metrics["outbox"]
    assert "pending" in outbox
    assert "sending" in outbox
    assert "sent" in outbox
    assert "failed" in outbox


@pytest.mark.asyncio(loop_scope="session")
async def test_metrics_requires_admin(
    e2e_client: AsyncClient,
    auth_header_customer: dict,
):
    """Customer role → 403 (hoặc redirect / login)."""
    resp = await e2e_client.get(
        "/admin/metrics",
        headers=auth_header_customer,
    )
    # Either 403 (forbidden) hoặc 401 (unauthorized) đều OK
    assert resp.status_code in (401, 403)
