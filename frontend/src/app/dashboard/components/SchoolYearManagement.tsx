'use client';

import { useState, useEffect } from 'react';
import {
  Calendar,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  Clock,
  Archive,
  AlertCircle,
  Users,
  BookOpen,
  ToggleLeft,
  ToggleRight,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import {
  getSchoolYears,
  createSchoolYear,
  updateSchoolYear,
  deleteSchoolYear,
  transitionSchoolYear,
  checkAutoCreateSchoolYear,
  checkTransitionNeeded,
} from '@/lib/api';
import {
  SchoolYearWithStats,
  SchoolYearCreate,
  SchoolYearUpdate,
  SchoolYearAutoCreateCheck,
  SchoolYearTransitionCheck,
} from '@/types/family';

interface SchoolYearModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: SchoolYearCreate) => Promise<void>;
  initialData?: SchoolYearWithStats | null;
  isLoading?: boolean;
}

function SchoolYearModal({ isOpen, onClose, onSave, initialData, isLoading }: SchoolYearModalProps) {
  // Generate default values
  const getDefaultValues = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const startYear = month >= 7 ? year : year;
    const endYear = startYear + 1;
    return {
      name: `${startYear}-${endYear}`,
      transitionDate: `${startYear}-07-01`,
      enrollmentOpen: true,
      isActive: false,
    };
  };

  const defaults = getDefaultValues();
  const [name, setName] = useState(initialData?.name || defaults.name);
  const [transitionDate, setTransitionDate] = useState(initialData?.transition_date || defaults.transitionDate);
  const [enrollmentOpen, setEnrollmentOpen] = useState(initialData?.enrollment_open ?? defaults.enrollmentOpen);
  const [isActive, setIsActive] = useState(initialData?.is_active ?? defaults.isActive);

  // Reset form when modal opens with new data
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name);
        setTransitionDate(initialData.transition_date || '');
        setEnrollmentOpen(initialData.enrollment_open);
        setIsActive(initialData.is_active);
      } else {
        const d = getDefaultValues();
        setName(d.name);
        setTransitionDate(d.transitionDate);
        setEnrollmentOpen(d.enrollmentOpen);
        setIsActive(d.isActive);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialData?.id]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      name,
      transition_date: transitionDate || undefined,
      enrollment_open: enrollmentOpen,
      is_active: isActive,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {initialData ? 'Edit School Year' : 'Create New School Year'}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Year Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., 2026-2027"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Format: YYYY-YYYY (e.g., 2026-2027)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Transition Date
            </label>
            <input
              type="date"
              value={transitionDate}
              onChange={(e) => setTransitionDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              When this year becomes active (typically July 1st)
            </p>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Enrollment Open
              </label>
              <p className="text-xs text-gray-500">
                Allow families to enroll for this year
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEnrollmentOpen(!enrollmentOpen)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                enrollmentOpen ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  enrollmentOpen ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {!initialData && (
            <div className="flex items-center justify-between py-2">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Set as Active
                </label>
                <p className="text-xs text-gray-500">
                  Make this the currently active school year
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isActive ? 'bg-green-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isActive ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : initialData ? 'Save Changes' : 'Create Year'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  yearName: string;
  isLoading?: boolean;
}

function DeleteConfirmModal({ isOpen, onClose, onConfirm, yearName, isLoading }: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-100 rounded-full">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Delete School Year</h2>
        </div>
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete <strong>{yearName}</strong>? This action cannot be undone.
          You can only delete a school year if it has no associated classes.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface TransitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  targetYear: SchoolYearWithStats | null;
  isLoading?: boolean;
}

function TransitionModal({ isOpen, onClose, onConfirm, targetYear, isLoading }: TransitionModalProps) {
  if (!isOpen || !targetYear) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-full">
            <ArrowRight className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Transition School Year</h2>
        </div>
        <p className="text-gray-600 mb-6">
          This will make <strong>{targetYear.name}</strong> the active school year. 
          The current active year will be marked as archived.
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
          <p className="text-sm text-amber-800">
            <strong>Note:</strong> This action affects which year is shown by default in the admin dashboard.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Transitioning...' : 'Confirm Transition'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SchoolYearManagement() {
  const [schoolYears, setSchoolYears] = useState<SchoolYearWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingYear, setEditingYear] = useState<SchoolYearWithStats | null>(null);
  const [deletingYear, setDeletingYear] = useState<SchoolYearWithStats | null>(null);
  const [transitioningYear, setTransitioningYear] = useState<SchoolYearWithStats | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [autoCreateCheck, setAutoCreateCheck] = useState<SchoolYearAutoCreateCheck | null>(null);
  const [transitionCheck, setTransitionCheck] = useState<SchoolYearTransitionCheck | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const loadSchoolYears = async (includeArchived: boolean) => {
    try {
      setIsLoading(true);
      setError(null);
      const years = await getSchoolYears(includeArchived);
      setSchoolYears(years);
      
      // Check for alerts
      const [autoCreate, transition] = await Promise.all([
        checkAutoCreateSchoolYear(),
        checkTransitionNeeded(),
      ]);
      setAutoCreateCheck(autoCreate);
      setTransitionCheck(transition);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load school years');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSchoolYears(showArchived);
  }, [showArchived]);

  const handleCreate = async (data: SchoolYearCreate) => {
    try {
      setIsSaving(true);
      await createSchoolYear(data);
      setIsModalOpen(false);
      await loadSchoolYears(showArchived);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create school year');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async (data: SchoolYearCreate) => {
    if (!editingYear) return;
    try {
      setIsSaving(true);
      await updateSchoolYear(editingYear.id, data as SchoolYearUpdate);
      setEditingYear(null);
      await loadSchoolYears(showArchived);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update school year');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingYear) return;
    try {
      setIsSaving(true);
      await deleteSchoolYear(deletingYear.id);
      setDeletingYear(null);
      await loadSchoolYears(showArchived);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete school year');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTransition = async () => {
    if (!transitioningYear) return;
    try {
      setIsSaving(true);
      await transitionSchoolYear(transitioningYear.id);
      setTransitioningYear(null);
      await loadSchoolYears(showArchived);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to transition school year');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleEnrollment = async (year: SchoolYearWithStats) => {
    try {
      await updateSchoolYear(year.id, { enrollment_open: !year.enrollment_open });
      await loadSchoolYears(showArchived);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle enrollment');
    }
  };

  const handleAutoCreate = async () => {
    if (!autoCreateCheck?.should_create) return;
    try {
      setIsSaving(true);
      await createSchoolYear({
        name: autoCreateCheck.suggested_name!,
        transition_date: autoCreateCheck.suggested_transition_date,
        enrollment_open: true,
      });
      await loadSchoolYears(showArchived);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create school year');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusIcon = (status: string | undefined) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'upcoming':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'archived':
        return <Archive className="h-5 w-5 text-gray-400" />;
      default:
        return <Calendar className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string | undefined) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3" />
            Active
          </span>
        );
      case 'upcoming':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Clock className="h-3 w-3" />
            Upcoming
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            <Archive className="h-3 w-3" />
            Archived
          </span>
        );
      default:
        return null;
    }
  };

  if (isLoading && schoolYears.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 text-gray-400 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">School Year Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage academic years, enrollment periods, and year transitions
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          New School Year
        </button>
      </div>

      {/* Alerts */}
      {autoCreateCheck?.should_create && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            <div>
              <p className="font-medium text-blue-900">New School Year Suggested</p>
              <p className="text-sm text-blue-700">
                {autoCreateCheck.reason}
              </p>
            </div>
          </div>
          <button
            onClick={handleAutoCreate}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Create {autoCreateCheck.suggested_name}
          </button>
        </div>
      )}

      {transitionCheck?.should_transition && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <div>
              <p className="font-medium text-amber-900">School Year Transition Due</p>
              <p className="text-sm text-amber-700">
                {transitionCheck.reason}. Consider transitioning to {transitionCheck.year_name}.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              const year = schoolYears.find(y => y.id === transitionCheck.year_id);
              if (year) setTransitioningYear(year);
            }}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
          >
            Transition Now
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-600 hover:text-red-800"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Show Archived Toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowArchived(!showArchived)}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          {showArchived ? (
            <ToggleRight className="h-5 w-5 text-blue-600" />
          ) : (
            <ToggleLeft className="h-5 w-5" />
          )}
          Show Archived Years
        </button>
      </div>

      {/* School Years List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Year
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Enrollment
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transition Date
                </th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Classes
                </th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Enrollments
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {schoolYears.map((year) => (
                <tr key={year.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(year.status)}
                      <span className="font-medium text-gray-900">{year.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(year.status)}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleEnrollment(year)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        year.enrollment_open
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {year.enrollment_open ? (
                        <>
                          <ToggleRight className="h-3.5 w-3.5" />
                          Open
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="h-3.5 w-3.5" />
                          Closed
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {year.transition_date
                      ? new Date(year.transition_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : '—'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-sm text-gray-600">
                      <BookOpen className="h-4 w-4" />
                      {year.class_count}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-sm text-gray-600">
                      <Users className="h-4 w-4" />
                      {year.enrolled_students_count}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {year.status === 'upcoming' && (
                        <button
                          onClick={() => setTransitioningYear(year)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Transition to this year"
                        >
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => setEditingYear(year)}
                        className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      {year.class_count === 0 && (
                        <button
                          onClick={() => setDeletingYear(year)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {schoolYears.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No school years found. Create your first school year to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-2">How School Years Work</h3>
        <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600">
          <div className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
            <div>
              <strong className="text-gray-700">Active</strong>
              <p>The current year with running classes. Both admin dashboard and parent portal default to this year.</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Clock className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <strong className="text-gray-700">Upcoming</strong>
              <p>A future year that can accept enrollments. Becomes active when you trigger a transition.</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Archive className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <strong className="text-gray-700">Archived</strong>
              <p>Past years kept for historical records. Hidden by default but can be viewed.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <SchoolYearModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleCreate}
        isLoading={isSaving}
      />

      <SchoolYearModal
        isOpen={!!editingYear}
        onClose={() => setEditingYear(null)}
        onSave={handleUpdate}
        initialData={editingYear}
        isLoading={isSaving}
      />

      <DeleteConfirmModal
        isOpen={!!deletingYear}
        onClose={() => setDeletingYear(null)}
        onConfirm={handleDelete}
        yearName={deletingYear?.name || ''}
        isLoading={isSaving}
      />

      <TransitionModal
        isOpen={!!transitioningYear}
        onClose={() => setTransitioningYear(null)}
        onConfirm={handleTransition}
        targetYear={transitioningYear}
        isLoading={isSaving}
      />
    </div>
  );
}
