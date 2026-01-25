'use client';

import { useEnrollment } from '../EnrollmentContext';
import { WizardNavigation } from './WizardNavigation';

export function ClassSelectionStep() {
  const { 
    state, 
    goToNextStep, 
    goToPreviousStep,
    addEnrollment,
    removeEnrollment 
  } = useEnrollment();
  
  const { 
    family, 
    availableClasses, 
    suggestedEnrollments, 
    selectedEnrollments,
    academicYear,
    isLoading 
  } = state;
  
  // Group available classes by program
  const classesByProgram = availableClasses.reduce((acc, cls) => {
    const programName = cls.program_name || 'Other';
    if (!acc[programName]) {
      acc[programName] = [];
    }
    acc[programName].push(cls);
    return acc;
  }, {} as Record<string, typeof availableClasses>);
  
  // Check if a class is selected for a student
  const isClassSelected = (studentId: string, classId: string) => {
    return selectedEnrollments.some(
      e => e.student_id === studentId && e.class_id === classId
    );
  };
  
  // Check if a class was auto-suggested
  const isAutoSuggested = (studentId: string, classId: string) => {
    const enrollment = selectedEnrollments.find(
      e => e.student_id === studentId && e.class_id === classId
    );
    return enrollment?.is_auto_suggested || false;
  };
  
  // Get selected classes for a student
  const getStudentEnrollments = (studentId: string) => {
    return selectedEnrollments.filter(e => e.student_id === studentId);
  };
  
  // Toggle class selection
  const handleToggleClass = (studentId: string, classItem: typeof availableClasses[0]) => {
    if (isClassSelected(studentId, classItem.id)) {
      removeEnrollment(studentId, classItem.id);
    } else {
      addEnrollment({
        student_id: studentId,
        class_id: classItem.id,
        class_name: classItem.name,
        program_name: classItem.program_name,
        is_auto_suggested: false,
      });
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Class Selection</h2>
        <p className="mt-1 text-sm text-gray-600">
          Select classes for each of your children for {academicYear?.name || 'the current school year'}.
        </p>
      </div>
      
      {/* Auto-suggestion info */}
      {suggestedEnrollments.some(s => s.suggested_classes.length > 0) && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-green-900">
                Pre-populated enrollments
              </p>
              <p className="text-sm text-green-700 mt-1">
                Based on last year&apos;s enrollments, we&apos;ve automatically suggested classes for your children with grade progression applied. 
                Classes marked with a star (★) are pre-populated suggestions.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Student class selection */}
      {family?.students.map((student) => {
        const studentEnrollments = getStudentEnrollments(student.id!);
        // Find suggestions for this student (used for displaying suggestion indicators)
        const _studentSuggestions = suggestedEnrollments.find(s => s.student_id === student.id);
        void _studentSuggestions; // Intentionally unused - kept for future reference
        
        return (
          <div key={student.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Student header */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 font-medium">
                      {student.first_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {student.first_name} {student.last_name}
                    </h3>
                    {student.saint_name && (
                      <p className="text-xs text-gray-500">Saint Name: {student.saint_name}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                    {studentEnrollments.length} class{studentEnrollments.length !== 1 ? 'es' : ''} selected
                  </span>
                </div>
              </div>
            </div>
            
            {/* Class selection by program */}
            <div className="p-6 space-y-6">
              {Object.entries(classesByProgram).map(([programName, classes]) => (
                <div key={programName}>
                  <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      programName.toLowerCase().includes('giao') || programName.toLowerCase().includes('giáo')
                        ? 'bg-indigo-500'
                        : programName.toLowerCase().includes('viet') || programName.toLowerCase().includes('việt')
                        ? 'bg-green-500'
                        : 'bg-gray-500'
                    }`} />
                    {programName}
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                    {classes.map((cls) => {
                      const isSelected = isClassSelected(student.id!, cls.id);
                      const isSuggested = isAutoSuggested(student.id!, cls.id);
                      
                      return (
                        <button
                          key={cls.id}
                          type="button"
                          onClick={() => handleToggleClass(student.id!, cls)}
                          className={`relative px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                            isSelected
                              ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                              : 'bg-white border-gray-300 text-gray-700 hover:border-blue-400 hover:bg-blue-50'
                          }`}
                        >
                          {isSuggested && (
                            <span className="absolute -top-1 -right-1 text-yellow-400 text-xs">★</span>
                          )}
                          {cls.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              
              {/* Selected classes summary */}
              {studentEnrollments.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Selected Classes:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {studentEnrollments.map((enrollment) => (
                      <span
                        key={enrollment.class_id}
                        className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800"
                      >
                        {enrollment.is_auto_suggested && <span className="text-yellow-500">★</span>}
                        {enrollment.class_name}
                        <button
                          type="button"
                          onClick={() => removeEnrollment(student.id!, enrollment.class_id)}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
      
      {/* No students warning */}
      {(!family?.students || family.students.length === 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
          <p className="text-sm text-amber-800">
            No children found in your family. Please go back and add children first.
          </p>
        </div>
      )}
      
      {/* Navigation */}
      <WizardNavigation
        onBack={goToPreviousStep}
        onNext={goToNextStep}
        nextLabel="Review Enrollment"
        isLoading={isLoading}
        isNextDisabled={selectedEnrollments.length === 0}
      />
      
      {/* Warning if no selections */}
      {selectedEnrollments.length === 0 && (
        <p className="text-center text-sm text-amber-600">
          Please select at least one class to continue.
        </p>
      )}
    </div>
  );
}
