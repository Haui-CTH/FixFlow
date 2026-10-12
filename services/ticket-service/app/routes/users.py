# SPDX-License-Identifier: Apache-2.0
# DX-FSM Ticket Service – User Routes

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.database import get_db
from app.models.user import User

router = APIRouter()


@router.get("/me")
async def get_current_user():
    return {"username": "demo", "role": "customer"}


@router.get("/technicians")
async def list_technicians(db: AsyncSession = Depends(get_db)):
    return []
