# SPDX-License-Identifier: Apache-2.0
# DX-FSM Ticket Service – test logic mới phục vụ frontend (không cần DB):
#   - notify_users: bỏ trùng / bỏ người thực hiện / bỏ None
#   - TicketCreate: customer_* và category/priority tuỳ chọn, vẫn validate giá trị

import uuid

import pytest
from pydantic import ValidationError

from app.routes.tickets import TicketCreate
from app.services.notifier import STATUS_VI, notify_users


class FakeSession:
    def __init__(self):
        self.added = []

    def add(self, obj):
        self.added.append(obj)


@pytest.mark.asyncio
async def test_notify_users_dedupes_and_skips_actor_and_none():
    a, b, actor = uuid.uuid4(), uuid.uuid4(), uuid.uuid4()
    db = FakeSession()
    n = await notify_users(db, [a, b, a, None, actor], "Tiêu đề", "Nội dung", exclude=actor)
    assert n == 2
    assert {x.user_id for x in db.added} == {a, b}
    assert all(x.title == "Tiêu đề" and x.type == "info" for x in db.added)


@pytest.mark.asyncio
async def test_notify_users_nobody_to_notify():
    db = FakeSession()
    assert await notify_users(db, [None], "t", "m") == 0
    assert db.added == []


def test_status_labels_cover_all_statuses():
    for s in ("new", "assigned", "in_progress", "pending", "resolved", "closed", "cancelled"):
        assert STATUS_VI[s]


class TestTicketCreateModel:
    def test_customer_fields_optional(self):
        t = TicketCreate(title="Máy in hỏng", description="Không in được")
        assert t.customer_id is None and t.customer_name is None and t.customer_email is None

    def test_category_and_priority_optional(self):
        t = TicketCreate(title="Máy in hỏng")
        assert t.category is None and t.priority is None

    def test_user_choice_is_normalised(self):
        t = TicketCreate(title="Máy in hỏng", category="Network", priority="CRITICAL")
        assert (t.category, t.priority) == ("network", "critical")

    def test_invalid_values_still_rejected(self):
        with pytest.raises(ValidationError):
            TicketCreate(title="Máy in hỏng", category="plumbing")
        with pytest.raises(ValidationError):
            TicketCreate(title="Máy in hỏng", priority="urgent")

    def test_title_min_length(self):
        with pytest.raises(ValidationError):
            TicketCreate(title="abc")
