-- DX-FSM Outbox DLQ (A5.4) — dead-letter queue cho failed events
-- SPDX-License-Identifier: Apache-2.0

CREATE TABLE IF NOT EXISTS outbox_dlq (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_event_id UUID NOT NULL,
    event_type VARCHAR(64) NOT NULL,
    payload JSONB NOT NULL,
    last_error TEXT,
    total_attempts INTEGER NOT NULL DEFAULT 0,
    moved_to_dlq_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Resolution tracking (admin retry / discard)
    resolved VARCHAR(16) NOT NULL DEFAULT 'pending',  -- pending | retried | discarded
    resolved_at TIMESTAMPTZ,
    resolved_by VARCHAR(100),
    resolution_note TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_outbox_dlq_original_event_id
    ON outbox_dlq (original_event_id);

CREATE INDEX IF NOT EXISTS ix_outbox_dlq_resolved_moved
    ON outbox_dlq (resolved, moved_to_dlq_at);

CREATE INDEX IF NOT EXISTS ix_outbox_dlq_event_type
    ON outbox_dlq (event_type);
