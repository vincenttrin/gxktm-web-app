'use client';

import Image from 'next/image';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { useTranslation, LanguageToggle } from '@/lib/i18n';

interface WizardHeaderProps {
  userEmail?: string | null;
  familyName?: string | null;
  academicYear?: string | null;
}

export function WizardHeader({ userEmail, familyName, academicYear }: WizardHeaderProps) {
  const router = useRouter();
  const { t } = useTranslation();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/enroll');
  };
  
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Title */}
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 relative">
              <Image
                src="/icon.png"
                alt="Logo"
                fill
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                {t('wizard.title')}
              </h1>
              {academicYear && (
                <p className="text-xs text-gray-500">{academicYear}</p>
              )}
            </div>
          </div>
          
          {/* User info & Sign out */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              {familyName && (
                <p className="text-sm font-medium text-gray-900">{familyName}</p>
              )}
              {userEmail && (
                <p className="text-xs text-gray-500">{userEmail}</p>
              )}
            </div>
            <LanguageToggle />
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {t('common.signOut')}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
