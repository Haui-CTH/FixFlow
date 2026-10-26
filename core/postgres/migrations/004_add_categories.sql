-- SPDX-License-Identifier: Apache-2.0
-- DX-FSM Migration: 004 — Add access_control and service_request categories
-- Đồng bộ 7 categories với ai-service và frontend

ALTER TYPE ticket_category ADD VALUE IF NOT EXISTS 'access_control';
ALTER TYPE ticket_category ADD VALUE IF NOT EXISTS 'service_request';

