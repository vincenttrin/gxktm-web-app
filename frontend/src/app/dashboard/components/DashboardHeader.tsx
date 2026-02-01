'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  LogOut,
  Users,
  ChevronDown,
  Calendar,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { getSchoolYears, getAcademicYears } from '@/lib/api';

// Unified year type that works with both SchoolYear and AcademicYear
export interface DisplayYear {
  id: number;
  name: string;
  is_current: boolean;
  is_active?: boolean;
  status?: string;
  school_year_id?: number;  // If from SchoolYear model
}

interface DashboardHeaderProps {
  selectedYear: DisplayYear | null;
  onYearChange: (year: DisplayYear) => void;
}

export default function DashboardHeader({
  selectedYear,
  onYearChange,
}: DashboardHeaderProps) {
  const router = useRouter();
  const [displayYears, setDisplayYears] = useState<DisplayYear[]>([]);
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUserEmail(user?.email || null);
    };

    const loadYears = async () => {
      try {
        // Try to load from new SchoolYear model first
        const schoolYears = await getSchoolYears();
        
        if (schoolYears && schoolYears.length > 0) {
          // Convert SchoolYear to DisplayYear
          const years: DisplayYear[] = schoolYears.map(sy => ({
            id: sy.id,
            name: sy.name,
            is_current: sy.is_current,
            is_active: sy.is_active,
            status: sy.status,
            school_year_id: sy.id,
          }));
          setDisplayYears(years);
          
          // Default to the newest year (first in list, sorted by start_year desc)
          // The newest year is what both admin and parents should see by default
          const newestYear = years[0];
          onYearChange(newestYear);
          return;
        }
      } catch {
        console.log('SchoolYear API not available, falling back to AcademicYear');
      }
      
      // Fall back to legacy AcademicYear
      try {
        const academicYears = await getAcademicYears();
        
        if (academicYears && academicYears.length > 0) {
          const years: DisplayYear[] = academicYears.map(ay => ({
            id: ay.id,
            name: ay.name,
            is_current: ay.is_current,
          }));
          setDisplayYears(years);
          
          const currentYear = years.find(y => y.is_current) || years[0];
          onYearChange(currentYear);
          return;
        }
      } catch (error) {
        console.error('Failed to load years:', error);
      }
      
      // Create default year if nothing exists
      const defaultYear: DisplayYear = {
        id: 0,
        name: '2025-2026',
        is_current: true,
      };
      setDisplayYears([defaultYear]);
      onYearChange(defaultYear);
    };

    loadYears();
    loadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSignOut = async () => {
    setIsLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  const getYearBadge = (year: DisplayYear) => {
    if (year.status === 'active' || year.is_active) {
      return (
        <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
          <CheckCircle className="h-3 w-3" />
          Active
        </span>
      );
    }
    if (year.status === 'upcoming') {
      return (
        <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
          <Clock className="h-3 w-3" />
          Upcoming
        </span>
      );
    }
    if (year.is_current) {
      return (
        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
          Current
        </span>
      );
    }
    return null;
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

          {/* Center Section - School Year Selector */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
              >
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  {selectedYear?.name || 'Select Year'}
                </span>
                {selectedYear && getYearBadge(selectedYear)}
                <ChevronDown
                  className={`h-4 w-4 text-gray-500 transition-transform ${
                    isYearDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isYearDropdownOpen && (
                <div className="absolute top-full mt-1 right-0 w-64 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                  <div className="px-3 py-2 border-b border-gray-100">
                    <p className="text-xs font-medium text-gray-500 uppercase">School Years</p>
                  </div>
                  {displayYears.map((year) => (
                    <button
                      key={year.id}
                      onClick={() => {
                        onYearChange(year);
                        setIsYearDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center justify-between ${
                        selectedYear?.id === year.id
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'text-gray-700'
                      }`}
                    >
                      <span>{year.name}</span>
                      {getYearBadge(year)}
                    </button>
                  ))}
                </div>
              )}
            </div>
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
