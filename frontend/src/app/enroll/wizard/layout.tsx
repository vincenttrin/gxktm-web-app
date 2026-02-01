'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { EnrollmentProvider } from './EnrollmentContext';
import { useAuth } from '@/contexts/AuthContext';
import { verifyMagicLink, AuthApiError } from '@/lib/authApi';

export default function WizardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, isParentUser, login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for magic link token in URL
    const token = searchParams.get('token');
    
    if (token && !isAuthenticated) {
      // Verify magic link token
      setIsVerifying(true);
      verifyMagicLink(token)
        .then(({ user }) => {
          login(user);
          // Remove token from URL
          router.replace('/enroll/wizard');
        })
        .catch((err) => {
          if (err instanceof AuthApiError) {
            setError(err.message);
          } else {
            setError('Failed to verify magic link. Please try again.');
          }
          // Redirect to enrollment landing after showing error
          setTimeout(() => {
            router.push('/enroll');
          }, 3000);
        })
        .finally(() => {
          setIsVerifying(false);
        });
    }
  }, [searchParams, isAuthenticated, login, router]);

  // Show verifying state
  if (isVerifying) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying your access...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mx-auto h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <svg
              className="h-8 w-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Verification Failed</h2>
          <p className="mt-2 text-gray-600">{error}</p>
          <p className="mt-4 text-sm text-gray-500">Redirecting to enrollment page...</p>
        </div>
      </div>
    );
  }

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to enrollment landing
  if (!isAuthenticated) {
    // Don't redirect immediately - let the token verification happen
    const token = searchParams.get('token');
    if (!token) {
      router.push('/enroll');
      return null;
    }
    return null;
  }

  // If authenticated but not a parent (is an admin), show message
  if (!isParentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mx-auto h-16 w-16 rounded-full bg-yellow-100 flex items-center justify-center mb-4">
            <svg
              className="h-8 w-8 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Access Restricted</h2>
          <p className="mt-2 text-gray-600">
            The enrollment wizard is for parents only. 
            As an admin, please use the dashboard for enrollment management.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <EnrollmentProvider>
      {children}
    </EnrollmentProvider>
  );
}
