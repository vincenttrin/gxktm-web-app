'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  Download,
  DollarSign,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  Filter,
  X,
} from 'lucide-react';
import { getEnrolledFamilies, getEnrolledFamiliesSummary, markFamilyAsPaid, getPaymentsExportUrl } from '@/lib/api';
import {
  EnrolledFamilyPayment,
  EnrolledFamiliesSummary,
  PaymentStatus,
  AcademicYear,
} from '@/types/family';
import { vietnameseMatch } from '@/utils/vietnamese';
import Toast from './Toast';

interface PaymentListProps {
  selectedYear: AcademicYear | null;
}

export default function PaymentList({ selectedYear }: PaymentListProps) {
  const [allFamilies, setAllFamilies] = useState<EnrolledFamilyPayment[]>([]);
  const [summary, setSummary] = useState<EnrolledFamiliesSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [academicYearName, setAcademicYearName] = useState<string>('');
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | ''>('');
  
  // Toast
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);
  
  // Mark as paid loading state
  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null);

  const loadEnrolledFamilies = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const [familiesResponse, summaryResponse] = await Promise.all([
        getEnrolledFamilies(),
        getEnrolledFamiliesSummary(),
      ]);
      
      setAllFamilies(familiesResponse.items);
      setAcademicYearName(familiesResponse.academic_year_name);
      setSummary(summaryResponse);
    } catch (err) {
      console.error('Failed to load enrolled families:', err);
      setError('Failed to load enrolled families. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEnrolledFamilies();
  }, [loadEnrolledFamilies]);

  // Client-side filtering with Vietnamese character support
  const filteredFamilies = useMemo(() => {
    let result = allFamilies;
    
    // Filter by payment status
    if (statusFilter) {
      result = result.filter(f => f.payment_status === statusFilter);
    }
    
    // Filter by search query with Vietnamese character support
    if (searchQuery.trim()) {
      const query = searchQuery.trim();
      result = result.filter(family => {
        // Search in family name
        if (family.family_name && vietnameseMatch(family.family_name, query)) {
          return true;
        }
        
        // Search in guardian names
        if (family.guardians.some(g => vietnameseMatch(g.name, query))) {
          return true;
        }
        
        // Search in student names
        if (family.students.some(s => 
          vietnameseMatch(s.first_name, query) || 
          vietnameseMatch(s.last_name, query) ||
          vietnameseMatch(`${s.first_name} ${s.last_name}`, query)
        )) {
          return true;
        }
        
        return false;
      });
    }
    
    return result;
  }, [allFamilies, statusFilter, searchQuery]);

  const handleExport = () => {
    const url = getPaymentsExportUrl(academicYearName, statusFilter || undefined);
    window.open(url, '_blank');
    setToast({ message: 'Export started', type: 'success' });
    setTimeout(() => setToast(null), 2000);
  };

  const handleMarkAsPaid = async (familyId: string, familyName: string | null) => {
    setMarkingPaidId(familyId);
    try {
      await markFamilyAsPaid(familyId, academicYearName);
      
      // Update local state
      setAllFamilies(prev => prev.map(f => 
        f.id === familyId 
          ? { ...f, payment_status: 'paid' as PaymentStatus, payment_date: new Date().toISOString() }
          : f
      ));
      
      // Update summary
      if (summary) {
        setSummary({
          ...summary,
          paid_count: summary.paid_count + 1,
          unpaid_count: Math.max(0, summary.unpaid_count - 1),
        });
      }
      
      setToast({ 
        message: `Marked ${familyName || 'Family'} as paid`, 
        type: 'success' 
      });
    } catch (err) {
      console.error('Failed to mark as paid:', err);
      setToast({ message: 'Failed to mark as paid', type: 'error' });
    } finally {
      setMarkingPaidId(null);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
            <CheckCircle className="h-3 w-3" />
            Paid
          </span>
        );
      case 'partial':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">
            <Clock className="h-3 w-3" />
            Partial
          </span>
        );
      case 'refunded':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
            Refunded
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
            <AlertCircle className="h-3 w-3" />
            Unpaid
          </span>
        );
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Payment Tracking</h2>
          <p className="text-sm text-gray-500 mt-1">
            {academicYearName} • Families with enrolled students
          </p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Download className="h-5 w-5" />
          Export CSV
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Enrolled Families</p>
                <p className="text-xl font-bold text-gray-900">{summary.total_enrolled_families}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Paid</p>
                <p className="text-xl font-bold text-green-600">{summary.paid_count}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Partial</p>
                <p className="text-xl font-bold text-yellow-600">{summary.partial_count}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Unpaid</p>
                <p className="text-xl font-bold text-red-600">{summary.unpaid_count}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Collection Summary */}
      {summary && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <DollarSign className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-blue-600 font-medium">Collection Summary</p>
                <p className="text-2xl font-bold text-blue-900">
                  ${summary.total_amount_paid.toLocaleString()}
                  <span className="text-lg text-blue-600 font-normal">
                    {' '}/ ${summary.total_amount_due.toLocaleString()}
                  </span>
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-600">Collection Rate</p>
              <p className="text-2xl font-bold text-blue-900">
                {summary.total_amount_due > 0
                  ? Math.round((summary.total_amount_paid / summary.total_amount_due) * 100)
                  : 0}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          {/* Search Bar */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by family name, parent name, or child name... (supports Vietnamese)"
              className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>
            )}
          </div>
          
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as PaymentStatus | '')}
              className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-sm"
            >
              <option value="">All Status</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </div>
        </div>
        
        {/* Results Count */}
        <div className="mt-3 flex items-center justify-between text-sm text-gray-500">
          <span>
            Showing <span className="font-medium text-gray-900">{filteredFamilies.length}</span>
            {filteredFamilies.length !== allFamilies.length && (
              <> of {allFamilies.length}</>
            )} families with enrollments
          </span>
          {(searchQuery || statusFilter) && (
            <button
              onClick={() => { setSearchQuery(''); setStatusFilter(''); }}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear all filters
            </button>
          )}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
          <button onClick={loadEnrolledFamilies} className="ml-2 underline hover:no-underline">
            Try again
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading enrolled families...</span>
        </div>
      )}

      {/* Families Table */}
      {!isLoading && !error && filteredFamilies.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Family
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Parents / Guardians
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Children
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Enrolled
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredFamilies.map((family) => (
                <tr key={family.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {family.family_name || 'Unnamed Family'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600">
                      {family.guardians.length > 0 
                        ? family.guardians.map(g => g.name).join(', ')
                        : '-'
                      }
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600">
                      {family.students.length > 0
                        ? family.students.map(s => `${s.first_name} ${s.last_name}`).join(', ')
                        : '-'
                      }
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      {family.enrolled_count}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(family.payment_status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm">
                      <span className="font-medium text-gray-900">
                        ${family.amount_paid}
                      </span>
                      {family.amount_due && (
                        <span className="text-gray-500">
                          {' '}/ ${family.amount_due}
                        </span>
                      )}
                    </div>
                    {family.payment_date && (
                      <div className="text-xs text-gray-400">
                        {new Date(family.payment_date).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {family.payment_status !== 'paid' && (
                      <button
                        onClick={() => handleMarkAsPaid(family.id, family.family_name)}
                        disabled={markingPaidId === family.id}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {markingPaidId === family.id ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-3 w-3" />
                            Mark Paid
                          </>
                        )}
                      </button>
                    )}
                    {family.payment_status === 'paid' && (
                      <span className="text-xs text-gray-400">Paid</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredFamilies.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          {allFamilies.length === 0 ? (
            <>
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No enrolled families found</h3>
              <p className="text-gray-500">
                No families have students enrolled in classes for {academicYearName || 'the current year'}.
              </p>
            </>
          ) : (
            <>
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No matching families</h3>
              <p className="text-gray-500 mb-4">
                No families match your search criteria
              </p>
              <button
                onClick={() => { setSearchQuery(''); setStatusFilter(''); }}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear filters
              </button>
            </>
          )}
        </div>
      )}

      {/* Toast */}
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
