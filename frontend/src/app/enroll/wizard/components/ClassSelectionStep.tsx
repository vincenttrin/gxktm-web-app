'use client';

import { useMemo } from 'react';
import { useEnrollment } from '../EnrollmentContext';
import { WizardNavigation } from './WizardNavigation';
import { useTranslation } from '@/lib/i18n';

// Grade level options (1-9)
const GRADE_LEVELS = [
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

function isProgramGiaoLy(programName: string, className: string): boolean {
  const p = programName.toLowerCase();
  const c = className.toLowerCase();
  return p.includes('giao ly') || p.includes('giáo lý') || c.includes('giao ly') || c.includes('giáo lý');
}

function isProgramVietNgu(programName: string, className: string): boolean {
  const p = programName.toLowerCase();
  const c = className.toLowerCase();
  return p.includes('viet ngu') || p.includes('việt ngữ') || c.includes('viet ngu') || c.includes('việt ngữ');
}

function extractLevel(className: string): number | null {
  const match = className.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

export function ClassSelectionStep() {
  const { state, updateClassSelections, goToNextStep, goToPreviousStep } = useEnrollment();
  const { t } = useTranslation();
  const { formState, academicYear, suggestedEnrollments, isLoading } = state;
  const children = formState.children;
  const classSelections = formState.classSelections;

  // Build a lookup: which programs are locked/completed per student
  const studentEnrollmentStatus = useMemo(() => {
    const statusMap: Record<string, {
      isCurrentlyEnrolled: boolean;
      giaoLyLocked: boolean;
      vietNguLocked: boolean;
      giaoLyCompleted: boolean;
      vietNguCompleted: boolean;
      giaoLyPreviousLevel: number | null;
      vietNguPreviousLevel: number | null;
    }> = {};

    for (const suggestion of suggestedEnrollments) {
      const isEnrolled = suggestion.is_currently_enrolled ?? false;
      const completedPrograms = suggestion.completed_programs ?? [];

      let giaoLyLocked = false;
      let vietNguLocked = false;
      let giaoLyPrevLevel: number | null = null;
      let vietNguPrevLevel: number | null = null;

      for (const cls of suggestion.suggested_classes) {
        const programName = cls.program_name ?? '';
        if (isProgramGiaoLy(programName, cls.class_name)) {
          giaoLyLocked = true;
          const prevMatch = cls.previous_class_name.match(/(\d+)/);
          giaoLyPrevLevel = prevMatch ? parseInt(prevMatch[1], 10) : null;
        }
        if (isProgramVietNgu(programName, cls.class_name)) {
          vietNguLocked = true;
          const prevMatch = cls.previous_class_name.match(/(\d+)/);
          vietNguPrevLevel = prevMatch ? parseInt(prevMatch[1], 10) : null;
        }
      }

      const giaoLyCompleted = completedPrograms.some(
        p => p.toLowerCase().includes('giao ly') || p.toLowerCase().includes('giáo lý')
      );
      const vietNguCompleted = completedPrograms.some(
        p => p.toLowerCase().includes('viet ngu') || p.toLowerCase().includes('việt ngữ')
      );

      statusMap[suggestion.student_id] = {
        isCurrentlyEnrolled: isEnrolled,
        giaoLyLocked,
        vietNguLocked,
        giaoLyCompleted,
        vietNguCompleted,
        giaoLyPreviousLevel: giaoLyPrevLevel,
        vietNguPreviousLevel: vietNguPrevLevel,
      };
    }

    return statusMap;
  }, [suggestedEnrollments]);

  // Build selections from suggested enrollments data, then sync to context.
  // This avoids useEffect timing issues where classSelections would initialize
  // before suggestedEnrollments arrived.
  const computedSelections = useMemo(() => {
    return children.map((child, index) => {
      // If user has already made a selection (stored in context), use it
      const existing = classSelections.find(s => s.student_id === child.id);
      if (existing) return existing;

      // Otherwise compute from suggestions
      let giaoLyLevel: number | null = null;
      let vietNguLevel: number | null = null;
      let giaoLyCompleted = false;
      let vietNguCompleted = false;

      const status = child.id ? studentEnrollmentStatus[child.id] : undefined;

      if (status?.isCurrentlyEnrolled) {
        const suggestion = suggestedEnrollments.find(s => s.student_id === child.id);
        if (suggestion) {
          for (const cls of suggestion.suggested_classes) {
            const programName = cls.program_name ?? '';
            const level = extractLevel(cls.class_name);
            if (level && isProgramGiaoLy(programName, cls.class_name)) {
              giaoLyLevel = level > 9 ? null : level;
              if (level > 9) giaoLyCompleted = true;
            } else if (level && isProgramVietNgu(programName, cls.class_name)) {
              vietNguLevel = level > 9 ? null : level;
              if (level > 9) vietNguCompleted = true;
            }
          }
        }
        if (status.giaoLyCompleted) {
          giaoLyCompleted = true;
          giaoLyLevel = null;
        }
        if (status.vietNguCompleted) {
          vietNguCompleted = true;
          vietNguLevel = null;
        }
      } else {
        if (child.grade_level) {
          giaoLyLevel = Math.min(child.grade_level, 9);
          vietNguLevel = Math.min(child.grade_level, 9);
        }
      }

      return {
        student_id: child.id || `temp-${index}`,
        giao_ly_level: giaoLyLevel,
        viet_ngu_level: vietNguLevel,
        giao_ly_completed: giaoLyCompleted,
        viet_ngu_completed: vietNguCompleted,
      };
    });
  }, [children, classSelections, studentEnrollmentStatus, suggestedEnrollments]);

  const currentSelections = computedSelections;

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

  // Allow continuing even if some students are not enrolling in any classes
  const canContinue = currentSelections.length === children.length;

  // Sync computed selections to context before navigating to review,
  // so ReviewStep/submission always has up-to-date class selections
  const handleNext = () => {
    updateClassSelections(currentSelections);
    goToNextStep();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{t('wizard.classSelection.title')}</h2>
        <p className="mt-1 text-sm text-gray-600">
          {t('wizard.classSelection.description')}
        </p>
        {academicYear && (
          <p className="mt-2 text-sm font-medium text-blue-600">
            {t('wizard.classSelection.academicYear')}: {academicYear.name}
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

          const status = child.id ? studentEnrollmentStatus[child.id] : undefined;
          const isReturning = status?.isCurrentlyEnrolled ?? false;

          // Find any suggested enrollments for this child
          const suggestion = suggestedEnrollments.find(s => s.student_id === child.id);
          const currentYearClasses = suggestion?.suggested_classes ?? [];
          const currentCourseBadges: Array<{ id: string; label: string; tone: keyof typeof COURSE_BADGE_STYLES }> = [];
          const completedPrograms: string[] = [];
          currentYearClasses.forEach(cls => {
            const programName = cls.program_name ?? '';
            const isGiaoLy = isProgramGiaoLy(programName, cls.class_name);
            const isVietNgu = isProgramVietNgu(programName, cls.class_name);
            const level = extractLevel(cls.class_name);

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

          // Add completed programs from backend
          if (status?.giaoLyCompleted && !completedPrograms.includes('Giáo Lý')) {
            completedPrograms.push('Giáo Lý');
          }
          if (status?.vietNguCompleted && !completedPrograms.includes('Việt Ngữ')) {
            completedPrograms.push('Việt Ngữ');
          }

          const hasCurrentCourseInfo = currentCourseBadges.length > 0 || completedPrograms.length > 0;

          // Determine lock state per program
          const giaoLyLocked = isReturning && (status?.giaoLyLocked || status?.giaoLyCompleted);
          const vietNguLocked = isReturning && (status?.vietNguLocked || status?.vietNguCompleted);

          // Get the suggested class names for locked display
          const giaoLySuggestedName = suggestion?.suggested_classes.find(
            cls => isProgramGiaoLy(cls.program_name ?? '', cls.class_name)
          )?.class_name ?? null;
          const vietNguSuggestedName = suggestion?.suggested_classes.find(
            cls => isProgramVietNgu(cls.program_name ?? '', cls.class_name)
          )?.class_name ?? null;
          const giaoLyGraduated = isReturning && status?.giaoLyCompleted;
          const vietNguGraduated = isReturning && status?.vietNguCompleted;

          // Check if student has completed ALL programs (both graduated)
          const fullyGraduated = giaoLyGraduated && vietNguGraduated;

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
                      <p className="text-sm text-gray-600">{t('wizard.classSelection.schoolGrade')}: {child.grade_level}</p>
                    )}
                    <div className="mt-3 rounded-lg border border-white/70 bg-white/60 px-3 py-2 text-xs text-gray-700">
                      <div className="flex items-center gap-2 font-semibold">
                        <svg className="h-3.5 w-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-2.21 0-4 1.567-4 3.5S9.79 15 12 15s4-1.567 4-3.5S14.21 8 12 8z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6.343 17.657A8 8 0 1117.657 6.343 8 8 0 016.343 17.657z" />
                        </svg>
                        <span>{t('wizard.classSelection.currentAcademicYear')}</span>
                        {/* TODO: ensure academicYear shown is the current active school year, not enrollment year. */}
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
                                  {program} {t('wizard.classSelection.completed')}
                                </span>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="mt-2 text-xs text-gray-600">
                          {fullyGraduated
                            ? t('wizard.classSelection.completedAllCourses')
                            : child.grade_level && child.grade_level >= 9
                              ? t('wizard.classSelection.completedAllCourses')
                              : t('wizard.classSelection.noCoursesRecorded')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Class Selections */}
              {fullyGraduated ? (
                <div className="p-6">
                  <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-center">
                    <svg className="mx-auto h-8 w-8 text-green-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm font-medium text-green-800">{t('wizard.classSelection.completedAllLevels')}</p>
                    <p className="text-xs text-green-700 mt-1">{t('wizard.classSelection.graduatedNoEnrollment')}</p>
                  </div>
                </div>
              ) : (
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Giáo Lý Selection */}
                    <div className={`rounded-lg p-4 border ${giaoLyGraduated ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${giaoLyGraduated ? 'bg-green-600' : 'bg-amber-600'}`}>
                          <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </div>
                        <div>
                          <h4 className={`font-semibold ${giaoLyGraduated ? 'text-green-900' : 'text-amber-900'}`}>{t('wizard.classSelection.giaoLy')}</h4>
                          <p className={`text-xs ${giaoLyGraduated ? 'text-green-700' : 'text-amber-700'}`}>{t('wizard.classSelection.religiousEducation')}</p>
                        </div>
                      </div>

                      {giaoLyGraduated ? (
                        <div className="flex items-center gap-1 text-sm text-green-700">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{t('wizard.classSelection.completedAllLevels')}</span>
                        </div>
                      ) : giaoLyLocked ? (
                        <>
                          <div className="block w-full rounded-lg border border-amber-300 bg-amber-100 px-3 py-2.5 text-gray-900 cursor-not-allowed">
                            {giaoLySuggestedName ?? t('wizard.classSelection.level', { num: selection.giao_ly_level ?? '' })}
                          </div>
                          <div className="mt-2 flex items-center gap-1 text-xs text-amber-700">
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <span>
                              {t('wizard.classSelection.autoPromoted', { level: status?.giaoLyPreviousLevel ?? '' })}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-gray-500">{t('wizard.classSelection.lockedSelection')}</p>
                        </>
                      ) : (
                        <>
                          <select
                            value={
                              selection.giao_ly_completed
                                ? 'completed'
                                : selection.giao_ly_level?.toString() || ''
                            }
                            onChange={(e) => handleGiaoLyChange(index, e.target.value)}
                            className="block w-full rounded-lg border border-amber-300 bg-white px-3 py-2.5 text-gray-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500 focus:ring-opacity-20 transition-all"
                          >
                            <option value="">{t('wizard.classSelection.notEnrolling')}</option>
                            {GRADE_LEVELS.map(grade => (
                              <option key={grade.value} value={grade.value.toString()}>
                                {t('wizard.classSelection.level', { num: grade.value })}
                              </option>
                            ))}
                            <option value="completed">{t('wizard.classSelection.alreadyCompleted')}</option>
                          </select>

                          {selection.giao_ly_completed && (
                            <div className="mt-2 flex items-center gap-1 text-sm text-green-700">
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {t('wizard.classSelection.completedAllLevels')}
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Việt Ngữ Selection */}
                    <div className={`rounded-lg p-4 border ${vietNguGraduated ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${vietNguGraduated ? 'bg-green-600' : 'bg-blue-600'}`}>
                          <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                          </svg>
                        </div>
                        <div>
                          <h4 className={`font-semibold ${vietNguGraduated ? 'text-green-900' : 'text-blue-900'}`}>{t('wizard.classSelection.vietNgu')}</h4>
                          <p className={`text-xs ${vietNguGraduated ? 'text-green-700' : 'text-blue-700'}`}>{t('wizard.classSelection.vietnameseLanguage')}</p>
                        </div>
                      </div>

                      {vietNguGraduated ? (
                        <div className="flex items-center gap-1 text-sm text-green-700">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{t('wizard.classSelection.completedAllLevels')}</span>
                        </div>
                      ) : vietNguLocked ? (
                        <>
                          <div className="block w-full rounded-lg border border-blue-300 bg-blue-100 px-3 py-2.5 text-gray-900 cursor-not-allowed">
                            {vietNguSuggestedName ?? t('wizard.classSelection.level', { num: selection.viet_ngu_level ?? '' })}
                          </div>
                          <div className="mt-2 flex items-center gap-1 text-xs text-blue-700">
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <span>
                              {t('wizard.classSelection.autoPromoted', { level: status?.vietNguPreviousLevel ?? '' })}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-gray-500">{t('wizard.classSelection.lockedSelection')}</p>
                        </>
                      ) : (
                        <>
                          <select
                            value={
                              selection.viet_ngu_completed
                                ? 'completed'
                                : selection.viet_ngu_level?.toString() || ''
                            }
                            onChange={(e) => handleVietNguChange(index, e.target.value)}
                            className="block w-full rounded-lg border border-blue-300 bg-white px-3 py-2.5 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-all"
                          >
                            <option value="">{t('wizard.classSelection.notEnrolling')}</option>
                            {GRADE_LEVELS.map(grade => (
                              <option key={grade.value} value={grade.value.toString()}>
                                {t('wizard.classSelection.level', { num: grade.value })}
                              </option>
                            ))}
                            <option value="completed">{t('wizard.classSelection.alreadyCompleted')}</option>
                          </select>

                          {selection.viet_ngu_completed && (
                            <div className="mt-2 flex items-center gap-1 text-sm text-green-700">
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {t('wizard.classSelection.completedAllLevels')}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Enrollment Summary for this child */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <span className="font-medium">{t('wizard.classSelection.enrollingIn')}</span>
                      {selection.giao_ly_level && (
                        <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                          {t('wizard.classSelection.giaoLyLevel', { level: selection.giao_ly_level })}
                        </span>
                      )}
                      {selection.viet_ngu_level && (
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                          {t('wizard.classSelection.vietNguLevel', { level: selection.viet_ngu_level })}
                        </span>
                      )}
                      {!selection.giao_ly_level && !selection.viet_ngu_level && !selection.giao_ly_completed && !selection.viet_ngu_completed && (
                        <span className="text-gray-500">{t('wizard.classSelection.notEnrolling')}</span>
                      )}
                      {(selection.giao_ly_completed || selection.viet_ngu_completed) && !selection.giao_ly_level && !selection.viet_ngu_level && (
                        <span className="text-gray-500">{t('wizard.classSelection.completedPrograms')}</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Navigation */}
      <WizardNavigation
        onBack={goToPreviousStep}
        onNext={handleNext}
        backLabel={t('wizard.classSelection.backToEmergency')}
        nextLabel={t('wizard.classSelection.reviewEnrollment')}
        isLoading={isLoading}
        isNextDisabled={!canContinue}
      />
    </div>
  );
}
