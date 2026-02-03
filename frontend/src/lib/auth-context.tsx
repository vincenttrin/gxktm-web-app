'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { UserInfo, UserRole } from '@/types/auth';

interface AuthContextType {
  user: UserInfo | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  refreshUser: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Extract role from Supabase user metadata
 */
function getUserRole(userMetadata: Record<string, unknown> | undefined): UserRole {
  if (!userMetadata) return 'user';
  return (userMetadata.role as UserRole) || 'user';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  const refreshUser = useCallback(async () => {
    try {
      const { data: { user: supabaseUser }, error } = await supabase.auth.getUser();
      
      if (error || !supabaseUser) {
        setUser(null);
        return;
      }

      const role = getUserRole(supabaseUser.user_metadata);
      
      setUser({
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        role,
        isAdmin: role === 'admin',
      });
    } catch (error) {
      console.error('Error refreshing user:', error);
      setUser(null);
    }
  }, [supabase.auth]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, [supabase.auth]);

  useEffect(() => {
    // Initial user fetch
    const initializeAuth = async () => {
      setIsLoading(true);
      await refreshUser();
      setIsLoading(false);
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            const role = getUserRole(session.user.user_metadata);
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              role,
              isAdmin: role === 'admin',
            });
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshUser, supabase.auth]);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.isAdmin ?? false,
    refreshUser,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth context
 * @throws Error if used outside of AuthProvider
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Hook to check if current user is admin
 * Returns loading state and admin status
 */
export function useIsAdmin(): { isAdmin: boolean; isLoading: boolean } {
  const { isAdmin, isLoading } = useAuth();
  return { isAdmin, isLoading };
}

/**
 * Hook to require admin access
 * Returns user info if admin, throws or returns null otherwise
 */
export function useRequireAdmin(): { user: UserInfo | null; isLoading: boolean; isAuthorized: boolean } {
  const { user, isLoading, isAdmin } = useAuth();
  
  return {
    user: isAdmin ? user : null,
    isLoading,
    isAuthorized: isAdmin,
  };
}
