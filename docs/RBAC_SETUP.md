# Role-Based Access Control (RBAC) Setup Guide

This document explains how to set up and manage role-based access control in the GXKTM application.

## Overview

The application implements a two-role system:
- **admin**: Full access to the dashboard and all management features
- **user**: Limited access (enrollment wizard only)

## Architecture

### Security Layers

The RBAC system implements **defense in depth** with multiple security layers:

1. **Database Level**: Supabase RLS policies (optional)
2. **Backend Level**: FastAPI middleware validates JWT tokens and checks roles
3. **Frontend Middleware Level**: Next.js middleware protects routes
4. **Frontend Component Level**: React context provides role-aware rendering

### Where Roles are Stored

User roles are stored in Supabase's `user_metadata` field:

```json
{
  "role": "admin"  // or "user"
}
```

This is automatically included in the JWT token and accessible on both frontend and backend.

---

## Initial Setup

### Step 1: Run Database Migration

Run the SQL migration in your Supabase SQL Editor:

1. Go to Supabase Dashboard → SQL Editor
2. Open the file `backend/migrations/rbac_setup.sql`
3. Execute the script

This creates:
- `get_user_role()` function for RLS policies
- `is_admin()` helper function
- Updates existing users to have default "user" role

### Step 2: Set Initial Admin User

#### Option A: Via Supabase Dashboard (Recommended)

1. Go to Supabase Dashboard → Authentication → Users
2. Find the user you want to make admin
3. Click on the user to open details
4. In the "User Metadata" section, click "Edit"
5. Add or update the JSON:
   ```json
   {
     "role": "admin"
   }
   ```
6. Click "Save"

#### Option B: Via SQL Query

Run this in the Supabase SQL Editor:

```sql
UPDATE auth.users
SET raw_user_meta_data = 
  COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
WHERE email = 'your-admin@email.com';
```

### Step 3: Rebuild Docker Containers

After pulling the code changes:

```bash
docker-compose down
docker-compose build
docker-compose up -d
```

---

## How It Works

### Backend Protection

All admin-only endpoints require the `require_admin` dependency:

```python
from auth import require_admin, UserInfo

@router.post("/admin-only-endpoint")
async def admin_endpoint(user: UserInfo = Depends(require_admin)):
    # Only admins can access this
    pass
```

The backend validates:
1. JWT token is present in Authorization header
2. Token is valid (verified with Supabase)
3. User has `role: "admin"` in their metadata

Unauthorized requests receive:
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Valid token but not an admin

### Frontend Protection

#### Route Protection (Middleware)

The Next.js middleware (`src/utils/supabase/middleware.ts`) checks routes:

- `/dashboard/*` routes require admin role
- Non-admins are redirected to `/unauthorized`
- Unauthenticated users are redirected to `/login`

#### Component Protection (AuthContext)

Components can use the auth context:

```tsx
import { useAuth } from '@/lib/auth-context';

function MyComponent() {
  const { isAdmin, isLoading } = useAuth();
  
  if (isLoading) return <Loading />;
  
  if (!isAdmin) return null; // Hide from non-admins
  
  return <AdminOnlyContent />;
}
```

#### Server-Side Protection

Server components can check roles:

```tsx
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AdminPage() {
  const user = await getCurrentUser();
  
  if (!user?.isAdmin) {
    redirect('/unauthorized');
  }
  
  return <AdminContent />;
}
```

### API Call Authentication

All admin API calls automatically include the auth token:

```typescript
// In src/lib/api.ts
async function getAuthHeaders(): Promise<HeadersInit> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session?.access_token) {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    };
  }
  
  return { 'Content-Type': 'application/json' };
}
```

---

## User Flow

### Admin User Flow

1. Admin logs in at `/login`
2. Backend validates credentials
3. JWT includes `role: "admin"` in user_metadata
4. User is redirected to `/dashboard`
5. Sidebar shows "Admin Dashboard" link
6. All admin API calls include auth token

### Regular User Flow

1. User logs in at `/login`
2. Backend validates credentials
3. JWT includes `role: "user"` in user_metadata
4. User is redirected to `/enroll/wizard`
5. Sidebar does NOT show "Admin Dashboard" link
6. Attempting to access `/dashboard` redirects to `/unauthorized`

---

## Managing Users

### Promoting a User to Admin

```sql
-- Via SQL
UPDATE auth.users
SET raw_user_meta_data = 
  COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
WHERE email = 'user@example.com';
```

Or via Supabase Dashboard → Authentication → Users → Edit User Metadata

### Demoting an Admin to User

```sql
UPDATE auth.users
SET raw_user_meta_data = 
  COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "user"}'::jsonb
WHERE email = 'admin@example.com';
```

### Checking a User's Role

```sql
SELECT email, raw_user_meta_data->>'role' as role
FROM auth.users
WHERE email = 'user@example.com';
```

### Listing All Admins

```sql
SELECT id, email, created_at
FROM auth.users
WHERE raw_user_meta_data->>'role' = 'admin';
```

---

## Protected Endpoints

The following API endpoints require admin access:

### Families
- `POST /api/families` - Create family
- `PUT /api/families/{id}` - Update family
- `DELETE /api/families/{id}` - Delete family
- All guardian, student, emergency contact CRUD

### Classes
- `POST /api/classes` - Create class
- `PUT /api/classes/{id}` - Update class
- `DELETE /api/classes/{id}` - Delete class
- Enrollment management

### Payments
- `POST /api/payments` - Create payment
- `PUT /api/payments/{id}` - Update payment
- `DELETE /api/payments/{id}` - Delete payment
- `POST /api/payments/mark-paid/{id}` - Mark as paid

### School Years
- `POST /api/school-years` - Create school year
- `PUT /api/school-years/{id}` - Update school year
- `DELETE /api/school-years/{id}` - Delete school year
- `POST /api/school-years/transition` - Transition years

### Enrollments
- All manual enrollment endpoints

---

## Troubleshooting

### User Can't Access Dashboard

1. Check user's role in Supabase:
   ```sql
   SELECT email, raw_user_meta_data FROM auth.users WHERE email = 'user@email.com';
   ```

2. Verify role is exactly `"admin"` (case-sensitive)

3. Have user log out and log back in (to refresh JWT)

### API Returns 401/403

1. Check browser DevTools → Network → Failed request
2. Verify Authorization header is present
3. Check if token is expired (user should log in again)
4. Verify backend is receiving the token correctly

### Role Not Updating After Change

After changing a user's role in Supabase:
1. User must log out
2. User must log back in
3. New JWT will contain updated role

---

## Security Considerations

1. **Never trust client-side only**: Always verify roles on the backend
2. **Token validation**: All protected endpoints verify JWT with Supabase
3. **Default to least privilege**: New users default to "user" role
4. **Audit trail**: Consider logging admin actions for security audits
5. **Regular review**: Periodically review who has admin access

---

## Environment Variables

No new environment variables are required. The system uses existing:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # For backend
```

---

## Future Enhancements

Consider adding:

1. **More granular roles**: e.g., "moderator", "viewer"
2. **Permission system**: Fine-grained permissions within roles
3. **Role-based RLS**: Database-level access control
4. **Admin activity logging**: Track admin actions
5. **Role expiration**: Temporary admin access
