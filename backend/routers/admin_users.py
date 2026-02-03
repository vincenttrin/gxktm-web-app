"""
Admin Users Router - Manage user roles.

This router provides endpoints for:
- Listing all users with their roles
- Updating user roles (promote/demote admin)

All endpoints require admin privileges.
Uses Supabase Admin API (service role key).
"""

from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
import httpx

from auth import require_admin, UserInfo
from config import get_settings

router = APIRouter(prefix="/api/admin/users", tags=["admin-users"])


class UserListItem(BaseModel):
    """User information for admin listing."""
    id: str
    email: str
    role: str
    created_at: str
    last_sign_in_at: Optional[str] = None
    email_confirmed: bool = False


class UserRoleUpdate(BaseModel):
    """Request body for updating user role."""
    role: str  # "admin" or "user"


class UserRoleUpdateResponse(BaseModel):
    """Response after updating user role."""
    id: str
    email: str
    role: str
    message: str


@router.get("", response_model=List[UserListItem])
async def list_users(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    search: Optional[str] = Query(None),
    user: UserInfo = Depends(require_admin),
):
    """
    List all users with their roles. (Admin only)
    
    Uses Supabase Admin API to fetch users.
    """
    settings = get_settings()
    
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise HTTPException(
            status_code=500,
            detail="Supabase configuration missing. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. ERROR HERE IDIOT"
        )
    
    try:
        async with httpx.AsyncClient() as client:
            # Use Supabase Admin API to list users
            response = await client.get(
                f"{settings.supabase_url}/auth/v1/admin/users",
                headers={
                    "Authorization": f"Bearer {settings.supabase_service_role_key}",
                    "apikey": settings.supabase_service_role_key,
                },
                params={
                    "page": page,
                    "per_page": per_page,
                },
                timeout=30.0,
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Failed to fetch users: {response.text}"
                )
            
            data = response.json()
            users = data.get("users", [])
            
            # Transform to our response format
            user_list = []
            for u in users:
                # Extract role from user_metadata
                user_metadata = u.get("user_metadata", {}) or {}
                role = user_metadata.get("role", "user")
                
                # Apply search filter if provided
                email = u.get("email", "")
                if search and search.lower() not in email.lower():
                    continue
                
                user_list.append(UserListItem(
                    id=u.get("id", ""),
                    email=email,
                    role=role,
                    created_at=u.get("created_at", ""),
                    last_sign_in_at=u.get("last_sign_in_at"),
                    email_confirmed=u.get("email_confirmed_at") is not None,
                ))
            
            return user_list
            
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=503,
            detail=f"Unable to connect to Supabase: {str(e)}"
        )


@router.put("/{user_id}/role", response_model=UserRoleUpdateResponse)
async def update_user_role(
    user_id: str,
    role_update: UserRoleUpdate,
    admin_user: UserInfo = Depends(require_admin),
):
    """
    Update a user's role. (Admin only)
    
    Can promote a user to admin or demote to regular user.
    """
    # Validate role value
    if role_update.role not in ["admin", "user"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid role. Must be 'admin' or 'user'."
        )
    
    # Prevent admin from demoting themselves
    if user_id == admin_user.id and role_update.role != "admin":
        raise HTTPException(
            status_code=400,
            detail="You cannot remove your own admin privileges."
        )
    
    settings = get_settings()
    
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise HTTPException(
            status_code=500,
            detail="Supabase configuration missing."
        )
    
    try:
        async with httpx.AsyncClient() as client:
            # First, get the current user to preserve other metadata
            get_response = await client.get(
                f"{settings.supabase_url}/auth/v1/admin/users/{user_id}",
                headers={
                    "Authorization": f"Bearer {settings.supabase_service_role_key}",
                    "apikey": settings.supabase_service_role_key,
                },
                timeout=30.0,
            )
            
            if get_response.status_code == 404:
                raise HTTPException(status_code=404, detail="User not found")
            
            if get_response.status_code != 200:
                raise HTTPException(
                    status_code=get_response.status_code,
                    detail=f"Failed to fetch user: {get_response.text}"
                )
            
            current_user_data = get_response.json()
            current_metadata = current_user_data.get("user_metadata", {}) or {}
            
            # Update the role in metadata
            updated_metadata = {**current_metadata, "role": role_update.role}
            
            # Use Supabase Admin API to update user metadata
            response = await client.put(
                f"{settings.supabase_url}/auth/v1/admin/users/{user_id}",
                headers={
                    "Authorization": f"Bearer {settings.supabase_service_role_key}",
                    "apikey": settings.supabase_service_role_key,
                    "Content-Type": "application/json",
                },
                json={
                    "user_metadata": updated_metadata
                },
                timeout=30.0,
            )
            
            if response.status_code == 404:
                raise HTTPException(status_code=404, detail="User not found")
            
            if response.status_code not in [200, 201]:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Failed to update user role: {response.text}"
                )
            
            updated_user = response.json()
            email = updated_user.get("email", "")
            
            action = "promoted to admin" if role_update.role == "admin" else "demoted to user"
            
            return UserRoleUpdateResponse(
                id=user_id,
                email=email,
                role=role_update.role,
                message=f"User {email} has been {action}."
            )
            
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=503,
            detail=f"Unable to connect to Supabase: {str(e)}"
        )


@router.get("/count")
async def get_user_counts(
    user: UserInfo = Depends(require_admin),
):
    """
    Get counts of users by role. (Admin only)
    """
    settings = get_settings()
    
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise HTTPException(
            status_code=500,
            detail="Supabase configuration missing."
        )
    
    try:
        async with httpx.AsyncClient() as client:
            # Fetch all users (paginated if needed for large user bases)
            response = await client.get(
                f"{settings.supabase_url}/auth/v1/admin/users",
                headers={
                    "Authorization": f"Bearer {settings.supabase_service_role_key}",
                    "apikey": settings.supabase_service_role_key,
                },
                params={"per_page": 1000},  # Adjust for your needs
                timeout=30.0,
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail="Failed to fetch users"
                )
            
            data = response.json()
            users = data.get("users", [])
            
            admin_count = 0
            user_count = 0
            
            for u in users:
                user_metadata = u.get("user_metadata", {}) or {}
                role = user_metadata.get("role", "user")
                if role == "admin":
                    admin_count += 1
                else:
                    user_count += 1
            
            return {
                "total": len(users),
                "admin_count": admin_count,
                "user_count": user_count,
            }
            
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=503,
            detail=f"Unable to connect to Supabase: {str(e)}"
        )
