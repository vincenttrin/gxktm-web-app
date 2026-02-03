'use client';

import { useState } from 'react';
import { Users, GraduationCap, DollarSign, Calendar, Shield } from 'lucide-react';
import DashboardHeader, { DisplayYear } from './components/DashboardHeader';
import FamilyList from './components/FamilyList';
import ClassList from './components/ClassList';
import PaymentList from './components/PaymentList';
import SchoolYearManagement from './components/SchoolYearManagement';
import AdminManagement from './components/AdminManagement';
import Toast from './components/Toast';

type TabType = 'families' | 'classes' | 'payments' | 'school-years' | 'admin-users';

export default function DashboardPage() {
  const [selectedYear, setSelectedYear] = useState<DisplayYear | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('families');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  const tabs = [
    { id: 'families' as TabType, label: 'Families', icon: Users },
    { id: 'classes' as TabType, label: 'Classes', icon: GraduationCap },
    { id: 'payments' as TabType, label: 'Payments', icon: DollarSign },
    { id: 'school-years' as TabType, label: 'School Years', icon: Calendar },
    { id: 'admin-users' as TabType, label: 'Admin Users', icon: Shield },
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
        {activeTab === 'payments' && (
          <div className="p-6">
            <PaymentList selectedYear={selectedYear} />
          </div>
        )}
        {activeTab === 'school-years' && <SchoolYearManagement />}
        {activeTab === 'admin-users' && (
          <div className="p-6">
            <AdminManagement onShowToast={showToast} />
          </div>
        )}
      </main>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
