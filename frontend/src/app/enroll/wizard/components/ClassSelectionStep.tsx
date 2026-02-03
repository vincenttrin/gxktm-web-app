'use client';

import { useEffect, useMemo } from 'react';
import { useEnrollment } from '../EnrollmentContext';
import { WizardNavigation } from './WizardNavigation';
import { ClassSelection } from '@/types/enrollment';

// Grade level options (1-9) plus completed option
const GRADE_LEVELS = [
  { value: null, label: 'Not Enrolling' },
  { value: 1, label: 'Level 1' },
  { value: 2, label: 'Level 2' },
  { value: 3, label: 'Level 3' },
  { value: 4, label: 'Level 4' },
  { value: 5, label: 'Level 5' },
  { value: 6, label: 'Level 6' },
  { value: 7, label: 'Level 7' },
  { value: 8, label: 'Level 8' },
  { value: 9, label: 'Level 9' },
];

const COURSE_BADGE_STYLES = {
  amber: 'bg-amber-100 text-amber-800',
  blue: 'bg-blue-100 text-blue-800',
  slate: 'bg-slate-100 text-slate-800',
} as const;

export function ClassSelectionStep() {
  const { state, updateClassSelections, goToNextStep, goToPreviousStep } = useEnrollment();
  const { formState, academicYear, suggestedEnrollments, isLoading } = state;
  const children = formState.children;
  const classSelections = formState.classSelections;
  
  // Initialize class selections from children and suggested enrollments
  useEffect(() => {
    if (children.length > 0 && classSelections.length === 0) {
      const initialSelections: ClassSelection[] = children.map((child) => {
        let giaoLyLevel: number | null = null;
        let vietNguLevel: number | null = null;
        let giaoLyCompleted = false;
        let vietNguCompleted = false;
        
        // Default to level 1 if no previous enrollment found and child has grade_level
        if (giaoLyLevel === null && !giaoLyCompleted && child.grade_level) {
          giaoLyLevel = Math.min(child.grade_level, 9);
        }
        if (vietNguLevel === null && !vietNguCompleted && child.grade_level) {
          vietNguLevel = Math.min(child.grade_level, 9);
        }
        
        return {
          student_id: child.id || `temp-${children.indexOf(child)}`,
          giao_ly_level: giaoLyLevel,
          viet_ngu_level: vietNguLevel,
          giao_ly_completed: giaoLyCompleted,
          viet_ngu_completed: vietNguCompleted,
        };
      });
      
      updateClassSelections(initialSelections);
    }
  }, [children, classSelections.length, updateClassSelections]);
  
  // Ensure we have selections for all children
  const currentSelections = useMemo(() => {
    if (classSelections.length === children.length) {
      return classSelections;
    }
    return children.map((child, index) => {
      const existing = classSelections.find(s => s.student_id === child.id);
      if (existing) return existing;
      
      return {
        student_id: child.id || `temp-${index}`,
        giao_ly_level: child.grade_level ? Math.min(child.grade_level, 9) : 1,
        viet_ngu_level: child.grade_level ? Math.min(child.grade_level, 9) : 1,
        giao_ly_completed: false,
        viet_ngu_completed: false,
      };
    });
  }, [children, classSelections]);
  
  const handleGiaoLyChange = (studentIndex: number, value: string) => {
    const updatedSelections = [...currentSelections];
    const selection = { ...updatedSelections[studentIndex] };
    
    if (value === 'completed') {
      selection.giao_ly_level = null;
      selection.giao_ly_completed = true;
    } else if (value === '') {
      selection.giao_ly_level = null;
      selection.giao_ly_completed = false;
    } else {
      selection.giao_ly_level = parseInt(value);
      selection.giao_ly_completed = false;
    }
    
    updatedSelections[studentIndex] = selection;
    updateClassSelections(updatedSelections);
  };
  
  const handleVietNguChange = (studentIndex: number, value: string) => {
    const updatedSelections = [...currentSelections];
    const selection = { ...updatedSelections[studentIndex] };
    
    if (value === 'completed') {
      selection.viet_ngu_level = null;
      selection.viet_ngu_completed = true;
    } else if (value === '') {
      selection.viet_ngu_level = null;
      selection.viet_ngu_completed = false;
    } else {
      selection.viet_ngu_level = parseInt(value);
      selection.viet_ngu_completed = false;
    }
    
    updatedSelections[studentIndex] = selection;
    updateClassSelections(updatedSelections);
  };
  
  // Check if at least one program is selected for each student
  const canContinue = currentSelections.every(selection => 
    selection.giao_ly_level !== null || 
    selection.viet_ngu_level !== null ||
    selection.giao_ly_completed ||
    selection.viet_ngu_completed
  );
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Class Selection</h2>
        <p className="mt-1 text-sm text-gray-600">
          Select class levels for each child. You can enroll in Giáo Lý (Religious Education), Việt Ngữ (Vietnamese Language), or both.
        </p>
        {academicYear && (
          <p className="mt-2 text-sm font-medium text-blue-600">
            Academic Year: {academicYear.name}
          </p>
        )}
      </div>
      
      {/* Class Selection Cards */}
      <div className="space-y-6">
        {children.map((child, index) => {
          const selection = currentSelections[index] || {
            student_id: child.id || `temp-${index}`,
            giao_ly_level: null,
            viet_ngu_level: null,
            giao_ly_completed: false,
            viet_ngu_completed: false,
          };
          
          // Find any suggested enrollments for this child
          const suggestion = suggestedEnrollments.find(s => s.student_id === child.id);
          const currentYearClasses = suggestion?.suggested_classes ?? [];
          const currentCourseBadges: Array<{ id: string; label: string; tone: keyof typeof COURSE_BADGE_STYLES }> = [];
          const completedPrograms: string[] = [];
          currentYearClasses.forEach(cls => {
            const programName = cls.program_name?.toLowerCase() || '';
            const className = cls.class_name.toLowerCase();
            const isGiaoLy = programName.includes('giao ly') || programName.includes('giáo lý') || className.includes('giao ly') || className.includes('giáo lý');
            const isVietNgu = programName.includes('viet ngu') || programName.includes('việt ngữ') || className.includes('viet ngu') || className.includes('việt ngữ');
            const match = cls.class_name.match(/(\d+)/);
            const level = match ? parseInt(match[1], 10) : null;
            
            if (level === 9 && (isGiaoLy || isVietNgu)) {
              if (isGiaoLy && !completedPrograms.includes('Giáo Lý')) {
                completedPrograms.push('Giáo Lý');
              }
              if (isVietNgu && !completedPrograms.includes('Việt Ngữ')) {
                completedPrograms.push('Việt Ngữ');
              }
              return;
            }
            
            currentCourseBadges.push({
              id: cls.class_id,
              label: cls.class_name,
              tone: isGiaoLy ? 'amber' : isVietNgu ? 'blue' : 'slate',
            });
          });
          const hasCurrentCourseInfo = currentCourseBadges.length > 0 || completedPrograms.length > 0;
          
          return (
            <div key={child.id || index} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* Student Header */}
              <div className="bg-gradient-to-r from-blue-50 to-green-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-white shadow-sm flex items-center justify-center">
                    <span className="text-lg font-bold text-blue-600">
                      {child.first_name.charAt(0)}{child.last_name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {child.first_name} {child.last_name}
                      {child.vietnamese_name && (
                        <span className="text-gray-500 font-normal ml-2">({child.vietnamese_name})</span>
                      )}
                    </h3>
                    {child.grade_level && (
                      <p className="text-sm text-gray-600">School Grade: {child.grade_level}</p>
                    )}
                    <div className="mt-3 rounded-lg border border-white/70 bg-white/60 px-3 py-2 text-xs text-gray-700">
                      <div className="flex items-center gap-2 font-semibold">
                        <svg className="h-3.5 w-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-2.21 0-4 1.567-4 3.5S9.79 15 12 15s4-1.567 4-3.5S14.21 8 12 8z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6.343 17.657A8 8 0 1117.657 6.343 8 8 0 016.343 17.657z" />
                        </svg>
                        <span>Current Academic Year</span>
                        {academicYear && (
                          <span className="font-normal text-gray-500">({academicYear.name})</span>
                        )}
                      </div>
                      {hasCurrentCourseInfo ? (
                        <>
                          {currentCourseBadges.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {currentCourseBadges.map(course => (
                                <span
                                  key={course.id}
                                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${COURSE_BADGE_STYLES[course.tone]}`}
                                >
                                  {course.label}
                                </span>
                              ))}
                            </div>
                          )}
                          {completedPrograms.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {completedPrograms.map(program => (
                                <span
                                  key={program}
                                  className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800"
                                >
                                  {program} completed
                                </span>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="mt-2 text-xs text-gray-600">
                          {child.grade_level && child.grade_level >= 9
                            ? 'Completed all courses for this academic year.'
                            : 'No courses recorded for this academic year yet.'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Class Selections */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Giáo Lý Selection */}
                  <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-8 w-8 rounded-full bg-amber-600 flex items-center justify-center">
                        <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-amber-900">Giáo Lý</h4>
                        <p className="text-xs text-amber-700">Religious Education</p>
                      </div>
                    </div>
                    
                    <select
                      value={
                        selection.giao_ly_completed 
                          ? 'completed' 
                          : selection.giao_ly_level?.toString() || ''
                      }
                      onChange={(e) => handleGiaoLyChange(index, e.target.value)}
                      className="block w-full rounded-lg border border-amber-300 bg-white px-3 py-2.5 text-gray-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500 focus:ring-opacity-20 transition-all"
                    >
                      <option value="">Not Enrolling</option>
                      {GRADE_LEVELS.filter(g => g.value !== null).map(grade => (
                        <option key={grade.value} value={grade.value!.toString()}>
                          {grade.label}
                        </option>
                      ))}
                      <option value="completed">✓ Already Completed (All 9 Levels)</option>
                    </select>
                    
                    {selection.giao_ly_completed && (
                      <div className="mt-2 flex items-center gap-1 text-sm text-green-700">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Completed all levels
                      </div>
                    )}
                  </div>
                  
                  {/* Việt Ngữ Selection */}
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                        <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-blue-900">Việt Ngữ</h4>
                        <p className="text-xs text-blue-700">Vietnamese Language</p>
                      </div>
                    </div>
                    
                    <select
                      value={
                        selection.viet_ngu_completed 
                          ? 'completed' 
                          : selection.viet_ngu_level?.toString() || ''
                      }
                      onChange={(e) => handleVietNguChange(index, e.target.value)}
                      className="block w-full rounded-lg border border-blue-300 bg-white px-3 py-2.5 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-all"
                    >
                      <option value="">Not Enrolling</option>
                      {GRADE_LEVELS.filter(g => g.value !== null).map(grade => (
                        <option key={grade.value} value={grade.value!.toString()}>
                          {grade.label}
                        </option>
                      ))}
                      <option value="completed">✓ Already Completed (All 9 Levels)</option>
                    </select>
                    
                    {selection.viet_ngu_completed && (
                      <div className="mt-2 flex items-center gap-1 text-sm text-green-700">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Completed all levels
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Enrollment Summary for this child */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span className="font-medium">Enrolling in:</span>
                    {selection.giao_ly_level && (
                      <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                        Giáo Lý Level {selection.giao_ly_level}
                      </span>
                    )}
                    {selection.viet_ngu_level && (
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                        Việt Ngữ Level {selection.viet_ngu_level}
                      </span>
                    )}
                    {!selection.giao_ly_level && !selection.viet_ngu_level && !selection.giao_ly_completed && !selection.viet_ngu_completed && (
                      <span className="text-red-600">No classes selected</span>
                    )}
                    {(selection.giao_ly_completed || selection.viet_ngu_completed) && !selection.giao_ly_level && !selection.viet_ngu_level && (
                      <span className="text-gray-500">Completed program(s)</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Validation Warning */}
      {!canContinue && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-amber-900">Class selection required</p>
              <p className="text-sm text-amber-700 mt-1">
                Each child must be enrolled in at least one program (or have completed all levels) to continue.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Navigation */}
      <WizardNavigation
        onBack={goToPreviousStep}
        onNext={goToNextStep}
        backLabel="Back to Emergency Contacts"
        nextLabel="Review Enrollment"
        isLoading={isLoading}
        isNextDisabled={!canContinue}
      />
    </div>
  );
}
