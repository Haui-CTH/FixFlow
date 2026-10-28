#!/bin/sh
# SPDX-License-Identifier: Apache-2.0
# MinIO Entrypoint Script: Khoi dong MinIO server va tu dong khoi tao bucket

set -e

# Chay MinIO server o background
/usr/bin/minio server /data --console-address ":9001" "$@" &
MINIO_PID=$!

# Chay subshell background de cho MinIO san sang va tao bucket
(
  echo "MinIO Entrypoint: Dang cho MinIO API khoi dong tren port 9000..."
  until mc alias set local http://localhost:9000 "${MINIO_ROOT_USER}" "${MINIO_ROOT_PASSWORD}" > /dev/null 2>&1; do
    sleep 1
  done
  echo "MinIO Entrypoint: Ket noi local MinIO thanh cong."

  # Chay init script neu co
  if [ -f /init.sh ]; then
    echo "MinIO Entrypoint: Dang thuc thi /init.sh..."
    sh /init.sh || true
  fi
) &

# Bat tin hieu dung gracefully
trap 'kill -TERM $MINIO_PID' TERM INT
wait $MINIO_PID

