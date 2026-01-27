'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Users, Download, Search, UserPlus } from 'lucide-react';
import { getClass, getClassExportUrl, unenrollStudent } from '@/lib/api';
import { ClassWithEnrollments, StudentWithFamily, ClassItem, Enrollment, AcademicYear } from '@/types/family';

interface ClassDetailProps {
  classItem: ClassItem;
  selectedYear: AcademicYear | null;
  onBack: () => void;
  onAddStudents: () => void;
  showToast: (message: string, type: 'success' | 'error') => void;
}

export default function ClassDetail({
  classItem,
  selectedYear,
  onBack,
  onAddStudents,
  showToast,
}: ClassDetailProps) {
  const [classData, setClassData] = useState<ClassWithEnrollments | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUnenrolling, setIsUnenrolling] = useState<string | null>(null);

  const loadClassDetails = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getClass(classItem.id);
      setClassData(data);
    } catch (error) {
      console.error('Failed to load class details:', error);
      showToast('Failed to load class details', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [classItem.id, showToast]);

  useEffect(() => {
    loadClassDetails();
  }, [loadClassDetails]);

  const handleExport = () => {
    window.open(getClassExportUrl(classItem.id), '_blank');
    showToast('Download started', 'success');
  };

  const handleUnenroll = async (studentId: string, studentName: string) => {
    if (!confirm(`Remove ${studentName} from this class?`)) return;
    
    setIsUnenrolling(studentId);
    try {
      await unenrollStudent(classItem.id, studentId);
      showToast(`${studentName} has been removed from this class`, 'success');
      loadClassDetails();
    } catch (error) {
      console.error('Failed to unenroll student:', error);
      showToast('Failed to remove student', 'error');
    } finally {
      setIsUnenrolling(null);
    }
  };

  // Get students from enrollments
  const enrolledStudents = classData?.enrollments
    ?.map((e: Enrollment) => e.student)
    .filter((s): s is StudentWithFamily => s !== null) || [];

  const filteredStudents = enrolledStudents.filter((student: StudentWithFamily) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    const fullName = `${student.first_name} ${student.last_name}`.toLowerCase();
    const familyName = student.family_name?.toLowerCase() || '';
    return fullName.includes(search) || familyName.includes(search);
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load class details</p>
        <button
          onClick={onBack}
          className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{classData.name}</h2>
            <p className="text-gray-500">
              {classData.program?.name} • {enrolledStudents.length} students
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onAddStudents}
            className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            Add Students
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search students..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
      </div>

      {/* Students List */}
      {filteredStudents.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Users className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            {searchTerm ? 'No students found' : 'No students enrolled'}
          </h3>
          <p className="mt-1 text-gray-500">
            {searchTerm
              ? 'Try adjusting your search terms'
              : 'This class has no enrolled students yet'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Family
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Grade Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date of Birth
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.map((student: StudentWithFamily) => (
                <StudentRow
                  key={student.id}
                  student={student}
                  onUnenroll={handleUnenroll}
                  isUnenrolling={isUnenrolling === student.id}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Students</p>
              <p className="text-xl font-semibold text-gray-900">
                {enrolledStudents.length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StudentRow({
  student,
  onUnenroll,
  isUnenrolling,
}: {
  student: StudentWithFamily;
  onUnenroll: (id: string, name: string) => void;
  isUnenrolling: boolean;
}) {
  const fullName = `${student.first_name} ${student.last_name}`;
  const dateOfBirth = student.date_of_birth
    ? new Date(student.date_of_birth).toLocaleDateString()
    : 'N/A';

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="h-10 w-10 flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium">
              {student.first_name.charAt(0)}{student.last_name.charAt(0)}
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{fullName}</div>
            {student.saint_name && (
              <div className="text-sm text-gray-500">St. {student.saint_name}</div>
            )}
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{student.family_name || 'N/A'}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">
          {student.grade_level !== null ? `Grade ${student.grade_level}` : 'N/A'}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {dateOfBirth}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button
          onClick={() => onUnenroll(student.id, fullName)}
          disabled={isUnenrolling}
          className="text-red-600 hover:text-red-800 disabled:opacity-50"
        >
          {isUnenrolling ? 'Removing...' : 'Remove'}
        </button>
      </td>
    </tr>
  );
}
