'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { UserRoleType, UserRole } from '@/lib/roles';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRoleType;
  redirectTo?: string;
  loadingComponent?: React.ReactNode;
}

/**
 * ProtectedRoute component that wraps pages requiring authentication.
 * 
 * Usage:
 * ```tsx
 * // Require any authenticated user
 * <ProtectedRoute>
 *   <MyPage />
 * </ProtectedRoute>
 * 
 * // Require admin role
 * <ProtectedRoute requiredRole="admin">
 *   <AdminPage />
 * </ProtectedRoute>
 * 
 * // Custom redirect
 * <ProtectedRoute requiredRole="admin" redirectTo="/unauthorized">
 *   <AdminPage />
 * </ProtectedRoute>
 * ```
 */
export function ProtectedRoute({
  children,
  requiredRole,
  redirectTo,
  loadingComponent,
}: ProtectedRouteProps) {
  const { user, role, isLoading } = useAuth();
  const router = useRouter();

  // Compute authorization status
  const isAuthorized = useMemo(() => {
    if (isLoading) return false;
    if (!user) return false;
    if (requiredRole && role !== requiredRole) return false;
    return true;
  }, [user, role, isLoading, requiredRole]);

  useEffect(() => {
    if (isLoading) return;

    // Not authenticated
    if (!user) {
      const defaultRedirect = requiredRole === UserRole.ADMIN 
        ? '/admin/login' 
        : '/enroll';
      router.replace(redirectTo || defaultRedirect);
      return;
    }

    // Check role if required
    if (requiredRole && role !== requiredRole) {
      const defaultRedirect = requiredRole === UserRole.ADMIN 
        ? '/enroll/wizard?error=unauthorized' 
        : '/';
      router.replace(redirectTo || defaultRedirect);
    }
  }, [user, role, isLoading, requiredRole, redirectTo, router]);

  // Show loading state
  if (isLoading || !isAuthorized) {
    return loadingComponent || <DefaultLoadingComponent />;
  }

  return <>{children}</>;
}

/**
 * AdminRoute - shorthand for ProtectedRoute with admin role requirement.
 */
export function AdminRoute({
  children,
  redirectTo = '/admin/login',
  loadingComponent,
}: Omit<ProtectedRouteProps, 'requiredRole'>) {
  return (
    <ProtectedRoute
      requiredRole={UserRole.ADMIN}
      redirectTo={redirectTo}
      loadingComponent={loadingComponent}
    >
      {children}
    </ProtectedRoute>
  );
}

/**
 * UserRoute - requires authentication but any role is allowed.
 */
export function UserRoute({
  children,
  redirectTo = '/enroll',
  loadingComponent,
}: Omit<ProtectedRouteProps, 'requiredRole'>) {
  return (
    <ProtectedRoute
      redirectTo={redirectTo}
      loadingComponent={loadingComponent}
    >
      {children}
    </ProtectedRoute>
  );
}

function DefaultLoadingComponent() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  );
}
