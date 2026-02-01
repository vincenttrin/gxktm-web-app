/**
 * Server-side role utilities for Supabase authentication.
 * Use these in Server Components and Server Actions.
 */

import { createClient } from '@/utils/supabase/server';
import { UserRole, UserRoleType } from '@/lib/roles';
import { redirect } from 'next/navigation';

/**
 * Get user role from server-side Supabase client.
 */
function getUserRoleFromUser(user: { 
  app_metadata?: { role?: string }; 
  user_metadata?: { role?: string } 
} | null): UserRoleType {
  if (!user) return UserRole.USER;
  return (user.app_metadata?.role || user.user_metadata?.role || UserRole.USER) as UserRoleType;
}

/**
 * Get the current user and their role from the server.
 * 
 * @returns User object with role, or null if not authenticated
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;
  
  const role = getUserRoleFromUser(user);
  
  return {
    id: user.id,
    email: user.email,
    role,
    isAdmin: role === UserRole.ADMIN,
    raw: user,
  };
}

/**
 * Require authentication for a server component or action.
 * Redirects to login if not authenticated.
 * 
 * @param redirectTo - Where to redirect if not authenticated
 * @returns The authenticated user
 */
export async function requireAuth(redirectTo: string = '/admin/login') {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect(redirectTo);
  }
  
  return user;
}

/**
 * Require admin role for a server component or action.
 * Redirects if not authenticated or not an admin.
 * 
 * @param redirectTo - Where to redirect if not admin
 * @returns The authenticated admin user
 */
export async function requireAdmin(redirectTo: string = '/admin/login') {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/admin/login');
  }
  
  if (!user.isAdmin) {
    redirect(redirectTo);
  }
  
  return user;
}

/**
 * Check if current user is admin without redirecting.
 * 
 * @returns True if user is an admin, false otherwise
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.isAdmin ?? false;
}

/**
 * Get the current session from the server.
 */
export async function getCurrentSession() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}
