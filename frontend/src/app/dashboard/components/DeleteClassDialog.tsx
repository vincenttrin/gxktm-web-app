'use client';

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { deleteClass } from '@/lib/api';
import { ClassItem } from '@/types/family';

interface DeleteClassDialogProps {
  classItem: ClassItem;
  onClose: () => void;
  onConfirm: () => void;
  showToast: (message: string, type: 'success' | 'error') => void;
}

export default function DeleteClassDialog({
  classItem,
  onClose,
  onConfirm,
  showToast,
}: DeleteClassDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteClass(classItem.id);
      onConfirm();
    } catch (error) {
      console.error('Failed to delete class:', error);
      showToast('Failed to delete class', 'error');
      setIsDeleting(false);
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

        {/* Dialog */}
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>

            <div className="mt-4 text-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Delete Class
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Are you sure you want to delete{' '}
                <span className="font-medium">{classItem.name}</span>?
              </p>
              {(classItem.enrollment_count || 0) > 0 && (
                <p className="mt-2 text-sm text-orange-600 bg-orange-50 p-2 rounded-lg">
                  ⚠️ This class has {classItem.enrollment_count} enrolled student(s).
                  All enrollments will be removed.
                </p>
              )}
              <p className="mt-2 text-sm text-gray-500">
                This action cannot be undone.
              </p>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
