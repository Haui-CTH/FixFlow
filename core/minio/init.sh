#!/bin/sh
# SPDX-License-Identifier: Apache-2.0
# MinIO Init Script - Tao bucket va policy khi khoi dong

set -e

# Dat alias ket noi toi MinIO cuc bo
mc alias set local http://localhost:9000 "${MINIO_ROOT_USER}" "${MINIO_ROOT_PASSWORD}"

# Tao bucket neu chua co
if ! mc ls local/attachments > /dev/null 2>&1; then
    mc mb local/attachments
    mc anonymous set download local/attachments
    echo "Bucket 'attachments' created"
else
    echo "Bucket 'attachments' already exists"
fi

# Cau hinh lifecycle rule (xoa file tickets sau 90 ngay)
mc ilm rule add --expire-days 90 --prefix 'tickets/' local/attachments > /dev/null 2>&1 || true

echo "MinIO initialized successfully"
