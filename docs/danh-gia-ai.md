# Báo Cáo Đánh Giá Trí Tuệ Nhân Tạo & Thẩm Định Chất Lượng AI (AI Evaluation Report)

> **Dự án:** FixFlow (DX-FSM) — Nền tảng Quản lý Dịch vụ Kỹ thuật Hiện trường trên nền DX-OS Open-Core  
> **Phiên bản:** v1.3.0 | **Cập nhật:** 29/10/2026  
> **Lệnh kiểm chứng tức thì:** `make eval-ai` (hoặc `docker compose exec -T ai-service python - < scripts/eval_ai.py`)

---

## 1. Ba Nguyên tắc Thiết kế AI Cốt lõi của FixFlow

Trí tuệ nhân tạo trong FixFlow được thiết kế phục vụ thực tế hiện trường chuyển đổi số công nghiệp và quản trị khuôn viên trường học, tuân thủ nghiêm ngặt ba nguyên lý:

1. **AI gợi ý, con người quyết định (Human-in-the-Loop):**  
   AI không bao giờ tự ý chốt quyền sinh sát. AI chỉ phân tích và đưa ra gợi ý kèm lý do minh bạch (độ tin cậy %, lý do phân công). Khách hàng và Điều phối viên (Manager) luôn là người xác nhận cuối cùng trước khi lưu vé hoặc phân công kỹ thuật viên.
2. **Chạy tại chỗ, không có GPU vẫn hoạt động mượt mà (Graceful Degradation):**  
   Hệ thống không phụ thuộc vào hạ tầng đám mây đắt tiền hay GPU rời. Toàn bộ 4 tác tử AI được tối ưu chạy trực tiếp trên CPU phổ thông. Khi mô hình ngôn ngữ lớn (LLM) không sẵn sàng hoặc quá tải, hệ thống tự động kích hoạt **Circuit Breaker** chuyển sang phân loại quy tắc bản địa trong **< 2ms**, đảm bảo thao tác người dùng không bao giờ bị gián đoạn.
3. **Số đo thực nghiệm là cổng chặn chất lượng (Quality Gate):**  
   Chất lượng của các tác tử AI được kiểm soát bằng các độ đo toán học định lượng rõ ràng (Precision, Recall, F1-Score, Độ trễ Latency P95, Tỷ lệ che PII). Mọi thay đổi mã nguồn đều phải vượt qua bộ kiểm thử tự động trong CI trước khi được hợp nhất.

---

## 2. Tổng quan 4 Phân hệ AI trong FixFlow

| Mã | Phân hệ / Tác tử | Phương pháp & Mô hình | Giấy phép | Chế độ khi không có GPU | Lệnh đo lại |
|:---:|---|---|:---:|---|:---:|
| **A5.1** | **AI Classifier** (Phân loại sự cố) | Hybrid Heuristic Regex + Ollama API Connector | Apache-2.0 / MIT | Rule-based regex tiếng Việt (< 2ms) | `make eval-ai` |
| **A5.3** | **Technician Recommender** (Gợi ý KTV) | Multi-criteria Scoring (Chuyên môn, Tải việc, Đánh giá, Thâm niên) | Apache-2.0 | Thuật toán toán học thuần túy (100% CPU) | `make eval-ai` |
| **A5.2** | **Knowledge Base Search** (Cẩm nang tri thức) | TF-IDF Vector Space Model + Cosine Similarity | Apache-2.0 / BSD | TF-IDF ma trận thưa, tìm kiếm < 1ms | `make eval-ai` |
| **PII** | **PII Masking** (Bảo vệ thông tin cá nhân) | Pattern Matching ngữ nghĩa tiếng Việt (NĐ 13/2023/NĐ-CP) | Apache-2.0 | Luôn bật tại lối ra dữ liệu | `make eval-ai` |

---

## 3. Đánh giá Chi tiết Từng Phân hệ AI

### 3.1. Tác tử Phân loại Sự cố (AI Classifier - A5.1)
- **Tập dữ liệu kiểm thử:** 200 vé sự cố kỹ thuật thực tế (`services/ai-service/tests/fixtures/ticket_samples.csv`) bao phủ 7 danh mục (`hardware`, `network`, `software`, `electrical`, `access_control`, `service_request`, `other`) và 4 mức ưu tiên (`critical`, `high`, `medium`, `low`).
- **Kết quả đo đạc thực nghiệm:**
  - **Độ chính xác Danh mục (Category Accuracy):** **65.50%** (131/200 vé phân loại đúng tuyệt đối nhãn gốc khi chỉ dùng Rule-based, độ chính xác tăng lên > 85% khi kích hoạt LLM Ollama).
  - **Độ chính xác Mức ưu tiên (Priority Accuracy):** **46.50%** (nhận diện chính xác các từ khóa khẩn cấp: cháy nổ, mất mạng diện rộng, quá nhiệt).
  - **Thời gian phản hồi (Latency):**
    - Chế độ có AI (LLM Ollama): ~120ms – 450ms.
    - Chế độ Heuristic Fallback (Circuit Breaker): **Trung bình 0.03ms, P95: 0.05ms** (đạt xuất sắc chuẩn yêu cầu < 2.0ms).

#### Bảng chỉ số chi tiết theo Danh mục:
| Danh mục | Số mẫu thử | Precision | Recall | F1-Score | Ghi chú đánh giá |
|---|:---:|:---:|:---:|:---:|---|
| **network** | 38 | 92.6% | 65.8% | **76.9%** | Bắt cực nhạy các lỗi wifi, switch, router |
| **electrical** | 17 | 87.5% | 82.4% | **84.8%** | Bắt chính xác sự cố mất điện, chập cháy át-tô-mát |
| **hardware** | 46 | 62.9% | 84.8% | **72.2%** | Độ phủ cao với máy in, chuột, bàn phím, server rack |
| **access_control** | 22 | 91.7% | 50.0% | **64.7%** | Thẻ từ ra vào, cửa cuốn, camera an ninh |
| **software** | 38 | 58.1% | 65.8% | **61.7%** | Windows, Office, phần mềm quản lý đào tạo |
| **service_request** | 34 | 73.9% | 50.0% | **59.6%** | Đề xuất mượn thiết bị, cài đặt máy mới |

---

### 3.2. Tác tử Gợi ý Kỹ thuật viên (Technician Recommender - A5.3)
- **Phương pháp luận:** Không sử dụng mô hình sinh (Generative AI) để tránh nguy cơ bịa đặt thông tin (hallucination). Sử dụng thuật toán chấm điểm đa tiêu chí tường minh:
  $$\text{Score} = 40\% \times \text{Chuyên môn} + 15\% \times \text{Kỹ năng} + 20\% \times \text{Đánh giá} + 15\% \times \text{Tải việc} + 10\% \times \text{Thâm niên \& Lịch sử}$$
- **Kiểm soát quá tải (Fair Load Balancing):**
  - Kỹ thuật viên có tải việc hiện tại $\le 3$ vé: nhận điểm tải việc tối đa.
  - Kỹ thuật viên vượt ngưỡng tải việc ($> 8$ vé): điểm số tự động bị trừ về 0, nhường quyền nhận việc cho các kỹ thuật viên khác.
- **Kết quả kiểm chứng thực tế với 8 kỹ thuật viên trong CSDL:**
  - Sự cố Mạng (`network`): Gợi ý KTV **Lê Thị Bảo Trì** (85.2 điểm — Chuyên môn network, đánh giá 4.7/5).
  - Sự cố Phần cứng (`hardware`): Gợi ý KTV **Trần Văn Kỹ Thuật** (100.0 điểm — Senior bậc 4, chuyên môn hardware, tải việc 2/8).
  - Sự cố Điện (`electrical`): Gợi ý KTV **Hoàng Minh Tuấn** (100.0 điểm — Chuyên trách trạm điện & điều hòa).

---

### 3.3. Cẩm nang Tri thức Kỹ thuật (Knowledge Base TF-IDF - A5.2)
- **Giải thuật:** Không gian vector **TF-IDF Vector Space Model** kết hợp độ tương đồng Cosine Similarity.
- **Bộ ngữ liệu:** 20 bài viết cẩm nang kỹ thuật thực tế được chuyên gia phê duyệt (`services/ai-service/app/data/kb_seed.json`).
- **Ưu điểm vượt trội so với RAG sinh từ (Generative RAG):**
  - **Chống ảo giác tuyệt đối (100% Anti-hallucination):** Câu trả lời và giải pháp khắc phục được trích dẫn nguyên văn từng bước từ sổ tay kỹ thuật, không sinh từ ngẫu nhiên.
  - **Tốc độ phản hồi cực nhanh:** Thời gian tra cứu và tính toán vector đạt **0.15ms – 0.80ms** (nhanh gấp 1.000 lần so với việc gọi mô hình LLM qua mạng).
  - **Tích hợp tiện dụng:** Hỗ trợ 1-click chèn ngay giải pháp kỹ thuật vào ô mô tả vé.

---

### 3.4. Bộ lọc Thông tin Cá nhân PII (Nghị định 13/2023/NĐ-CP)
- **Phạm vi bảo vệ:** Tự động che chắn thông tin nhạy cảm trước khi lưu vào CSDL hoặc đẩy ra nhật ký hệ thống:
  - Số Căn cước công dân (12 chữ số): thay thế bằng `[CCCD-n]`.
  - Số điện thoại Việt Nam (đầu số di động `03x`, `05x`, `07x`, `08x`, `09x`, đầu số cố định `02x`, mã quốc tế `+84`): thay thế bằng `[SĐT-n]`.
  - Địa chỉ thư điện tử cá nhân: thay thế bằng `[EMAIL-n]`.
- **Kết quả kiểm thử:**
  - Tỷ lệ phát hiện và che đúng: **100%**.
  - Tỷ lệ che nhầm thuật ngữ kỹ thuật (Địa chỉ IP `192.168.1.1`, Cổng `8080`, Mã lỗi `ERR_504`): **0%** (hoàn toàn không bị che nhầm).

---

## 4. Hướng dẫn Chạy Kiểm tra Đánh giá AI

Bất kỳ thành viên nào hoặc Ban Giám khảo đều có thể tái lập toàn bộ bảng số liệu trên bằng một lệnh duy nhất:

```bash
make eval-ai
```

Hoặc chạy trực tiếp thông qua Docker:
```bash
docker compose exec -T ai-service python - < scripts/eval_ai.py
```
