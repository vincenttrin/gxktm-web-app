'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Book, Users, Download, Edit2, Trash2, X } from 'lucide-react';
import { getClasses, getPrograms, getClassExportUrl } from '@/lib/api';
import { ClassItem, Program, AcademicYear } from '@/types/family';
import ClassModal from './ClassModal';
import ClassDetail from './ClassDetail';
import DeleteClassDialog from './DeleteClassDialog';
import Toast from './Toast';

interface ClassListProps {
  selectedYear: AcademicYear | null;
}

export default function ClassList({ selectedYear }: ClassListProps) {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Selected class for detail view
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProgramId, setSelectedProgramId] = useState<number | null>(null);
  
  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
  const [deletingClass, setDeletingClass] = useState<ClassItem | null>(null);
  
  // Toast
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  const loadClasses = useCallback(async () => {
    if (!selectedYear) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getClasses({
        academic_year_id: selectedYear.id,
        program_id: selectedProgramId || undefined,
      });
      setClasses(data);
    } catch (err) {
      console.error('Failed to load classes:', err);
      setError('Failed to load classes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear, selectedProgramId]);

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

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

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
    loadClasses();
    showToast('Class created successfully', 'success');
  };

  const handleClassUpdated = () => {
    setEditingClass(null);
    loadClasses();
    showToast('Class updated successfully', 'success');
  };

  const handleClassDeleted = () => {
    setDeletingClass(null);
    loadClasses();
    showToast('Class deleted successfully', 'success');
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Filter classes by search query
  const filteredClasses = classes.filter((cls) =>
    cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cls.program?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group classes by program
  const groupedClasses = filteredClasses.reduce((acc, cls) => {
    const programName = cls.program?.name || 'Uncategorized';
    if (!acc[programName]) {
      acc[programName] = [];
    }
    acc[programName].push(cls);
    return acc;
  }, {} as Record<string, ClassItem[]>);

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
          onBack={() => setSelectedClass(null)}
          showToast={showToast}
        />
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
          <p className="text-sm text-gray-500 mt-1">
            {selectedYear.name} • {classes.length} {classes.length === 1 ? 'class' : 'classes'}
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Plus className="h-5 w-5" />
          Add Class
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search classes..."
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

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
          <button
            onClick={loadClasses}
            className="ml-2 underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading classes...</span>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredClasses.length === 0 && (
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
      {!isLoading && !error && filteredClasses.length > 0 && (
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
