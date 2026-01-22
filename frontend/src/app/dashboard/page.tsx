'use client';

import { useState } from 'react';
import { Users, GraduationCap } from 'lucide-react';
import DashboardHeader from './components/DashboardHeader';
import FamilyList from './components/FamilyList';
import ClassList from './components/ClassList';
import { AcademicYear } from '@/types/family';

type TabType = 'families' | 'classes';

export default function DashboardPage() {
  const [selectedYear, setSelectedYear] = useState<AcademicYear | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('families');

  const tabs = [
    { id: 'families' as TabType, label: 'Families', icon: Users },
    { id: 'classes' as TabType, label: 'Classes', icon: GraduationCap },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader
        selectedYear={selectedYear}
        onYearChange={setSelectedYear}
      />
      
      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6">
          <nav className="flex gap-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 border-b-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <main>
        {activeTab === 'families' && <FamilyList selectedYear={selectedYear} />}
        {activeTab === 'classes' && <ClassList selectedYear={selectedYear} />}
      </main>
    </div>
  );
}
