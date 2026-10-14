# SPDX-License-Identifier: Apache-2.0
# DX-FSM Ticket Service – JWT Authentication via Keycloak JWKS

"""
security.py
───────────
JWT verification using Keycloak JWKS (JSON Web Key Set).

Flow:
  1. Extract Bearer token from Authorization header.
  2. Decode header to get `kid` (key ID).
  3. Fetch JWKS from Keycloak: {KEYCLOAK_URL}/realms/{REALM}/protocol/openid-connect/certs
  4. Match `kid` → public RSA key.
  5. Verify signature, expiry, audience, issuer.

Usage:
  @router.get("/tickets", dependencies=[Depends(get_current_user)])
  async def list_tickets(user: TokenUser = Depends(get_current_user)):
      ...
"""

from __future__ import annotations

import time
from functools import lru_cache
from typing import Annotated, Optional

import httpx
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from pydantic import BaseModel

from app.config import settings

# ─── Pydantic models ────────────────────────────────────────────────────────


class TokenUser(BaseModel):
    """Decoded JWT claims."""

    sub: str               # Keycloak user ID (keycloak_id)
    preferred_username: str
    email: str | None = None
    full_name: str | None = None
    role: str | None = None   # extracted from realm_access.roles or groups
    exp: int               # expiry unix timestamp
    iss: str               # issuer

    # Shortcuts for common role checks
    @property
    def is_admin(self) -> bool:
        return self.role in ("admin",)

    @property
    def is_manager(self) -> bool:
        return self.role in ("admin", "manager")

    @property
    def is_technician(self) -> bool:
        return self.role in ("admin", "manager", "technician")


# ─── Keycloak JWKS ───────────────────────────────────────────────────────────

# Cache TTL: 1 hour (Keycloak rotates keys rarely)
_JWKS_CACHE_TTL = 3600
_jwks_cache: dict = {}
_jwks_fetched_at: float = 0.0


async def get_jwks() -> dict:
    """
    Fetch + cache JWKS from Keycloak.
    Returns the full JWKS dict: {"keys": [...]}.
    Refreshes if cache older than _JWKS_CACHE_TTL seconds.
    """
    global _jwks_cache, _jwks_fetched_at

    now = time.time()
    if _jwks_cache and (now - _jwks_fetched_at) < _JWKS_CACHE_TTL:
        return _jwks_cache

    jwks_url = (
        f"{settings.keycloak_internal_url}"
        f"/realms/{settings.keycloak_realm}"
        f"/protocol/openid-connect/certs"
    )

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(jwks_url)
        response.raise_for_status()
        _jwks_cache = response.json()
        _jwks_fetched_at = now

    return _jwks_cache


def _find_key(jwks: dict, kid: str) -> dict | None:
    """Find RSA key matching `kid` in JWKS."""
    for key in jwks.get("keys", []):
        if key.get("kid") == kid:
            return key
    return None


async def _decode_token(token: str) -> dict:
    """
    Verify + decode a JWT using Keycloak JWKS.
    Returns the decoded claims dict.
    Raises HTTPException(401) on any failure.
    """
    try:
        # Decode header (no verification) to get kid
        unverified = jwt.get_unverified_header(token)
        kid = unverified.get("kid")
        if not kid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token missing 'kid' in header",
            )

        # Fetch JWKS and find the key
        jwks = await get_jwks()
        rsa_key = _find_key(jwks, kid)
        if not rsa_key:
            # Key not found — might have rotated; clear cache and retry once
            global _jwks_cache, _jwks_fetched_at
            _jwks_cache = {}
            _jwks_fetched_at = 0.0
            jwks = await get_jwks()
            rsa_key = _find_key(jwks, kid)
            if not rsa_key:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Unknown signing key",
                )

        # Verify signature + standard claims
        claims = jwt.decode(
            token,
            rsa_key,
            algorithms=["RS256"],
            audience=settings.keycloak_client_id,
            issuer=f"{settings.keycloak_public_url}/realms/{settings.keycloak_realm}",
        )
        return claims

    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {e}",
        ) from e


# ─── FastAPI security scheme ─────────────────────────────────────────────────

# HTTPBearer parses "Bearer <token>" automatically
_bearer = HTTPBearer(auto_error=False)  # auto_error=False so we can handle 401 ourselves


async def get_current_user(
    request: Request,
    credentials: Annotated[
        Optional[HTTPAuthorizationCredentials],
        Depends(_bearer),
    ],
) -> TokenUser:
    """
    FastAPI Dependency — validates the JWT and returns a TokenUser.

    Usage:
        @router.get("/tickets")
        async def list(user: TokenUser = Depends(get_current_user)):
            ...

    Raises HTTPException(401) if no token, invalid, or expired.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    claims = await _decode_token(token)

    # Extract role from Keycloak token structure
    # Keycloak embeds realm roles under "realm_access.roles" or "resource_access.{client}.roles"
    role: str | None = None
    realm_roles: list[str] = claims.get("realm_access", {}).get("roles", [])
    if "admin" in realm_roles:
        role = "admin"
    elif "manager" in realm_roles:
        role = "manager"
    elif "technician" in realm_roles:
        role = "technician"
    elif "customer" in realm_roles:
        role = "customer"

    return TokenUser(
        sub=claims.get("sub", ""),
        preferred_username=claims.get("preferred_username", ""),
        email=claims.get("email"),
        full_name=claims.get("name") or claims.get("given_name", ""),
        role=role,
        exp=claims.get("exp", 0),
        iss=claims.get("iss", ""),
    )


# ─── Role guard dependency ──────────────────────────────────────────────────

RoleList = list[str]


def require_roles(*roles: str) -> type:
    """
    Factory: returns a FastAPI Dependency that enforces one of the given roles.

    Usage:
        @router.patch("/tickets/{id}", dependencies=[Depends(require_roles("manager", "admin"))])
        async def close_ticket(...):
            ...

    Raises HTTPException(403) if the user lacks the required role.
    """
    async def role_checker(user: TokenUser = Depends(get_current_user)) -> TokenUser:
        if user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"This action requires one of roles: {roles}",
            )
        return user

    return role_checker


# Re-export for convenience
CurrentUser = Annotated[TokenUser, Depends(get_current_user)]
