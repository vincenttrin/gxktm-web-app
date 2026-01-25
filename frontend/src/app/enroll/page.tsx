'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function EnrollmentLandingPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const supabase = createClient();
      
      // Send magic link with redirect to enrollment auth callback
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/enroll/auth/callback`,
        },
      });

      if (error) {
        throw error;
      }

      setMessage({
        type: 'success',
        text: 'Check your email! We\'ve sent you a magic link to continue with enrollment.',
      });
      setEmail('');
    } catch (error) {
      console.error('Error sending magic link:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to send magic link. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="w-full max-w-md text-center mb-8">
        <div className="mx-auto h-16 w-16 rounded-full bg-blue-600 flex items-center justify-center mb-4">
          <svg
            className="h-8 w-8 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
          Student Enrollment
        </h1>
        <p className="mt-3 text-gray-600">
          Enroll your children in our Vietnamese language and religious education classes
        </p>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Get Started
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            Enter your email address and we&apos;ll send you a secure link to access the enrollment portal.
          </p>

          {/* Success/Error Message */}
          {message && (
            <div
              className={`mb-6 p-4 rounded-lg border ${
                message.type === 'success'
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              <div className="flex items-start gap-3">
                {message.type === 'success' ? (
                  <svg className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <p className="text-sm">{message.text}</p>
              </div>
            </div>
          )}

          {/* Email Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-all"
                placeholder="parent@example.com"
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Sending...
                </>
              ) : (
                <>
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Send Magic Link
                </>
              )}
            </button>
          </form>

          {/* Info Box */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <h3 className="text-sm font-medium text-blue-900 mb-2">
              How it works:
            </h3>
            <ol className="text-sm text-blue-700 space-y-1.5 list-decimal list-inside">
              <li>Enter your email address</li>
              <li>Click the link we send to your email</li>
              <li>Complete the enrollment for your children</li>
            </ol>
          </div>
        </div>

        {/* Program Info Cards */}
        <div className="mt-8 grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center mb-3">
              <span className="text-lg">📖</span>
            </div>
            <h3 className="font-semibold text-gray-900 text-sm">Giáo Lý</h3>
            <p className="text-xs text-gray-500 mt-1">Religious Education Classes (Levels 1-9)</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center mb-3">
              <span className="text-lg">🇻🇳</span>
            </div>
            <h3 className="font-semibold text-gray-900 text-sm">Việt Ngữ</h3>
            <p className="text-xs text-gray-500 mt-1">Vietnamese Language Classes (Levels 1-9)</p>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-gray-500">
          Need help? Contact us at{' '}
          <a href="mailto:support@gxktm.org" className="text-blue-600 hover:underline">
            support@gxktm.org
          </a>
        </p>
      </div>
    </div>
  );
}
