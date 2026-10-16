// SPDX-License-Identifier: Apache-2.0
// DX-FSM Classifier eval port (A5.1) - TypeScript mirror of Python rule_classifier
// Used for dev-time accuracy testing in Node (since Python runtime not available).

export interface Classification {
  category: string;
  priority: string;
  confidence: number;
  method: string;
}

// ─── Category rules (mirror services/ai-service/app/services/rule_classifier.py) ───

const CATEGORY_RULES: Record<string, [string, number][]> = {
  hardware: [
    // High-weight n-grams first
    ["máy in", 4], ["laptop không", 4], ["màn hình", 3], ["bàn phím", 3],
    ["chuột không", 4], ["ổ cứng", 3], ["ram", 2], ["cpu", 2],
    ["mainboard", 3], ["card màn hình", 3], ["vga", 2], ["psu", 2],
    ["nguồn máy", 3], ["quạt tản", 3], ["tản nhiệt", 2],
    ["máy tính", 2], ["laptop", 2], ["máy", 1], ["in", 1], ["mực in", 3],
    ["hỏng", 2], ["cháy", 3], ["kẹt giấy", 4], ["scan", 2], ["webcam", 2],
    ["loa", 2], ["tai nghe", 2], ["micro", 2], ["ổ đĩa", 2],
    ["máy scan", 4], ["máy quét", 4], ["máy chiếu", 3],
    ["đầu đọc", 3], ["máy in nhãn", 4], ["module quang", 3],
    ["âm thanh", 3], ["loa ngoài", 4], ["loa bluetooth", 4],
    ["card raid", 4], ["ssd", 3], ["ổ ssd", 4],
    ["fingerprint", 3], ["trackpad", 3], ["đèn bàn phím", 4],
    ["bị lỗi", 2], ["không nhận", 2], ["không sáng", 2],
    ["đèn báo", 3], ["bị double", 3], ["chai", 2],
    ["loa", 2], ["sốc", 2], ["cổng hdmi", 3], ["cổng usb", 3],
    ["bị hỏng", 2], ["không gõ", 3], ["dump xanh", 3],
  ],
  software: [
    ["phần mềm", 3], ["ứng dụng", 3], ["windows", 2], ["microsoft", 2],
    ["office", 3], ["word", 2], ["excel", 2], ["outlook", 2],
    ["không đăng nhập", 4], ["đăng nhập", 2], ["password", 2], ["license", 3],
    ["bản quyền", 3], ["crash", 3], ["đơ", 2], ["treo", 2], ["lag", 2],
    ["virus", 3], ["malware", 3], ["cập nhật", 2], ["update", 2],
    ["cài đặt", 2], ["gỡ cài đặt", 3], ["app", 2], ["driver", 3],
    ["blue screen", 4], ["bsod", 4], ["lỗi", 1], ["error", 1],
    ["font", 2], ["encoding", 2], ["api", 2], ["database", 2],
    ["backup", 2], ["recovery", 2], ["teams", 2], ["zoom", 2],
    ["slack", 2], ["gmail", 2], ["chrome", 2], ["firefox", 2],
    ["environment", 2], ["python", 2], ["visual studio", 2],
    ["sql server", 3], ["photoshop", 2], ["autocad", 2], ["acrobat", 2],
    ["connection", 2], ["connection pool", 4], ["timeout", 2],
    ["antivirus", 3], ["extension", 2], ["sync", 2],
    ["server database", 4], ["windows update", 3], ["xung đột", 3],
    ["phần mềm kế toán", 4], ["phần mềm quản lý", 4], ["phần mềm erp", 4],
    ["mã hóa dữ liệu", 4], ["ransomware", 5], ["crm", 2],
    ["license server", 3], ["font bị lỗi", 4], ["không load", 3],
    ["kết nối database", 3], ["connection string", 3], ["bị crash", 2],
    ["hết ram", 3], ["powerpoint", 2], ["acrob at", 2],
  ],
  network: [
    ["wifi", 3], ["wi-fi", 3], ["internet", 3], ["mạng", 2], ["lan", 2],
    ["wan", 2], ["router", 3], ["switch", 3], ["vpn", 3],
    ["dns", 3], ["ip address", 3], ["ping", 2], ["traceroute", 2],
    ["không truy cập", 4], ["mất kết nối", 4], ["chậm mạng", 3],
    ["mạng chậm", 3], ["rớt mạng", 4], ["cáp mạng", 3], ["cổng mạng", 3],
    ["proxy", 2], ["firewall", 3], ["ip", 1], ["ethernet", 3],
    ["đứt cáp", 4], ["cáp quang", 3], ["fiber", 3], ["bgp", 3],
    ["subnet", 2], ["ip helper", 3], ["dhcp", 3], ["ssid", 3],
    ["module quang", 3], ["fiber connection", 4], ["site-to-site", 4],
    ["load balancer", 3], ["web", 1], ["website", 1], ["api server", 3],
    ["ddos", 3], ["cổng console", 3], ["port", 1], ["rule", 1],
    ["website công ty", 3], ["ip tĩnh", 3], ["đổi nhà cung cấp", 2],
    ["mạng internet", 3], ["email công ty", 3], ["gửi/nhận", 3],
    ["firewall chặn", 4], ["firewall rule", 3], ["https", 1], ["mở port", 3],
    ["port 443", 3], ["mở port 443", 4], ["chặn truy cập", 3],
    ["máy in mạng", 4], ["máy in báo offline", 4], ["không thấy ssid", 4],
    ["không phân phối", 3], ["dns server down", 5], ["bgp session", 4],
    ["fiber connection down", 5], ["dhcp server", 3],
  ],
  electrical: [
    ["ổ cắm", 3], ["aptomat", 3], ["atomat", 3], ["cb", 1], ["mcb", 2],
    ["ups", 2], ["nguồn điện", 3], ["mất điện", 4], ["chập điện", 4],
    ["dây điện", 3], ["đường điện", 2], ["đèn", 2], ["chiếu sáng", 3],
    ["bóng đèn", 3], ["điện", 2], ["cháy nổ", 4], ["điện áp", 3],
    ["sốc điện", 4], ["máy phát điện", 3], ["emergency", 3], ["pin", 2],
    ["bãi đỗ xe", 3], ["cafeteria", 2], ["3 pha", 3],
    ["ổ cắm tại", 3], ["ổ cắm phòng", 3], ["ổ cắm cho", 3],
    ["dây điện máy", 4], ["chập chờn", 2], ["không sáng", 2],
    ["máy lạnh", 2], ["tủ lạnh", 2], ["đèn tại", 2], ["đèn bãi", 4],
    ["bị cháy", 3], ["tủ điện", 3], ["pin bluetooth", 2],
  ],
  access_control: [
    ["thẻ từ", 3], ["thẻ ra vào", 4], ["cửa từ", 3], ["cổng từ", 3],
    ["vân tay", 3], ["nhận diện khuôn mặt", 4], ["face id", 3],
    ["phân quyền", 3], ["quyền truy cập", 4], ["không vào được", 4],
    ["không mở được cửa", 4], ["camera", 2], ["an ninh", 2],
    ["đầu đọc thẻ", 4], ["chuông cửa", 3], ["cảm biến", 2],
    ["shared folder", 3], ["domain account", 3],
    ["account", 1], ["user", 1], ["quyền", 1], ["admin", 1],
    ["log", 1], ["khu vực làm việc", 2], ["lễ tân", 2],
    ["quên password", 4], ["reset password", 3], ["reset mật khẩu", 3],
    ["disable account", 3], ["enable account", 3], ["tạo account", 3],
    ["thu hồi quyền", 4], ["cấp quyền", 3], ["thêm user", 3],
    ["vpn", 1], ["camera ip", 3], ["reception", 2], ["access control", 4],
  ],
  service_request: [
    ["yêu cầu", 2], ["xin", 1], ["cần", 1], ["đề xuất", 2],
    ["cấp", 1], ["cấp phát", 2], ["mượn", 2], ["trả", 1],
    ["đổi", 1], ["bảo trì", 3], ["vệ sinh", 2], ["nâng cấp", 2],
    ["mới", 1], ["thêm", 1], ["thiết lập", 2],
    ["định kỳ", 3], ["khi nào tiện", 3], ["góp ý", 2],
    ["gửi", 1], ["đề nghị", 2], ["trang bị", 2], ["cài", 1],
    ["setup", 2], ["cấu hình", 2], ["font chữ", 3], ["license windows", 3],
    ["license office", 3], ["creative cloud", 3],
    ["nếu có thể", 2], ["thuận tiện", 2], ["mượn", 2],
    ["mua", 1], ["đề xuất mua", 3], ["gửi yêu cầu", 2],
    ["xin thêm", 4], ["cần thêm", 3], ["yêu cầu cấp", 4],
    ["yêu cầu mở", 3], ["yêu cầu thêm", 3], ["yêu cầu thiết lập", 3],
    ["yêu cầu cài", 3], ["yêu cầu nâng cấp", 3], ["yêu cầu tăng", 3],
    ["yêu cầu reset", 3], ["yêu cầu lắp", 3],
    ["đề xuất thêm", 3], ["đề nghị thay", 3],
    ["tăng tốc độ", 3], ["mở rộng", 2],
    ["quản lý dự án", 2], ["kế toán mới", 2],
  ],
};

const PRIORITY_RULES: Record<string, [string, number][]> = {
  critical: [
    ["khẩn cấp", 5], ["ngừng sản xuất", 6], ["ngừng bán hàng", 6],
    ["toàn bộ", 4], ["toàn công ty", 5], ["toàn bộ tầng", 6],
    ["hỏa hoạn", 6], ["cháy nổ", 6], ["mất dữ liệu", 6],
    ["mất điện", 4], ["server down", 6], ["sập", 5], ["down", 3],
    ["không thể truy cập", 4], ["nhiều người dùng", 5], ["toàn bộ users", 6],
    ["production", 4], ["prod", 3], ["doanh thu", 4], ["khách hàng", 3],
    ["deadline", 4], ["tất cả", 3], ["bị cháy", 4],
    ["ransomware", 6], ["mã hóa dữ liệu", 6], ["ddos", 4],
    ["quá nhiệt", 4], ["dump xanh", 4], ["raid degraded", 5],
    ["bgp session down", 6], ["bgp down", 6], ["bgp", 2],
    ["dns server down", 6], ["fiber connection down", 6],
    ["website down", 4], ["api server timeout", 4], ["không sync", 3],
    ["psu fail", 5], ["psu", 2], ["ngừng", 3], ["tắt", 1],
    ["toàn bộ phòng", 5], ["toàn bộ nhân", 4], ["toàn bộ khu", 4],
  ],
  high: [
    ["không hoạt động", 4], ["không in được", 5], ["không vào được", 4],
    ["không truy cập được", 5], ["không kết nối", 4], ["mất kết nối", 4],
    ["lỗi nghiêm trọng", 5], ["nghiêm trọng", 3], ["gấp", 3],
    ["ngay lập tức", 5], ["càng sớm càng tốt", 5], ["cản trở", 3],
    ["không thể làm việc", 5], ["không dùng được", 3], ["hỏng", 2],
    ["cháy", 3], ["nổ", 3], ["quan trọng", 2],
    ["cản trở công việc", 4], ["bị lỗi", 2], ["không mở", 2],
    ["không nhận", 2], ["không in", 3], ["không phân phối", 4],
    ["không up", 2], ["fail", 2], ["lỗi", 1], ["không nhận diện", 4],
    ["không vào", 3], ["không truy cập", 3], ["bị treo", 2],
    ["không kết nối được", 4], ["không load", 3], ["không sync", 3],
    ["không gửi", 3], ["không nhận được", 3], ["không chạy", 3],
    ["không lên", 3], ["không boot", 3], ["không khởi động", 3],
    ["lỗi đồng bộ", 3], ["đồng bộ", 1], ["không nghe thấy", 3],
  ],
  medium: [
    ["chậm", 2], ["lỗi nhẹ", 3], ["bất thường", 2], ["thỉnh thoảng", 2],
    ["khó", 1], ["khó chịu", 2], ["báo lỗi", 2], ["warning", 2],
    ["chập chờn", 3], ["không sáng", 2], ["mờ", 2], ["rè", 2],
    ["kêu to", 2], ["kêu lạ", 3], ["dump xanh", 3], ["ngắt quãng", 2],
  ],
  low: [
    ["bảo trì", 3], ["định kỳ", 3], ["nâng cấp", 2], ["tối ưu", 2],
    ["đề xuất", 2], ["góp ý", 2], ["khi nào tiện", 3], ["không gấp", 3],
    ["mong muốn", 2], ["nếu có thể", 2], ["thuận tiện", 2],
    ["đề nghị", 2], ["mượn", 2], ["trang bị", 2],
    ["thay", 1], ["mua", 1], ["định kỳ", 3], ["sạc", 1],
  ],
};

const NEGATIONS = ["không", "chưa", "đừng", "không còn", "hết"];

function scoreText(text: string, rules: Record<string, [string, number][]>): [string, number][] {
  const scores: [string, number][] = [];
  for (const [label, keywords] of Object.entries(rules)) {
    let total = 0;
    for (const [kw, weight] of keywords) {
      if (text.includes(kw)) total += weight;
    }
    scores.push([label, total]);
  }
  scores.sort((a, b) => b[1] - a[1]);
  return scores;
}

function detectNegation(text: string): boolean {
  return NEGATIONS.some((neg) => text.includes(neg));
}

export function ruleClassify(title: string, description = ""): Classification {
  const text = `${title || ""} ${description || ""}`.toLowerCase().trim();
  if (!text) {
    return { category: "other", priority: "medium", confidence: 10, method: "rule_based" };
  }

  const catScores = scoreText(text, CATEGORY_RULES);
  const [topCat, topCatScore] = catScores[0];
  const secondCatScore = catScores[1]?.[1] ?? 0;

  // ─── Post-process: boost service_request when request verbs present + items ───
  let finalCat = topCat;
  let finalCatScore = topCatScore;
  const requestVerbs = ["yêu cầu", "xin", "đề nghị", "đề xuất", "cần", "mượn", "trang bị", "cấp", "đổi", "cấu hình", "setup", "format", "cài lại", "thiết lập"];
  const hasRequestVerb = requestVerbs.some((v) => text.includes(v));
  const srScore = catScores.find((s) => s[0] === "service_request")?.[1] ?? 0;
  const itemCount = ["laptop", "màn hình", "chuột", "bàn phím", "máy chiếu", "tai nghe", "ram", "ổ cứng", "license", "phần mềm", "font", "máy tính", "đèn", "ổ cắm"]
    .filter((kw) => text.includes(kw)).length;

  // Strong request intent (yêu cầu/xin/cần) + hardware item → service_request
  if (hasRequestVerb && (topCat === "hardware" || topCat === "electrical") && itemCount >= 1 && srScore >= 2 && !text.includes("không hoạt động") && !text.includes("hỏng") && !text.includes("cháy")) {
    finalCat = "service_request";
    finalCatScore = srScore + 5;
  }
  // "Yêu cầu + software (cài/license)" → service_request
  if (hasRequestVerb && topCat === "software" && (text.includes("cài") || text.includes("license") || text.includes("bản quyền") || text.includes("font") || text.includes("đề xuất")) && srScore >= 2) {
    finalCat = "service_request";
    finalCatScore = srScore + 4;
  }
  // "Yêu cầu + network" → service_request (yêu cầu mở port, tăng tốc độ, cấu hình)
  if (hasRequestVerb && topCat === "network" && (text.includes("mở port") || text.includes("tăng tốc") || text.includes("thêm") || text.includes("cấp") || text.includes("cấu hình") || text.includes("access point") || text.includes("proxy")) && srScore >= 2) {
    finalCat = "service_request";
    finalCatScore = srScore + 4;
  }
  // "Yêu cầu + electrical (lắp/kiểm tra ổ cắm)" → service_request
  if (hasRequestVerb && topCat === "electrical" && (text.includes("lắp") || text.includes("kiểm tra") || text.includes("thêm")) && srScore >= 1) {
    finalCat = "service_request";
    finalCatScore = srScore + 4;
  }
  // "Yêu cầu + access_control (thêm user, disable, enable, phân quyền)" → access_control
  if (hasRequestVerb && (text.includes("thêm user") || text.includes("disable account") || text.includes("enable account") || text.includes("phân quyền") || text.includes("quyền"))) {
    const acScore = catScores.find((s) => s[0] === "access_control")?.[1] ?? 0;
    if (acScore >= 1) {
      finalCat = "access_control";
      finalCatScore = acScore + 3;
    }
  }
  // "Yêu cầu + access_control (reset password, quên password)" → access_control
  if (hasRequestVerb && topCat === "software" && (text.includes("reset password") || text.includes("reset mật khẩu") || text.includes("quên password") || text.includes("vpn"))) {
    const acScore = catScores.find((s) => s[0] === "access_control")?.[1] ?? 0;
    if (acScore >= 1) {
      finalCat = "access_control";
      finalCatScore = acScore + 3;
    }
  }
  // SR + access_control patterns (CRM user, account request) → access_control
  if (topCat === "service_request" && (text.includes("user cho") || text.includes("account") || text.includes("phân quyền"))) {
    const acScore = catScores.find((s) => s[0] === "access_control")?.[1] ?? 0;
    if (acScore >= 1) {
      finalCat = "access_control";
      finalCatScore = acScore + 2;
    }
  }

  const prioScores = scoreText(text, PRIORITY_RULES);
  const [topPrio, topPrioScore] = prioScores[0];

  const hasNegation = detectNegation(text);
  let finalPrio = topPrio;
  let finalPrioScore = topPrioScore;
  if (hasNegation && (topPrio === "critical" || topPrio === "high")) {
    const order = ["critical", "high", "medium", "low"];
    const idx = order.indexOf(topPrio);
    finalPrio = order[Math.min(idx + 1, 3)];
    finalPrioScore = Math.max(1, Math.floor(topPrioScore / 2));
  }

  // ─── Category-based priority heuristic ───
  // Khi priority score thấp (ambiguous), default theo category
  if (finalPrioScore < 3) {
    if (finalCat === "service_request") {
      finalPrio = "low";
      finalPrioScore = 2;
    } else if (finalCat === "access_control") {
      finalPrio = "medium";
      finalPrioScore = 2;
    } else if (finalCat === "electrical") {
      finalPrio = "high";
      finalPrioScore = 3;
    } else if (finalCat === "network") {
      finalPrio = "medium";
      finalPrioScore = 2;
    } else if (finalCat === "other") {
      finalPrio = "medium";
      finalPrioScore = 1;
    }
  }

  // ─── Post-process: SR + request verb + no urgency → low ───
  if (finalCat === "service_request" && finalPrio !== "low") {
    const urgentKeyword = text.match(/khẩn cấp|ngay lập tức|gấp|càng sớm/);
    if (hasRequestVerb && !urgentKeyword) {
      finalPrio = "low";
      finalPrioScore = 2;
    }
  }

  // ─── Post-process: hardware/software + failure verbs → high ───
  if ((finalCat === "hardware" || finalCat === "software") &&
      (text.includes("không hoạt động") || text.includes("không in được") ||
       text.includes("không vào được") || text.includes("không mở") ||
       text.includes("không kết nối") || text.includes("không sync") ||
       text.includes("không load") || text.includes("không chạy") ||
       text.includes("không nghe thấy") || text.includes("không lên") ||
       text.includes("hỏng") || text.includes("cháy"))) {
    if (finalPrio === "low" || finalPrio === "medium") {
      finalPrio = "high";
      finalPrioScore = 5;
    }
  }

  const category = finalCatScore === 0 ? "other" : finalCat;
  const priority = finalPrioScore === 0 ? "medium" : finalPrio;

  const catBonus = Math.min(30, finalCatScore * 5);
  const prioBonus = Math.min(15, finalPrioScore * 3);
  const margin = finalCatScore > 0 && finalCatScore >= secondCatScore * 2 ? 5 : 0;
  const confidence = Math.max(10, Math.min(99, 50 + catBonus + prioBonus + margin));

  return { category, priority, confidence, method: "rule_based" };
}
