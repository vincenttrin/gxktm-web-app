'use client';

import { useState } from 'react';
import DashboardHeader from './components/DashboardHeader';
import FamilyList from './components/FamilyList';
import { AcademicYear } from '@/types/family';

export default function DashboardPage() {
  const [selectedYear, setSelectedYear] = useState<AcademicYear | null>(null);

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader
        selectedYear={selectedYear}
        onYearChange={setSelectedYear}
      />
      <main>
        <FamilyList selectedYear={selectedYear} />
      </main>
    </div>
  );
}
