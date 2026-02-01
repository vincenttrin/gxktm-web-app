# Role-Based Access Control (RBAC) Implementation Guide

This document describes the two-tier role system (admin and user) implemented with Supabase authentication.

## Overview

- **Admin users**: Email/password authentication, access to dashboard
- **Regular users**: Magic link authentication, access to enrollment portal

## Architecture

### User Roles

Roles are stored in Supabase user metadata:
- `app_metadata.role`: Authoritative source (set by admin/service role)
- `user_metadata.role`: Client-accessible copy

Valid roles:
- `admin`: Full access to admin dashboard and APIs
- `user`: Access to enrollment portal only (default)

## Setup Instructions

### 1. Environment Variables

Add these to your `.env` file:

```env
# Backend (.env)
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # Required for admin management
FIRST_ADMIN_SETUP_KEY=your-secure-setup-key      # One-time setup key

# Frontend (.env.local)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 2. Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

New dependencies added:
- `python-jose[cryptography]`: JWT verification
- `httpx`: Async HTTP client for JWKS fetching
- `cachetools`: TTL cache for JWKS

### 3. Create First Admin User

**Option A: Using the Setup Page (Recommended)**

1. Set `FIRST_ADMIN_SETUP_KEY` in your backend environment
2. Navigate to `http://localhost:3000/admin/setup`
3. Enter the setup key and admin credentials
4. The first admin account will be created

**Option B: Using the API**

```bash
curl -X POST http://localhost:8000/admin/setup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "secure-password",
    "setup_key": "your-setup-key"
  }'
```

**Option C: Using Supabase Dashboard**

1. Go to Supabase Dashboard > Authentication > Users
2. Create a new user with email/password
3. Go to the user's details
4. Edit `app_metadata` to add: `{"role": "admin"}`
5. Edit `user_metadata` to add: `{"role": "admin"}`

### 4. Disable Setup Endpoint (Production)

After creating your first admin, remove or unset `FIRST_ADMIN_SETUP_KEY` to disable the setup endpoint.

## Usage Guide

### Frontend

#### Protected Routes with Middleware

The middleware at `src/middleware.ts` automatically protects routes:

- `/dashboard/*` - Requires admin role
- `/enroll/wizard/*` - Requires authentication (any role)
- Public routes: `/login`, `/signup`, `/enroll`, `/admin/login`, `/admin/setup`

#### Client-Side Role Checking

```tsx
'use client';

import { useAuth, useIsAdmin } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, role, isAdmin, isLoading } = useAuth();
  
  if (isLoading) return <Loading />;
  
  if (!user) return <NotAuthenticated />;
  
  if (isAdmin) {
    return <AdminView />;
  }
  
  return <UserView />;
}
```

#### Protected Route Components

```tsx
import { ProtectedRoute, AdminRoute, UserRoute } from '@/components/ProtectedRoute';

// Require any authenticated user
<ProtectedRoute>
  <MyPage />
</ProtectedRoute>

// Require admin role
<AdminRoute>
  <AdminPage />
</AdminRoute>

// With custom redirect
<ProtectedRoute requiredRole="admin" redirectTo="/unauthorized">
  <AdminPage />
</ProtectedRoute>
```

#### Server-Side Role Checking

```tsx
// In Server Components or Server Actions
import { requireAdmin, getCurrentUser, isCurrentUserAdmin } from '@/lib/serverAuth';

// Require admin (redirects if not admin)
export default async function AdminPage() {
  const user = await requireAdmin();
  return <div>Welcome, {user.email}</div>;
}

// Check role without redirect
export async function someAction() {
  const user = await getCurrentUser();
  if (!user?.isAdmin) {
    return { error: 'Unauthorized' };
  }
  // Perform admin action
}
```

### Backend (FastAPI)

#### Protecting Endpoints

```python
from auth.supabase_auth import (
    CurrentUser,      # Any authenticated user
    AdminUser,        # Admin only
    OptionalUser,     # Optional authentication
    get_current_user,
    require_admin
)

# Any authenticated user
@app.get("/api/data")
async def get_data(user: CurrentUser):
    return {"user_id": user.id, "role": user.role}

# Admin only
@app.get("/api/admin/data")
async def get_admin_data(user: AdminUser):
    return {"message": "Admin data", "email": user.email}

# Optional authentication
@app.get("/api/public")
async def public_data(user: OptionalUser):
    if user:
        return {"authenticated": True, "user_id": user.id}
    return {"authenticated": False}
```

#### Admin User Management

```python
from auth.admin_management import (
    create_admin_user,
    update_user_role,
    list_admin_users
)

# Create new admin (from admin endpoint)
new_admin = await create_admin_user("newadmin@example.com", "password")

# Update user role
await update_user_role(user_id, "admin")  # or "user"

# List all admins
admins = await list_admin_users()
```

## API Endpoints

### Admin Routes (`/admin`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/admin/setup` | Setup Key | Create first admin (one-time) |
| GET | `/admin/verify` | Admin | Verify admin access |
| GET | `/admin/me` | Admin | Get current admin info |
| POST | `/admin/users` | Admin | Create new admin user |
| PATCH | `/admin/users/{id}/role` | Admin | Update user role |
| GET | `/admin/users` | Admin | List all admins |
| GET | `/admin/user-info` | User | Get current user info |

## Security Considerations

1. **JWT Verification**: All tokens are verified against Supabase JWKS
2. **Role in app_metadata**: The authoritative role is in `app_metadata`, which can only be set by service role
3. **JWKS Caching**: JWKS keys are cached for 1 hour to reduce network calls
4. **Setup Key**: One-time setup key should be removed after initial admin creation
5. **Service Role Key**: Never expose in client-side code
6. **Double Verification**: Frontend middleware + backend verification for defense in depth

## Troubleshooting

### "Token verification failed"
- Check that `SUPABASE_URL` is correct
- Ensure the token hasn't expired
- Verify JWKS endpoint is accessible

### "Admin access required" for admin user
- Check `app_metadata.role` is set to "admin" in Supabase
- Refresh the session after role change
- Clear browser cookies and re-login

### Setup endpoint returns 403
- Ensure `FIRST_ADMIN_SETUP_KEY` is set in environment
- Check that no admin users exist yet
- Verify the setup key matches exactly

## File Structure

```
backend/
  auth/
    __init__.py
    supabase_auth.py    # JWT verification, dependencies
    admin_management.py  # Admin user CRUD
  routers/
    admin.py            # Admin API endpoints

frontend/
  src/
    app/
      admin/
        login/
          actions.ts    # Admin login server action
          page.tsx      # Admin login page
        setup/
          page.tsx      # Initial admin setup page
      dashboard/
        layout.tsx      # Admin-protected layout
    components/
      ProtectedRoute.tsx # Route protection components
    contexts/
      AuthContext.tsx    # Client auth state management
    lib/
      roles.ts          # Role constants and utilities
      authApi.ts        # Auth API client functions
      serverAuth.ts     # Server-side auth utilities
    utils/
      supabase/
        middleware.ts   # Route protection middleware
```
