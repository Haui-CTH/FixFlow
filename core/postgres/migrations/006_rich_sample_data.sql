-- SPDX-License-Identifier: Apache-2.0
-- DX-FSM Migration: 006 — Rich Realistic Sample Data
-- Bổ sung dữ liệu mẫu thực tế bám sát bối cảnh Đại học Công nghiệp Hà Nội (HaUI)
-- Đầy đủ 7 categories, 7 statuses, comments trao đổi, internal notes, audit history và SLA metrics

-- 1. Đảm bảo các danh mục sự cố mới đã tồn tại
ALTER TYPE ticket_category ADD VALUE IF NOT EXISTS 'access_control';
ALTER TYPE ticket_category ADD VALUE IF NOT EXISTS 'service_request';

-- 2. Tạo hàm tiện ích nạp dữ liệu an toàn
DO $$
DECLARE
  v_cust_id UUID;
  v_cust2_id UUID;
  v_cust3_id UUID;
  v_mgr_id UUID;
  v_tech1_id UUID; v_tech1_uid UUID;
  v_tech2_id UUID; v_tech2_uid UUID;
  v_tech3_id UUID; v_tech3_uid UUID;
  v_tech4_id UUID; v_tech4_uid UUID;
  v_tech5_id UUID; v_tech5_uid UUID;
  v_tech6_id UUID; v_tech6_uid UUID;
  v_tech7_id UUID; v_tech7_uid UUID;
  v_tech8_id UUID; v_tech8_uid UUID;
  v_tkt_id UUID;
BEGIN
  -- Lấy ID người dùng mẫu
  SELECT id INTO v_cust_id FROM users WHERE username = 'customer';
  SELECT id INTO v_cust2_id FROM users WHERE username = 'cust2';
  SELECT id INTO v_cust3_id FROM users WHERE username = 'cust3';
  SELECT id INTO v_mgr_id FROM users WHERE username = 'manager';

  -- Lấy ID KTV mẫu (UUID từ technicians và users)
  SELECT id, user_id INTO v_tech1_id, v_tech1_uid FROM technicians WHERE employee_code = 'TECH001';
  SELECT id, user_id INTO v_tech2_id, v_tech2_uid FROM technicians WHERE employee_code = 'TECH002';
  SELECT id, user_id INTO v_tech3_id, v_tech3_uid FROM technicians WHERE employee_code = 'TECH003';
  SELECT id, user_id INTO v_tech4_id, v_tech4_uid FROM technicians WHERE employee_code = 'TECH004';
  SELECT id, user_id INTO v_tech5_id, v_tech5_uid FROM technicians WHERE employee_code = 'TECH005';
  SELECT id, user_id INTO v_tech6_id, v_tech6_uid FROM technicians WHERE employee_code = 'TECH006';
  SELECT id, user_id INTO v_tech7_id, v_tech7_uid FROM technicians WHERE employee_code = 'TECH007';
  SELECT id, user_id INTO v_tech8_id, v_tech8_uid FROM technicians WHERE employee_code = 'TECH008';

  -- TKT-2026-000101: Máy in HP LaserJet P2035 kẹt giấy liên t
  INSERT INTO tickets (
    ticket_number, title, description, category, priority, status,
    customer_id, customer_name, customer_email, customer_phone, customer_location,
    technician_id, technician_name,
    created_at, assigned_at, started_at, resolved_at, closed_at,
    ai_category, ai_priority, ai_confidence, sla_deadline, sla_met
  ) VALUES (
    'TKT-2026-000101', 'Máy in HP LaserJet P2035 kẹt giấy liên tục', 'Phòng Quản lý Đào tạo báo máy in không kéo được giấy, đèn đỏ nhấp nháy liên tục khi in bảng điểm thi học kỳ.', 'hardware', 'high', 'closed',
    v_cust_id, 'Khách Hàng Demo', 'customer@haui.vn', '0901000001', 'Tòa A - Phòng Đào tạo A.201',
    v_tech1_id, 'Trần Văn Kỹ Thuật',
    NOW() - INTERVAL '6 days', NOW() - INTERVAL '5.9 days', NOW() - INTERVAL '5.8 days', NOW() - INTERVAL '6 days' + INTERVAL '3.5 hours', NOW() - INTERVAL '6 days' + INTERVAL '5.5 hours',
    'hardware', 'high', 94.0, NOW() - INTERVAL '6 days' + INTERVAL '24 hours', TRUE
  ) ON CONFLICT (ticket_number) DO UPDATE SET
    title = EXCLUDED.title, description = EXCLUDED.description, category = EXCLUDED.category,
    priority = EXCLUDED.priority, status = EXCLUDED.status, technician_id = EXCLUDED.technician_id,
    technician_name = EXCLUDED.technician_name, ai_category = EXCLUDED.ai_category,
    ai_priority = EXCLUDED.ai_priority, ai_confidence = EXCLUDED.ai_confidence,
    sla_deadline = EXCLUDED.sla_deadline, sla_met = EXCLUDED.sla_met
  RETURNING id INTO v_tkt_id;

  INSERT INTO ticket_comments (ticket_id, user_id, content, is_internal, created_at)
  VALUES (v_tkt_id, v_cust_id, 'Em đã thử tắt đi bật lại 2 lần và rút giấy kẹt nhưng vẫn báo lỗi đèn đỏ ạ.', FALSE, NOW() - INTERVAL '6 days' + INTERVAL '0.5 hours');
  INSERT INTO ticket_comments (ticket_id, user_id, content, is_internal, created_at)
  VALUES (v_tkt_id, v_tech1_uid, 'Chào bạn, mình đã nhận ticket. Khoảng 15 phút nữa mình mang linh kiện thay thế lên phòng A.201 nhé.', FALSE, NOW() - INTERVAL '6 days' + INTERVAL '1.0 hours');
  INSERT INTO ticket_comments (ticket_id, user_id, content, is_internal, created_at)
  VALUES (v_tkt_id, v_tech1_uid, 'Đã thay thế bao lụa sấy và vệ sinh quả đào kéo giấy. In test 20 trang thành công.', FALSE, NOW() - INTERVAL '6 days' + INTERVAL '3.5 hours');
  INSERT INTO ticket_notes (ticket_id, author_id, author_name, body, created_at)
  VALUES (v_tkt_id, v_tech1_uid, 'Trần Văn Kỹ Thuật', 'Bao lụa cũ bị rách mép do người dùng in giấy có ghim kim loại. Đã lấy cụm sấy dự phòng kho Tầng 1.', NOW() - INTERVAL '6 days' + INTERVAL '3.0 hours');
  INSERT INTO ticket_notes (ticket_id, author_id, author_name, body, created_at)
  VALUES (v_tkt_id, v_mgr_id, 'Nguyễn Văn Quản', 'Đã duyệt xuất kho vật tư cụm sấy P2035.', NOW() - INTERVAL '6 days' + INTERVAL '3.2 hours');
  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)
  VALUES (v_tkt_id, v_cust_id, 'created', NULL, 'Tạo ticket mới: Máy in HP LaserJet P2035 kẹt g', NOW() - INTERVAL '6 days');
  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)
  VALUES (v_tkt_id, v_mgr_id, 'assigned', 'new', 'Phân công cho Trần Văn Kỹ Thuật', NOW() - INTERVAL '5.9 days');
  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)
  VALUES (v_tkt_id, v_tech1_uid, 'status_changed', 'assigned', 'Bắt đầu xử lý (in_progress)', NOW() - INTERVAL '5.8 days');
  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)
  VALUES (v_tkt_id, v_tech1_uid, 'status_changed', 'in_progress', 'Đã xử lý xong (resolved)', NOW() - INTERVAL '6 days' + INTERVAL '3.5 hours');
  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)
  VALUES (v_tkt_id, v_cust_id, 'status_changed', 'resolved', 'Khách hàng nghiệm thu & đóng ticket', NOW() - INTERVAL '6 days' + INTERVAL '5.5 hours');

  -- TKT-2026-000102: Màn hình máy trạm Dell UltraSharp bị sọc
  INSERT INTO tickets (
    ticket_number, title, description, category, priority, status,
    customer_id, customer_name, customer_email, customer_phone, customer_location,
    technician_id, technician_name,
    created_at, assigned_at, started_at, resolved_at, closed_at,
    ai_category, ai_priority, ai_confidence, sla_deadline, sla_met
  ) VALUES (
    'TKT-2026-000102', 'Màn hình máy trạm Dell UltraSharp bị sọc dọc màu xanh', 'Màn hình Dell U2419H tại phòng đồ họa bị 3 vạch sọc màu xanh lá cây ở góc phải, đã đổi cáp DisplayPort khác vẫn bị.', 'hardware', 'medium', 'resolved',
    v_cust2_id, 'Công ty ABC', 'customer@haui.vn', '0901000001', 'Nhà B - Phòng Thiết kế Đồ họa B.403',
    v_tech1_id, 'Trần Văn Kỹ Thuật',
    NOW() - INTERVAL '3 days', NOW() - INTERVAL '2.9 days', NOW() - INTERVAL '2.8 days', NOW() - INTERVAL '3 days' + INTERVAL '5.0 hours', NULL,
    'hardware', 'medium', 89.0, NOW() - INTERVAL '3 days' + INTERVAL '72 hours', TRUE
  ) ON CONFLICT (ticket_number) DO UPDATE SET
    title = EXCLUDED.title, description = EXCLUDED.description, category = EXCLUDED.category,
    priority = EXCLUDED.priority, status = EXCLUDED.status, technician_id = EXCLUDED.technician_id,
    technician_name = EXCLUDED.technician_name, ai_category = EXCLUDED.ai_category,
    ai_priority = EXCLUDED.ai_priority, ai_confidence = EXCLUDED.ai_confidence,
    sla_deadline = EXCLUDED.sla_deadline, sla_met = EXCLUDED.sla_met
  RETURNING id INTO v_tkt_id;

  INSERT INTO ticket_comments (ticket_id, user_id, content, is_internal, created_at)
  VALUES (v_tkt_id, v_cust2_id, 'Nhờ anh kỹ thuật kiểm tra xem có cần bảo hành hãng không giúp bên em.', FALSE, NOW() - INTERVAL '3 days' + INTERVAL '1.0 hours');
  INSERT INTO ticket_comments (ticket_id, user_id, content, is_internal, created_at)
  VALUES (v_tkt_id, v_tech1_uid, 'Đã kiểm tra panel LCD bị lỗi tab đồng, đã lập phiếu gửi trung tâm bảo hành ủy quyền Dell.', FALSE, NOW() - INTERVAL '3 days' + INTERVAL '5.0 hours');
  INSERT INTO ticket_notes (ticket_id, author_id, author_name, body, created_at)
  VALUES (v_tkt_id, v_tech1_uid, 'Trần Văn Kỹ Thuật', 'Màn hình còn bảo hành đến tháng 11/2026. Số Service Tag: 8FD2K1. Đã cấp tạm màn hình dự phòng AOC 24inch cho người dùng.', NOW() - INTERVAL '3 days' + INTERVAL '4.5 hours');
  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)
  VALUES (v_tkt_id, v_cust2_id, 'created', NULL, 'Tạo ticket mới: Màn hình máy trạm Dell UltraSh', NOW() - INTERVAL '3 days');
  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)
  VALUES (v_tkt_id, v_mgr_id, 'assigned', 'new', 'Phân công cho Trần Văn Kỹ Thuật', NOW() - INTERVAL '2.9 days');
  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)
  VALUES (v_tkt_id, v_tech1_uid, 'status_changed', 'assigned', 'Bắt đầu xử lý (in_progress)', NOW() - INTERVAL '2.8 days');
  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)
  VALUES (v_tkt_id, v_tech1_uid, 'status_changed', 'in_progress', 'Đã xử lý xong (resolved)', NOW() - INTERVAL '3 days' + INTERVAL '5.0 hours');

  -- TKT-2026-000103: Bàn phím máy tính phòng thực hành tin họ
  INSERT INTO tickets (
    ticket_number, title, description, category, priority, status,
    customer_id, customer_name, customer_email, customer_phone, customer_location,
    technician_id, technician_name,
    created_at, assigned_at, started_at, resolved_at, closed_at,
    ai_category, ai_priority, ai_confidence, sla_deadline, sla_met
  ) VALUES (
    'TKT-2026-000103', 'Bàn phím máy tính phòng thực hành tin học bị liệt hàng phím số', 'Máy số 14 phòng Lab Tin học C.102 liệt toàn bộ hàng phím từ 1 đến 0, sinh viên không làm được bài thi trắc nghiệm.', 'hardware', 'high', 'in_progress',
    v_cust_id, 'Khách Hàng Demo', 'customer@haui.vn', '0901000001', 'Nhà C - Phòng Lab Tin học C.102',
    v_tech3_id, 'Phạm Minh Hùng',
    NOW() - INTERVAL '1 days', NOW() - INTERVAL '0.9 days', NOW() - INTERVAL '0.8 days', NULL, NULL,
    'hardware', 'high', 92.0, NOW() - INTERVAL '1 days' + INTERVAL '24 hours', NULL
  ) ON CONFLICT (ticket_number) DO UPDATE SET
    title = EXCLUDED.title, description = EXCLUDED.description, category = EXCLUDED.category,
    priority = EXCLUDED.priority, status = EXCLUDED.status, technician_id = EXCLUDED.technician_id,
    technician_name = EXCLUDED.technician_name, ai_category = EXCLUDED.ai_category,
    ai_priority = EXCLUDED.ai_priority, ai_confidence = EXCLUDED.ai_confidence,
    sla_deadline = EXCLUDED.sla_deadline, sla_met = EXCLUDED.sla_met
  RETURNING id INTO v_tkt_id;

  INSERT INTO ticket_comments (ticket_id, user_id, content, is_internal, created_at)
  VALUES (v_tkt_id, v_cust_id, 'Ca thi bắt đầu lúc 13h30 chiều nay, nhờ các anh xử lý gấp giúp em.', FALSE, NOW() - INTERVAL '1 days' + INTERVAL '0.2 hours');
  INSERT INTO ticket_comments (ticket_id, user_id, content, is_internal, created_at)
  VALUES (v_tkt_id, v_tech3_uid, 'Đang mang bàn phím Fuhlen USB mới sang thay thế ngay.', FALSE, NOW() - INTERVAL '1 days' + INTERVAL '0.5 hours');
  INSERT INTO ticket_notes (ticket_id, author_id, author_name, body, created_at)
  VALUES (v_tkt_id, v_tech3_uid, 'Phạm Minh Hùng', 'Bàn phím cũ bị đổ nước ngọt dẫn đến chập mạch than, đã thu hồi về xưởng.', NOW() - INTERVAL '1 days' + INTERVAL '0.6 hours');
  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)
  VALUES (v_tkt_id, v_cust_id, 'created', NULL, 'Tạo ticket mới: Bàn phím máy tính phòng thực h', NOW() - INTERVAL '1 days');
  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)
  VALUES (v_tkt_id, v_mgr_id, 'assigned', 'new', 'Phân công cho Phạm Minh Hùng', NOW() - INTERVAL '0.9 days');
  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)
  VALUES (v_tkt_id, v_tech3_uid, 'status_changed', 'assigned', 'Bắt đầu xử lý (in_progress)', NOW() - INTERVAL '0.8 days');

  -- TKT-2026-000104: Máy trạm HP Z440 không lên nguồn, quạt q
  INSERT INTO tickets (
    ticket_number, title, description, category, priority, status,
    customer_id, customer_name, customer_email, customer_phone, customer_location,
    technician_id, technician_name,
    created_at, assigned_at, started_at, resolved_at, closed_at,
    ai_category, ai_priority, ai_confidence, sla_deadline, sla_met
  ) VALUES (
    'TKT-2026-000104', 'Máy trạm HP Z440 không lên nguồn, quạt quay ngắt quãng', 'Máy tính nghiên cứu mô phỏng tại Phòng Tự động hóa cắm nguồn chỉ nháy đèn nguồn màu đỏ 4 tiếng bip, không khởi động được.', 'hardware', 'critical', 'assigned',
    v_cust3_id, 'Trường XYZ', 'customer@haui.vn', '0901000001', 'Nhà A - Phòng Thí nghiệm Tự động hóa A.105',
    v_tech5_id, 'Hoàng Minh Tuấn',
    NOW() - INTERVAL '0.5 days', NOW() - INTERVAL '0.4 days', NULL, NULL, NULL,
    'hardware', 'critical', 96.0, NOW() - INTERVAL '0.5 days' + INTERVAL '4 hours', NULL
  ) ON CONFLICT (ticket_number) DO UPDATE SET
    title = EXCLUDED.title, description = EXCLUDED.description, category = EXCLUDED.category,
    priority = EXCLUDED.priority, status = EXCLUDED.status, technician_id = EXCLUDED.technician_id,
    technician_name = EXCLUDED.technician_name, ai_category = EXCLUDED.ai_category,
    ai_priority = EXCLUDED.ai_priority, ai_confidence = EXCLUDED.ai_confidence,
    sla_deadline = EXCLUDED.sla_deadline, sla_met = EXCLUDED.sla_met
  RETURNING id INTO v_tkt_id;

  INSERT INTO ticket_comments (ticket_id, user_id, content, is_internal, created_at)
  VALUES (v_tkt_id, v_cust3_id, 'Trong máy có dữ liệu đề tài NCKH cấp bộ đang chạy dở, mong KTV ưu tiên.', FALSE, NOW() - INTERVAL '0.5 days' + INTERVAL '0.1 hours');
  INSERT INTO ticket_notes (ticket_id, author_id, author_name, body, created_at)
  VALUES (v_tkt_id, v_mgr_id, 'Nguyễn Văn Quản', 'Giao kỹ thuật viên Tuấn chuyên phần cứng công nghiệp kiểm tra bộ nguồn PSU 700W.', NOW() - INTERVAL '0.5 days' + INTERVAL '0.2 hours');
  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)
  VALUES (v_tkt_id, v_cust3_id, 'created', NULL, 'Tạo ticket mới: Máy trạm HP Z440 không lên ngu', NOW() - INTERVAL '0.5 days');
  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)
  VALUES (v_tkt_id, v_mgr_id, 'assigned', 'new', 'Phân công cho Hoàng Minh Tuấn', NOW() - INTERVAL '0.4 days');

  -- TKT-2026-000105: Phần mềm kế toán MISA báo lỗi không kết 
  INSERT INTO tickets (
    ticket_number, title, description, category, priority, status,
    customer_id, customer_name, customer_email, customer_phone, customer_location,
    technician_id, technician_name,
    created_at, assigned_at, started_at, resolved_at, closed_at,
    ai_category, ai_priority, ai_confidence, sla_deadline, sla_met
  ) VALUES (
    'TKT-2026-000105', 'Phần mềm kế toán MISA báo lỗi không kết nối được SQL Server', 'Mở phần mềm MISA SME báo ''Không thể kết nối đến máy chủ dữ liệu 192.168.1.200'', toàn bộ kế toán viên không xuất được hóa đơn.', 'software', 'critical', 'closed',
    v_cust2_id, 'Công ty ABC', 'customer@haui.vn', '0901000001', 'Tòa A - Phòng Kế toán A.204',
    v_tech2_id, 'Lê Thị Bảo Trì',
    NOW() - INTERVAL '5 days', NOW() - INTERVAL '4.9 days', NOW() - INTERVAL '4.8 days', NOW() - INTERVAL '5 days' + INTERVAL '1.2 hours', NOW() - INTERVAL '5 days' + INTERVAL '3.2 hours',
    'software', 'critical', 97.0, NOW() - INTERVAL '5 days' + INTERVAL '4 hours', TRUE
  ) ON CONFLICT (ticket_number) DO UPDATE SET
    title = EXCLUDED.title, description = EXCLUDED.description, category = EXCLUDED.category,
    priority = EXCLUDED.priority, status = EXCLUDED.status, technician_id = EXCLUDED.technician_id,
    technician_name = EXCLUDED.technician_name, ai_category = EXCLUDED.ai_category,
    ai_priority = EXCLUDED.ai_priority, ai_confidence = EXCLUDED.ai_confidence,
    sla_deadline = EXCLUDED.sla_deadline, sla_met = EXCLUDED.sla_met
  RETURNING id INTO v_tkt_id;

  INSERT INTO ticket_comments (ticket_id, user_id, content, is_internal, created_at)
  VALUES (v_tkt_id, v_cust2_id, 'Đang đến hạn nộp báo cáo thuế cuối tháng, khẩn cấp ạ!', FALSE, NOW() - INTERVAL '5 days' + INTERVAL '0.1 hours');
  INSERT INTO ticket_comments (ticket_id, user_id, content, is_internal, created_at)
  VALUES (v_tkt_id, v_tech2_uid, 'Dịch vụ SQL Server Browser trên máy chủ bị stopped do lỗi đầy ổ C, đã giải phóng 20GB và restart service.', FALSE, NOW() - INTERVAL '5 days' + INTERVAL '1.2 hours');
  INSERT INTO ticket_comments (ticket_id, user_id, content, is_internal, created_at)
  VALUES (v_tkt_id, v_cust2_id, 'Bên em đã đăng nhập lại bình thường rồi, cảm ơn chị Trì!', FALSE, NOW() - INTERVAL '5 days' + INTERVAL '1.5 hours');
  INSERT INTO ticket_notes (ticket_id, author_id, author_name, body, created_at)
  VALUES (v_tkt_id, v_tech2_uid, 'Lê Thị Bảo Trì', 'Đã cấu hình script dọn dẹp log file tự động hàng tuần để tránh đầy ổ đĩa DB.', NOW() - INTERVAL '5 days' + INTERVAL '1.3 hours');
  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)
  VALUES (v_tkt_id, v_cust2_id, 'created', NULL, 'Tạo ticket mới: Phần mềm kế toán MISA báo lỗi ', NOW() - INTERVAL '5 days');
  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)
  VALUES (v_tkt_id, v_mgr_id, 'assigned', 'new', 'Phân công cho Lê Thị Bảo Trì', NOW() - INTERVAL '4.9 days');
  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)
  VALUES (v_tkt_id, v_tech2_uid, 'status_changed', 'assigned', 'Bắt đầu xử lý (in_progress)', NOW() - INTERVAL '4.8 days');
  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)
  VALUES (v_tkt_id, v_tech2_uid, 'status_changed', 'in_progress', 'Đã xử lý xong (resolved)', NOW() - INTERVAL '5 days' + INTERVAL '1.2 hours');
  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)
  VALUES (v_tkt_id, v_cust2_id, 'status_changed', 'resolved', 'Khách hàng nghiệm thu & đóng ticket', NOW() - INTERVAL '5 days' + INTERVAL '3.2 hours');

  -- TKT-2026-000106: Microsoft Office 365 báo lỗi Product Act
  INSERT INTO tickets (
    ticket_number, title, description, category, priority, status,
    customer_id, customer_name, customer_email, customer_phone, customer_location,
    technician_id, technician_name,
    created_at, assigned_at, started_at, resolved_at, closed_at,
    ai_category, ai_priority, ai_confidence, sla_deadline, sla_met
  ) VALUES (
    'TKT-2026-000106', 'Microsoft Office 365 báo lỗi Product Activation Failed', 'Bộ ứng dụng Word, Excel, PowerPoint báo banner màu đỏ hết hạn giấy phép, không lưu được nội dung soạn thảo.', 'software', 'medium', 'closed',
    v_cust_id, 'Khách Hàng Demo', 'customer@haui.vn', '0901000001', 'Tòa B - Phòng Công tác Sinh viên B.101',
    v_tech2_id, 'Lê Thị Bảo Trì',
    NOW() - INTERVAL '4 days', NOW() - INTERVAL '3.9 days', NOW() - INTERVAL '3.8 days', NOW() - INTERVAL '4 days' + INTERVAL '2.0 hours', NOW() - INTERVAL '4 days' + INTERVAL '4.0 hours',
    'software', 'medium', 91.0, NOW() - INTERVAL '4 days' + INTERVAL '72 hours', TRUE
  ) ON CONFLICT (ticket_number) DO UPDATE SET
    title = EXCLUDED.title, description = EXCLUDED.description, category = EXCLUDED.category,
    priority = EXCLUDED.priority, status = EXCLUDED.status, technician_id = EXCLUDED.technician_id,
    technician_name = EXCLUDED.technician_name, ai_category = EXCLUDED.ai_category,
    ai_priority = EXCLUDED.ai_priority, ai_confidence = EXCLUDED.ai_confidence,
    sla_deadline = EXCLUDED.sla_deadline, sla_met = EXCLUDED.sla_met
  RETURNING id INTO v_tkt_id;

  INSERT INTO ticket_comments (ticket_id, user_id, content, is_internal, created_at)
  VALUES (v_tkt_id, v_tech2_uid, 'Đã cấp lại license A3 của HaUI qua tài khoản email công vụ @haui.vn.', FALSE, NOW() - INTERVAL '4 days' + INTERVAL '2.0 hours');
  INSERT INTO ticket_notes (ticket_id, author_id, author_name, body, created_at)
  VALUES (v_tkt_id, v_tech2_uid, 'Lê Thị Bảo Trì', 'Người dùng đăng nhập nhầm tài khoản cá nhân thay vì tài khoản trường cấp.', NOW() - INTERVAL '4 days' + INTERVAL '1.9 hours');
  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)
  VALUES (v_tkt_id, v_cust_id, 'created', NULL, 'Tạo ticket mới: Microsoft Office 365 báo lỗi P', NOW() - INTERVAL '4 days');
  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)
  VALUES (v_tkt_id, v_mgr_id, 'assigned', 'new', 'Phân công cho Lê Thị Bảo Trì', NOW() - INTERVAL '3.9 days');
  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)
  VALUES (v_tkt_id, v_tech2_uid, 'status_changed', 'assigned', 'Bắt đầu xử lý (in_progress)', NOW() - INTERVAL '3.8 days');
  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)
  VALUES (v_tkt_id, v_tech2_uid, 'status_changed', 'in_progress', 'Đã xử lý xong (resolved)', NOW() - INTERVAL '4 days' + INTERVAL '2.0 hours');
  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)
  VALUES (v_tkt_id, v_cust_id, 'status_changed', 'resolved', 'Khách hàng nghiệm thu & đóng ticket', NOW() - INTERVAL '4 days' + INTERVAL '4.0 hours');

  -- TKT-2026-000107: AutoCAD 2024 tự động văng (crash) khi re
  INSERT INTO tickets (
    ticket_number, title, description, category, priority, status,
    customer_id, customer_name, customer_email, customer_phone, customer_location,
    technician_id, technician_name,
    created_at, assigned_at, started_at, resolved_at, closed_at,
    ai_category, ai_priority, ai_confidence, sla_deadline, sla_met
  ) VALUES (
    'TKT-2026-000107', 'AutoCAD 2024 tự động văng (crash) khi render mô hình 3D', 'Giảng viên bộ môn Cơ điện tử thao tác lệnh Render 3D thì phần mềm tắt đột ngột kèm thông báo ''Fatal Error''.', 'software', 'high', 'resolved',
    v_cust3_id, 'Trường XYZ', 'customer@haui.vn', '0901000001', 'Xưởng Cơ khí - Phòng Thực hành CAD/CAM',
    v_tech4_id, 'Nguyễn Thị Hương',
    NOW() - INTERVAL '2 days', NOW() - INTERVAL '1.9 days', NOW() - INTERVAL '1.8 days', NOW() - INTERVAL '2 days' + INTERVAL '4.0 hours', NULL,
    'software', 'high', 88.0, NOW() - INTERVAL '2 days' + INTERVAL '24 hours', TRUE
  ) ON CONFLICT (ticket_number) DO UPDATE SET
    title = EXCLUDED.title, description = EXCLUDED.description, category = EXCLUDED.category,
    priority = EXCLUDED.priority, status = EXCLUDED.status, technician_id = EXCLUDED.technician_id,
    technician_name = EXCLUDED.technician_name, ai_category = EXCLUDED.ai_category,
    ai_priority = EXCLUDED.ai_priority, ai_confidence = EXCLUDED.ai_confidence,
    sla_deadline = EXCLUDED.sla_deadline, sla_met = EXCLUDED.sla_met
  RETURNING id INTO v_tkt_id;

  INSERT INTO ticket_comments (ticket_id, user_id, content, is_internal, created_at)
  VALUES (v_tkt_id, v_cust3_id, 'Đã thử cài lại nhưng vẫn bị lỗi tương tự.', FALSE, NOW() - INTERVAL '2 days' + INTERVAL '0.5 hours');
  INSERT INTO ticket_comments (ticket_id, user_id, content, is_internal, created_at)
  VALUES (v_tkt_id, v_tech4_uid, 'Lỗi do driver card đồ họa NVIDIA Quadro chưa tương thích DirectX 12, đã update driver bản Studio 551.86.', FALSE, NOW() - INTERVAL '2 days' + INTERVAL '4.0 hours');
  INSERT INTO ticket_notes (ticket_id, author_id, author_name, body, created_at)
  VALUES (v_tkt_id, v_tech4_uid, 'Nguyễn Thị Hương', 'Test render thử file mẫu 500MB chạy mượt không còn văng.', NOW() - INTERVAL '2 days' + INTERVAL '3.8 hours');
  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)
  VALUES (v_tkt_id, v_cust3_id, 'created', NULL, 'Tạo ticket mới: AutoCAD 2024 tự động văng (cra', NOW() - INTERVAL '2 days');
  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)
  VALUES (v_tkt_id, v_mgr_id, 'assigned', 'new', 'Phân công cho Nguyễn Thị Hương', NOW() - INTERVAL '1.9 days');
  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)
  VALUES (v_tkt_id, v_tech4_uid, 'status_changed', 'assigned', 'Bắt đầu xử lý (in_progress)', NOW() - INTERVAL '1.8 days');
  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)
  VALUES (v_tkt_id, v_tech4_uid, 'status_changed', 'in_progress', 'Đã xử lý xong (resolved)', NOW() - INTERVAL '2 days' + INTERVAL '4.0 hours');

  -- TKT-2026-000108: Hệ thống thi trắc nghiệm trực tuyến báo 
  INSERT INTO tickets (
    ticket_number, title, description, category, priority, status,
    customer_id, customer_name, customer_email, customer_phone, customer_location,
    technician_id, technician_name,
    created_at, assigned_at, started_at, resolved_at, closed_at,
    ai_category, ai_priority, ai_confidence, sla_deadline, sla_met
  ) VALUES (
    'TKT-2026-000108', 'Hệ thống thi trắc nghiệm trực tuyến báo lỗi Gateway Timeout 504', 'Khi 80 sinh viên đồng thời truy cập làm bài thi kết thúc học phần thì trang web thi bị trắng và báo 504 Gateway Time-out.', 'software', 'critical', 'in_progress',
    v_cust_id, 'Khách Hàng Demo', 'customer@haui.vn', '0901000001', 'Tòa A - Trung tâm Khảo thí A.305',
    v_tech2_id, 'Lê Thị Bảo Trì',
    NOW() - INTERVAL '0.8 days', NOW() - INTERVAL '0.7000000000000001 days', NOW() - INTERVAL '0.6000000000000001 days', NULL, NULL,
    'software', 'critical', 95.0, NOW() - INTERVAL '0.8 days' + INTERVAL '4 hours', NULL
  ) ON CONFLICT (ticket_number) DO UPDATE SET
    title = EXCLUDED.title, description = EXCLUDED.description, category = EXCLUDED.category,
    priority = EXCLUDED.priority, status = EXCLUDED.status, technician_id = EXCLUDED.technician_id,
    technician_name = EXCLUDED.technician_name, ai_category = EXCLUDED.ai_category,
    ai_priority = EXCLUDED.ai_priority, ai_confidence = EXCLUDED.ai_confidence,
    sla_deadline = EXCLUDED.sla_deadline, sla_met = EXCLUDED.sla_met
  RETURNING id INTO v_tkt_id;

  INSERT INTO ticket_comments (ticket_id, user_id, content, is_internal, created_at)
  VALUES (v_tkt_id, v_cust_id, 'Ca thi đang phải tạm hoãn 20 phút, nhờ ban kỹ thuật hỗ trợ gấp.', FALSE, NOW() - INTERVAL '0.8 days' + INTERVAL '0.1 hours');
  INSERT INTO ticket_comments (ticket_id, user_id, content, is_internal, created_at)
  VALUES (v_tkt_id, v_tech2_uid, 'Đang nâng worker connection trên Nginx và scale thêm 2 instance backend.', FALSE, NOW() - INTERVAL '0.8 days' + INTERVAL '0.3 hours');
  INSERT INTO ticket_notes (ticket_id, author_id, author_name, body, created_at)
  VALUES (v_tkt_id, v_tech2_uid, 'Lê Thị Bảo Trì', 'Tăng max_connections từ 100 lên 500 trên PostgreSQL và cấu hình connection pool pgbouncer.', NOW() - INTERVAL '0.8 days' + INTERVAL '0.4 hours');
  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)
  VALUES (v_tkt_id, v_cust_id, 'created', NULL, 'Tạo ticket mới: Hệ thống thi trắc nghiệm trực ', NOW() - INTERVAL '0.8 days');
  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)
  VALUES (v_tkt_id, v_mgr_id, 'assigned', 'new', 'Phân công cho Lê Thị Bảo Trì', NOW() - INTERVAL '0.7000000000000001 days');
  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)
  VALUES (v_tkt_id, v_tech2_uid, 'status_changed', 'assigned', 'Bắt đầu xử lý (in_progress)', NOW() - INTERVAL '0.6000000000000001 days');

  -- TKT-2026-000109: Mất kết nối WiFi toàn bộ tầng 3 nhà A1 s
  INSERT INTO tickets (
    ticket_number, title, description, category, priority, status,
    customer_id, customer_name, customer_email, customer_phone, customer_location,
    technician_id, technician_name,
    created_at, assigned_at, started_at, resolved_at, closed_at,
    ai_category, ai_priority, ai_confidence, sla_deadline, sla_met
  ) VALUES (
    'TKT-2026-000109', 'Mất kết nối WiFi toàn bộ tầng 3 nhà A1 sau cơn mưa dông', 'Toàn bộ giảng viên và sinh viên tại tầng 3 nhà A1 không bắt được sóng WiFi HaUI_Staff và HaUI_Student, đèn AP trên trần tắt ngấm.', 'network', 'critical', 'closed',
    v_cust_id, 'Khách Hàng Demo', 'customer@haui.vn', '0901000001', 'Tòa A1 - Tầng 3 Hành lang',
    v_tech3_id, 'Phạm Minh Hùng',
    NOW() - INTERVAL '7 days', NOW() - INTERVAL '6.9 days', NOW() - INTERVAL '6.8 days', NOW() - INTERVAL '7 days' + INTERVAL '2.5 hours', NOW() - INTERVAL '7 days' + INTERVAL '4.5 hours',
    'network', 'critical', 98.0, NOW() - INTERVAL '7 days' + INTERVAL '4 hours', TRUE
  ) ON CONFLICT (ticket_number) DO UPDATE SET
    title = EXCLUDED.title, description = EXCLUDED.description, category = EXCLUDED.category,
    priority = EXCLUDED.priority, status = EXCLUDED.status, technician_id = EXCLUDED.technician_id,
    technician_name = EXCLUDED.technician_name, ai_category = EXCLUDED.ai_category,
    ai_priority = EXCLUDED.ai_priority, ai_confidence = EXCLUDED.ai_confidence,
    sla_deadline = EXCLUDED.sla_deadline, sla_met = EXCLUDED.sla_met
  RETURNING id INTO v_tkt_id;

  INSERT INTO ticket_comments (ticket_id, user_id, content, is_internal, created_at)
  VALUES (v_tkt_id, v_cust_id, 'Sét đánh gần khu vực nhà A1 lúc 15h, sau đó là mất mạng toàn bộ tầng 3.', FALSE, NOW() - INTERVAL '7 days' + INTERVAL '0.2 hours');
  INSERT INTO ticket_comments (ticket_id, user_id, content, is_internal, created_at)
  VALUES (v_tkt_id, v_tech3_uid, 'Đã kiểm tra switch PoE cấp nguồn cho 4 Access Point bị nổ cầu chì nguồn, đã thay thế switch dự phòng Cisco SG350.', FALSE, NOW() - INTERVAL '7 days' + INTERVAL '2.5 hours');
  INSERT INTO ticket_notes (ticket_id, author_id, author_name, body, created_at)
  VALUES (v_tkt_id, v_tech3_uid, 'Phạm Minh Hùng', 'Cần bổ sung thiết bị chống sét lan truyền (SPD) cho tủ rack tầng 3.', NOW() - INTERVAL '7 days' + INTERVAL '2.6 hours');
  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)
  VALUES (v_tkt_id, v_cust_id, 'created', NULL, 'Tạo ticket mới: Mất kết nối WiFi toàn bộ tầng ', NOW() - INTERVAL '7 days');
  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)
  VALUES (v_tkt_id, v_mgr_id, 'assigned', 'new', 'Phân công cho Phạm Minh Hùng', NOW() - INTERVAL '6.9 days');
  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)
  VALUES (v_tkt_id, v_tech3_uid, 'status_changed', 'assigned', 'Bắt đầu xử lý (in_progress)', NOW() - INTERVAL '6.8 days');
  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)
  VALUES (v_tkt_id, v_tech3_uid, 'status_changed', 'in_progress', 'Đã xử lý xong (resolved)', NOW() - INTERVAL '7 days' + INTERVAL '2.5 hours');
  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)
  VALUES (v_tkt_id, v_cust_id, 'status_changed', 'resolved', 'Khách hàng nghiệm thu & đóng ticket', NOW() - INTERVAL '7 days' + INTERVAL '4.5 hours');

  -- TKT-2026-000110: Mạng LAN phòng kế toán chập chờn, tỷ lệ 
  INSERT INTO tickets (
    ticket_number, title, description, category, priority, status,
    customer_id, customer_name, customer_email, customer_phone, customer_location,
    technician_id, technician_name,
    created_at, assigned_at, started_at, resolved_at, closed_at,
    ai_category, ai_priority, ai_confidence, sla_deadline, sla_met
  ) VALUES (
    'TKT-2026-000110', 'Mạng LAN phòng kế toán chập chờn, tỷ lệ rớt gói tin ping 35%', 'Các máy kế toán cắm cáp mạng vào mạng LAN nội bộ ping default gateway 192.168.1.1 bị Request timed out liên tục.', 'network', 'high', 'resolved',
    v_cust2_id, 'Công ty ABC', 'customer@haui.vn', '0901000001', 'Tòa A - Phòng Kế toán A.203',
    v_tech8_id, 'Bùi Anh Đức',
    NOW() - INTERVAL '2 days', NOW() - INTERVAL '1.9 days', NOW() - INTERVAL '1.8 days', NOW() - INTERVAL '2 days' + INTERVAL '3.0 hours', NULL,
    'network', 'high', 93.0, NOW() - INTERVAL '2 days' + INTERVAL '24 hours', TRUE
  ) ON CONFLICT (ticket_number) DO UPDATE SET
    title = EXCLUDED.title, description = EXCLUDED.description, category = EXCLUDED.category,
    priority = EXCLUDED.priority, status = EXCLUDED.status, technician_id = EXCLUDED.technician_id,
    technician_name = EXCLUDED.technician_name, ai_category = EXCLUDED.ai_category,
    ai_priority = EXCLUDED.ai_priority, ai_confidence = EXCLUDED.ai_confidence,
    sla_deadline = EXCLUDED.sla_deadline, sla_met = EXCLUDED.sla_met
  RETURNING id INTO v_tkt_id;

  INSERT INTO ticket_comments (ticket_id, user_id, content, is_internal, created_at)
  VALUES (v_tkt_id, v_tech8_uid, 'Phát hiện có hiện tượng loop mạng do một nhân viên tự ý cắm cả 2 đầu dây mạng vào cùng 1 switch phụ. Đã rút dây loop và kích hoạt Spanning Tree Protocol (STP).', FALSE, NOW() - INTERVAL '2 days' + INTERVAL '3.0 hours');
  INSERT INTO ticket_notes (ticket_id, author_id, author_name, body, created_at)
  VALUES (v_tkt_id, v_tech8_uid, 'Bùi Anh Đức', 'Đã bật cấu hình BPDU Guard trên tất cả port access switch tầng 2.', NOW() - INTERVAL '2 days' + INTERVAL '2.8 hours');
  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)
  VALUES (v_tkt_id, v_cust2_id, 'created', NULL, 'Tạo ticket mới: Mạng LAN phòng kế toán chập ch', NOW() - INTERVAL '2 days');
  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)
  VALUES (v_tkt_id, v_mgr_id, 'assigned', 'new', 'Phân công cho Bùi Anh Đức', NOW() - INTERVAL '1.9 days');
  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)
  VALUES (v_tkt_id, v_tech8_uid, 'status_changed', 'assigned', 'Bắt đầu xử lý (in_progress)', NOW() - INTERVAL '1.8 days');
  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)
  VALUES (v_tkt_id, v_tech8_uid, 'status_changed', 'in_progress', 'Đã xử lý xong (resolved)', NOW() - INTERVAL '2 days' + INTERVAL '3.0 hours');

  -- TKT-2026-000111: Không thể kết nối mạng riêng ảo VPN nội 
  INSERT INTO tickets (
    ticket_number, title, description, category, priority, status,
    customer_id, customer_name, customer_email, customer_phone, customer_location,
    technician_id, technician_name,
    created_at, assigned_at, started_at, resolved_at, closed_at,
    ai_category, ai_priority, ai_confidence, sla_deadline, sla_met
  ) VALUES (
    'TKT-2026-000111', 'Không thể kết nối mạng riêng ảo VPN nội bộ từ ngoài trường', 'Giảng viên đi công tác nước ngoài kết nối Cisco AnyConnect VPN báo ''Login failed: Certificate expired''.', 'network', 'medium', 'new',
    v_cust3_id, 'Trường XYZ', 'customer@haui.vn', '0901000001', 'Văn phòng Hợp tác Quốc tế',
    NULL, NULL,
    NOW() - INTERVAL '0.3 days', NULL, NULL, NULL, NULL,
    'network', 'medium', 89.0, NOW() - INTERVAL '0.3 days' + INTERVAL '72 hours', NULL
  ) ON CONFLICT (ticket_number) DO UPDATE SET
    title = EXCLUDED.title, description = EXCLUDED.description, category = EXCLUDED.category,
    priority = EXCLUDED.priority, status = EXCLUDED.status, technician_id = EXCLUDED.technician_id,
    technician_name = EXCLUDED.technician_name, ai_category = EXCLUDED.ai_category,
    ai_priority = EXCLUDED.ai_priority, ai_confidence = EXCLUDED.ai_confidence,
    sla_deadline = EXCLUDED.sla_deadline, sla_met = EXCLUDED.sla_met
  RETURNING id INTO v_tkt_id;

  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)
  VALUES (v_tkt_id, v_cust3_id, 'created', NULL, 'Tạo ticket mới: Không thể kết nối mạng riêng ả', NOW() - INTERVAL '0.3 days');

  -- TKT-2026-000112: Ổ cắm điện tủ rack phòng máy chủ có mùi 
  INSERT INTO tickets (
    ticket_number, title, description, category, priority, status,
    customer_id, customer_name, customer_email, customer_phone, customer_location,
    technician_id, technician_name,
    created_at, assigned_at, started_at, resolved_at, closed_at,
    ai_category, ai_priority, ai_confidence, sla_deadline, sla_met
  ) VALUES (
    'TKT-2026-000112', 'Ổ cắm điện tủ rack phòng máy chủ có mùi khét và tia lửa', 'Tủ rack số 2 phòng Server trung tâm phát ra mùi khét từ ổ cắm PDU 16A, tải điện đang tăng cao, tiềm ẩn nguy cơ chập cháy.', 'electrical', 'critical', 'closed',
    v_cust_id, 'Khách Hàng Demo', 'customer@haui.vn', '0901000001', 'Nhà C - Phòng Datacenter Tầng 2',
    v_tech1_id, 'Trần Văn Kỹ Thuật',
    NOW() - INTERVAL '8 days', NOW() - INTERVAL '7.9 days', NOW() - INTERVAL '7.8 days', NOW() - INTERVAL '8 days' + INTERVAL '1.0 hours', NOW() - INTERVAL '8 days' + INTERVAL '3.0 hours',
    'electrical', 'critical', 99.0, NOW() - INTERVAL '8 days' + INTERVAL '4 hours', TRUE
  ) ON CONFLICT (ticket_number) DO UPDATE SET
    title = EXCLUDED.title, description = EXCLUDED.description, category = EXCLUDED.category,
    priority = EXCLUDED.priority, status = EXCLUDED.status, technician_id = EXCLUDED.technician_id,
    technician_name = EXCLUDED.technician_name, ai_category = EXCLUDED.ai_category,
    ai_priority = EXCLUDED.ai_priority, ai_confidence = EXCLUDED.ai_confidence,
    sla_deadline = EXCLUDED.sla_deadline, sla_met = EXCLUDED.sla_met
  RETURNING id INTO v_tkt_id;

  INSERT INTO ticket_comments (ticket_id, user_id, content, is_internal, created_at)
  VALUES (v_tkt_id, v_cust_id, 'Báo động khẩn cấp! Đã ngắt tạm 1 đường nguồn UPS nhánh B.', FALSE, NOW() - INTERVAL '8 days' + INTERVAL '0.1 hours');
  INSERT INTO ticket_comments (ticket_id, user_id, content, is_internal, created_at)
  VALUES (v_tkt_id, v_tech1_uid, 'Đã có mặt sau 10 phút, thay thế PDU chuyên dụng APC 32A và siết chặt các đầu cosse tiếp xúc.', FALSE, NOW() - INTERVAL '8 days' + INTERVAL '1.0 hours');
  INSERT INTO ticket_notes (ticket_id, author_id, author_name, body, created_at)
  VALUES (v_tkt_id, v_tech1_uid, 'Trần Văn Kỹ Thuật', 'Đầu cắm PDU cũ bị move chân cắm do siết ốc không đủ lực mô-men. Đã đo lại nhiệt độ bằng súng hồng ngoại: 34 độ C (an toàn).', NOW() - INTERVAL '8 days' + INTERVAL '1.1 hours');
  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)
  VALUES (v_tkt_id, v_cust_id, 'created', NULL, 'Tạo ticket mới: Ổ cắm điện tủ rack phòng máy c', NOW() - INTERVAL '8 days');
  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)
  VALUES (v_tkt_id, v_mgr_id, 'assigned', 'new', 'Phân công cho Trần Văn Kỹ Thuật', NOW() - INTERVAL '7.9 days');
  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)
  VALUES (v_tkt_id, v_tech1_uid, 'status_changed', 'assigned', 'Bắt đầu xử lý (in_progress)', NOW() - INTERVAL '7.8 days');
  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)
  VALUES (v_tkt_id, v_tech1_uid, 'status_changed', 'in_progress', 'Đã xử lý xong (resolved)', NOW() - INTERVAL '8 days' + INTERVAL '1.0 hours');
  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)
  VALUES (v_tkt_id, v_cust_id, 'status_changed', 'resolved', 'Khách hàng nghiệm thu & đóng ticket', NOW() - INTERVAL '8 days' + INTERVAL '3.0 hours');

  -- TKT-2026-000113: Aptomat tổng xưởng thực hành cơ khí CNC 
  INSERT INTO tickets (
    ticket_number, title, description, category, priority, status,
    customer_id, customer_name, customer_email, customer_phone, customer_location,
    technician_id, technician_name,
    created_at, assigned_at, started_at, resolved_at, closed_at,
    ai_category, ai_priority, ai_confidence, sla_deadline, sla_met
  ) VALUES (
    'TKT-2026-000113', 'Aptomat tổng xưởng thực hành cơ khí CNC nhảy liên tục', 'Khi đồng loạt bật 3 máy tiện CNC Fanuc và máy phay thì aptomat 100A tổng của xưởng cơ khí bị sập nguồn.', 'electrical', 'high', 'in_progress',
    v_cust3_id, 'Trường XYZ', 'customer@haui.vn', '0901000001', 'Xưởng Cơ khí - Khu CNC',
    v_tech5_id, 'Hoàng Minh Tuấn',
    NOW() - INTERVAL '1 days', NOW() - INTERVAL '0.9 days', NOW() - INTERVAL '0.8 days', NULL, NULL,
    'electrical', 'high', 94.0, NOW() - INTERVAL '1 days' + INTERVAL '24 hours', NULL
  ) ON CONFLICT (ticket_number) DO UPDATE SET
    title = EXCLUDED.title, description = EXCLUDED.description, category = EXCLUDED.category,
    priority = EXCLUDED.priority, status = EXCLUDED.status, technician_id = EXCLUDED.technician_id,
    technician_name = EXCLUDED.technician_name, ai_category = EXCLUDED.ai_category,
    ai_priority = EXCLUDED.ai_priority, ai_confidence = EXCLUDED.ai_confidence,
    sla_deadline = EXCLUDED.sla_deadline, sla_met = EXCLUDED.sla_met
  RETURNING id INTO v_tkt_id;

  INSERT INTO ticket_comments (ticket_id, user_id, content, is_internal, created_at)
  VALUES (v_tkt_id, v_tech5_uid, 'Đang đo dòng khởi động (inrush current) từng máy, phát hiện tụ bù của máy CNC số 2 bị nổ gây lệch pha.', FALSE, NOW() - INTERVAL '1 days' + INTERVAL '2.0 hours');
  INSERT INTO ticket_notes (ticket_id, author_id, author_name, body, created_at)
  VALUES (v_tkt_id, v_tech5_uid, 'Hoàng Minh Tuấn', 'Cần thay thế bộ tụ bù hạ thế 15kVAr tại tủ điện phân phối xưởng.', NOW() - INTERVAL '1 days' + INTERVAL '2.2 hours');
  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)
  VALUES (v_tkt_id, v_cust3_id, 'created', NULL, 'Tạo ticket mới: Aptomat tổng xưởng thực hành c', NOW() - INTERVAL '1 days');
  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)
  VALUES (v_tkt_id, v_mgr_id, 'assigned', 'new', 'Phân công cho Hoàng Minh Tuấn', NOW() - INTERVAL '0.9 days');
  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)
  VALUES (v_tkt_id, v_tech5_uid, 'status_changed', 'assigned', 'Bắt đầu xử lý (in_progress)', NOW() - INTERVAL '0.8 days');

  -- TKT-2026-000114: Đèn tuýp LED phòng học A.302 nhấp nháy p
  INSERT INTO tickets (
    ticket_number, title, description, category, priority, status,
    customer_id, customer_name, customer_email, customer_phone, customer_location,
    technician_id, technician_name,
    created_at, assigned_at, started_at, resolved_at, closed_at,
    ai_category, ai_priority, ai_confidence, sla_deadline, sla_met
  ) VALUES (
    'TKT-2026-000114', 'Đèn tuýp LED phòng học A.302 nhấp nháy phát tiếng kêu vo vo', '4 bóng đèn LED ở dãy bàn cuối phòng A.302 nhấp nháy liên tục gây ảnh hưởng sinh viên học tập môn hình họa.', 'electrical', 'low', 'new',
    v_cust_id, 'Khách Hàng Demo', 'customer@haui.vn', '0901000001', 'Tòa A - Phòng học A.302',
    NULL, NULL,
    NOW() - INTERVAL '0.4 days', NULL, NULL, NULL, NULL,
    'electrical', 'low', 87.0, NOW() - INTERVAL '0.4 days' + INTERVAL '168 hours', NULL
  ) ON CONFLICT (ticket_number) DO UPDATE SET
    title = EXCLUDED.title, description = EXCLUDED.description, category = EXCLUDED.category,
    priority = EXCLUDED.priority, status = EXCLUDED.status, technician_id = EXCLUDED.technician_id,
    technician_name = EXCLUDED.technician_name, ai_category = EXCLUDED.ai_category,
    ai_priority = EXCLUDED.ai_priority, ai_confidence = EXCLUDED.ai_confidence,
    sla_deadline = EXCLUDED.sla_deadline, sla_met = EXCLUDED.sla_met
  RETURNING id INTO v_tkt_id;

  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)
  VALUES (v_tkt_id, v_cust_id, 'created', NULL, 'Tạo ticket mới: Đèn tuýp LED phòng học A.302 n', NOW() - INTERVAL '0.4 days');

  -- TKT-2026-000115: Đầu đọc thẻ từ cửa phòng Server báo đèn 
  INSERT INTO tickets (
    ticket_number, title, description, category, priority, status,
    customer_id, customer_name, customer_email, customer_phone, customer_location,
    technician_id, technician_name,
    created_at, assigned_at, started_at, resolved_at, closed_at,
    ai_category, ai_priority, ai_confidence, sla_deadline, sla_met
  ) VALUES (
    'TKT-2026-000115', 'Đầu đọc thẻ từ cửa phòng Server báo đèn đỏ không mở được', 'Quẹt thẻ từ RFID vào đầu đọc Soyal cửa phòng máy chủ báo bíp 3 tiếng đèn đỏ, khóa nam châm điện từ không nhả chốt.', 'access_control', 'critical', 'closed',
    v_cust_id, 'Khách Hàng Demo', 'customer@haui.vn', '0901000001', 'Nhà C - Phòng Server Trung tâm C.201',
    v_tech4_id, 'Nguyễn Thị Hương',
    NOW() - INTERVAL '5 days', NOW() - INTERVAL '4.9 days', NOW() - INTERVAL '4.8 days', NOW() - INTERVAL '5 days' + INTERVAL '1.5 hours', NOW() - INTERVAL '5 days' + INTERVAL '3.5 hours',
    'access_control', 'critical', 96.0, NOW() - INTERVAL '5 days' + INTERVAL '4 hours', TRUE
  ) ON CONFLICT (ticket_number) DO UPDATE SET
    title = EXCLUDED.title, description = EXCLUDED.description, category = EXCLUDED.category,
    priority = EXCLUDED.priority, status = EXCLUDED.status, technician_id = EXCLUDED.technician_id,
    technician_name = EXCLUDED.technician_name, ai_category = EXCLUDED.ai_category,
    ai_priority = EXCLUDED.ai_priority, ai_confidence = EXCLUDED.ai_confidence,
    sla_deadline = EXCLUDED.sla_deadline, sla_met = EXCLUDED.sla_met
  RETURNING id INTO v_tkt_id;

  INSERT INTO ticket_comments (ticket_id, user_id, content, is_internal, created_at)
  VALUES (v_tkt_id, v_cust_id, 'Cán bộ quản trị cần vào phòng server thay băng từ backup lúc 8h sáng.', FALSE, NOW() - INTERVAL '5 days' + INTERVAL '0.2 hours');
  INSERT INTO ticket_comments (ticket_id, user_id, content, is_internal, created_at)
  VALUES (v_tkt_id, v_tech4_uid, 'Bộ cấp nguồn phụ 12V-5A của khóa từ bị đứt cầu chì bảo vệ, đã thay cầu chì và test mở khóa thành công.', FALSE, NOW() - INTERVAL '5 days' + INTERVAL '1.5 hours');
  INSERT INTO ticket_notes (ticket_id, author_id, author_name, body, created_at)
  VALUES (v_tkt_id, v_tech4_uid, 'Nguyễn Thị Hương', 'Đã kiểm tra nhật ký quẹt thẻ trên phần mềm 701Server, các thẻ admin đều hoạt động bình thường.', NOW() - INTERVAL '5 days' + INTERVAL '1.4 hours');
  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)
  VALUES (v_tkt_id, v_cust_id, 'created', NULL, 'Tạo ticket mới: Đầu đọc thẻ từ cửa phòng Serve', NOW() - INTERVAL '5 days');
  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)
  VALUES (v_tkt_id, v_mgr_id, 'assigned', 'new', 'Phân công cho Nguyễn Thị Hương', NOW() - INTERVAL '4.9 days');
  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)
  VALUES (v_tkt_id, v_tech4_uid, 'status_changed', 'assigned', 'Bắt đầu xử lý (in_progress)', NOW() - INTERVAL '4.8 days');
  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)
  VALUES (v_tkt_id, v_tech4_uid, 'status_changed', 'in_progress', 'Đã xử lý xong (resolved)', NOW() - INTERVAL '5 days' + INTERVAL '1.5 hours');
  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)
  VALUES (v_tkt_id, v_cust_id, 'status_changed', 'resolved', 'Khách hàng nghiệm thu & đóng ticket', NOW() - INTERVAL '5 days' + INTERVAL '3.5 hours');

  -- TKT-2026-000116: Máy chấm công vân tay cửa bảo vệ cổng số
  INSERT INTO tickets (
    ticket_number, title, description, category, priority, status,
    customer_id, customer_name, customer_email, customer_phone, customer_location,
    technician_id, technician_name,
    created_at, assigned_at, started_at, resolved_at, closed_at,
    ai_category, ai_priority, ai_confidence, sla_deadline, sla_met
  ) VALUES (
    'TKT-2026-000116', 'Máy chấm công vân tay cửa bảo vệ cổng số 1 mất dữ liệu ca sáng', 'Hơn 50 cán bộ công nhân viên chấm công vân tay sáng nay nhưng trên phần mềm chấm công Wise Eye không thấy dữ liệu đồng bộ.', 'access_control', 'high', 'resolved',
    v_cust2_id, 'Công ty ABC', 'customer@haui.vn', '0901000001', 'Phòng Bảo vệ - Cổng số 1 Đường 32',
    v_tech7_id, 'Vũ Thị Lan',
    NOW() - INTERVAL '2 days', NOW() - INTERVAL '1.9 days', NOW() - INTERVAL '1.8 days', NOW() - INTERVAL '2 days' + INTERVAL '2.5 hours', NULL,
    'access_control', 'high', 93.0, NOW() - INTERVAL '2 days' + INTERVAL '24 hours', TRUE
  ) ON CONFLICT (ticket_number) DO UPDATE SET
    title = EXCLUDED.title, description = EXCLUDED.description, category = EXCLUDED.category,
    priority = EXCLUDED.priority, status = EXCLUDED.status, technician_id = EXCLUDED.technician_id,
    technician_name = EXCLUDED.technician_name, ai_category = EXCLUDED.ai_category,
    ai_priority = EXCLUDED.ai_priority, ai_confidence = EXCLUDED.ai_confidence,
    sla_deadline = EXCLUDED.sla_deadline, sla_met = EXCLUDED.sla_met
  RETURNING id INTO v_tkt_id;

  INSERT INTO ticket_comments (ticket_id, user_id, content, is_internal, created_at)
  VALUES (v_tkt_id, v_tech7_uid, 'Địa chỉ IP máy chấm công bị đổi do router cấp phát DHCP nhầm, đã gán IP tĩnh 192.168.1.250 và tải lại toàn bộ log ca sáng về CSDL.', FALSE, NOW() - INTERVAL '2 days' + INTERVAL '2.5 hours');
  INSERT INTO ticket_notes (ticket_id, author_id, author_name, body, created_at)
  VALUES (v_tkt_id, v_tech7_uid, 'Vũ Thị Lan', 'Khóa dải IP tĩnh trên DHCP server để tránh xung đột IP trong tương lai.', NOW() - INTERVAL '2 days' + INTERVAL '2.4 hours');
  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)
  VALUES (v_tkt_id, v_cust2_id, 'created', NULL, 'Tạo ticket mới: Máy chấm công vân tay cửa bảo ', NOW() - INTERVAL '2 days');
  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)
  VALUES (v_tkt_id, v_mgr_id, 'assigned', 'new', 'Phân công cho Vũ Thị Lan', NOW() - INTERVAL '1.9 days');
  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)
  VALUES (v_tkt_id, v_tech7_uid, 'status_changed', 'assigned', 'Bắt đầu xử lý (in_progress)', NOW() - INTERVAL '1.8 days');
  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)
  VALUES (v_tkt_id, v_tech7_uid, 'status_changed', 'in_progress', 'Đã xử lý xong (resolved)', NOW() - INTERVAL '2 days' + INTERVAL '2.5 hours');

  -- TKT-2026-000117: Camera giám sát hành lang tầng 5 nhà B b
  INSERT INTO tickets (
    ticket_number, title, description, category, priority, status,
    customer_id, customer_name, customer_email, customer_phone, customer_location,
    technician_id, technician_name,
    created_at, assigned_at, started_at, resolved_at, closed_at,
    ai_category, ai_priority, ai_confidence, sla_deadline, sla_met
  ) VALUES (
    'TKT-2026-000117', 'Camera giám sát hành lang tầng 5 nhà B bị mất tín hiệu video', 'Đầu ghi hình NVR báo kênh 08 camera IP Hikvision tầng 5 hiển thị màn hình đen chữ ''No Video''.', 'access_control', 'medium', 'assigned',
    v_cust_id, 'Khách Hàng Demo', 'customer@haui.vn', '0901000001', 'Tòa B - Tầng 5 Hành lang phía Tây',
    v_tech4_id, 'Nguyễn Thị Hương',
    NOW() - INTERVAL '0.6 days', NOW() - INTERVAL '0.5 days', NULL, NULL, NULL,
    'access_control', 'medium', 91.0, NOW() - INTERVAL '0.6 days' + INTERVAL '72 hours', NULL
  ) ON CONFLICT (ticket_number) DO UPDATE SET
    title = EXCLUDED.title, description = EXCLUDED.description, category = EXCLUDED.category,
    priority = EXCLUDED.priority, status = EXCLUDED.status, technician_id = EXCLUDED.technician_id,
    technician_name = EXCLUDED.technician_name, ai_category = EXCLUDED.ai_category,
    ai_priority = EXCLUDED.ai_priority, ai_confidence = EXCLUDED.ai_confidence,
    sla_deadline = EXCLUDED.sla_deadline, sla_met = EXCLUDED.sla_met
  RETURNING id INTO v_tkt_id;

  INSERT INTO ticket_comments (ticket_id, user_id, content, is_internal, created_at)
  VALUES (v_tkt_id, v_cust_id, 'Cần kiểm tra camera sớm vì có lớp thi tốt nghiệp tại tầng này vào ngày mai.', FALSE, NOW() - INTERVAL '0.6 days' + INTERVAL '0.2 hours');
  INSERT INTO ticket_notes (ticket_id, author_id, author_name, body, created_at)
  VALUES (v_tkt_id, v_mgr_id, 'Nguyễn Văn Quản', 'Phân công KTV Hương mang kìm bấm mạng và switch PoE dự phòng kiểm tra cáp mạng camera.', NOW() - INTERVAL '0.6 days' + INTERVAL '0.3 hours');
  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)
  VALUES (v_tkt_id, v_cust_id, 'created', NULL, 'Tạo ticket mới: Camera giám sát hành lang tầng', NOW() - INTERVAL '0.6 days');
  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)
  VALUES (v_tkt_id, v_mgr_id, 'assigned', 'new', 'Phân công cho Nguyễn Thị Hương', NOW() - INTERVAL '0.5 days');

  -- TKT-2026-000118: Yêu cầu cấp phát laptop ThinkPad và setu
  INSERT INTO tickets (
    ticket_number, title, description, category, priority, status,
    customer_id, customer_name, customer_email, customer_phone, customer_location,
    technician_id, technician_name,
    created_at, assigned_at, started_at, resolved_at, closed_at,
    ai_category, ai_priority, ai_confidence, sla_deadline, sla_met
  ) VALUES (
    'TKT-2026-000118', 'Yêu cầu cấp phát laptop ThinkPad và setup môi trường cho kỹ sư mới', 'Phòng R&D tiếp nhận 01 kỹ sư trí tuệ nhân tạo mới vào ngày thứ Hai tuần tới. Đề nghị cấp phát laptop cấu hình Core i7, 32GB RAM, cài đặt Ubuntu 22.04 và Docker.', 'service_request', 'medium', 'closed',
    v_cust2_id, 'Công ty ABC', 'customer@haui.vn', '0901000001', 'Phòng Nghiên cứu & Phát triển R&D',
    v_tech6_id, 'Đỗ Quang Vinh',
    NOW() - INTERVAL '9 days', NOW() - INTERVAL '8.9 days', NOW() - INTERVAL '8.8 days', NOW() - INTERVAL '9 days' + INTERVAL '6.0 hours', NOW() - INTERVAL '9 days' + INTERVAL '8.0 hours',
    'service_request', 'medium', 95.0, NOW() - INTERVAL '9 days' + INTERVAL '72 hours', TRUE
  ) ON CONFLICT (ticket_number) DO UPDATE SET
    title = EXCLUDED.title, description = EXCLUDED.description, category = EXCLUDED.category,
    priority = EXCLUDED.priority, status = EXCLUDED.status, technician_id = EXCLUDED.technician_id,
    technician_name = EXCLUDED.technician_name, ai_category = EXCLUDED.ai_category,
    ai_priority = EXCLUDED.ai_priority, ai_confidence = EXCLUDED.ai_confidence,
    sla_deadline = EXCLUDED.sla_deadline, sla_met = EXCLUDED.sla_met
  RETURNING id INTO v_tkt_id;

  INSERT INTO ticket_comments (ticket_id, user_id, content, is_internal, created_at)
  VALUES (v_tkt_id, v_cust2_id, 'Đính kèm quyết định tiếp nhận nhân sự mới từ phòng Hành chính Nhân sự.', FALSE, NOW() - INTERVAL '9 days' + INTERVAL '0.5 hours');
  INSERT INTO ticket_comments (ticket_id, user_id, content, is_internal, created_at)
  VALUES (v_tkt_id, v_tech6_uid, 'Đã chuẩn bị xong máy ThinkPad P14s Gen 4, cài sẵn Docker, Python 3.11, VS Code và bàn giao có biên bản.', FALSE, NOW() - INTERVAL '9 days' + INTERVAL '6.0 hours');
  INSERT INTO ticket_notes (ticket_id, author_id, author_name, body, created_at)
  VALUES (v_tkt_id, v_tech6_uid, 'Đỗ Quang Vinh', 'Biên bản bàn giao số BB-BG-2026-042 lưu tại hồ sơ tài sản IT.', NOW() - INTERVAL '9 days' + INTERVAL '5.8 hours');
  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)
  VALUES (v_tkt_id, v_cust2_id, 'created', NULL, 'Tạo ticket mới: Yêu cầu cấp phát laptop ThinkP', NOW() - INTERVAL '9 days');
  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)
  VALUES (v_tkt_id, v_mgr_id, 'assigned', 'new', 'Phân công cho Đỗ Quang Vinh', NOW() - INTERVAL '8.9 days');
  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)
  VALUES (v_tkt_id, v_tech6_uid, 'status_changed', 'assigned', 'Bắt đầu xử lý (in_progress)', NOW() - INTERVAL '8.8 days');
  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)
  VALUES (v_tkt_id, v_tech6_uid, 'status_changed', 'in_progress', 'Đã xử lý xong (resolved)', NOW() - INTERVAL '9 days' + INTERVAL '6.0 hours');
  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)
  VALUES (v_tkt_id, v_cust2_id, 'status_changed', 'resolved', 'Khách hàng nghiệm thu & đóng ticket', NOW() - INTERVAL '9 days' + INTERVAL '8.0 hours');

  -- TKT-2026-000119: Đề nghị nâng cấp RAM 32GB và ổ cứng SSD 
  INSERT INTO tickets (
    ticket_number, title, description, category, priority, status,
    customer_id, customer_name, customer_email, customer_phone, customer_location,
    technician_id, technician_name,
    created_at, assigned_at, started_at, resolved_at, closed_at,
    ai_category, ai_priority, ai_confidence, sla_deadline, sla_met
  ) VALUES (
    'TKT-2026-000119', 'Đề nghị nâng cấp RAM 32GB và ổ cứng SSD NVMe cho máy trạm AI Lab', 'Máy trạm xử lý thị giác máy tính tại phòng Lab thường xuyên báo lỗi ''Out of Memory'' khi huấn luyện mô hình YOLOv8, xin phê duyệt nâng cấp.', 'service_request', 'high', 'resolved',
    v_cust3_id, 'Trường XYZ', 'customer@haui.vn', '0901000001', 'Tòa A - Phòng Thí nghiệm AI A.402',
    v_tech6_id, 'Đỗ Quang Vinh',
    NOW() - INTERVAL '3 days', NOW() - INTERVAL '2.9 days', NOW() - INTERVAL '2.8 days', NOW() - INTERVAL '3 days' + INTERVAL '4.5 hours', NULL,
    'service_request', 'high', 92.0, NOW() - INTERVAL '3 days' + INTERVAL '24 hours', TRUE
  ) ON CONFLICT (ticket_number) DO UPDATE SET
    title = EXCLUDED.title, description = EXCLUDED.description, category = EXCLUDED.category,
    priority = EXCLUDED.priority, status = EXCLUDED.status, technician_id = EXCLUDED.technician_id,
    technician_name = EXCLUDED.technician_name, ai_category = EXCLUDED.ai_category,
    ai_priority = EXCLUDED.ai_priority, ai_confidence = EXCLUDED.ai_confidence,
    sla_deadline = EXCLUDED.sla_deadline, sla_met = EXCLUDED.sla_met
  RETURNING id INTO v_tkt_id;

  INSERT INTO ticket_comments (ticket_id, user_id, content, is_internal, created_at)
  VALUES (v_tkt_id, v_tech6_uid, 'Đã lắp đặt thêm 2 thanh RAM Kingston 16GB DDR4-3200 và 1 ổ Samsung 980 Pro 1TB NVMe, benchmark đạt 6500MB/s.', FALSE, NOW() - INTERVAL '3 days' + INTERVAL '4.5 hours');
  INSERT INTO ticket_notes (ticket_id, author_id, author_name, body, created_at)
  VALUES (v_tkt_id, v_tech6_uid, 'Đỗ Quang Vinh', 'Đã chuyển swap partition sang SSD mới, huấn luyện thử epoch đầu mượt mà.', NOW() - INTERVAL '3 days' + INTERVAL '4.3 hours');
  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)
  VALUES (v_tkt_id, v_cust3_id, 'created', NULL, 'Tạo ticket mới: Đề nghị nâng cấp RAM 32GB và ổ', NOW() - INTERVAL '3 days');
  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)
  VALUES (v_tkt_id, v_mgr_id, 'assigned', 'new', 'Phân công cho Đỗ Quang Vinh', NOW() - INTERVAL '2.9 days');
  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)
  VALUES (v_tkt_id, v_tech6_uid, 'status_changed', 'assigned', 'Bắt đầu xử lý (in_progress)', NOW() - INTERVAL '2.8 days');
  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)
  VALUES (v_tkt_id, v_tech6_uid, 'status_changed', 'in_progress', 'Đã xử lý xong (resolved)', NOW() - INTERVAL '3 days' + INTERVAL '4.5 hours');

  -- TKT-2026-000120: Đăng ký mượn máy chiếu và micro không dâ
  INSERT INTO tickets (
    ticket_number, title, description, category, priority, status,
    customer_id, customer_name, customer_email, customer_phone, customer_location,
    technician_id, technician_name,
    created_at, assigned_at, started_at, resolved_at, closed_at,
    ai_category, ai_priority, ai_confidence, sla_deadline, sla_met
  ) VALUES (
    'TKT-2026-000120', 'Đăng ký mượn máy chiếu và micro không dây cho lễ bảo vệ khóa luận', 'Bộ môn Công nghệ phần mềm xin mượn 01 máy chiếu Panasonic độ sáng 4000 Ansi và 02 micro không dây Shure phục vụ lễ bảo vệ khóa luận ngày mai.', 'service_request', 'low', 'new',
    v_cust_id, 'Khách Hàng Demo', 'customer@haui.vn', '0901000001', 'Hội trường Lớn Tòa nhà A',
    NULL, NULL,
    NOW() - INTERVAL '0.2 days', NULL, NULL, NULL, NULL,
    'service_request', 'low', 86.0, NOW() - INTERVAL '0.2 days' + INTERVAL '168 hours', NULL
  ) ON CONFLICT (ticket_number) DO UPDATE SET
    title = EXCLUDED.title, description = EXCLUDED.description, category = EXCLUDED.category,
    priority = EXCLUDED.priority, status = EXCLUDED.status, technician_id = EXCLUDED.technician_id,
    technician_name = EXCLUDED.technician_name, ai_category = EXCLUDED.ai_category,
    ai_priority = EXCLUDED.ai_priority, ai_confidence = EXCLUDED.ai_confidence,
    sla_deadline = EXCLUDED.sla_deadline, sla_met = EXCLUDED.sla_met
  RETURNING id INTO v_tkt_id;

  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)
  VALUES (v_tkt_id, v_cust_id, 'created', NULL, 'Tạo ticket mới: Đăng ký mượn máy chiếu và micr', NOW() - INTERVAL '0.2 days');

  -- TKT-2026-000121: Kiểm kê định kỳ trang thiết bị CNTT quý 
  INSERT INTO tickets (
    ticket_number, title, description, category, priority, status,
    customer_id, customer_name, customer_email, customer_phone, customer_location,
    technician_id, technician_name,
    created_at, assigned_at, started_at, resolved_at, closed_at,
    ai_category, ai_priority, ai_confidence, sla_deadline, sla_met
  ) VALUES (
    'TKT-2026-000121', 'Kiểm kê định kỳ trang thiết bị CNTT quý 1/2026', 'Thực hiện rà soát, dán tem mã QR tài sản cho toàn bộ máy tính, máy in, switch mạng tại khu vực nhà C theo kế hoạch kiểm kê tài sản nhà trường.', 'other', 'low', 'in_progress',
    v_cust_id, 'Khách Hàng Demo', 'customer@haui.vn', '0901000001', 'Nhà C - Toàn bộ các phòng làm việc',
    v_tech7_id, 'Vũ Thị Lan',
    NOW() - INTERVAL '2 days', NOW() - INTERVAL '1.9 days', NOW() - INTERVAL '1.8 days', NULL, NULL,
    'other', 'low', 84.0, NOW() - INTERVAL '2 days' + INTERVAL '168 hours', NULL
  ) ON CONFLICT (ticket_number) DO UPDATE SET
    title = EXCLUDED.title, description = EXCLUDED.description, category = EXCLUDED.category,
    priority = EXCLUDED.priority, status = EXCLUDED.status, technician_id = EXCLUDED.technician_id,
    technician_name = EXCLUDED.technician_name, ai_category = EXCLUDED.ai_category,
    ai_priority = EXCLUDED.ai_priority, ai_confidence = EXCLUDED.ai_confidence,
    sla_deadline = EXCLUDED.sla_deadline, sla_met = EXCLUDED.sla_met
  RETURNING id INTO v_tkt_id;

  INSERT INTO ticket_comments (ticket_id, user_id, content, is_internal, created_at)
  VALUES (v_tkt_id, v_tech7_uid, 'Đã kiểm kê xong tầng 1 và tầng 2 (tổng 68 thiết bị), đang tiến hành tầng 3.', FALSE, NOW() - INTERVAL '2 days' + INTERVAL '8.0 hours');
  INSERT INTO ticket_notes (ticket_id, author_id, author_name, body, created_at)
  VALUES (v_tkt_id, v_tech7_uid, 'Vũ Thị Lan', 'Phát hiện 02 màn hình cũ hỏng ở kho C.105 không có trong danh mục tài sản, đang lập biên bản bổ sung.', NOW() - INTERVAL '2 days' + INTERVAL '7.5 hours');
  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)
  VALUES (v_tkt_id, v_cust_id, 'created', NULL, 'Tạo ticket mới: Kiểm kê định kỳ trang thiết bị', NOW() - INTERVAL '2 days');
  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)
  VALUES (v_tkt_id, v_mgr_id, 'assigned', 'new', 'Phân công cho Vũ Thị Lan', NOW() - INTERVAL '1.9 days');
  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)
  VALUES (v_tkt_id, v_tech7_uid, 'status_changed', 'assigned', 'Bắt đầu xử lý (in_progress)', NOW() - INTERVAL '1.8 days');

  -- TKT-2026-000122: Đề xuất thanh lý 15 màn hình máy tính CR
  INSERT INTO tickets (
    ticket_number, title, description, category, priority, status,
    customer_id, customer_name, customer_email, customer_phone, customer_location,
    technician_id, technician_name,
    created_at, assigned_at, started_at, resolved_at, closed_at,
    ai_category, ai_priority, ai_confidence, sla_deadline, sla_met
  ) VALUES (
    'TKT-2026-000122', 'Đề xuất thanh lý 15 màn hình máy tính CRT và vỏ case cũ hỏng', 'Kho thiết bị tầng hầm nhà B còn tồn 15 màn hình CRT đời cũ không còn linh kiện thay thế, đề nghị thành lập hội đồng thanh lý tài sản.', 'other', 'low', 'closed',
    v_cust3_id, 'Trường XYZ', 'customer@haui.vn', '0901000001', 'Tầng hầm Nhà B - Kho Thiết bị cũ',
    v_tech7_id, 'Vũ Thị Lan',
    NOW() - INTERVAL '12 days', NOW() - INTERVAL '11.9 days', NOW() - INTERVAL '11.8 days', NOW() - INTERVAL '12 days' + INTERVAL '24.0 hours', NOW() - INTERVAL '12 days' + INTERVAL '26.0 hours',
    'other', 'low', 82.0, NOW() - INTERVAL '12 days' + INTERVAL '168 hours', TRUE
  ) ON CONFLICT (ticket_number) DO UPDATE SET
    title = EXCLUDED.title, description = EXCLUDED.description, category = EXCLUDED.category,
    priority = EXCLUDED.priority, status = EXCLUDED.status, technician_id = EXCLUDED.technician_id,
    technician_name = EXCLUDED.technician_name, ai_category = EXCLUDED.ai_category,
    ai_priority = EXCLUDED.ai_priority, ai_confidence = EXCLUDED.ai_confidence,
    sla_deadline = EXCLUDED.sla_deadline, sla_met = EXCLUDED.sla_met
  RETURNING id INTO v_tkt_id;

  INSERT INTO ticket_comments (ticket_id, user_id, content, is_internal, created_at)
  VALUES (v_tkt_id, v_cust3_id, 'Hội đồng thẩm định tài sản đã ký duyệt biên bản thanh lý số 08/BB-TL.', FALSE, NOW() - INTERVAL '12 days' + INTERVAL '24.0 hours');
  INSERT INTO ticket_notes (ticket_id, author_id, author_name, body, created_at)
  VALUES (v_tkt_id, v_mgr_id, 'Nguyễn Văn Quản', 'Đã chuyển giao đơn vị thu hồi thiết bị điện tử môi trường xử lý theo quy định.', NOW() - INTERVAL '12 days' + INTERVAL '23.5 hours');
  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)
  VALUES (v_tkt_id, v_cust3_id, 'created', NULL, 'Tạo ticket mới: Đề xuất thanh lý 15 màn hình m', NOW() - INTERVAL '12 days');
  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)
  VALUES (v_tkt_id, v_mgr_id, 'assigned', 'new', 'Phân công cho Vũ Thị Lan', NOW() - INTERVAL '11.9 days');
  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)
  VALUES (v_tkt_id, v_tech7_uid, 'status_changed', 'assigned', 'Bắt đầu xử lý (in_progress)', NOW() - INTERVAL '11.8 days');
  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)
  VALUES (v_tkt_id, v_tech7_uid, 'status_changed', 'in_progress', 'Đã xử lý xong (resolved)', NOW() - INTERVAL '12 days' + INTERVAL '24.0 hours');
  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)
  VALUES (v_tkt_id, v_cust3_id, 'status_changed', 'resolved', 'Khách hàng nghiệm thu & đóng ticket', NOW() - INTERVAL '12 days' + INTERVAL '26.0 hours');

  -- 40 Ticket bổ sung đảm bảo độ phủ 7 danh mục và đo lường SLA chuẩn
  INSERT INTO tickets (
    ticket_number, title, description, category, priority, status,
    customer_id, customer_name, customer_email, customer_phone, customer_location,
    technician_id, technician_name,
    created_at, assigned_at, started_at, resolved_at, closed_at,
    ai_category, ai_priority, ai_confidence, sla_deadline, sla_met
  )
  SELECT
    'TKT-2026-' || LPAD((gs.i)::TEXT, 6, '0'),
    CASE (gs.i % 7)
      WHEN 0 THEN 'Sự cố thiết bị phần cứng tại phòng thực hành #' || gs.i
      WHEN 1 THEN 'Lỗi ứng dụng nghiệp vụ phần mềm máy trạm #' || gs.i
      WHEN 2 THEN 'Chập chờn đường truyền mạng phòng ban #' || gs.i
      WHEN 3 THEN 'Kiểm tra hệ thống điện và ổ cắm khu vực #' || gs.i
      WHEN 4 THEN 'Lỗi đầu đọc thẻ từ và kiểm soát ra vào cửa #' || gs.i
      WHEN 5 THEN 'Yêu cầu hỗ trợ cấp phát trang thiết bị #' || gs.i
      ELSE 'Đề xuất kiểm kê tài sản kỹ thuật #' || gs.i
    END,
    'Mô tả chi tiết và yêu cầu hỗ trợ kỹ thuật hiện trường cho sự cố số #' || gs.i || ' tại cơ sở Đại học Công nghiệp Hà Nội.',
    CASE (gs.i % 7)
      WHEN 0 THEN 'hardware'
      WHEN 1 THEN 'software'
      WHEN 2 THEN 'network'
      WHEN 3 THEN 'electrical'
      WHEN 4 THEN 'access_control'
      WHEN 5 THEN 'service_request'
      ELSE 'other'
    END::ticket_category,
    CASE (gs.i % 4)
      WHEN 0 THEN 'low'
      WHEN 1 THEN 'medium'
      WHEN 2 THEN 'high'
      ELSE 'critical'
    END::ticket_priority,
    CASE (gs.i % 6)
      WHEN 0 THEN 'closed'
      WHEN 1 THEN 'resolved'
      WHEN 2 THEN 'in_progress'
      WHEN 3 THEN 'pending'
      WHEN 4 THEN 'assigned'
      ELSE 'new'
    END::ticket_status,
    CASE (gs.i % 3) WHEN 0 THEN v_cust_id WHEN 1 THEN v_cust2_id ELSE v_cust3_id END,
    CASE (gs.i % 3) WHEN 0 THEN 'Khách Hàng Demo' WHEN 1 THEN 'Công ty ABC' ELSE 'Trường XYZ' END,
    CASE (gs.i % 3) WHEN 0 THEN 'customer@haui.vn' WHEN 1 THEN 'cust2@company.vn' ELSE 'cust3@school.vn' END,
    '090100000' || (gs.i % 9 + 1),
    'Khu vực Tòa ' || CHR(65 + (gs.i % 4)) || ' - Phòng ' || (100 + gs.i),
    CASE (gs.i % 8)
      WHEN 0 THEN v_tech1_id WHEN 1 THEN v_tech2_id WHEN 2 THEN v_tech3_id WHEN 3 THEN v_tech4_id
      WHEN 4 THEN v_tech5_id WHEN 5 THEN v_tech6_id WHEN 6 THEN v_tech7_id ELSE v_tech8_id
    END,
    CASE (gs.i % 8)
      WHEN 0 THEN 'Trần Văn Kỹ Thuật' WHEN 1 THEN 'Lê Thị Bảo Trì' WHEN 2 THEN 'Phạm Minh Hùng' WHEN 3 THEN 'Nguyễn Thị Hương'
      WHEN 4 THEN 'Hoàng Minh Tuấn' WHEN 5 THEN 'Đỗ Quang Vinh' WHEN 6 THEN 'Vũ Thị Lan' ELSE 'Bùi Anh Đức'
    END,
    NOW() - (gs.i || ' hours')::INTERVAL - INTERVAL '2 days',
    NOW() - (gs.i || ' hours')::INTERVAL - INTERVAL '1.8 days',
    NOW() - (gs.i || ' hours')::INTERVAL - INTERVAL '1.5 days',
    CASE WHEN gs.i % 6 <= 1 THEN NOW() - (gs.i || ' hours')::INTERVAL - INTERVAL '0.5 days' ELSE NULL END,
    CASE WHEN gs.i % 6 = 0 THEN NOW() - (gs.i || ' hours')::INTERVAL ELSE NULL END,
    CASE (gs.i % 7)
      WHEN 0 THEN 'hardware' WHEN 1 THEN 'software' WHEN 2 THEN 'network' WHEN 3 THEN 'electrical'
      WHEN 4 THEN 'access_control' WHEN 5 THEN 'service_request' ELSE 'other'
    END,
    CASE (gs.i % 4) WHEN 0 THEN 'low' WHEN 1 THEN 'medium' WHEN 2 THEN 'high' ELSE 'critical' END,
    80.0 + (gs.i % 18),
    NOW() - (gs.i || ' hours')::INTERVAL + INTERVAL '24 hours',
    CASE WHEN gs.i % 10 = 0 THEN FALSE ELSE TRUE END
  FROM generate_series(201, 245) AS gs(i)
  ON CONFLICT (ticket_number) DO NOTHING;

END $$;

-- Hoàn tất nạp dữ liệu mẫu thực tế DX-FSM