# SPDX-License-Identifier: Apache-2.0
# DX-FSM Ticket Service – MinIO Storage Service

from minio import Minio
from app.config import get_settings

settings = get_settings()


def get_minio_client() -> Minio:
    return Minio(
        settings.minio_endpoint,
        access_key=settings.minio_access_key,
        secret_key=settings.minio_secret_key,
        secure=False,
    )


async def upload_attachment(file_data: bytes, object_name: str, content_type: str) -> str:
    client = get_minio_client()
    data_length = len(file_data)

    client.put_object(
        settings.minio_bucket,
        object_name,
        file_data,
        data_length,
        content_type=content_type,
    )

    return f"{settings.minio_endpoint}/{settings.minio_bucket}/{object_name}"
