'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Plus, Search, Book, Users, Download, Edit2, Trash2, X, RefreshCw } from 'lucide-react';
import { getClasses, getPrograms, getClassExportUrl } from '@/lib/api';
import { ClassItem, Program, AcademicYear } from '@/types/family';
import { normalizeVietnamese } from '@/utils/vietnamese';
import ClassModal from './ClassModal';
import ClassDetail from './ClassDetail';
import DeleteClassDialog from './DeleteClassDialog';
import ManualEnrollmentModal from './ManualEnrollmentModal';
import Toast from './Toast';

interface ClassListProps {
  selectedYear: AcademicYear | null;
}

// Year-specific cache for classes
interface ClassCache {
  [yearId: number]: {
    classes: ClassItem[];
    fetchedAt: Date;
  };
}

export default function ClassList({ selectedYear }: ClassListProps) {
  // Cache for year-specific class data
  const classCacheRef = useRef<ClassCache>({});
  
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);
  
  // Selected class for detail view
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  
  // Filters - client-side only now
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProgramId, setSelectedProgramId] = useState<number | null>(null);
  
  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
  const [deletingClass, setDeletingClass] = useState<ClassItem | null>(null);
  const [enrollmentClass, setEnrollmentClass] = useState<ClassItem | null>(null);
  
  // Toast
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  const loadClasses = useCallback(async (forceRefresh = false) => {
    if (!selectedYear) return;
    
    // Check cache first (unless forcing refresh)
    const cached = classCacheRef.current[selectedYear.id];
    if (!forceRefresh && cached) {
      setClasses(cached.classes);
      setLastFetchTime(cached.fetchedAt);
      setIsInitialLoading(false);
      return;
    }
    
    if (forceRefresh) {
      setIsRefreshing(true);
    } else {
      setIsInitialLoading(true);
    }
    setError(null);
    
    try {
      // Only fetch classes for the selected year (no program filter - that's done client-side)
      const data = await getClasses({
        academic_year_id: selectedYear.id,
      });
      
      // Update cache
      const fetchedAt = new Date();
      classCacheRef.current[selectedYear.id] = {
        classes: data,
        fetchedAt,
      };
      
      setClasses(data);
      setLastFetchTime(fetchedAt);
    } catch (err) {
      console.error('Failed to load classes:', err);
      setError('Failed to load classes. Please try again.');
    } finally {
      setIsInitialLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedYear]);

  const loadPrograms = useCallback(async () => {
    try {
      const data = await getPrograms();
      setPrograms(data);
    } catch (err) {
      console.error('Failed to load programs:', err);
    }
  }, []);

  useEffect(() => {
    loadPrograms();
  }, [loadPrograms]);

  // Load classes when year changes
  useEffect(() => {
    if (selectedYear) {
      loadClasses();
    }
  }, [selectedYear, loadClasses]);

  const handleRefresh = () => {
    loadClasses(true);
  };

  // Invalidate cache for current year (after CRUD operations)
  const invalidateCache = useCallback(() => {
    if (selectedYear) {
      delete classCacheRef.current[selectedYear.id];
    }
  }, [selectedYear]);

  const handleExport = (classItem: ClassItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = getClassExportUrl(classItem.id);
    window.open(url, '_blank');
    showToast('Export started', 'success');
  };

  const handleEdit = (classItem: ClassItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingClass(classItem);
  };

  const handleDelete = (classItem: ClassItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingClass(classItem);
  };

  const handleClassCreated = () => {
    setIsCreateModalOpen(false);
    invalidateCache();
    loadClasses(true);
    showToast('Class created successfully', 'success');
  };

  const handleClassUpdated = () => {
    setEditingClass(null);
    invalidateCache();
    loadClasses(true);
    showToast('Class updated successfully', 'success');
  };

  const handleClassDeleted = () => {
    setDeletingClass(null);
    invalidateCache();
    loadClasses(true);
    showToast('Class deleted successfully', 'success');
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Client-side filtering with Vietnamese support
  const filteredClasses = useMemo(() => {
    let result = classes;
    
    // Filter by program (client-side)
    if (selectedProgramId) {
      result = result.filter(cls => cls.program_id === selectedProgramId);
    }
    
    // Filter by search query with Vietnamese normalization
    if (searchQuery) {
      const normalizedQuery = normalizeVietnamese(searchQuery);
      result = result.filter(cls => {
        const normalizedName = normalizeVietnamese(cls.name);
        const normalizedProgram = normalizeVietnamese(cls.program?.name || '');
        return normalizedName.includes(normalizedQuery) || 
               normalizedProgram.includes(normalizedQuery);
      });
    }
    
    return result;
  }, [classes, searchQuery, selectedProgramId]);

  // Group classes by program
  const groupedClasses = useMemo(() => {
    return filteredClasses.reduce((acc, cls) => {
      const programName = cls.program?.name || 'Uncategorized';
      if (!acc[programName]) {
        acc[programName] = [];
      }
      acc[programName].push(cls);
      return acc;
    }, {} as Record<string, ClassItem[]>);
  }, [filteredClasses]);

  if (!selectedYear) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">Please select an academic year to view classes.</p>
        </div>
      </div>
    );
  }

  // Show class detail view if a class is selected
  if (selectedClass) {
    return (
      <div className="p-6">
        <ClassDetail
          classItem={selectedClass}
          selectedYear={selectedYear}
          onBack={() => setSelectedClass(null)}
          onAddStudents={() => setEnrollmentClass(selectedClass)}
          showToast={showToast}
        />
        
        {/* Enrollment Modal */}
        {enrollmentClass && (
          <ManualEnrollmentModal
            mode="class"
            classId={enrollmentClass.id}
            className={enrollmentClass.name}
            selectedYear={selectedYear}
            onClose={() => setEnrollmentClass(null)}
            onSuccess={() => {
              setEnrollmentClass(null);
              // Refresh class detail
              setSelectedClass({ ...selectedClass });
            }}
            showToast={showToast}
          />
        )}
        
        {/* Toast Notification */}
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

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Classes</h2>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-gray-500">
              {selectedYear.name} • {filteredClasses.length} {filteredClasses.length === 1 ? 'class' : 'classes'}
              {searchQuery && ` matching "${searchQuery}"`}
            </p>
            {lastFetchTime && (
              <span className="text-xs text-gray-400">
                • Last updated: {lastFetchTime.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus className="h-5 w-5" />
            Add Class
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search classes (supports Vietnamese)..."
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-700"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        
        <select
          value={selectedProgramId || ''}
          onChange={(e) => setSelectedProgramId(e.target.value ? parseInt(e.target.value) : null)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-gray-700"
        >
          <option value="">All Programs</option>
          {programs.map((program) => (
            <option key={program.id} value={program.id}>
              {program.name}
            </option>
          ))}
        </select>
      </div>

      {/* Search indicator */}
      {searchQuery && !isInitialLoading && (
        <div className="mb-4 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
          ⚡ Searching cached data instantly
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
          <button
            onClick={() => loadClasses(true)}
            className="ml-2 underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Initial Loading State */}
      {isInitialLoading && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="mt-3 text-gray-600">Loading classes for {selectedYear.name}...</span>
          <span className="mt-1 text-sm text-gray-400">This may take a moment for the initial load</span>
        </div>
      )}

      {/* Empty State */}
      {!isInitialLoading && !error && filteredClasses.length === 0 && (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
            <Book className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            {searchQuery ? 'No classes found' : 'No classes yet'}
          </h3>
          <p className="text-gray-500 mb-4">
            {searchQuery
              ? 'Try adjusting your search query'
              : `Get started by creating your first class for ${selectedYear.name}`}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Add Class
            </button>
          )}
        </div>
      )}

      {/* Class Cards - Grouped by Program */}
      {!isInitialLoading && !error && filteredClasses.length > 0 && (
        <div className="space-y-8">
          {Object.entries(groupedClasses).map(([programName, programClasses]) => (
            <div key={programName}>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Book className="h-5 w-5 text-blue-600" />
                {programName}
                <span className="text-sm font-normal text-gray-500">
                  ({programClasses.length})
                </span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {programClasses.map((classItem) => (
                  <div
                    key={classItem.id}
                    onClick={() => setSelectedClass(classItem)}
                    className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {classItem.name}
                        </h4>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => handleEdit(classItem, e)}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit class"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(classItem, e)}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete class"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Users className="h-4 w-4 text-green-500" />
                          <span>
                            {classItem.enrollment_count || 0} student
                            {classItem.enrollment_count !== 1 ? 's' : ''}
                          </span>
                        </div>
                        
                        <button
                          onClick={(e) => handleExport(classItem, e)}
                          className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Export roster"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Export
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Class Modal */}
      {isCreateModalOpen && selectedYear && (
        <ClassModal
          programs={programs}
          academicYear={selectedYear}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleClassCreated}
          showToast={showToast}
        />
      )}

      {/* Edit Class Modal */}
      {editingClass && selectedYear && (
        <ClassModal
          classItem={editingClass}
          programs={programs}
          academicYear={selectedYear}
          onClose={() => setEditingClass(null)}
          onSuccess={handleClassUpdated}
          showToast={showToast}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deletingClass && (
        <DeleteClassDialog
          classItem={deletingClass}
          onClose={() => setDeletingClass(null)}
          onConfirm={handleClassDeleted}
          showToast={showToast}
        />
      )}

      {/* Toast Notification */}
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
