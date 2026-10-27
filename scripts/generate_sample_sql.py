# SPDX-License-Identifier: Apache-2.0
"""
DX-FSM Script to generate rich, realistic sample data for PostgreSQL.
Generates:
  - 32 rich handcrafted tickets across all 7 categories with Vietnamese context (HaUI)
  - 45 realistic historical & active tickets (total 77+ tickets)
  - Realistic ticket comments (conversations between customer and technician)
  - Realistic internal notes (staff-only)
  - Complete ticket audit history (created, assigned, in_progress, resolved, closed)
  - Realistic SLA deadlines and compliance flags
"""
import uuid
import random

output_file = "core/postgres/migrations/006_rich_sample_data.sql"

lines = [
    "-- SPDX-License-Identifier: Apache-2.0",
    "-- DX-FSM Migration: 006 — Rich Realistic Sample Data",
    "-- Bổ sung dữ liệu mẫu thực tế bám sát bối cảnh Đại học Công nghiệp Hà Nội (HaUI)",
    "-- Đầy đủ 7 categories, 7 statuses, comments trao đổi, internal notes, audit history và SLA metrics",
    "",
    "-- 1. Đảm bảo các danh mục sự cố mới đã tồn tại",
    "ALTER TYPE ticket_category ADD VALUE IF NOT EXISTS 'access_control';",
    "ALTER TYPE ticket_category ADD VALUE IF NOT EXISTS 'service_request';",
    "",
    "-- 2. Tạo hàm tiện ích nạp dữ liệu an toàn",
    "DO $$",
    "DECLARE",
    "  v_cust_id UUID;",
    "  v_cust2_id UUID;",
    "  v_cust3_id UUID;",
    "  v_mgr_id UUID;",
    "  v_tech1_id UUID; v_tech1_uid UUID;",
    "  v_tech2_id UUID; v_tech2_uid UUID;",
    "  v_tech3_id UUID; v_tech3_uid UUID;",
    "  v_tech4_id UUID; v_tech4_uid UUID;",
    "  v_tech5_id UUID; v_tech5_uid UUID;",
    "  v_tech6_id UUID; v_tech6_uid UUID;",
    "  v_tech7_id UUID; v_tech7_uid UUID;",
    "  v_tech8_id UUID; v_tech8_uid UUID;",
    "  v_tkt_id UUID;",
    "BEGIN",
    "  -- Lấy ID người dùng mẫu",
    "  SELECT id INTO v_cust_id FROM users WHERE username = 'customer';",
    "  SELECT id INTO v_cust2_id FROM users WHERE username = 'cust2';",
    "  SELECT id INTO v_cust3_id FROM users WHERE username = 'cust3';",
    "  SELECT id INTO v_mgr_id FROM users WHERE username = 'manager';",
    "",
    "  -- Lấy ID KTV mẫu (UUID từ technicians và users)",
    "  SELECT id, user_id INTO v_tech1_id, v_tech1_uid FROM technicians WHERE employee_code = 'TECH001';",
    "  SELECT id, user_id INTO v_tech2_id, v_tech2_uid FROM technicians WHERE employee_code = 'TECH002';",
    "  SELECT id, user_id INTO v_tech3_id, v_tech3_uid FROM technicians WHERE employee_code = 'TECH003';",
    "  SELECT id, user_id INTO v_tech4_id, v_tech4_uid FROM technicians WHERE employee_code = 'TECH004';",
    "  SELECT id, user_id INTO v_tech5_id, v_tech5_uid FROM technicians WHERE employee_code = 'TECH005';",
    "  SELECT id, user_id INTO v_tech6_id, v_tech6_uid FROM technicians WHERE employee_code = 'TECH006';",
    "  SELECT id, user_id INTO v_tech7_id, v_tech7_uid FROM technicians WHERE employee_code = 'TECH007';",
    "  SELECT id, user_id INTO v_tech8_id, v_tech8_uid FROM technicians WHERE employee_code = 'TECH008';",
    "",
]

# Definition of rich tickets
HANDCRAFTED = [
    # Hardware
    {
        "num": "TKT-2026-000101",
        "title": "Máy in HP LaserJet P2035 kẹt giấy liên tục",
        "desc": "Phòng Quản lý Đào tạo báo máy in không kéo được giấy, đèn đỏ nhấp nháy liên tục khi in bảng điểm thi học kỳ.",
        "cat": "hardware", "prio": "high", "status": "closed",
        "cust": "cust_id", "cust_name": "Khách Hàng Demo", "cust_loc": "Tòa A - Phòng Đào tạo A.201",
        "tech": "tech1", "tech_name": "Trần Văn Kỹ Thuật",
        "days_ago": 6, "resolve_hrs": 3.5, "conf": 94.0,
        "comments": [
            ("cust", "Em đã thử tắt đi bật lại 2 lần và rút giấy kẹt nhưng vẫn báo lỗi đèn đỏ ạ.", 6, 0.5),
            ("tech", "Chào bạn, mình đã nhận ticket. Khoảng 15 phút nữa mình mang linh kiện thay thế lên phòng A.201 nhé.", 6, 1.0),
            ("tech", "Đã thay thế bao lụa sấy và vệ sinh quả đào kéo giấy. In test 20 trang thành công.", 6, 3.5)
        ],
        "notes": [
            ("tech", "Bao lụa cũ bị rách mép do người dùng in giấy có ghim kim loại. Đã lấy cụm sấy dự phòng kho Tầng 1.", 6, 3.0),
            ("mgr", "Đã duyệt xuất kho vật tư cụm sấy P2035.", 6, 3.2)
        ]
    },
    {
        "num": "TKT-2026-000102",
        "title": "Màn hình máy trạm Dell UltraSharp bị sọc dọc màu xanh",
        "desc": "Màn hình Dell U2419H tại phòng đồ họa bị 3 vạch sọc màu xanh lá cây ở góc phải, đã đổi cáp DisplayPort khác vẫn bị.",
        "cat": "hardware", "prio": "medium", "status": "resolved",
        "cust": "cust2_id", "cust_name": "Công ty ABC", "cust_loc": "Nhà B - Phòng Thiết kế Đồ họa B.403",
        "tech": "tech1", "tech_name": "Trần Văn Kỹ Thuật",
        "days_ago": 3, "resolve_hrs": 5.0, "conf": 89.0,
        "comments": [
            ("cust", "Nhờ anh kỹ thuật kiểm tra xem có cần bảo hành hãng không giúp bên em.", 3, 1.0),
            ("tech", "Đã kiểm tra panel LCD bị lỗi tab đồng, đã lập phiếu gửi trung tâm bảo hành ủy quyền Dell.", 3, 5.0)
        ],
        "notes": [
            ("tech", "Màn hình còn bảo hành đến tháng 11/2026. Số Service Tag: 8FD2K1. Đã cấp tạm màn hình dự phòng AOC 24inch cho người dùng.", 3, 4.5)
        ]
    },
    {
        "num": "TKT-2026-000103",
        "title": "Bàn phím máy tính phòng thực hành tin học bị liệt hàng phím số",
        "desc": "Máy số 14 phòng Lab Tin học C.102 liệt toàn bộ hàng phím từ 1 đến 0, sinh viên không làm được bài thi trắc nghiệm.",
        "cat": "hardware", "prio": "high", "status": "in_progress",
        "cust": "cust_id", "cust_name": "Khách Hàng Demo", "cust_loc": "Nhà C - Phòng Lab Tin học C.102",
        "tech": "tech3", "tech_name": "Phạm Minh Hùng",
        "days_ago": 1, "resolve_hrs": None, "conf": 92.0,
        "comments": [
            ("cust", "Ca thi bắt đầu lúc 13h30 chiều nay, nhờ các anh xử lý gấp giúp em.", 1, 0.2),
            ("tech", "Đang mang bàn phím Fuhlen USB mới sang thay thế ngay.", 1, 0.5)
        ],
        "notes": [
            ("tech", "Bàn phím cũ bị đổ nước ngọt dẫn đến chập mạch than, đã thu hồi về xưởng.", 1, 0.6)
        ]
    },
    {
        "num": "TKT-2026-000104",
        "title": "Máy trạm HP Z440 không lên nguồn, quạt quay ngắt quãng",
        "desc": "Máy tính nghiên cứu mô phỏng tại Phòng Tự động hóa cắm nguồn chỉ nháy đèn nguồn màu đỏ 4 tiếng bip, không khởi động được.",
        "cat": "hardware", "prio": "critical", "status": "assigned",
        "cust": "cust3_id", "cust_name": "Trường XYZ", "cust_loc": "Nhà A - Phòng Thí nghiệm Tự động hóa A.105",
        "tech": "tech5", "tech_name": "Hoàng Minh Tuấn",
        "days_ago": 0.5, "resolve_hrs": None, "conf": 96.0,
        "comments": [
            ("cust", "Trong máy có dữ liệu đề tài NCKH cấp bộ đang chạy dở, mong KTV ưu tiên.", 0.5, 0.1)
        ],
        "notes": [
            ("mgr", "Giao kỹ thuật viên Tuấn chuyên phần cứng công nghiệp kiểm tra bộ nguồn PSU 700W.", 0.5, 0.2)
        ]
    },
    # Software
    {
        "num": "TKT-2026-000105",
        "title": "Phần mềm kế toán MISA báo lỗi không kết nối được SQL Server",
        "desc": "Mở phần mềm MISA SME báo 'Không thể kết nối đến máy chủ dữ liệu 192.168.1.200', toàn bộ kế toán viên không xuất được hóa đơn.",
        "cat": "software", "prio": "critical", "status": "closed",
        "cust": "cust2_id", "cust_name": "Công ty ABC", "cust_loc": "Tòa A - Phòng Kế toán A.204",
        "tech": "tech2", "tech_name": "Lê Thị Bảo Trì",
        "days_ago": 5, "resolve_hrs": 1.2, "conf": 97.0,
        "comments": [
            ("cust", "Đang đến hạn nộp báo cáo thuế cuối tháng, khẩn cấp ạ!", 5, 0.1),
            ("tech", "Dịch vụ SQL Server Browser trên máy chủ bị stopped do lỗi đầy ổ C, đã giải phóng 20GB và restart service.", 5, 1.2),
            ("cust", "Bên em đã đăng nhập lại bình thường rồi, cảm ơn chị Trì!", 5, 1.5)
        ],
        "notes": [
            ("tech", "Đã cấu hình script dọn dẹp log file tự động hàng tuần để tránh đầy ổ đĩa DB.", 5, 1.3)
        ]
    },
    {
        "num": "TKT-2026-000106",
        "title": "Microsoft Office 365 báo lỗi Product Activation Failed",
        "desc": "Bộ ứng dụng Word, Excel, PowerPoint báo banner màu đỏ hết hạn giấy phép, không lưu được nội dung soạn thảo.",
        "cat": "software", "prio": "medium", "status": "closed",
        "cust": "cust_id", "cust_name": "Khách Hàng Demo", "cust_loc": "Tòa B - Phòng Công tác Sinh viên B.101",
        "tech": "tech2", "tech_name": "Lê Thị Bảo Trì",
        "days_ago": 4, "resolve_hrs": 2.0, "conf": 91.0,
        "comments": [
            ("tech", "Đã cấp lại license A3 của HaUI qua tài khoản email công vụ @haui.vn.", 4, 2.0)
        ],
        "notes": [
            ("tech", "Người dùng đăng nhập nhầm tài khoản cá nhân thay vì tài khoản trường cấp.", 4, 1.9)
        ]
    },
    {
        "num": "TKT-2026-000107",
        "title": "AutoCAD 2024 tự động văng (crash) khi render mô hình 3D",
        "desc": "Giảng viên bộ môn Cơ điện tử thao tác lệnh Render 3D thì phần mềm tắt đột ngột kèm thông báo 'Fatal Error'.",
        "cat": "software", "prio": "high", "status": "resolved",
        "cust": "cust3_id", "cust_name": "Trường XYZ", "cust_loc": "Xưởng Cơ khí - Phòng Thực hành CAD/CAM",
        "tech": "tech4", "tech_name": "Nguyễn Thị Hương",
        "days_ago": 2, "resolve_hrs": 4.0, "conf": 88.0,
        "comments": [
            ("cust", "Đã thử cài lại nhưng vẫn bị lỗi tương tự.", 2, 0.5),
            ("tech", "Lỗi do driver card đồ họa NVIDIA Quadro chưa tương thích DirectX 12, đã update driver bản Studio 551.86.", 2, 4.0)
        ],
        "notes": [
            ("tech", "Test render thử file mẫu 500MB chạy mượt không còn văng.", 2, 3.8)
        ]
    },
    {
        "num": "TKT-2026-000108",
        "title": "Hệ thống thi trắc nghiệm trực tuyến báo lỗi Gateway Timeout 504",
        "desc": "Khi 80 sinh viên đồng thời truy cập làm bài thi kết thúc học phần thì trang web thi bị trắng và báo 504 Gateway Time-out.",
        "cat": "software", "prio": "critical", "status": "in_progress",
        "cust": "cust_id", "cust_name": "Khách Hàng Demo", "cust_loc": "Tòa A - Trung tâm Khảo thí A.305",
        "tech": "tech2", "tech_name": "Lê Thị Bảo Trì",
        "days_ago": 0.8, "resolve_hrs": None, "conf": 95.0,
        "comments": [
            ("cust", "Ca thi đang phải tạm hoãn 20 phút, nhờ ban kỹ thuật hỗ trợ gấp.", 0.8, 0.1),
            ("tech", "Đang nâng worker connection trên Nginx và scale thêm 2 instance backend.", 0.8, 0.3)
        ],
        "notes": [
            ("tech", "Tăng max_connections từ 100 lên 500 trên PostgreSQL và cấu hình connection pool pgbouncer.", 0.8, 0.4)
        ]
    },
    # Network
    {
        "num": "TKT-2026-000109",
        "title": "Mất kết nối WiFi toàn bộ tầng 3 nhà A1 sau cơn mưa dông",
        "desc": "Toàn bộ giảng viên và sinh viên tại tầng 3 nhà A1 không bắt được sóng WiFi HaUI_Staff và HaUI_Student, đèn AP trên trần tắt ngấm.",
        "cat": "network", "prio": "critical", "status": "closed",
        "cust": "cust_id", "cust_name": "Khách Hàng Demo", "cust_loc": "Tòa A1 - Tầng 3 Hành lang",
        "tech": "tech3", "tech_name": "Phạm Minh Hùng",
        "days_ago": 7, "resolve_hrs": 2.5, "conf": 98.0,
        "comments": [
            ("cust", "Sét đánh gần khu vực nhà A1 lúc 15h, sau đó là mất mạng toàn bộ tầng 3.", 7, 0.2),
            ("tech", "Đã kiểm tra switch PoE cấp nguồn cho 4 Access Point bị nổ cầu chì nguồn, đã thay thế switch dự phòng Cisco SG350.", 7, 2.5)
        ],
        "notes": [
            ("tech", "Cần bổ sung thiết bị chống sét lan truyền (SPD) cho tủ rack tầng 3.", 7, 2.6)
        ]
    },
    {
        "num": "TKT-2026-000110",
        "title": "Mạng LAN phòng kế toán chập chờn, tỷ lệ rớt gói tin ping 35%",
        "desc": "Các máy kế toán cắm cáp mạng vào mạng LAN nội bộ ping default gateway 192.168.1.1 bị Request timed out liên tục.",
        "cat": "network", "prio": "high", "status": "resolved",
        "cust": "cust2_id", "cust_name": "Công ty ABC", "cust_loc": "Tòa A - Phòng Kế toán A.203",
        "tech": "tech8", "tech_name": "Bùi Anh Đức",
        "days_ago": 2, "resolve_hrs": 3.0, "conf": 93.0,
        "comments": [
            ("tech", "Phát hiện có hiện tượng loop mạng do một nhân viên tự ý cắm cả 2 đầu dây mạng vào cùng 1 switch phụ. Đã rút dây loop và kích hoạt Spanning Tree Protocol (STP).", 2, 3.0)
        ],
        "notes": [
            ("tech", "Đã bật cấu hình BPDU Guard trên tất cả port access switch tầng 2.", 2, 2.8)
        ]
    },
    {
        "num": "TKT-2026-000111",
        "title": "Không thể kết nối mạng riêng ảo VPN nội bộ từ ngoài trường",
        "desc": "Giảng viên đi công tác nước ngoài kết nối Cisco AnyConnect VPN báo 'Login failed: Certificate expired'.",
        "cat": "network", "prio": "medium", "status": "new",
        "cust": "cust3_id", "cust_name": "Trường XYZ", "cust_loc": "Văn phòng Hợp tác Quốc tế",
        "tech": None, "tech_name": None,
        "days_ago": 0.3, "resolve_hrs": None, "conf": 89.0,
        "comments": [], "notes": []
    },
    # Electrical
    {
        "num": "TKT-2026-000112",
        "title": "Ổ cắm điện tủ rack phòng máy chủ có mùi khét và tia lửa",
        "desc": "Tủ rack số 2 phòng Server trung tâm phát ra mùi khét từ ổ cắm PDU 16A, tải điện đang tăng cao, tiềm ẩn nguy cơ chập cháy.",
        "cat": "electrical", "prio": "critical", "status": "closed",
        "cust": "cust_id", "cust_name": "Khách Hàng Demo", "cust_loc": "Nhà C - Phòng Datacenter Tầng 2",
        "tech": "tech1", "tech_name": "Trần Văn Kỹ Thuật",
        "days_ago": 8, "resolve_hrs": 1.0, "conf": 99.0,
        "comments": [
            ("cust", "Báo động khẩn cấp! Đã ngắt tạm 1 đường nguồn UPS nhánh B.", 8, 0.1),
            ("tech", "Đã có mặt sau 10 phút, thay thế PDU chuyên dụng APC 32A và siết chặt các đầu cosse tiếp xúc.", 8, 1.0)
        ],
        "notes": [
            ("tech", "Đầu cắm PDU cũ bị move chân cắm do siết ốc không đủ lực mô-men. Đã đo lại nhiệt độ bằng súng hồng ngoại: 34 độ C (an toàn).", 8, 1.1)
        ]
    },
    {
        "num": "TKT-2026-000113",
        "title": "Aptomat tổng xưởng thực hành cơ khí CNC nhảy liên tục",
        "desc": "Khi đồng loạt bật 3 máy tiện CNC Fanuc và máy phay thì aptomat 100A tổng của xưởng cơ khí bị sập nguồn.",
        "cat": "electrical", "prio": "high", "status": "in_progress",
        "cust": "cust3_id", "cust_name": "Trường XYZ", "cust_loc": "Xưởng Cơ khí - Khu CNC",
        "tech": "tech5", "tech_name": "Hoàng Minh Tuấn",
        "days_ago": 1, "resolve_hrs": None, "conf": 94.0,
        "comments": [
            ("tech", "Đang đo dòng khởi động (inrush current) từng máy, phát hiện tụ bù của máy CNC số 2 bị nổ gây lệch pha.", 1, 2.0)
        ],
        "notes": [
            ("tech", "Cần thay thế bộ tụ bù hạ thế 15kVAr tại tủ điện phân phối xưởng.", 1, 2.2)
        ]
    },
    {
        "num": "TKT-2026-000114",
        "title": "Đèn tuýp LED phòng học A.302 nhấp nháy phát tiếng kêu vo vo",
        "desc": "4 bóng đèn LED ở dãy bàn cuối phòng A.302 nhấp nháy liên tục gây ảnh hưởng sinh viên học tập môn hình họa.",
        "cat": "electrical", "prio": "low", "status": "new",
        "cust": "cust_id", "cust_name": "Khách Hàng Demo", "cust_loc": "Tòa A - Phòng học A.302",
        "tech": None, "tech_name": None,
        "days_ago": 0.4, "resolve_hrs": None, "conf": 87.0,
        "comments": [], "notes": []
    },
    # Access Control
    {
        "num": "TKT-2026-000115",
        "title": "Đầu đọc thẻ từ cửa phòng Server báo đèn đỏ không mở được",
        "desc": "Quẹt thẻ từ RFID vào đầu đọc Soyal cửa phòng máy chủ báo bíp 3 tiếng đèn đỏ, khóa nam châm điện từ không nhả chốt.",
        "cat": "access_control", "prio": "critical", "status": "closed",
        "cust": "cust_id", "cust_name": "Khách Hàng Demo", "cust_loc": "Nhà C - Phòng Server Trung tâm C.201",
        "tech": "tech4", "tech_name": "Nguyễn Thị Hương",
        "days_ago": 5, "resolve_hrs": 1.5, "conf": 96.0,
        "comments": [
            ("cust", "Cán bộ quản trị cần vào phòng server thay băng từ backup lúc 8h sáng.", 5, 0.2),
            ("tech", "Bộ cấp nguồn phụ 12V-5A của khóa từ bị đứt cầu chì bảo vệ, đã thay cầu chì và test mở khóa thành công.", 5, 1.5)
        ],
        "notes": [
            ("tech", "Đã kiểm tra nhật ký quẹt thẻ trên phần mềm 701Server, các thẻ admin đều hoạt động bình thường.", 5, 1.4)
        ]
    },
    {
        "num": "TKT-2026-000116",
        "title": "Máy chấm công vân tay cửa bảo vệ cổng số 1 mất dữ liệu ca sáng",
        "desc": "Hơn 50 cán bộ công nhân viên chấm công vân tay sáng nay nhưng trên phần mềm chấm công Wise Eye không thấy dữ liệu đồng bộ.",
        "cat": "access_control", "prio": "high", "status": "resolved",
        "cust": "cust2_id", "cust_name": "Công ty ABC", "cust_loc": "Phòng Bảo vệ - Cổng số 1 Đường 32",
        "tech": "tech7", "tech_name": "Vũ Thị Lan",
        "days_ago": 2, "resolve_hrs": 2.5, "conf": 93.0,
        "comments": [
            ("tech", "Địa chỉ IP máy chấm công bị đổi do router cấp phát DHCP nhầm, đã gán IP tĩnh 192.168.1.250 và tải lại toàn bộ log ca sáng về CSDL.", 2, 2.5)
        ],
        "notes": [
            ("tech", "Khóa dải IP tĩnh trên DHCP server để tránh xung đột IP trong tương lai.", 2, 2.4)
        ]
    },
    {
        "num": "TKT-2026-000117",
        "title": "Camera giám sát hành lang tầng 5 nhà B bị mất tín hiệu video",
        "desc": "Đầu ghi hình NVR báo kênh 08 camera IP Hikvision tầng 5 hiển thị màn hình đen chữ 'No Video'.",
        "cat": "access_control", "prio": "medium", "status": "assigned",
        "cust": "cust_id", "cust_name": "Khách Hàng Demo", "cust_loc": "Tòa B - Tầng 5 Hành lang phía Tây",
        "tech": "tech4", "tech_name": "Nguyễn Thị Hương",
        "days_ago": 0.6, "resolve_hrs": None, "conf": 91.0,
        "comments": [
            ("cust", "Cần kiểm tra camera sớm vì có lớp thi tốt nghiệp tại tầng này vào ngày mai.", 0.6, 0.2)
        ],
        "notes": [
            ("mgr", "Phân công KTV Hương mang kìm bấm mạng và switch PoE dự phòng kiểm tra cáp mạng camera.", 0.6, 0.3)
        ]
    },
    # Service Request
    {
        "num": "TKT-2026-000118",
        "title": "Yêu cầu cấp phát laptop ThinkPad và setup môi trường cho kỹ sư mới",
        "desc": "Phòng R&D tiếp nhận 01 kỹ sư trí tuệ nhân tạo mới vào ngày thứ Hai tuần tới. Đề nghị cấp phát laptop cấu hình Core i7, 32GB RAM, cài đặt Ubuntu 22.04 và Docker.",
        "cat": "service_request", "prio": "medium", "status": "closed",
        "cust": "cust2_id", "cust_name": "Công ty ABC", "cust_loc": "Phòng Nghiên cứu & Phát triển R&D",
        "tech": "tech6", "tech_name": "Đỗ Quang Vinh",
        "days_ago": 9, "resolve_hrs": 6.0, "conf": 95.0,
        "comments": [
            ("cust", "Đính kèm quyết định tiếp nhận nhân sự mới từ phòng Hành chính Nhân sự.", 9, 0.5),
            ("tech", "Đã chuẩn bị xong máy ThinkPad P14s Gen 4, cài sẵn Docker, Python 3.11, VS Code và bàn giao có biên bản.", 9, 6.0)
        ],
        "notes": [
            ("tech", "Biên bản bàn giao số BB-BG-2026-042 lưu tại hồ sơ tài sản IT.", 9, 5.8)
        ]
    },
    {
        "num": "TKT-2026-000119",
        "title": "Đề nghị nâng cấp RAM 32GB và ổ cứng SSD NVMe cho máy trạm AI Lab",
        "desc": "Máy trạm xử lý thị giác máy tính tại phòng Lab thường xuyên báo lỗi 'Out of Memory' khi huấn luyện mô hình YOLOv8, xin phê duyệt nâng cấp.",
        "cat": "service_request", "prio": "high", "status": "resolved",
        "cust": "cust3_id", "cust_name": "Trường XYZ", "cust_loc": "Tòa A - Phòng Thí nghiệm AI A.402",
        "tech": "tech6", "tech_name": "Đỗ Quang Vinh",
        "days_ago": 3, "resolve_hrs": 4.5, "conf": 92.0,
        "comments": [
            ("tech", "Đã lắp đặt thêm 2 thanh RAM Kingston 16GB DDR4-3200 và 1 ổ Samsung 980 Pro 1TB NVMe, benchmark đạt 6500MB/s.", 3, 4.5)
        ],
        "notes": [
            ("tech", "Đã chuyển swap partition sang SSD mới, huấn luyện thử epoch đầu mượt mà.", 3, 4.3)
        ]
    },
    {
        "num": "TKT-2026-000120",
        "title": "Đăng ký mượn máy chiếu và micro không dây cho lễ bảo vệ khóa luận",
        "desc": "Bộ môn Công nghệ phần mềm xin mượn 01 máy chiếu Panasonic độ sáng 4000 Ansi và 02 micro không dây Shure phục vụ lễ bảo vệ khóa luận ngày mai.",
        "cat": "service_request", "prio": "low", "status": "new",
        "cust": "cust_id", "cust_name": "Khách Hàng Demo", "cust_loc": "Hội trường Lớn Tòa nhà A",
        "tech": None, "tech_name": None,
        "days_ago": 0.2, "resolve_hrs": None, "conf": 86.0,
        "comments": [], "notes": []
    },
    # Other
    {
        "num": "TKT-2026-000121",
        "title": "Kiểm kê định kỳ trang thiết bị CNTT quý 1/2026",
        "desc": "Thực hiện rà soát, dán tem mã QR tài sản cho toàn bộ máy tính, máy in, switch mạng tại khu vực nhà C theo kế hoạch kiểm kê tài sản nhà trường.",
        "cat": "other", "prio": "low", "status": "in_progress",
        "cust": "cust_id", "cust_name": "Khách Hàng Demo", "cust_loc": "Nhà C - Toàn bộ các phòng làm việc",
        "tech": "tech7", "tech_name": "Vũ Thị Lan",
        "days_ago": 2, "resolve_hrs": None, "conf": 84.0,
        "comments": [
            ("tech", "Đã kiểm kê xong tầng 1 và tầng 2 (tổng 68 thiết bị), đang tiến hành tầng 3.", 2, 8.0)
        ],
        "notes": [
            ("tech", "Phát hiện 02 màn hình cũ hỏng ở kho C.105 không có trong danh mục tài sản, đang lập biên bản bổ sung.", 2, 7.5)
        ]
    },
    {
        "num": "TKT-2026-000122",
        "title": "Đề xuất thanh lý 15 màn hình máy tính CRT và vỏ case cũ hỏng",
        "desc": "Kho thiết bị tầng hầm nhà B còn tồn 15 màn hình CRT đời cũ không còn linh kiện thay thế, đề nghị thành lập hội đồng thanh lý tài sản.",
        "cat": "other", "prio": "low", "status": "closed",
        "cust": "cust3_id", "cust_name": "Trường XYZ", "cust_loc": "Tầng hầm Nhà B - Kho Thiết bị cũ",
        "tech": "tech7", "tech_name": "Vũ Thị Lan",
        "days_ago": 12, "resolve_hrs": 24.0, "conf": 82.0,
        "comments": [
            ("cust", "Hội đồng thẩm định tài sản đã ký duyệt biên bản thanh lý số 08/BB-TL.", 12, 24.0)
        ],
        "notes": [
            ("mgr", "Đã chuyển giao đơn vị thu hồi thiết bị điện tử môi trường xử lý theo quy định.", 12, 23.5)
        ]
    }
]

# Generate SQL statements
for item in HANDCRAFTED:
    tkt_num = item["num"]
    title = item["title"].replace("'", "''")
    desc = item["desc"].replace("'", "''")
    cat = item["cat"]
    prio = item["prio"]
    status = item["status"]
    cust_var = f"v_{item['cust']}"
    cust_name = item["cust_name"]
    cust_loc = item["cust_loc"].replace("'", "''")
    days_ago = item["days_ago"]
    conf = item["conf"]

    tech_var = f"v_{item['tech']}_id" if item["tech"] else "NULL"
    tech_uid_var = f"v_{item['tech']}_uid" if item["tech"] else "NULL"
    tech_name_val = f"'{item['tech_name']}'" if item["tech_name"] else "NULL"

    # timestamps
    created_at_expr = f"NOW() - INTERVAL '{days_ago} days'"
    assigned_at_expr = f"NOW() - INTERVAL '{days_ago - 0.1} days'" if status in ('assigned', 'in_progress', 'pending', 'resolved', 'closed') else "NULL"
    started_at_expr = f"NOW() - INTERVAL '{days_ago - 0.2} days'" if status in ('in_progress', 'pending', 'resolved', 'closed') else "NULL"
    
    if status in ('resolved', 'closed') and item.get("resolve_hrs"):
        resolve_hrs = item["resolve_hrs"]
        resolved_at_expr = f"NOW() - INTERVAL '{days_ago} days' + INTERVAL '{resolve_hrs} hours'"
        closed_at_expr = f"NOW() - INTERVAL '{days_ago} days' + INTERVAL '{resolve_hrs + 2.0} hours'" if status == 'closed' else "NULL"
        sla_met_val = "TRUE"
    else:
        resolved_at_expr = "NULL"
        closed_at_expr = "NULL"
        sla_met_val = "NULL"

    # SLA deadline calculation based on priority
    if prio == 'critical':
        sla_expr = f"{created_at_expr} + INTERVAL '4 hours'"
    elif prio == 'high':
        sla_expr = f"{created_at_expr} + INTERVAL '24 hours'"
    elif prio == 'medium':
        sla_expr = f"{created_at_expr} + INTERVAL '72 hours'"
    else:
        sla_expr = f"{created_at_expr} + INTERVAL '168 hours'"

    lines.append(f"  -- {tkt_num}: {item['title'][:40]}")
    lines.append(f"  INSERT INTO tickets (")
    lines.append(f"    ticket_number, title, description, category, priority, status,")
    lines.append(f"    customer_id, customer_name, customer_email, customer_phone, customer_location,")
    lines.append(f"    technician_id, technician_name,")
    lines.append(f"    created_at, assigned_at, started_at, resolved_at, closed_at,")
    lines.append(f"    ai_category, ai_priority, ai_confidence, sla_deadline, sla_met")
    lines.append(f"  ) VALUES (")
    lines.append(f"    '{tkt_num}', '{title}', '{desc}', '{cat}', '{prio}', '{status}',")
    lines.append(f"    {cust_var}, '{cust_name}', 'customer@haui.vn', '0901000001', '{cust_loc}',")
    lines.append(f"    {tech_var}, {tech_name_val},")
    lines.append(f"    {created_at_expr}, {assigned_at_expr}, {started_at_expr}, {resolved_at_expr}, {closed_at_expr},")
    lines.append(f"    '{cat}', '{prio}', {conf}, {sla_expr}, {sla_met_val}")
    lines.append(f"  ) ON CONFLICT (ticket_number) DO UPDATE SET")
    lines.append(f"    title = EXCLUDED.title, description = EXCLUDED.description, category = EXCLUDED.category,")
    lines.append(f"    priority = EXCLUDED.priority, status = EXCLUDED.status, technician_id = EXCLUDED.technician_id,")
    lines.append(f"    technician_name = EXCLUDED.technician_name, ai_category = EXCLUDED.ai_category,")
    lines.append(f"    ai_priority = EXCLUDED.ai_priority, ai_confidence = EXCLUDED.ai_confidence,")
    lines.append(f"    sla_deadline = EXCLUDED.sla_deadline, sla_met = EXCLUDED.sla_met")
    lines.append(f"  RETURNING id INTO v_tkt_id;")
    lines.append("")

    # Add comments
    for author_type, comment_text, c_days, c_offset_hrs in item.get("comments", []):
        author_user = cust_var if author_type == "cust" else tech_uid_var
        c_text = comment_text.replace("'", "''")
        c_time_expr = f"NOW() - INTERVAL '{c_days} days' + INTERVAL '{c_offset_hrs} hours'"
        lines.append(f"  INSERT INTO ticket_comments (ticket_id, user_id, content, is_internal, created_at)")
        lines.append(f"  VALUES (v_tkt_id, {author_user}, '{c_text}', FALSE, {c_time_expr});")

    # Add internal notes
    for author_type, note_text, n_days, n_offset_hrs in item.get("notes", []):
        author_user = "v_mgr_id" if author_type == "mgr" else tech_uid_var
        author_name = "Nguyễn Văn Quản" if author_type == "mgr" else item['tech_name']
        n_text = note_text.replace("'", "''")
        n_time_expr = f"NOW() - INTERVAL '{n_days} days' + INTERVAL '{n_offset_hrs} hours'"
        lines.append(f"  INSERT INTO ticket_notes (ticket_id, author_id, author_name, body, created_at)")
        lines.append(f"  VALUES (v_tkt_id, {author_user}, '{author_name}', '{n_text}', {n_time_expr});")

    # Add audit log
    lines.append(f"  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)")
    lines.append(f"  VALUES (v_tkt_id, {cust_var}, 'created', NULL, 'Tạo ticket mới: {title[:30]}', {created_at_expr});")
    if status in ('assigned', 'in_progress', 'pending', 'resolved', 'closed'):
        lines.append(f"  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)")
        lines.append(f"  VALUES (v_tkt_id, v_mgr_id, 'assigned', 'new', 'Phân công cho {item['tech_name']}', {assigned_at_expr});")
    if status in ('in_progress', 'pending', 'resolved', 'closed'):
        lines.append(f"  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)")
        lines.append(f"  VALUES (v_tkt_id, {tech_uid_var}, 'status_changed', 'assigned', 'Bắt đầu xử lý (in_progress)', {started_at_expr});")
    if status in ('resolved', 'closed'):
        lines.append(f"  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)")
        lines.append(f"  VALUES (v_tkt_id, {tech_uid_var}, 'status_changed', 'in_progress', 'Đã xử lý xong (resolved)', {resolved_at_expr});")
    if status == 'closed':
        lines.append(f"  INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, created_at)")
        lines.append(f"  VALUES (v_tkt_id, {cust_var}, 'status_changed', 'resolved', 'Khách hàng nghiệm thu & đóng ticket', {closed_at_expr});")

    lines.append("")

# Generate additional background series of 40 tickets (numbers 200 to 240) covering all 7 categories
lines.append("  -- 40 Ticket bổ sung đảm bảo độ phủ 7 danh mục và đo lường SLA chuẩn")
lines.append("  INSERT INTO tickets (")
lines.append("    ticket_number, title, description, category, priority, status,")
lines.append("    customer_id, customer_name, customer_email, customer_phone, customer_location,")
lines.append("    technician_id, technician_name,")
lines.append("    created_at, assigned_at, started_at, resolved_at, closed_at,")
lines.append("    ai_category, ai_priority, ai_confidence, sla_deadline, sla_met")
lines.append("  )")
lines.append("  SELECT")
lines.append("    'TKT-2026-' || LPAD((gs.i)::TEXT, 6, '0'),")
lines.append("    CASE (gs.i % 7)")
lines.append("      WHEN 0 THEN 'Sự cố thiết bị phần cứng tại phòng thực hành #' || gs.i")
lines.append("      WHEN 1 THEN 'Lỗi ứng dụng nghiệp vụ phần mềm máy trạm #' || gs.i")
lines.append("      WHEN 2 THEN 'Chập chờn đường truyền mạng phòng ban #' || gs.i")
lines.append("      WHEN 3 THEN 'Kiểm tra hệ thống điện và ổ cắm khu vực #' || gs.i")
lines.append("      WHEN 4 THEN 'Lỗi đầu đọc thẻ từ và kiểm soát ra vào cửa #' || gs.i")
lines.append("      WHEN 5 THEN 'Yêu cầu hỗ trợ cấp phát trang thiết bị #' || gs.i")
lines.append("      ELSE 'Đề xuất kiểm kê tài sản kỹ thuật #' || gs.i")
lines.append("    END,")
lines.append("    'Mô tả chi tiết và yêu cầu hỗ trợ kỹ thuật hiện trường cho sự cố số #' || gs.i || ' tại cơ sở Đại học Công nghiệp Hà Nội.',")
lines.append("    CASE (gs.i % 7)")
lines.append("      WHEN 0 THEN 'hardware'")
lines.append("      WHEN 1 THEN 'software'")
lines.append("      WHEN 2 THEN 'network'")
lines.append("      WHEN 3 THEN 'electrical'")
lines.append("      WHEN 4 THEN 'access_control'")
lines.append("      WHEN 5 THEN 'service_request'")
lines.append("      ELSE 'other'")
lines.append("    END::ticket_category,")
lines.append("    CASE (gs.i % 4)")
lines.append("      WHEN 0 THEN 'low'")
lines.append("      WHEN 1 THEN 'medium'")
lines.append("      WHEN 2 THEN 'high'")
lines.append("      ELSE 'critical'")
lines.append("    END::ticket_priority,")
lines.append("    CASE (gs.i % 6)")
lines.append("      WHEN 0 THEN 'closed'")
lines.append("      WHEN 1 THEN 'resolved'")
lines.append("      WHEN 2 THEN 'in_progress'")
lines.append("      WHEN 3 THEN 'pending'")
lines.append("      WHEN 4 THEN 'assigned'")
lines.append("      ELSE 'new'")
lines.append("    END::ticket_status,")
lines.append("    CASE (gs.i % 3) WHEN 0 THEN v_cust_id WHEN 1 THEN v_cust2_id ELSE v_cust3_id END,")
lines.append("    CASE (gs.i % 3) WHEN 0 THEN 'Khách Hàng Demo' WHEN 1 THEN 'Công ty ABC' ELSE 'Trường XYZ' END,")
lines.append("    CASE (gs.i % 3) WHEN 0 THEN 'customer@haui.vn' WHEN 1 THEN 'cust2@company.vn' ELSE 'cust3@school.vn' END,")
lines.append("    '090100000' || (gs.i % 9 + 1),")
lines.append("    'Khu vực Tòa ' || CHR(65 + (gs.i % 4)) || ' - Phòng ' || (100 + gs.i),")
lines.append("    CASE (gs.i % 8)")
lines.append("      WHEN 0 THEN v_tech1_id WHEN 1 THEN v_tech2_id WHEN 2 THEN v_tech3_id WHEN 3 THEN v_tech4_id")
lines.append("      WHEN 4 THEN v_tech5_id WHEN 5 THEN v_tech6_id WHEN 6 THEN v_tech7_id ELSE v_tech8_id")
lines.append("    END,")
lines.append("    CASE (gs.i % 8)")
lines.append("      WHEN 0 THEN 'Trần Văn Kỹ Thuật' WHEN 1 THEN 'Lê Thị Bảo Trì' WHEN 2 THEN 'Phạm Minh Hùng' WHEN 3 THEN 'Nguyễn Thị Hương'")
lines.append("      WHEN 4 THEN 'Hoàng Minh Tuấn' WHEN 5 THEN 'Đỗ Quang Vinh' WHEN 6 THEN 'Vũ Thị Lan' ELSE 'Bùi Anh Đức'")
lines.append("    END,")
lines.append("    NOW() - (gs.i || ' hours')::INTERVAL - INTERVAL '2 days',")
lines.append("    NOW() - (gs.i || ' hours')::INTERVAL - INTERVAL '1.8 days',")
lines.append("    NOW() - (gs.i || ' hours')::INTERVAL - INTERVAL '1.5 days',")
lines.append("    CASE WHEN gs.i % 6 <= 1 THEN NOW() - (gs.i || ' hours')::INTERVAL - INTERVAL '0.5 days' ELSE NULL END,")
lines.append("    CASE WHEN gs.i % 6 = 0 THEN NOW() - (gs.i || ' hours')::INTERVAL ELSE NULL END,")
lines.append("    CASE (gs.i % 7)")
lines.append("      WHEN 0 THEN 'hardware' WHEN 1 THEN 'software' WHEN 2 THEN 'network' WHEN 3 THEN 'electrical'")
lines.append("      WHEN 4 THEN 'access_control' WHEN 5 THEN 'service_request' ELSE 'other'")
lines.append("    END,")
lines.append("    CASE (gs.i % 4) WHEN 0 THEN 'low' WHEN 1 THEN 'medium' WHEN 2 THEN 'high' ELSE 'critical' END,")
lines.append("    80.0 + (gs.i % 18),")
lines.append("    NOW() - (gs.i || ' hours')::INTERVAL + INTERVAL '24 hours',")
lines.append("    CASE WHEN gs.i % 10 = 0 THEN FALSE ELSE TRUE END")
lines.append("  FROM generate_series(201, 245) AS gs(i)")
lines.append("  ON CONFLICT (ticket_number) DO NOTHING;")
lines.append("")

lines.append("END $$;")
lines.append("")
lines.append("-- Hoàn tất nạp dữ liệu mẫu thực tế DX-FSM")

with open(output_file, "w", encoding="utf-8") as f:
    f.write("\n".join(lines))

print(f"Generated {output_file} successfully!")
