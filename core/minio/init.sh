#!/bin/bash
# SPDX-License-Identifier: Apache-2.0
# MinIO Init Script – Tạo bucket khi khởi động

mc alias set local http://localhost:9000 "${MINIO_ROOT_USER}" "${MINIO_ROOT_PASSWORD}"

# Tạo bucket nếu chưa có
if ! mc ls local/attachments > /dev/null 2>&1; then
    mc mb local/attachments
    mc anonymous set download local/attachments
    echo "Bucket 'attachments' created"
else
    echo "Bucket 'attachments' already exists"
fi

# Cấu hình lifecycle (xóa sau 90 ngày)
mc ilm import local/attachments << 'EOF'
{
  "Rules": [{
    "ID": "delete-old-ticket-files",
    "Status": "Enabled",
    "Filter": {"Prefix": "tickets/"},
    "Expiration": {"Days": 90}
  }]
}
EOF

echo "MinIO initialized"
