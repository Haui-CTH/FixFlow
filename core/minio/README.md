# MinIO Object Storage

## Bucket: attachments

Lưu trữ ảnh và file đính kèm của ticket.

## Truy cập

- **API:** http://localhost:9000
- **Console:** http://localhost:9001
- **Credentials:** minioadmin / changeme_minio_123 (đổi trong .env)

## SDK

```python
from minio import Minio

client = Minio(
    "localhost:9000",
    access_key="minioadmin",
    secret_key="changeme_minio_123",
    secure=False
)

# Upload file
client.put_object(
    "attachments",
    "tickets/abc123/photo.jpg",
    data,
    length,
    content_type="image/jpeg"
)

# Get presigned URL (24h)
url = client.presigned_get_object(
    "attachments",
    "tickets/abc123/photo.jpg",
    expires=timedelta(hours=24)
)
```

## Cấu hình lifecycle

- File ticket đính kèm: lưu trữ 90 ngày
- Sau đó tự động xóa
