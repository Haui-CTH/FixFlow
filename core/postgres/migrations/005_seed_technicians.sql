-- SPDX-License-Identifier: Apache-2.0
-- DX-FSM Migration: 005 — Seed All 8 Technicians with Deterministic UUIDs
-- Đồng bộ danh sách KTV giữa Database và AI Recommender

-- 1. Bổ sung các tài khoản kỹ thuật viên còn thiếu
INSERT INTO users (keycloak_id, username, email, full_name, role, phone, department) VALUES
  ('kc-tech-004', 'tech4', 'tech4@haui.vn', 'Nguyễn Thị Hương', 'technician', '0912000006', 'Kỹ thuật'),
  ('kc-tech-005', 'tech5', 'tech5@haui.vn', 'Hoàng Minh Tuấn', 'technician', '0912000007', 'Kỹ thuật'),
  ('kc-tech-006', 'tech6', 'tech6@haui.vn', 'Đỗ Quang Vinh', 'technician', '0912000008', 'Kỹ thuật'),
  ('kc-tech-007', 'tech7', 'tech7@haui.vn', 'Vũ Thị Lan', 'technician', '0912000009', 'Kỹ thuật'),
  ('kc-tech-008', 'tech8', 'tech8@haui.vn', 'Bùi Anh Đức', 'technician', '0912000010', 'Kỹ thuật')
ON CONFLICT (username) DO NOTHING;

-- 2. Thêm 8 technicians với UUID khớp hoàn toàn với AI Recommender
INSERT INTO technicians (id, user_id, employee_code, specialty, experience_years, max_concurrent_tickets, location) VALUES
  ('d0000000-0000-0000-0000-000000000001', (SELECT id FROM users WHERE username = 'technician'), 'TECH001', ARRAY['hardware', 'electrical']::ticket_category[], 5, 8, 'Hà Nội'),
  ('d0000000-0000-0000-0000-000000000002', (SELECT id FROM users WHERE username = 'tech2'), 'TECH002', ARRAY['software', 'network']::ticket_category[], 3, 6, 'Hà Nội'),
  ('d0000000-0000-0000-0000-000000000003', (SELECT id FROM users WHERE username = 'tech3'), 'TECH003', ARRAY['network', 'hardware']::ticket_category[], 4, 7, 'Hà Nội'),
  ('d0000000-0000-0000-0000-000000000004', (SELECT id FROM users WHERE username = 'tech4'), 'TECH004', ARRAY['access_control', 'software']::ticket_category[], 2, 5, 'Hà Nội'),
  ('d0000000-0000-0000-0000-000000000005', (SELECT id FROM users WHERE username = 'tech5'), 'TECH005', ARRAY['electrical', 'hardware']::ticket_category[], 5, 8, 'Hà Nội'),
  ('d0000000-0000-0000-0000-000000000006', (SELECT id FROM users WHERE username = 'tech6'), 'TECH006', ARRAY['software', 'service_request']::ticket_category[], 1, 5, 'Hà Nội'),
  ('d0000000-0000-0000-0000-000000000007', (SELECT id FROM users WHERE username = 'tech7'), 'TECH007', ARRAY['service_request', 'access_control']::ticket_category[], 1, 5, 'Hà Nội'),
  ('d0000000-0000-0000-0000-000000000008', (SELECT id FROM users WHERE username = 'tech8'), 'TECH008', ARRAY['network', 'electrical']::ticket_category[], 4, 7, 'Hà Nội')
ON CONFLICT (employee_code) DO UPDATE SET
  specialty = EXCLUDED.specialty,
  experience_years = EXCLUDED.experience_years,
  max_concurrent_tickets = EXCLUDED.max_concurrent_tickets,
  location = EXCLUDED.location;

