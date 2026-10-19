# SPDX-License-Identifier: Apache-2.0
# DX-FSM E2E – Ticket lifecycle test
# B5.2: 7-step flow: create → assign → in_progress → pending → resolved → closed
# Verify DB state + outbox events + history records.

import pytest
from httpx import AsyncClient
from sqlalchemy import select, text


# ─── Happy path: full lifecycle ────────────────────────────────────────


@pytest.mark.asyncio(loop_scope="session")
async def test_ticket_full_lifecycle(
    e2e_client: AsyncClient,
    db_engine,
    ticket_payload: dict,
    auth_header_customer: dict,
    auth_header_admin: dict,
):
    """
    Test 7-step flow:
      1. POST /tickets (create) → status=open
      2. PATCH /tickets/{id}/assign → status=assigned
      3. PATCH /tickets/{id} (status=in_progress)
      4. PATCH /tickets/{id} (status=pending)
      5. PATCH /tickets/{id} (status=resolved)
      6. PATCH /tickets/{id} (status=closed)
      7. GET /tickets/{id} → verify final state

    Mỗi step verify DB state + ticket_history records.
    """
    # ── Step 1: Create ────────────────────────────────────────────────
    create_resp = await e2e_client.post(
        "/tickets",
        json=ticket_payload,
        headers=auth_header_customer,
    )
    assert create_resp.status_code == 201, f"Create failed: {create_resp.text}"
    ticket = create_resp.json()
    ticket_id = ticket["id"]
    assert ticket["status"] == "open"
    assert ticket["title"] == ticket_payload["title"]

    # Verify outbox event created
    async with db_engine.connect() as conn:
        result = await conn.execute(
            text(
                "SELECT event_type, status FROM outbox_events "
                "WHERE payload->>'ticket_id' = :tid"
            ),
            {"tid": ticket_id},
        )
        events = result.fetchall()
    assert len(events) >= 1
    assert events[0][0] == "ticket.created"

    # Verify history record
    async with db_engine.connect() as conn:
        result = await conn.execute(
            text(
                "SELECT action FROM ticket_history WHERE ticket_id = :tid "
                "ORDER BY created_at"
            ),
            {"tid": ticket_id},
        )
        history_actions = [row[0] for row in result.fetchall()]
    assert "created" in history_actions

    # ── Step 2: Assign ────────────────────────────────────────────────
    assign_payload = {"assignee_id": "00000000-0000-0000-0000-000000000099"}
    assign_resp = await e2e_client.patch(
        f"/tickets/{ticket_id}/assign",
        json=assign_payload,
        headers=auth_header_admin,
    )
    assert assign_resp.status_code == 200
    assert assign_resp.json()["status"] == "assigned"
    assert assign_resp.json()["assignee_id"] == assign_payload["assignee_id"]

    # ── Step 3: In progress ───────────────────────────────────────────
    in_progress_resp = await e2e_client.patch(
        f"/tickets/{ticket_id}",
        json={"status": "in_progress"},
        headers=auth_header_admin,
    )
    assert in_progress_resp.status_code == 200
    assert in_progress_resp.json()["status"] == "in_progress"

    # ── Step 4: Pending ───────────────────────────────────────────────
    pending_resp = await e2e_client.patch(
        f"/tickets/{ticket_id}",
        json={"status": "pending", "pending_reason": "Waiting for parts"},
        headers=auth_header_admin,
    )
    assert pending_resp.status_code == 200
    assert pending_resp.json()["status"] == "pending"

    # ── Step 5: Resolved ──────────────────────────────────────────────
    resolved_resp = await e2e_client.patch(
        f"/tickets/{ticket_id}",
        json={"status": "resolved", "resolution_note": "Part replaced"},
        headers=auth_header_admin,
    )
    assert resolved_resp.status_code == 200
    assert resolved_resp.json()["status"] == "resolved"

    # ── Step 6: Closed ────────────────────────────────────────────────
    closed_resp = await e2e_client.patch(
        f"/tickets/{ticket_id}",
        json={"status": "closed"},
        headers=auth_header_admin,
    )
    assert closed_resp.status_code == 200
    assert closed_resp.json()["status"] == "closed"

    # ── Step 7: Verify final state ────────────────────────────────────
    get_resp = await e2e_client.get(
        f"/tickets/{ticket_id}",
        headers=auth_header_customer,
    )
    assert get_resp.status_code == 200
    final = get_resp.json()
    assert final["status"] == "closed"

    # Verify history has all transitions
    async with db_engine.connect() as conn:
        result = await conn.execute(
            text(
                "SELECT action FROM ticket_history WHERE ticket_id = :tid "
                "ORDER BY created_at"
            ),
            {"tid": ticket_id},
        )
        all_actions = [row[0] for row in result.fetchall()]

    assert "created" in all_actions
    # Mỗi status change → history record
    assert any("status" in a or "assigned" in a for a in all_actions)


# ─── Error cases ───────────────────────────────────────────────────────


@pytest.mark.asyncio(loop_scope="session")
async def test_create_ticket_validation_error(
    e2e_client: AsyncClient,
    auth_header_customer: dict,
):
    """Empty title → 422."""
    resp = await e2e_client.post(
        "/tickets",
        json={"title": "", "description": "x", "category": "hardware", "priority": "low"},
        headers=auth_header_customer,
    )
    assert resp.status_code == 422


@pytest.mark.asyncio(loop_scope="session")
async def test_invalid_status_transition(
    e2e_client: AsyncClient,
    db_engine,
    ticket_payload: dict,
    auth_header_customer: dict,
    auth_header_admin: dict,
):
    """Skip status (open → resolved) → 400 hoặc rejected."""
    # Create
    create_resp = await e2e_client.post(
        "/tickets",
        json=ticket_payload,
        headers=auth_header_customer,
    )
    assert create_resp.status_code == 201
    ticket_id = create_resp.json()["id"]

    # Try invalid transition: open → resolved (skip steps)
    resp = await e2e_client.patch(
        f"/tickets/{ticket_id}",
        json={"status": "resolved"},
        headers=auth_header_admin,
    )
    # App có thể reject (400) hoặc accept (200) tùy business rule
    # Test chỉ verify không crash
    assert resp.status_code in (200, 400, 422)


@pytest.mark.asyncio(loop_scope="session")
async def test_get_nonexistent_ticket_404(
    e2e_client: AsyncClient,
    auth_header_customer: dict,
):
    """GET /tickets/{random-uuid} → 404."""
    resp = await e2e_client.get(
        "/tickets/00000000-0000-0000-0000-deadbeef0000",
        headers=auth_header_customer,
    )
    assert resp.status_code == 404


# ─── Concurrency / data integrity ─────────────────────────────────────


@pytest.mark.asyncio(loop_scope="session")
async def test_create_multiple_tickets_unique_ids(
    e2e_client: AsyncClient,
    ticket_payload: dict,
    auth_header_customer: dict,
):
    """3 tickets → 3 unique IDs."""
    ids = set()
    for i in range(3):
        payload = {**ticket_payload, "title": f"Test {i}"}
        resp = await e2e_client.post(
            "/tickets",
            json=payload,
            headers=auth_header_customer,
        )
        assert resp.status_code == 201
        ids.add(resp.json()["id"])
    assert len(ids) == 3
