# SPDX-License-Identifier: Apache-2.0
# DX-FSM Ticket Service – Health Check

from fastapi import APIRouter

router = APIRouter()


@router.get("")
async def health_check():
    return {
        "status": "healthy",
        "service": "ticket-service",
        "version": "1.0.0",
    }
