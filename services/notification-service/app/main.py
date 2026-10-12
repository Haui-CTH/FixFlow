# SPDX-License-Identifier: Apache-2.0
# DX-FSM Notification Service

from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="DX-FSM Notification Service", version="1.0.0")


class NotifyRequest(BaseModel):
    user_id: str
    title: str
    message: str
    type: str = "info"


@app.post("/notify")
async def send_notification(req: NotifyRequest):
    return {"status": "sent", "notification_id": "notif-placeholder"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
