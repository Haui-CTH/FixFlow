# SPDX-License-Identifier: Apache-2.0
# DX-FSM Migration: 002 — Outbox alerting column
# Thêm last_alerted_at để idempotent alerting.
# Idempotent: IF NOT EXISTS.

ALTER TABLE outbox_events
ADD COLUMN IF NOT EXISTS last_alerted_at TIMESTAMP WITH TIME ZONE;

-- Index để alert worker scan nhanh: failed + chưa alerted
CREATE INDEX IF NOT EXISTS ix_outbox_failed_unalerted
ON outbox_events (status, last_alerted_at)
WHERE status = 'failed' AND last_alerted_at IS NULL;
