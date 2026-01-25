'use client';

import { ReactNode } from 'react';

interface WizardNavigationProps {
  onBack?: () => void;
  onNext?: () => void;
  onSubmit?: () => void;
  backLabel?: string;
  nextLabel?: string;
  submitLabel?: string;
  showBack?: boolean;
  showNext?: boolean;
  showSubmit?: boolean;
  isLoading?: boolean;
  isNextDisabled?: boolean;
  children?: ReactNode;
}

export function WizardNavigation({
  onBack,
  onNext,
  onSubmit,
  backLabel = 'Back',
  nextLabel = 'Continue',
  submitLabel = 'Submit Enrollment',
  showBack = true,
  showNext = true,
  showSubmit = false,
  isLoading = false,
  isNextDisabled = false,
  children,
}: WizardNavigationProps) {
  return (
    <div className="mt-8 pt-6 border-t border-gray-200">
      <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-4">
        {/* Back button */}
        <div>
          {showBack && onBack && (
            <button
              type="button"
              onClick={onBack}
              disabled={isLoading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {backLabel}
            </button>
          )}
        </div>
        
        {/* Custom content in the middle */}
        {children}
        
        {/* Next/Submit button */}
        <div className="flex gap-3">
          {showNext && onNext && (
            <button
              type="button"
              onClick={onNext}
              disabled={isLoading || isNextDisabled}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Loading...
                </>
              ) : (
                <>
                  {nextLabel}
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          )}
          
          {showSubmit && onSubmit && (
            <button
              type="button"
              onClick={onSubmit}
              disabled={isLoading || isNextDisabled}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Submitting...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {submitLabel}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
