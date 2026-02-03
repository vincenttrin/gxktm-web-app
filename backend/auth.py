"""
Authentication and Authorization Module

This module provides:
- JWT token verification using Supabase
- Role-based access control (RBAC) dependencies
- User authentication middleware for FastAPI

Roles:
- "admin": Full access to all endpoints
- "user": Limited access (default role)
"""

import os
from typing import Optional
from functools import wraps

from fastapi import HTTPException, Header, Depends, status
from pydantic import BaseModel
import httpx

from config import get_settings


class UserInfo(BaseModel):
    """Authenticated user information extracted from JWT token."""
    id: str
    email: str
    role: str = "user"
    
    @property
    def is_admin(self) -> bool:
        return self.role == "admin"


class AuthError(Exception):
    """Custom exception for authentication errors."""
    def __init__(self, message: str, status_code: int = status.HTTP_401_UNAUTHORIZED):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


async def verify_supabase_token(authorization: Optional[str] = Header(None)) -> UserInfo:
    """
    Verify the Supabase JWT token and extract user information.
    
    This dependency:
    1. Extracts the Bearer token from the Authorization header
    2. Verifies the token with Supabase
    3. Returns user info including role from user_metadata
    
    Args:
        authorization: The Authorization header value (Bearer <token>)
        
    Returns:
        UserInfo: The authenticated user's information
        
    Raises:
        HTTPException: 401 if token is missing or invalid
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Extract token from "Bearer <token>" format
    parts = authorization.split(" ")
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format. Use: Bearer <token>",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = parts[1]
    settings = get_settings()
    
    if not settings.supabase_url:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Supabase URL not configured",
        )
    
    # Verify token with Supabase
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{settings.supabase_url}/auth/v1/user",
                headers={
                    "Authorization": f"Bearer {token}",
                    "apikey": settings.supabase_anon_key,
                },
                timeout=10.0,
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid or expired token",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            
            user_data = response.json()
            
            # Extract role from user_metadata, default to "user"
            user_metadata = user_data.get("user_metadata", {})
            role = user_metadata.get("role", "user")
            
            return UserInfo(
                id=user_data.get("id", ""),
                email=user_data.get("email", ""),
                role=role,
            )
            
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Unable to verify token: {str(e)}",
        )


async def get_current_user(
    user: UserInfo = Depends(verify_supabase_token)
) -> UserInfo:
    """
    Dependency to get the current authenticated user.
    
    This is an alias for verify_supabase_token for clearer semantics.
    """
    return user


async def require_admin(
    user: UserInfo = Depends(get_current_user)
) -> UserInfo:
    """
    Dependency that requires the current user to be an admin.
    
    Use this dependency on admin-only endpoints:
    
    @router.get("/admin-only")
    async def admin_endpoint(user: UserInfo = Depends(require_admin)):
        ...
    
    Args:
        user: The authenticated user (from get_current_user)
        
    Returns:
        UserInfo: The admin user's information
        
    Raises:
        HTTPException: 403 if user is not an admin
    """
    if not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return user


async def get_optional_user(
    authorization: Optional[str] = Header(None)
) -> Optional[UserInfo]:
    """
    Dependency to optionally get the current user.
    
    Returns None if no valid token is provided, instead of raising an error.
    Useful for endpoints that behave differently for authenticated users.
    """
    if not authorization:
        return None
    
    try:
        return await verify_supabase_token(authorization)
    except HTTPException:
        return None


# Role checking utilities

def check_role(user: UserInfo, required_role: str) -> bool:
    """
    Check if a user has the required role.
    
    Args:
        user: The user to check
        required_role: The role required ("admin" or "user")
        
    Returns:
        bool: True if user has the required role or higher
    """
    # Admin has access to everything
    if user.is_admin:
        return True
    # User role only has access to user-level features
    return required_role == "user"


class RoleChecker:
    """
    Dependency class for flexible role checking.
    
    Usage:
        @router.get("/endpoint")
        async def endpoint(user: UserInfo = Depends(RoleChecker(["admin"]))):
            ...
    """
    
    def __init__(self, allowed_roles: list[str]):
        self.allowed_roles = allowed_roles
    
    async def __call__(
        self,
        user: UserInfo = Depends(get_current_user)
    ) -> UserInfo:
        if user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {', '.join(self.allowed_roles)}",
            )
        return user

