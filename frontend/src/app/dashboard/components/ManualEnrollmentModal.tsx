'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Search, Check, GraduationCap, Users, BookOpen } from 'lucide-react';
import {
  getClasses,
  getStudentsWithEnrollments,
  manualEnrollStudent,
  bulkEnrollStudents,
} from '@/lib/api';
import { ClassItem, StudentEnrollmentInfo, AcademicYear } from '@/types/family';

interface ManualEnrollmentModalProps {
  mode: 'student' | 'class';
  studentId?: string;
  studentName?: string;
  classId?: string;
  className?: string;
  selectedYear: AcademicYear | null;
  onClose: () => void;
  onSuccess: () => void;
  showToast: (message: string, type: 'success' | 'error') => void;
}

export default function ManualEnrollmentModal({
  mode,
  studentId,
  studentName,
  classId,
  className,
  selectedYear,
  onClose,
  onSuccess,
  showToast,
}: ManualEnrollmentModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // For student mode: show available classes
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassIds, setSelectedClassIds] = useState<Set<string>>(new Set());
  const [alreadyEnrolledClassIds, setAlreadyEnrolledClassIds] = useState<Set<string>>(new Set());
  
  // For class mode: show available students
  const [students, setStudents] = useState<StudentEnrollmentInfo[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [alreadyEnrolledStudentIds, setAlreadyEnrolledStudentIds] = useState<Set<string>>(new Set());
  
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (mode === 'student' && studentId) {
        // Load available classes for the student
        const classData = await getClasses({
          academic_year_id: selectedYear?.id,
        });
        setClasses(classData);
        
        // Load student's current enrollments
        const studentData = await getStudentsWithEnrollments(undefined, undefined);
        const student = studentData.find(s => s.id === studentId);
        if (student) {
          const enrolledIds = new Set(student.enrolled_classes.map(c => c.id));
          setAlreadyEnrolledClassIds(enrolledIds);
        }
      } else if (mode === 'class' && classId) {
        // Load all students
        const studentData = await getStudentsWithEnrollments();
        setStudents(studentData);
        
        // Find which students are already enrolled in this class
        const enrolledIds = new Set<string>();
        for (const student of studentData) {
          if (student.enrolled_classes.some(c => c.id === classId)) {
            enrolledIds.add(student.id);
          }
        }
        setAlreadyEnrolledStudentIds(enrolledIds);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      showToast('Failed to load data', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [mode, studentId, classId, selectedYear?.id, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleClassToggle = (classItemId: string) => {
    if (alreadyEnrolledClassIds.has(classItemId)) return;
    
    const newSelected = new Set(selectedClassIds);
    if (newSelected.has(classItemId)) {
      newSelected.delete(classItemId);
    } else {
      newSelected.add(classItemId);
    }
    setSelectedClassIds(newSelected);
  };

  const handleStudentToggle = (studentItemId: string) => {
    if (alreadyEnrolledStudentIds.has(studentItemId)) return;
    
    const newSelected = new Set(selectedStudentIds);
    if (newSelected.has(studentItemId)) {
      newSelected.delete(studentItemId);
    } else {
      newSelected.add(studentItemId);
    }
    setSelectedStudentIds(newSelected);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (mode === 'student' && studentId) {
        const result = await manualEnrollStudent({
          student_id: studentId,
          class_ids: Array.from(selectedClassIds),
        });
        showToast(result.message, 'success');
      } else if (mode === 'class' && classId) {
        const result = await bulkEnrollStudents({
          class_id: classId,
          student_ids: Array.from(selectedStudentIds),
        });
        showToast(result.message, 'success');
      }
      onSuccess();
    } catch (error) {
      console.error('Failed to enroll:', error);
      showToast('Failed to enroll', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group classes by program
  const groupedClasses = classes.reduce((acc, classItem) => {
    const programName = classItem.program?.name || 'Other';
    if (!acc[programName]) {
      acc[programName] = [];
    }
    acc[programName].push(classItem);
    return acc;
  }, {} as Record<string, ClassItem[]>);

  // Filter students by search
  const filteredStudents = students.filter((student) => {
    if (!searchQuery) return true;
    const fullName = `${student.first_name} ${student.last_name}`.toLowerCase();
    const familyName = (student.family_name || '').toLowerCase();
    return (
      fullName.includes(searchQuery.toLowerCase()) ||
      familyName.includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-xl max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {mode === 'student' ? 'Enroll in Classes' : 'Add Students'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {mode === 'student'
                  ? `Select classes for ${studentName}`
                  : `Add students to ${className}`}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Search (for class mode) */}
          {mode === 'class' && (
            <div className="px-6 py-3 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search students..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-700"
                />
              </div>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading...</span>
              </div>
            ) : mode === 'student' ? (
              // Class selection for student enrollment
              <div className="space-y-6">
                {Object.entries(groupedClasses).map(([programName, programClasses]) => (
                  <div key={programName}>
                    <div className="flex items-center gap-2 mb-3">
                      <BookOpen className="h-4 w-4 text-gray-500" />
                      <h3 className="text-sm font-medium text-gray-700">{programName}</h3>
                    </div>
                    <div className="space-y-2">
                      {programClasses.map((classItem) => {
                        const isEnrolled = alreadyEnrolledClassIds.has(classItem.id);
                        const isSelected = selectedClassIds.has(classItem.id);
                        
                        return (
                          <button
                            key={classItem.id}
                            onClick={() => handleClassToggle(classItem.id)}
                            disabled={isEnrolled}
                            className={`w-full p-3 rounded-lg border text-left transition-colors flex items-center justify-between ${
                              isEnrolled
                                ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                                : isSelected
                                ? 'bg-blue-50 border-blue-300 text-blue-700'
                                : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <GraduationCap className="h-5 w-5" />
                              <span className="font-medium">{classItem.name}</span>
                            </div>
                            {isEnrolled ? (
                              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                                Already Enrolled
                              </span>
                            ) : isSelected ? (
                              <Check className="h-5 w-5 text-blue-600" />
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Student selection for class enrollment
              <div className="space-y-2">
                {filteredStudents.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                    <p>No students found</p>
                  </div>
                ) : (
                  filteredStudents.map((student) => {
                    const isEnrolled = alreadyEnrolledStudentIds.has(student.id);
                    const isSelected = selectedStudentIds.has(student.id);
                    
                    return (
                      <button
                        key={student.id}
                        onClick={() => handleStudentToggle(student.id)}
                        disabled={isEnrolled}
                        className={`w-full p-3 rounded-lg border text-left transition-colors flex items-center justify-between ${
                          isEnrolled
                            ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                            : isSelected
                            ? 'bg-blue-50 border-blue-300 text-blue-700'
                            : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                        }`}
                      >
                        <div>
                          <p className="font-medium">
                            {student.first_name} {student.last_name}
                          </p>
                          {student.family_name && (
                            <p className="text-sm text-gray-500">{student.family_name}</p>
                          )}
                        </div>
                        {isEnrolled ? (
                          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                            Already Enrolled
                          </span>
                        ) : isSelected ? (
                          <Check className="h-5 w-5 text-blue-600" />
                        ) : null}
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t bg-gray-50 rounded-b-xl flex-shrink-0">
            <div className="text-sm text-gray-600">
              {mode === 'student'
                ? `${selectedClassIds.size} class${selectedClassIds.size !== 1 ? 'es' : ''} selected`
                : `${selectedStudentIds.size} student${selectedStudentIds.size !== 1 ? 's' : ''} selected`}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={
                  isSubmitting ||
                  (mode === 'student' ? selectedClassIds.size === 0 : selectedStudentIds.size === 0)
                }
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Enrolling...' : 'Enroll'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
