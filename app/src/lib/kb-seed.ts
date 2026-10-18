// AUTO-GENERATED from kb_seed.json
// SPDX-License-Identifier: Apache-2.0
import type { KBArticle } from "./kb-search";

export const kbSeedArticles: KBArticle[] = [
  {
    "id": "kb-001",
    "title": "Máy in không hoạt động — hướng dẫn khắc phục",
    "body": "Máy in không phản hồi có nhiều nguyên nhân: dây nguồn lỏng, driver chưa cài, hết mực, hoặc kẹt giấy. Bước 1: kiểm tra đèn nguồn. Bước 2: kiểm tra cáp USB hoặc mạng. Bước 3: restart máy in. Bước 4: cập nhật driver. Nếu vẫn không được, liên hệ IT support.",
    "category": "hardware",
    "tags": [
      "printer",
      "máy in",
      "không hoạt động",
      "driver"
    ]
  },
  {
    "id": "kb-002",
    "title": "Laptop không lên nguồn",
    "body": "Laptop không bật được. Kiểm tra: pin còn không (cắm sạc thử), adapter có điện không, đèn báo sạc có sáng không. Thử tháo pin ra rồi cắm trực tiếp adapter. Nếu laptop vẫn không phản hồi, có thể mainboard hoặc nguồn bị hỏng — chuyển kỹ thuật viên xử lý.",
    "category": "hardware",
    "tags": [
      "laptop",
      "không lên",
      "nguồn",
      "pin"
    ]
  },
  {
    "id": "kb-003",
    "title": "WiFi mất kết nối — xử lý nhanh",
    "body": "WiFi không kết nối: kiểm tra SSID có đúng không, restart router (rút điện 30 giây), quên mạng rồi kết nối lại, kiểm tra password. Nếu vẫn không được, kiểm tra máy khác có vào được không. Nếu nhiều máy đều không vào được → lỗi router/AP. Nếu chỉ một máy → lỗi driver WiFi.",
    "category": "network",
    "tags": [
      "wifi",
      "mạng",
      "không kết nối",
      "router"
    ]
  },
  {
    "id": "kb-004",
    "title": "VPN không kết nối được",
    "body": "VPN fail thường do: sai username/password, certificate hết hạn, firewall chặn port 1194 hoặc 443, server VPN quá tải. Bước 1: thử đăng nhập lại. Bước 2: kiểm tra ngày giờ hệ thống. Bước 3: thử kết nối mạng khác (3G/4G). Nếu vẫn lỗi, gửi ticket category network.",
    "category": "network",
    "tags": [
      "vpn",
      "kết nối",
      "firewall",
      "certificate"
    ]
  },
  {
    "id": "kb-005",
    "title": "Email Outlook không gửi được",
    "body": "Outlook không gửi email: kiểm tra kết nối mạng, restart Outlook, kiểm tra SMTP settings (port 587, TLS). Nếu lỗi 0x800CCC0E thì firewall/antivirus chặn. Nếu lỗi 0x800CCC13 thì password sai. Xóa cache Outlook: Control Panel → Mail → Show Profiles → Properties → Data Files → Remove.",
    "category": "software",
    "tags": [
      "outlook",
      "email",
      "smtp",
      "không gửi"
    ]
  },
  {
    "id": "kb-006",
    "title": "Windows Blue Screen (BSOD)",
    "body": "Màn hình xanh chết chóc. Ghi nhớ mã lỗi (IRQL_NOT_LESS_OR_EQUAL, PAGE_FAULT_IN_NONPAGED_AREA...). Khởi động Safe Mode (F8 hoặc Shift+Restart). Kiểm tra recent driver/software. Chạy sfc /scannow và dism /online /cleanup-image /restorehealth. Nếu lặp lại, cài lại Windows.",
    "category": "software",
    "tags": [
      "windows",
      "bsod",
      "blue screen",
      "driver"
    ]
  },
  {
    "id": "kb-007",
    "title": "Phần mềm kế toán MISA bị lỗi",
    "body": "MISA SME.NET lỗi không vào được menu: kiểm tra SQL Server có chạy không (services.msc), restart service SQLSERVER. Nếu lỗi database, restore từ backup gần nhất. Lỗi license: liên hệ MISA support. Backup dữ liệu trước khi thao tác.",
    "category": "software",
    "tags": [
      "misa",
      "kế toán",
      "sql",
      "database"
    ]
  },
  {
    "id": "kb-008",
    "title": "Mất điện tại văn phòng — quy trình",
    "body": "Mất điện: kiểm tra aptomat tổng (MCB) có nhảy không. Nếu có, tắt hết thiết bị rồi bật lại aptomat. Nếu vẫn nhảy → chập điện, gọi thợ điện. Nếu không phải aptomat → liên hệ điện lực. Phòng server có UPS, kiểm tra UPS còn pin không.",
    "category": "electrical",
    "tags": [
      "mất điện",
      "aptomat",
      "ups",
      "nguồn"
    ]
  },
  {
    "id": "kb-009",
    "title": "Thẻ từ không mở được cửa",
    "body": "Thẻ từ không quét được: thử quét 2-3 lần, đảo chiều thẻ, kiểm tra thẻ có bị cong/vỡ không. Nếu vẫn không được, liên hệ lễ tân để cấp thẻ tạm. Nếu nhiều người cùng bị → lỗi đầu đọc, gửi ticket access_control.",
    "category": "access_control",
    "tags": [
      "thẻ từ",
      "cửa",
      "access",
      "vân tay"
    ]
  },
  {
    "id": "kb-010",
    "title": "Quên mật khẩu đăng nhập máy tính",
    "body": "Quên password Windows: dùng tài khoản admin khác reset, hoặc vào Safe Mode dùng command prompt (net user username newpass). Nếu là tài khoản domain, liên hệ IT để reset qua Active Directory. Self-service: https://passwordreset.microsoftonline.com nếu dùng Azure AD.",
    "category": "access_control",
    "tags": [
      "password",
      "quên",
      "reset",
      "domain"
    ]
  },
  {
    "id": "kb-011",
    "title": "Yêu cầu cấp phát laptop mới",
    "body": "Quy trình cấp laptop: 1) Manager duyệt yêu cầu, 2) IT kiểm tra budget và model phù hợp, 3) đặt mua hoặc lấy từ kho, 4) setup Windows + cài phần mềm cơ bản, 5) bàn giao cho nhân viên. Thời gian: 3-5 ngày làm việc cho máy có sẵn, 2-3 tuần cho máy mới.",
    "category": "service_request",
    "tags": [
      "laptop",
      "cấp phát",
      "mua",
      "mới"
    ]
  },
  {
    "id": "kb-012",
    "title": "Yêu cầu cài phần mềm",
    "body": "Để cài phần mềm, gửi ticket category service_request với: tên phần mềm, version, license (nếu có), mục đích sử dụng. IT sẽ review license và approve trong 1-2 ngày. Một số phần mềm cần manager duyệt (Adobe, IDE, design tools).",
    "category": "service_request",
    "tags": [
      "phần mềm",
      "cài đặt",
      "license",
      "đề xuất"
    ]
  },
  {
    "id": "kb-013",
    "title": "Mạng LAN chậm — chẩn đoán",
    "body": "Mạng LAN chậm: ping gateway (thường 192.168.1.1), ping 8.8.8.8 để test internet, ping các máy khác trong cùng subnet. Nếu ping gateway cao (>5ms) → vấn đề switch/router nội bộ. Nếu ping 8.8.8.8 cao → ISP. Dùng Wireshark để phân tích chi tiết.",
    "category": "network",
    "tags": [
      "mạng",
      "lan",
      "chậm",
      "ping"
    ]
  },
  {
    "id": "kb-014",
    "title": "Màn hình laptop bị sọc hoặc nhấp nháy",
    "body": "Màn hình bất thường: cập nhật driver card màn hình, kiểm tra cáp kết nối (nếu màn hình rời), thử cắm ra màn hình ngoài. Nếu màn hình laptop sọc ngang → panel bị hỏng, cần thay. Nếu nhấp nháy → refresh rate sai hoặc driver.",
    "category": "hardware",
    "tags": [
      "màn hình",
      "sọc",
      "nhấp nháy",
      "card màn hình"
    ]
  },
  {
    "id": "kb-015",
    "title": "Phần mềm antivirus block nhầm ứng dụng",
    "body": "Antivirus (Windows Defender/Kaspersky) block file IT cần chạy: thêm exception trong Settings → Virus & threat protection → Exclusions. Nếu là false positive, báo cáo lên nhà cung cấp antivirus. Không nên tắt antivirus hoàn toàn.",
    "category": "software",
    "tags": [
      "antivirus",
      "block",
      "exception",
      "defender"
    ]
  },
  {
    "id": "kb-016",
    "title": "Chuột không dây không kết nối",
    "body": "Chuột wireless không phản hồi: thay pin, kiểm tra USB receiver (cắm vào cổng USB khác), thử restart máy. Bluetooth mouse: xóa device trong Settings → Bluetooth, pair lại. Nếu vẫn không được, có thể chuột hỏng — yêu cầu cấp mới.",
    "category": "hardware",
    "tags": [
      "chuột",
      "không dây",
      "bluetooth",
      "usb"
    ]
  },
  {
    "id": "kb-017",
    "title": "Không đăng nhập được vào hệ thống nội bộ",
    "body": "Login fail hệ thống nội bộ (CRM/ERP): clear cookies, thử trình duyệt khác (Chrome → Edge), kiểm tra ngày giờ hệ thống, kiểm tra SSO (Azure AD/Keycloak). Nếu lỗi 401, có thể session hết hạn, login lại. Lỗi 403 → không có quyền, liên hệ manager.",
    "category": "access_control",
    "tags": [
      "đăng nhập",
      "sso",
      "keycloak",
      "quyền"
    ]
  },
  {
    "id": "kb-018",
    "title": "Aptomat nhảy liên tục",
    "body": "MCB/CB nhảy nhiều lần: rút hết thiết bị điện, bật aptomat, cắm từng thiết bị để xác định thiết bị gây chập. Nếu aptomat nhảy ngay cả khi không cắm gì → aptomat hỏng hoặc chập đường dây, gọi thợ điện. Tuyệt đối không dùng aptomat lớn hơn để bypass.",
    "category": "electrical",
    "tags": [
      "aptomat",
      "mcb",
      "chập",
      "điện"
    ]
  },
  {
    "id": "kb-019",
    "title": "Hệ thống chấm công không nhận vân tay",
    "body": "Chấm công fail: thử lau sạch đầu đọc, thử ngón khác, đăng ký lại vân tay tại phòng HR. Nếu nhiều người cùng bị → đầu đọc bẩn hoặc hỏng, gửi ticket. Fallback: dùng thẻ từ hoặc app chấm công mobile.",
    "category": "access_control",
    "tags": [
      "vân tay",
      "chấm công",
      "đầu đọc",
      "thẻ"
    ]
  },
  {
    "id": "kb-020",
    "title": "Yêu cầu backup dữ liệu",
    "body": "Backup dữ liệu: tự động qua OneDrive/SharePoint cho file công ty. Database tự động backup hàng ngày lúc 3h sáng. Yêu cầu restore: gửi ticket category service_request với: tên file/data, ngày cần restore, lý do. SLA restore: 4h trong giờ hành chính.",
    "category": "service_request",
    "tags": [
      "backup",
      "restore",
      "onedrive",
      "dữ liệu"
    ]
  }
];
