"""
Supabase JWT Authentication and Role-Based Access Control for FastAPI.

This module provides:
- JWT token verification using Supabase's JWKS
- User role extraction from token metadata
- Dependency functions for protecting endpoints
- Role-based access control decorators
"""

import os
from typing import Optional, Annotated

import httpx
from jose import jwt, JWTError, jwk
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from cachetools import TTLCache


# Security scheme for Bearer token
security = HTTPBearer(auto_error=False)


class UserRole:
    """Enum-like class for user roles."""
    ADMIN = "admin"
    USER = "user"


class AuthenticatedUser(BaseModel):
    """Represents an authenticated user with their role."""
    id: str
    email: Optional[str] = None
    role: str = UserRole.USER
    raw_token: str
    
    class Config:
        frozen = True


# Cache for JWKS keys (TTL: 1 hour)
_jwks_cache: TTLCache = TTLCache(maxsize=10, ttl=3600)


async def _get_supabase_jwks() -> dict:
    """
    Fetch Supabase JWKS (JSON Web Key Set) for JWT verification.
    Results are cached for 1 hour to avoid repeated network calls.
    """
    supabase_url = os.getenv("SUPABASE_URL", "")
    if not supabase_url:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="SUPABASE_URL not configured"
        )
    
    cache_key = f"jwks_{supabase_url}"
    
    if cache_key in _jwks_cache:
        return _jwks_cache[cache_key]
    
    jwks_url = f"{supabase_url}/auth/v1/.well-known/jwks.json"
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(jwks_url, timeout=10.0)
            response.raise_for_status()
            jwks = response.json()
            _jwks_cache[cache_key] = jwks
            return jwks
    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch JWKS: {str(e)}"
        )


def _get_signing_key(jwks: dict, token: str) -> str:
    """Extract the signing key from JWKS based on the token's kid."""
    try:
        # Get the kid from the token header
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")
        
        if not kid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token missing key ID"
            )
        
        # Find the matching key in JWKS
        for key in jwks.get("keys", []):
            if key.get("kid") == kid:
                # Convert JWK to PEM format for verification
                return jwk.construct(key).to_pem().decode('utf-8')
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unable to find matching signing key"
        )
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token header: {str(e)}"
        )


async def verify_supabase_token(token: str) -> dict:
    """
    Verify a Supabase JWT token and return the decoded payload.
    
    Args:
        token: The JWT token to verify
        
    Returns:
        Decoded token payload
        
    Raises:
        HTTPException: If token is invalid or verification fails
    """
    supabase_url = os.getenv("SUPABASE_URL", "")
    
    try:
        # Fetch JWKS for token verification
        jwks = await _get_supabase_jwks()
        signing_key = _get_signing_key(jwks, token)
        
        # Verify and decode the token
        payload = jwt.decode(
            token,
            signing_key,
            algorithms=["RS256"],
            audience="authenticated",
            issuer=f"{supabase_url}/auth/v1"
        )
        
        return payload
        
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token verification failed: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"}
        )


def extract_user_role(payload: dict) -> str:
    """
    Extract user role from Supabase JWT payload.
    
    The role is stored in app_metadata.role. If not present,
    defaults to 'user' role.
    
    Args:
        payload: Decoded JWT payload
        
    Returns:
        User role string ('admin' or 'user')
    """
    # Check app_metadata for role (set by admin or Supabase functions)
    app_metadata = payload.get("app_metadata", {})
    role = app_metadata.get("role", UserRole.USER)
    
    # Also check user_metadata as fallback
    if role == UserRole.USER:
        user_metadata = payload.get("user_metadata", {})
        role = user_metadata.get("role", UserRole.USER)
    
    # Validate role is one of the allowed values
    if role not in [UserRole.ADMIN, UserRole.USER]:
        role = UserRole.USER
    
    return role


async def get_current_user(
    credentials: Annotated[Optional[HTTPAuthorizationCredentials], Depends(security)]
) -> AuthenticatedUser:
    """
    FastAPI dependency to get the current authenticated user.
    
    Usage:
        @app.get("/protected")
        async def protected_route(user: AuthenticatedUser = Depends(get_current_user)):
            return {"user_id": user.id, "role": user.role}
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    token = credentials.credentials
    payload = await verify_supabase_token(token)
    
    # Extract user information
    user_id = payload.get("sub")
    email = payload.get("email")
    role = extract_user_role(payload)
    
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: missing user ID"
        )
    
    return AuthenticatedUser(
        id=user_id,
        email=email,
        role=role,
        raw_token=token
    )


async def get_optional_user(
    credentials: Annotated[Optional[HTTPAuthorizationCredentials], Depends(security)]
) -> Optional[AuthenticatedUser]:
    """
    FastAPI dependency to get the current user if authenticated, or None.
    
    Use this for routes that should work for both authenticated and
    unauthenticated users, but may provide different responses.
    """
    if not credentials:
        return None
    
    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None


async def require_admin(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)]
) -> AuthenticatedUser:
    """
    FastAPI dependency that requires the user to be an admin.
    
    Usage:
        @app.get("/admin-only")
        async def admin_route(user: AuthenticatedUser = Depends(require_admin)):
            return {"message": "Welcome, admin!"}
    """
    if user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return user


async def require_role(required_role: str):
    """
    Factory function to create a dependency that requires a specific role.
    
    Usage:
        @app.get("/specific-role")
        async def role_route(user: AuthenticatedUser = Depends(require_role("admin"))):
            return {"message": "You have the required role!"}
    """
    async def role_checker(
        user: Annotated[AuthenticatedUser, Depends(get_current_user)]
    ) -> AuthenticatedUser:
        if user.role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{required_role}' required"
            )
        return user
    return role_checker


# Type aliases for cleaner endpoint definitions
CurrentUser = Annotated[AuthenticatedUser, Depends(get_current_user)]
OptionalUser = Annotated[Optional[AuthenticatedUser], Depends(get_optional_user)]
AdminUser = Annotated[AuthenticatedUser, Depends(require_admin)]
