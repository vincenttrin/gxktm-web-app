"""
Admin user management utilities.

This module provides functions to:
- Create admin users
- Update user roles
- Manage user metadata in Supabase

NOTE: These functions require the Supabase service role key,
which has admin privileges. Handle with care!
"""

import os
from typing import Optional
from supabase import create_client, Client
from pydantic import BaseModel, EmailStr


class CreateAdminRequest(BaseModel):
    """Request model for creating an admin user."""
    email: EmailStr
    password: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "admin@example.com",
                "password": "secure_password_123"
            }
        }


class UpdateRoleRequest(BaseModel):
    """Request model for updating a user's role."""
    user_id: str
    role: str  # "admin" or "user"


class UserResponse(BaseModel):
    """Response model for user operations."""
    id: str
    email: Optional[str]
    role: str
    created_at: Optional[str]


def get_supabase_admin_client() -> Client:
    """
    Create a Supabase client with service role (admin) privileges.
    
    WARNING: This client bypasses Row Level Security.
    Only use for admin operations that require elevated privileges.
    """
    supabase_url = os.getenv("SUPABASE_URL", "")
    service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    
    if not supabase_url or not service_role_key:
        raise ValueError(
            "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set"
        )
    
    return create_client(supabase_url, service_role_key)


async def create_admin_user(email: str, password: str) -> UserResponse:
    """
    Create a new admin user in Supabase.
    
    This function:
    1. Creates a new user with email/password authentication
    2. Sets the user's role to 'admin' in app_metadata
    3. Auto-confirms the user's email
    
    Args:
        email: Admin user's email address
        password: Admin user's password
        
    Returns:
        UserResponse with the created user's details
        
    Raises:
        ValueError: If user creation fails
    """
    supabase = get_supabase_admin_client()
    
    try:
        # Create user with admin privileges using the Admin API
        response = supabase.auth.admin.create_user({
            "email": email,
            "password": password,
            "email_confirm": True,  # Auto-confirm email for admins
            "app_metadata": {
                "role": "admin"
            },
            "user_metadata": {
                "role": "admin"  # Also set in user_metadata for client access
            }
        })
        
        user = response.user
        if not user:
            raise ValueError("Failed to create admin user")
        
        return UserResponse(
            id=user.id,
            email=user.email,
            role="admin",
            created_at=str(user.created_at) if user.created_at else None
        )
        
    except Exception as e:
        raise ValueError(f"Failed to create admin user: {str(e)}")


async def update_user_role(user_id: str, role: str) -> UserResponse:
    """
    Update a user's role in Supabase.
    
    Args:
        user_id: The user's UUID
        role: The new role ('admin' or 'user')
        
    Returns:
        UserResponse with the updated user's details
        
    Raises:
        ValueError: If role update fails
    """
    if role not in ["admin", "user"]:
        raise ValueError("Role must be 'admin' or 'user'")
    
    supabase = get_supabase_admin_client()
    
    try:
        response = supabase.auth.admin.update_user_by_id(
            user_id,
            {
                "app_metadata": {"role": role},
                "user_metadata": {"role": role}
            }
        )
        
        user = response.user
        if not user:
            raise ValueError("Failed to update user role")
        
        return UserResponse(
            id=user.id,
            email=user.email,
            role=role,
            created_at=str(user.created_at) if user.created_at else None
        )
        
    except Exception as e:
        raise ValueError(f"Failed to update user role: {str(e)}")


async def get_user_by_email(email: str) -> Optional[UserResponse]:
    """
    Get a user by their email address.
    
    Args:
        email: The user's email address
        
    Returns:
        UserResponse if user found, None otherwise
    """
    supabase = get_supabase_admin_client()
    
    try:
        # List users and filter by email
        response = supabase.auth.admin.list_users()
        
        for user in response:
            if user.email == email:
                app_metadata = user.app_metadata or {}
                role = app_metadata.get("role", "user")
                
                return UserResponse(
                    id=user.id,
                    email=user.email,
                    role=role,
                    created_at=str(user.created_at) if user.created_at else None
                )
        
        return None
        
    except Exception as e:
        raise ValueError(f"Failed to get user: {str(e)}")


async def list_admin_users() -> list[UserResponse]:
    """
    List all admin users in the system.
    
    Returns:
        List of UserResponse for all admin users
    """
    supabase = get_supabase_admin_client()
    
    try:
        response = supabase.auth.admin.list_users()
        
        admins = []
        for user in response:
            app_metadata = user.app_metadata or {}
            if app_metadata.get("role") == "admin":
                admins.append(UserResponse(
                    id=user.id,
                    email=user.email,
                    role="admin",
                    created_at=str(user.created_at) if user.created_at else None
                ))
        
        return admins
        
    except Exception as e:
        raise ValueError(f"Failed to list admin users: {str(e)}")
