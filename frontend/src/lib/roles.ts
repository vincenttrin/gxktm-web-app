/**
 * User role types and utilities for role-based access control.
 */

// User role constants
export const UserRole = {
  ADMIN: 'admin',
  USER: 'user',
} as const;

export type UserRoleType = typeof UserRole[keyof typeof UserRole];

// User interface with role information
export interface AuthUser {
  id: string;
  email?: string;
  role: UserRoleType;
  app_metadata?: {
    role?: string;
  };
  user_metadata?: {
    role?: string;
  };
}

/**
 * Extract user role from Supabase user object.
 * 
 * Checks app_metadata first (set by admin), then user_metadata.
 * Defaults to 'user' if no role is found.
 */
export function getUserRole(user: { 
  app_metadata?: { role?: string }; 
  user_metadata?: { role?: string } 
} | null): UserRoleType {
  if (!user) return UserRole.USER;
  
  // Check app_metadata first (this is the authoritative source)
  const appRole = user.app_metadata?.role;
  if (appRole === UserRole.ADMIN || appRole === UserRole.USER) {
    return appRole;
  }
  
  // Fall back to user_metadata
  const userRole = user.user_metadata?.role;
  if (userRole === UserRole.ADMIN || userRole === UserRole.USER) {
    return userRole;
  }
  
  return UserRole.USER;
}

/**
 * Check if user has admin role.
 */
export function isAdmin(user: { 
  app_metadata?: { role?: string }; 
  user_metadata?: { role?: string } 
} | null): boolean {
  return getUserRole(user) === UserRole.ADMIN;
}

/**
 * Check if user has a specific role.
 */
export function hasRole(
  user: { 
    app_metadata?: { role?: string }; 
    user_metadata?: { role?: string } 
  } | null, 
  role: UserRoleType
): boolean {
  return getUserRole(user) === role;
}
