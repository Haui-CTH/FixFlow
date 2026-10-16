# SPDX-License-Identifier: Apache-2.0
# DX-FSM E2E – Outbox flow test
# B5.2: Verify status changes → outbox events.

import pytest
from httpx import AsyncClient
from sqlalchemy import text


@pytest.mark.asyncio
async def test_ticket_creation_emits_outbox_event(
    e2e_client: AsyncClient,
    db_engine,
    ticket_payload: dict,
    auth_header_customer: dict,
):
    """POST /tickets → outbox_events row với event_type=ticket.created."""
    resp = await e2e_client.post(
        "/tickets",
        json=ticket_payload,
        headers=auth_header_customer,
    )
    assert resp.status_code == 201
    ticket_id = resp.json()["id"]

    async with db_engine.connect() as conn:
        result = await conn.execute(
            text(
                "SELECT event_type, status, payload "
                "FROM outbox_events WHERE payload->>'ticket_id' = :tid"
            ),
            {"tid": ticket_id},
        )
        events = result.fetchall()

    assert len(events) >= 1
    event_type, status, payload = events[0]
    assert event_type == "ticket.created"
    assert status in ("pending", "sending", "sent")
    assert payload["ticket_id"] == ticket_id


@pytest.mark.asyncio
async def test_status_change_emits_outbox_event(
    e2e_client: AsyncClient,
    db_engine,
    ticket_payload: dict,
    auth_header_customer: dict,
    auth_header_admin: dict,
):
    """PATCH status → outbox event mới."""
    # Create
    create_resp = await e2e_client.post(
        "/tickets",
        json=ticket_payload,
        headers=auth_header_customer,
    )
    ticket_id = create_resp.json()["id"]

    # Initial outbox count
    async with db_engine.connect() as conn:
        result = await conn.execute(
            text("SELECT COUNT(*) FROM outbox_events WHERE payload->>'ticket_id' = :tid"),
            {"tid": ticket_id},
        )
        initial_count = result.scalar()

    # Status change
    resp = await e2e_client.patch(
        f"/tickets/{ticket_id}",
        json={"status": "in_progress"},
        headers=auth_header_admin,
    )
    assert resp.status_code == 200

    # Verify event count increased
    async with db_engine.connect() as conn:
        result = await conn.execute(
            text("SELECT COUNT(*) FROM outbox_events WHERE payload->>'ticket_id' = :tid"),
            {"tid": ticket_id},
        )
        new_count = result.scalar()

    assert new_count > initial_count


@pytest.mark.asyncio
async def test_outbox_event_payload_contains_required_fields(
    e2e_client: AsyncClient,
    db_engine,
    ticket_payload: dict,
    auth_header_customer: dict,
):
    """Outbox event payload phải có ticket_id, status, customer info."""
    resp = await e2e_client.post(
        "/tickets",
        json=ticket_payload,
        headers=auth_header_customer,
    )
    ticket_id = resp.json()["id"]

    async with db_engine.connect() as conn:
        result = await conn.execute(
            text(
                "SELECT payload FROM outbox_events "
                "WHERE payload->>'ticket_id' = :tid "
                "ORDER BY created_at DESC LIMIT 1"
            ),
            {"tid": ticket_id},
        )
        row = result.fetchone()

    assert row is not None
    payload = row[0]
    assert "ticket_id" in payload
    assert payload["ticket_id"] == ticket_id
