'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  LogOut,
  Users,
  ChevronDown,
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { getAcademicYears } from '@/lib/api';
import { AcademicYear } from '@/types/family';

interface DashboardHeaderProps {
  selectedYear: AcademicYear | null;
  onYearChange: (year: AcademicYear) => void;
}

export default function DashboardHeader({
  selectedYear,
  onYearChange,
}: DashboardHeaderProps) {
  const router = useRouter();
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUserEmail(user?.email || null);
    };

    const loadAcademicYears = async () => {
      try {
        const years = await getAcademicYears();
        setAcademicYears(years);
        
        // If no year is selected, select the current year or the first available
        if (years.length > 0) {
          const currentYear = years.find((y) => y.is_current) || years[0];
          onYearChange(currentYear);
        }
      } catch (error) {
        console.error('Failed to load academic years:', error);
        // Create default year if none exist
        const defaultYear: AcademicYear = {
          id: 0,
          name: '2025-2026',
          is_current: true,
        };
        setAcademicYears([defaultYear]);
        onYearChange(defaultYear);
      }
    };

    loadAcademicYears();
    loadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSignOut = async () => {
    setIsLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left Section - Logo/Title */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Users className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">
                Admin Dashboard
              </h1>
            </div>
          </div>

          {/* Center Section - Academic Year Selector */}
          <div className="relative">
            <button
              onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
            >
              <span className="text-sm font-medium text-gray-700">
                {selectedYear?.name || 'Select Year'}
              </span>
              <ChevronDown
                className={`h-4 w-4 text-gray-500 transition-transform ${
                  isYearDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isYearDropdownOpen && (
              <div className="absolute top-full mt-1 right-0 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                {academicYears.map((year) => (
                  <button
                    key={year.id}
                    onClick={() => {
                      onYearChange(year);
                      setIsYearDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                      selectedYear?.id === year.id
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-700'
                    }`}
                  >
                    {year.name}
                    {year.is_current && (
                      <span className="ml-2 text-xs text-blue-600">(Current)</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Section - User & Sign Out */}
          <div className="flex items-center gap-4">
            {userEmail && (
              <span className="text-sm text-gray-600">{userEmail}</span>
            )}
            <button
              onClick={handleSignOut}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
