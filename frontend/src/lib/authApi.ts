/**
 * Authentication API utilities for role-based access control.
 */

import { createClient } from '@/utils/supabase/client';
import { UserRole, UserRoleType, getUserRole } from './roles';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Custom error class for auth API errors.
 */
export class AuthApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public errors?: string[]
  ) {
    super(message);
    this.name = 'AuthApiError';
  }
}

/**
 * User profile type returned from API.
 */
export interface UserProfile {
  id: string;
  email?: string;
  username?: string;
  full_name?: string;
  role: string;
  created_at?: string;
  last_login_at?: string;
  is_active?: boolean;
}

/**
 * Get the current user's authentication token.
 */
export async function getAuthToken(): Promise<string | null> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

/**
 * Make an authenticated API request.
 */
export async function authFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getAuthToken();
  
  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  headers.set('Content-Type', 'application/json');
  
  return fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });
}

/**
 * Verify admin access with the backend.
 * 
 * This makes an API call to verify the user's admin status,
 * providing a secure server-side verification.
 */
export async function verifyAdminAccess(): Promise<{
  isAdmin: boolean;
  userId?: string;
  email?: string;
}> {
  try {
    const response = await authFetch('/admin/verify');
    
    if (response.ok) {
      const data = await response.json();
      return {
        isAdmin: data.is_admin === true,
        userId: data.user_id,
        email: data.email,
      };
    }
    
    return { isAdmin: false };
  } catch (error) {
    console.error('Error verifying admin access:', error);
    return { isAdmin: false };
  }
}

/**
 * Get current user info from the backend.
 */
export async function getCurrentUserInfo(): Promise<{
  userId: string;
  email?: string;
  role: UserRoleType;
  isAdmin: boolean;
} | null> {
  try {
    const response = await authFetch('/admin/user-info');
    
    if (response.ok) {
      const data = await response.json();
      return {
        userId: data.user_id,
        email: data.email,
        role: data.role,
        isAdmin: data.is_admin === true,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user info:', error);
    return null;
  }
}

/**
 * Initial admin setup - creates the first admin user.
 */
export async function setupFirstAdmin(
  email: string,
  password: string,
  setupKey: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_URL}/admin/setup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        setup_key: setupKey,
      }),
    });
    
    if (response.ok) {
      return { success: true };
    }
    
    const data = await response.json();
    return { success: false, error: data.detail || 'Setup failed' };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Setup failed' 
    };
  }
}

/**
 * Create a new admin user (requires admin authentication).
 */
export async function createAdminUser(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await authFetch('/admin/users', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (response.ok) {
      return { success: true };
    }
    
    const data = await response.json();
    return { success: false, error: data.detail || 'Failed to create admin' };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create admin' 
    };
  }
}

/**
 * List all admin users (requires admin authentication).
 */
export async function listAdmins(): Promise<{ items: UserProfile[] }> {
  const response = await authFetch('/admin/users');
  
  if (!response.ok) {
    const data = await response.json();
    throw new AuthApiError(data.detail || 'Failed to list admins', response.status);
  }
  
  const data = await response.json();
  return { items: data };
}

/**
 * Create a new admin (alias for createAdminUser with different return type).
 */
export async function createAdmin(
  params: { email: string; password: string; username?: string; fullName?: string }
): Promise<UserProfile> {
  const response = await authFetch('/admin/users', {
    method: 'POST',
    body: JSON.stringify({ email: params.email, password: params.password }),
  });
  
  if (!response.ok) {
    const data = await response.json();
    const error = new AuthApiError(data.detail || 'Failed to create admin', response.status);
    throw error;
  }
  
  return response.json();
}

/**
 * Deactivate a user (placeholder - implement based on your backend).
 */
export async function deactivateUser(userId: string): Promise<void> {
  const response = await authFetch(`/admin/users/${userId}/role?role=user`, {
    method: 'PATCH',
  });
  
  if (!response.ok) {
    const data = await response.json();
    throw new AuthApiError(data.detail || 'Failed to deactivate user', response.status);
  }
}

/**
 * Activate a user as admin (placeholder - implement based on your backend).
 */
export async function activateUser(userId: string): Promise<void> {
  const response = await authFetch(`/admin/users/${userId}/role?role=admin`, {
    method: 'PATCH',
  });
  
  if (!response.ok) {
    const data = await response.json();
    throw new AuthApiError(data.detail || 'Failed to activate user', response.status);
  }
}

/**
 * Get current user role from Supabase client.
 * 
 * This is a quick client-side check. For secure operations,
 * always verify with the backend using verifyAdminAccess().
 */
export async function getClientUserRole(): Promise<{
  isAuthenticated: boolean;
  role: UserRoleType;
  isAdmin: boolean;
}> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return {
      isAuthenticated: false,
      role: UserRole.USER,
      isAdmin: false,
    };
  }
  
  const role = getUserRole(user);
  
  return {
    isAuthenticated: true,
    role,
    isAdmin: role === UserRole.ADMIN,
  };
}
