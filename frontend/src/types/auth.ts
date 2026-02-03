/**
 * User Role Types
 * 
 * Defines the role-based access control types for the application.
 */

export type UserRole = 'admin' | 'user';

export interface UserInfo {
  id: string;
  email: string;
  role: UserRole;
  isAdmin: boolean;
}

export interface AuthState {
  user: UserInfo | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
}
