# SPDX-License-Identifier: Apache-2.0
# DX-FSM E2E – SLA breach test
# B5.2: advance time → SLA monitor detects breach → ticket status update.

import pytest
from httpx import AsyncClient
from sqlalchemy import text


@pytest.mark.asyncio
async def test_sla_breach_detection(
    e2e_client: AsyncClient,
    db_engine,
    ticket_payload: dict,
    auth_header_customer: dict,
    auth_header_admin: dict,
):
    """
    Tạo ticket → manually set sla_deadline = quá khứ
    → run SLA check → verify breach detected
    """
    # Create ticket
    create_resp = await e2e_client.post(
        "/tickets",
        json={**ticket_payload, "priority": "high"},
        headers=auth_header_customer,
    )
    assert create_resp.status_code == 201
    ticket_id = create_resp.json()["id"]

    # Backdate SLA deadline (1 hour ago)
    async with db_engine.begin() as conn:
        await conn.execute(
            text(
                "UPDATE tickets SET sla_deadline = NOW() - INTERVAL '1 hour' "
                "WHERE id = :tid"
            ),
            {"tid": ticket_id},
        )

    # Trigger SLA check via admin endpoint
    sla_resp = await e2e_client.post(
        "/admin/sla/check",
        headers=auth_header_admin,
    )
    assert sla_resp.status_code == 200
    sla_data = sla_resp.json()
    assert "breached" in sla_data
    assert sla_data["breached"] >= 1

    # Verify ticket is marked as breached (status field hoặc sla_breached flag)
    get_resp = await e2e_client.get(
        f"/tickets/{ticket_id}",
        headers=auth_header_customer,
    )
    assert get_resp.status_code == 200
    ticket = get_resp.json()
    # Either status changed OR sla_breached=True (depends on app impl)
    assert (
        ticket.get("sla_breached") is True
        or ticket.get("status") == "sla_breached"
    )


@pytest.mark.asyncio
async def test_sla_breach_emits_outbox_event(
    e2e_client: AsyncClient,
    db_engine,
    ticket_payload: dict,
    auth_header_customer: dict,
    auth_header_admin: dict,
):
    """SLA breach → outbox event với event_type=sla.breached."""
    create_resp = await e2e_client.post(
        "/tickets",
        json={**ticket_payload, "priority": "high"},
        headers=auth_header_customer,
    )
    ticket_id = create_resp.json()["id"]

    # Backdate
    async with db_engine.begin() as conn:
        await conn.execute(
            text(
                "UPDATE tickets SET sla_deadline = NOW() - INTERVAL '1 hour' "
                "WHERE id = :tid"
            ),
            {"tid": ticket_id},
        )

    # Run SLA check
    await e2e_client.post(
        "/admin/sla/check",
        headers=auth_header_admin,
    )

    # Verify outbox event
    async with db_engine.connect() as conn:
        result = await conn.execute(
            text(
                "SELECT event_type FROM outbox_events "
                "WHERE payload->>'ticket_id' = :tid "
                "AND event_type = 'sla.breached'"
            ),
            {"tid": ticket_id},
        )
        events = result.fetchall()

    assert len(events) >= 1


@pytest.mark.asyncio
async def test_no_breach_for_future_deadline(
    e2e_client: AsyncClient,
    db_engine,
    ticket_payload: dict,
    auth_header_customer: dict,
    auth_header_admin: dict,
):
    """Ticket có deadline trong tương lai → KHÔNG breach."""
    create_resp = await e2e_client.post(
        "/tickets",
        json=ticket_payload,
        headers=auth_header_customer,
    )
    ticket_id = create_resp.json()["id"]

    # Set deadline xa trong tương lai
    async with db_engine.begin() as conn:
        await conn.execute(
            text(
                "UPDATE tickets SET sla_deadline = NOW() + INTERVAL '24 hours' "
                "WHERE id = :tid"
            ),
            {"tid": ticket_id},
        )

    sla_resp = await e2e_client.post(
        "/admin/sla/check",
        headers=auth_header_admin,
    )
    sla_data = sla_resp.json()

    # Verify this specific ticket not breached
    async with db_engine.connect() as conn:
        result = await conn.execute(
            text("SELECT sla_breached FROM tickets WHERE id = :tid"),
            {"tid": ticket_id},
        )
        breached = result.scalar()

    assert bool(breached) is False or breached is None
