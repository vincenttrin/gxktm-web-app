"""
Admin-only API endpoints.

This router contains endpoints that require admin authentication:
- Admin user management
- System configuration
- Protected administrative operations
"""

import os
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status, Header
from pydantic import BaseModel

from auth.supabase_auth import (
    AdminUser,
    CurrentUser,
    AuthenticatedUser,
    UserRole
)
from auth.admin_management import (
    create_admin_user,
    update_user_role,
    list_admin_users,
    get_user_by_email,
    CreateAdminRequest,
    UpdateRoleRequest,
    UserResponse
)


router = APIRouter(prefix="/admin", tags=["admin"])


class AdminSetupRequest(BaseModel):
    """Request for initial admin setup."""
    email: str
    password: str
    setup_key: str


class MessageResponse(BaseModel):
    """Simple message response."""
    message: str


@router.post("/setup", response_model=UserResponse)
async def initial_admin_setup(request: AdminSetupRequest):
    """
    Create the first admin user.
    
    This endpoint is used for initial system setup only.
    It requires a special setup key that should be set in environment variables.
    
    Security:
    - Requires FIRST_ADMIN_SETUP_KEY from environment
    - Should be disabled after initial admin is created
    - Never expose the setup key in client-side code
    """
    setup_key = os.getenv("FIRST_ADMIN_SETUP_KEY", "")
    
    if not setup_key:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin setup is disabled. Set FIRST_ADMIN_SETUP_KEY to enable."
        )
    
    if request.setup_key != setup_key:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid setup key"
        )
    
    try:
        # Check if any admins already exist
        existing_admins = await list_admin_users()
        if existing_admins:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Admin user already exists. Use the admin panel to create more admins."
            )
        
        user = await create_admin_user(request.email, request.password)
        return user
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/me", response_model=UserResponse)
async def get_current_admin(user: AdminUser):
    """
    Get the current admin user's information.
    
    Requires admin authentication.
    """
    return UserResponse(
        id=user.id,
        email=user.email,
        role=user.role,
        created_at=None
    )


@router.get("/verify")
async def verify_admin_access(user: AdminUser):
    """
    Verify that the current user has admin access.
    
    This endpoint can be used by the frontend to check
    if the current user is an admin before showing admin UI.
    
    Returns:
        {"is_admin": true, "user_id": "...", "email": "..."}
    """
    return {
        "is_admin": True,
        "user_id": user.id,
        "email": user.email
    }


@router.post("/users", response_model=UserResponse)
async def create_new_admin(
    request: CreateAdminRequest,
    user: AdminUser  # Only admins can create other admins
):
    """
    Create a new admin user.
    
    Requires admin authentication.
    Only existing admins can create new admin users.
    """
    try:
        new_admin = await create_admin_user(request.email, request.password)
        return new_admin
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.patch("/users/{user_id}/role", response_model=UserResponse)
async def update_user_role_endpoint(
    user_id: str,
    role: str,
    admin: AdminUser  # Only admins can update roles
):
    """
    Update a user's role.
    
    Requires admin authentication.
    
    Args:
        user_id: The UUID of the user to update
        role: The new role ('admin' or 'user')
    """
    # Prevent admins from demoting themselves
    if user_id == admin.id and role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot change your own role"
        )
    
    try:
        updated_user = await update_user_role(user_id, role)
        return updated_user
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/users", response_model=list[UserResponse])
async def list_admins(user: AdminUser):
    """
    List all admin users.
    
    Requires admin authentication.
    """
    try:
        admins = await list_admin_users()
        return admins
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Example of a protected endpoint that any authenticated user can access
@router.get("/user-info")
async def get_user_info(user: CurrentUser):
    """
    Get the current user's information.
    
    This endpoint works for both admin and regular users.
    It demonstrates using CurrentUser dependency.
    """
    return {
        "user_id": user.id,
        "email": user.email,
        "role": user.role,
        "is_admin": user.role == UserRole.ADMIN
    }
