# SPDX-License-Identifier: Apache-2.0
# DX-FSM Ticket Service – Auth Routes

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

router = APIRouter()


class TokenRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


@router.post("/token", response_model=TokenResponse)
async def get_token(request: TokenRequest):
    # Placeholder – full implementation uses Keycloak
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Use Keycloak for authentication"
    )


@router.post("/verify")
async def verify_token(token: str):
    # Placeholder – verify JWT from Keycloak
    return {"valid": True}
