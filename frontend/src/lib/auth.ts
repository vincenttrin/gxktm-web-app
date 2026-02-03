import { createClient } from '@/utils/supabase/server';
import { UserInfo, UserRole } from '@/types/auth';

/**
 * Get the current user's info including role from the server
 * Use this in Server Components and Server Actions
 */
export async function getCurrentUser(): Promise<UserInfo | null> {
  const supabase = await createClient();
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }
  
  const role = (user.user_metadata?.role as UserRole) || 'user';
  
  return {
    id: user.id,
    email: user.email || '',
    role,
    isAdmin: role === 'admin',
  };
}

/**
 * Check if current user is an admin (server-side)
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.isAdmin ?? false;
}

/**
 * Get current user's access token for API calls
 */
export async function getAccessToken(): Promise<string | null> {
  const supabase = await createClient();
  
  const { data: { session } } = await supabase.auth.getSession();
  
  return session?.access_token ?? null;
}

/**
 * Require admin access - throws redirect if not admin
 */
export async function requireAdmin(): Promise<UserInfo> {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('Authentication required');
  }
  
  if (!user.isAdmin) {
    throw new Error('Admin access required');
  }
  
  return user;
}
