'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  Users,
  DollarSign,
  CreditCard,
  ChevronDown,
  ChevronRight,
  X,
  Check,
  GraduationCap,
  BookOpen,
  RefreshCw,
} from 'lucide-react';
import {
  getEnrolledFamilies,
  getEnrolledFamiliesSummary,
  markFamilyAsPaid,
  getClasses,
  manualEnrollStudent,
} from '@/lib/api';
import {
  EnrolledFamilyPayment,
  EnrolledFamiliesSummary,
  PaymentStatus,
  StudentWithEnrollmentStatus,
  ClassItem,
} from '@/types/family';
import { vietnameseMatch } from '@/utils/vietnamese';
import Toast from './Toast';

interface ToastState {
  message: string;
  type: 'success' | 'error';
}

interface EnrollingStudent {
  id: string;
  name: string;
  familyId: string;
}

export default function PaymentList() {
  const [families, setFamilies] = useState<EnrolledFamilyPayment[]>([]);
  const [summary, setSummary] = useState<EnrolledFamiliesSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>('all');
  const [academicYearName, setAcademicYearName] = useState<string>('');
  const [academicYearId, setAcademicYearId] = useState<number | null>(null);

  // Modal states
  const [selectedFamily, setSelectedFamily] = useState<EnrolledFamilyPayment | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  // Expand/collapse state
  const [expandedFamilyIds, setExpandedFamilyIds] = useState<Set<string>>(new Set());

  // Enrollment modal state
  const [enrollingStudent, setEnrollingStudent] = useState<EnrollingStudent | null>(null);
  const [availableClasses, setAvailableClasses] = useState<ClassItem[]>([]);
  const [selectedClassIds, setSelectedClassIds] = useState<Set<string>>(new Set());
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [familiesData, summaryData] = await Promise.all([
        getEnrolledFamilies(),
        getEnrolledFamiliesSummary(),
      ]);

      setFamilies(familiesData.items);
      setSummary(summaryData);
      setAcademicYearName(familiesData.academic_year_name);
      setAcademicYearId(familiesData.academic_year_id);
    } catch (error) {
      console.error('Failed to load payment data:', error);
      showToast('Failed to load payment data', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const toggleFamilyExpand = (familyId: string) => {
    setExpandedFamilyIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(familyId)) {
        newSet.delete(familyId);
      } else {
        newSet.add(familyId);
      }
      return newSet;
    });
  };

  const handleEnrollClick = async (student: StudentWithEnrollmentStatus, familyId: string) => {
    setEnrollingStudent({
      id: student.id,
      name: `${student.first_name} ${student.last_name}`,
      familyId,
    });
    setSelectedClassIds(new Set());
    setIsLoadingClasses(true);

    try {
      if (academicYearId) {
        const classes = await getClasses({ academic_year_id: academicYearId });
        // Filter out classes the student is already enrolled in
        const enrolledClassIds = new Set(student.enrolled_classes.map((c) => c.id));
        const availableForEnrollment = classes.filter((c) => !enrolledClassIds.has(c.id));
        setAvailableClasses(availableForEnrollment);
      }
    } catch (error) {
      console.error('Failed to load classes:', error);
      showToast('Failed to load available classes', 'error');
      setEnrollingStudent(null);
    } finally {
      setIsLoadingClasses(false);
    }
  };

  const handleClassToggle = (classId: string) => {
    setSelectedClassIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(classId)) {
        newSet.delete(classId);
      } else {
        newSet.add(classId);
      }
      return newSet;
    });
  };

  const handleEnrollSubmit = async () => {
    if (!enrollingStudent || selectedClassIds.size === 0) return;

    setIsEnrolling(true);
    try {
      const result = await manualEnrollStudent({
        student_id: enrollingStudent.id,
        class_ids: Array.from(selectedClassIds),
      });
      showToast(result.message, 'success');
      setEnrollingStudent(null);
      loadData(); // Refresh to show updated enrollment
    } catch (error) {
      console.error('Failed to enroll student:', error);
      showToast('Failed to enroll student', 'error');
    } finally {
      setIsEnrolling(false);
    }
  };

  const handlePaymentClick = (family: EnrolledFamilyPayment) => {
    setSelectedFamily(family);
    setPaymentAmount(family.amount_due?.toString() || family.amount_paid?.toString() || '');
    setPaymentMethod('cash');
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSubmit = async () => {
    if (!selectedFamily || !paymentAmount) return;

    setIsSubmittingPayment(true);
    try {
      await markFamilyAsPaid(
        selectedFamily.id,
        academicYearName,
        parseFloat(paymentAmount),
        paymentMethod
      );
      showToast('Payment recorded successfully', 'success');
      setIsPaymentModalOpen(false);
      setSelectedFamily(null);
      loadData();
    } catch (error) {
      console.error('Failed to record payment:', error);
      showToast('Failed to record payment', 'error');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  // Group classes by program for the enrollment modal
  const groupedClasses = useMemo(() => {
    return availableClasses.reduce((acc, classItem) => {
      const programName = classItem.program?.name || 'Other';
      if (!acc[programName]) {
        acc[programName] = [];
      }
      acc[programName].push(classItem);
      return acc;
    }, {} as Record<string, ClassItem[]>);
  }, [availableClasses]);

  // Filter families based on search and status
  const filteredFamilies = useMemo(() => {
    return families.filter((family) => {
      // Status filter
      if (statusFilter !== 'all' && family.payment_status !== statusFilter) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const familyNameMatch = vietnameseMatch(family.family_name || '', searchQuery);
        const guardianMatch = family.guardians.some((g) =>
          vietnameseMatch(g.name, searchQuery)
        );
        const studentMatch = family.students.some((s) =>
          vietnameseMatch(`${s.first_name} ${s.last_name}`, searchQuery)
        );
        return familyNameMatch || guardianMatch || studentMatch;
      }

      return true;
    });
  }, [families, statusFilter, searchQuery]);

  const getStatusBadge = (status: PaymentStatus) => {
    const styles = {
      paid: 'bg-green-100 text-green-700',
      partial: 'bg-yellow-100 text-yellow-700',
      unpaid: 'bg-red-100 text-red-700',
      refunded: 'bg-gray-100 text-gray-700',
    };
    const labels = {
      paid: 'Paid',
      partial: 'Partial',
      unpaid: 'Unpaid',
      refunded: 'Refunded',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Payment Tracking</h2>
          <p className="text-gray-500 mt-1">
            {academicYearName} - Enrolled families with children
          </p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Families</p>
                <p className="text-2xl font-bold text-gray-900">
                  {summary.total_enrolled_families}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Check className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Fully Paid</p>
                <p className="text-2xl font-bold text-gray-900">{summary.paid_count}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <CreditCard className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Partial</p>
                <p className="text-2xl font-bold text-gray-900">{summary.partial_count}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Unpaid</p>
                <p className="text-2xl font-bold text-gray-900">{summary.unpaid_count}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-700" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search families, parents, or students..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-700"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as PaymentStatus | 'all')}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-700"
        >
          <option value="all">All Status</option>
          <option value="paid">Paid</option>
          <option value="partial">Partial</option>
          <option value="unpaid">Unpaid</option>
        </select>
      </div>

      {/* Family Cards */}
      <div className="space-y-4">
        {filteredFamilies.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No families found matching your criteria.</p>
          </div>
        ) : (
          filteredFamilies.map((family) => {
            const isExpanded = expandedFamilyIds.has(family.id);
            const enrolledStudents = family.students.filter((s) => s.is_enrolled);
            const unenrolledStudents = family.students.filter((s) => !s.is_enrolled);

            return (
              <div
                key={family.id}
                className="bg-white rounded-xl shadow-sm border overflow-hidden"
              >
                {/* Family Header */}
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleFamilyExpand(family.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      )}
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {family.family_name || 'Unknown Family'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {family.guardians.map((g) => g.name).join(', ') || 'No guardians'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-500">
                          {family.enrolled_count} enrolled student
                          {family.enrolled_count !== 1 ? 's' : ''}
                        </p>
                        <p className="font-medium text-gray-900">
                          {formatCurrency(family.amount_paid)} /{' '}
                          {formatCurrency(family.amount_due)}
                        </p>
                      </div>
                      {getStatusBadge(family.payment_status)}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePaymentClick(family);
                        }}
                        className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        Update
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Content - Students */}
                {isExpanded && (
                  <div className="border-t px-4 py-4 bg-gray-50">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Children</h4>
                    <div className="space-y-2">
                      {/* Enrolled Students */}
                      {enrolledStudents.map((student) => (
                        <div
                          key={student.id}
                          className="flex items-center justify-between p-3 bg-white rounded-lg border"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-1.5 bg-green-100 rounded-full">
                              <GraduationCap className="h-4 w-4 text-green-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {student.first_name} {student.last_name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {student.enrolled_classes.length > 0 ? (
                                  <>
                                    {student.enrolled_classes
                                      .map((c) => c.name)
                                      .join(', ')}
                                  </>
                                ) : (
                                  <span className="text-green-600">Enrolled</span>
                                )}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleEnrollClick(student, family.id)}
                            className="text-xs px-2 py-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          >
                            + Add Classes
                          </button>
                        </div>
                      ))}

                      {/* Unenrolled Students */}
                      {unenrolledStudents.map((student) => (
                        <div
                          key={student.id}
                          className="flex items-center justify-between p-3 bg-white rounded-lg border border-dashed border-gray-300"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-1.5 bg-gray-100 rounded-full">
                              <Users className="h-4 w-4 text-gray-400" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {student.first_name} {student.last_name}
                              </p>
                              <p className="text-xs text-red-500">
                                Not enrolled for {academicYearName}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleEnrollClick(student, family.id)}
                            className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                          >
                            Enroll
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Payment Modal */}
      {isPaymentModalOpen && selectedFamily && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => {
              setIsPaymentModalOpen(false);
              setSelectedFamily(null);
            }} />

            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Record Payment</h2>
                  <p className="text-sm text-gray-500">{selectedFamily.family_name} • {academicYearName}</p>
                </div>
                <button
                  onClick={() => {
                    setIsPaymentModalOpen(false);
                    setSelectedFamily(null);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between text-sm mb-4">
                  <span className="text-gray-500">Current Status:</span>
                  {getStatusBadge(selectedFamily.payment_status)}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                  {selectedFamily.amount_due && (
                    <p className="text-xs text-gray-500 mt-1">
                      Amount due: {formatCurrency(selectedFamily.amount_due)}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="cash">Cash</option>
                    <option value="check">Check</option>
                    <option value="card">Card</option>
                    <option value="transfer">Bank Transfer</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
                <button
                  onClick={() => {
                    setIsPaymentModalOpen(false);
                    setSelectedFamily(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePaymentSubmit}
                  disabled={!paymentAmount || isSubmittingPayment}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {isSubmittingPayment ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Recording...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Record Payment
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enrollment Modal */}
      {enrollingStudent && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setEnrollingStudent(null)} />

            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-xl max-h-[80vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Enroll in Classes</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Select classes for {enrollingStudent.name}
                  </p>
                </div>
                <button
                  onClick={() => setEnrollingStudent(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {isLoadingClasses ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : availableClasses.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">
                      No available classes for enrollment.
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      Student may already be enrolled in all classes.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(groupedClasses)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([programName, programClasses]) => (
                        <div key={programName}>
                          <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                            <BookOpen className="h-4 w-4" />
                            {programName}
                          </h3>
                          <div className="space-y-2">
                            {programClasses.map((classItem) => {
                              const isSelected = selectedClassIds.has(classItem.id);
                              return (
                                <button
                                  key={classItem.id}
                                  onClick={() => handleClassToggle(classItem.id)}
                                  className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                                    isSelected
                                      ? 'border-blue-500 bg-blue-50'
                                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div
                                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                        isSelected
                                          ? 'border-blue-500 bg-blue-500'
                                          : 'border-gray-300'
                                      }`}
                                    >
                                      {isSelected && (
                                        <Check className="h-3 w-3 text-white" />
                                      )}
                                    </div>
                                    <span className="font-medium text-gray-900">
                                      {classItem.name}
                                    </span>
                                  </div>
                                  {classItem.enrollment_count !== undefined && (
                                    <span className="text-sm text-gray-500">
                                      {classItem.enrollment_count} enrolled
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between p-6 border-t flex-shrink-0 bg-gray-50">
                <p className="text-sm text-gray-500">
                  {selectedClassIds.size} class{selectedClassIds.size !== 1 ? 'es' : ''} selected
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setEnrollingStudent(null)}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEnrollSubmit}
                    disabled={selectedClassIds.size === 0 || isEnrolling}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    {isEnrolling ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Enrolling...
                      </>
                    ) : (
                      <>
                        <GraduationCap className="h-4 w-4" />
                        Enroll
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
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
