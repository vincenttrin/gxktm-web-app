'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { createClass, updateClass } from '@/lib/api';
import { ClassItem, ClassCreate, Program, AcademicYear } from '@/types/family';

interface ClassModalProps {
  classItem?: ClassItem;
  programs: Program[];
  academicYear: AcademicYear;
  onClose: () => void;
  onSuccess: () => void;
  showToast: (message: string, type: 'success' | 'error') => void;
}

export default function ClassModal({
  classItem,
  programs,
  academicYear,
  onClose,
  onSuccess,
  showToast,
}: ClassModalProps) {
  const isEditing = !!classItem;
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [name, setName] = useState(classItem?.name || '');
  const [programId, setProgramId] = useState<number | ''>(
    classItem?.program_id || (programs.length > 0 ? programs[0].id : '')
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      showToast('Class name is required', 'error');
      return;
    }
    
    if (!programId) {
      showToast('Please select a program', 'error');
      return;
    }
    
    setIsLoading(true);

    try {
      if (isEditing) {
        await updateClass(classItem.id, {
          name: name.trim(),
          program_id: programId as number,
        });
      } else {
        const createData: ClassCreate = {
          name: name.trim(),
          program_id: programId as number,
          academic_year_id: academicYear.id,
        };
        await createClass(createData);
      }
      onSuccess();
    } catch (error) {
      console.error('Failed to save class:', error);
      showToast(`Failed to ${isEditing ? 'update' : 'create'} class`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditing ? 'Edit Class' : 'Create New Class'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Class Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Grade 5 - Room A"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-700"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Program *
                </label>
                <select
                  value={programId}
                  onChange={(e) => setProgramId(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                  required
                >
                  <option value="">Select a program</option>
                  {programs.map((program) => (
                    <option key={program.id} value={program.id}>
                      {program.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Academic Year
                </label>
                <input
                  type="text"
                  value={academicYear.name}
                  disabled
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading
                  ? 'Saving...'
                  : isEditing
                  ? 'Save Changes'
                  : 'Create Class'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
