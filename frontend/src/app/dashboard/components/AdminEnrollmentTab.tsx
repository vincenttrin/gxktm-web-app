'use client';

import { useCallback, useMemo, useState } from 'react';
import { Search, Sparkles } from 'lucide-react';
import { getFamily } from '@/lib/api';
import { getSuggestedEnrollments, submitEnrollment } from '@/lib/enrollmentApi';
import type { Family } from '@/types/family';
import type {
  ClassSelection,
  SuggestedEnrollmentsResponse,
  StudentEnrollmentSuggestion,
} from '@/types/enrollment';
import { getFamilySearchableText, normalizeVietnamese } from '@/utils/vietnamese';

const LEVEL_OPTIONS = Array.from({ length: 9 }, (_, idx) => idx + 1);

function extractLevel(className: string): number | null {
  const match = className.match(/\d+/);
  return match ? Number(match[0]) : null;
}

function isGiaoLy(programName: string, className: string): boolean {
  const normalized = `${programName} ${className}`.toLowerCase();
  return normalized.includes('giao ly') || normalized.includes('giáo lý');
}

function isVietNgu(programName: string, className: string): boolean {
  const normalized = `${programName} ${className}`.toLowerCase();
  return normalized.includes('viet ngu') || normalized.includes('việt ngữ');
}

function toInitialSelections(
  family: Family,
  suggestions: SuggestedEnrollmentsResponse
): ClassSelection[] {
  const suggestionByStudent = new Map<string, StudentEnrollmentSuggestion>(
    suggestions.suggested_enrollments.map((entry) => [entry.student_id, entry])
  );

  return family.students.map((student) => {
    const suggestion = suggestionByStudent.get(student.id);

    const selection: ClassSelection = {
      student_id: student.id,
      giao_ly_level: null,
      viet_ngu_level: null,
      giao_ly_completed: false,
      viet_ngu_completed: false,
      register_for_tntt: false,
    };

    if (!suggestion) {
      return selection;
    }

    for (const suggestedClass of suggestion.suggested_classes) {
      const level = extractLevel(suggestedClass.class_name);
      if (!level) continue;

      if (isGiaoLy(suggestedClass.program_name || '', suggestedClass.class_name)) {
        selection.giao_ly_level = level;
      }

      if (isVietNgu(suggestedClass.program_name || '', suggestedClass.class_name)) {
        selection.viet_ngu_level = level;
      }
    }

    const completedPrograms = suggestion.completed_programs.map((program) => program.toLowerCase());
    if (completedPrograms.some((program) => program.includes('giao ly') || program.includes('giáo lý'))) {
      selection.giao_ly_completed = true;
      selection.giao_ly_level = null;
    }
    if (completedPrograms.some((program) => program.includes('viet ngu') || program.includes('việt ngữ'))) {
      selection.viet_ngu_completed = true;
      selection.viet_ngu_level = null;
    }

    return selection;
  });
}

interface AdminEnrollmentTabProps {
  cachedFamilies: Family[];
}

export default function AdminEnrollmentTab({ cachedFamilies }: AdminEnrollmentTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFamilyId, setSelectedFamilyId] = useState<string>('');
  const [familyData, setFamilyData] = useState<Family | null>(null);
  const [suggestedData, setSuggestedData] = useState<SuggestedEnrollmentsResponse | null>(null);
  const [classSelections, setClassSelections] = useState<ClassSelection[]>([]);
  const [isLoadingFamilyData, setIsLoadingFamilyData] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const indexedFamilies = useMemo(
    () =>
      cachedFamilies.map((family) => ({
        family,
        normalizedSearchText: normalizeVietnamese(getFamilySearchableText(family)),
      })),
    [cachedFamilies]
  );

  const filteredFamilies = useMemo(() => {
    const normalizedSearch = normalizeVietnamese(searchQuery.trim());
    if (!normalizedSearch) return indexedFamilies.map((entry) => entry.family);

    return indexedFamilies
      .filter((entry) => entry.normalizedSearchText.includes(normalizedSearch))
      .map((entry) => entry.family);
  }, [indexedFamilies, searchQuery]);

  const loadFamilyEnrollmentData = useCallback(async (familyId: string) => {
    setIsLoadingFamilyData(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const [family, suggestions] = await Promise.all([
        getFamily(familyId),
        getSuggestedEnrollments(familyId),
      ]);

      setFamilyData(family);
      setSuggestedData(suggestions);
      setClassSelections(toInitialSelections(family, suggestions));
    } catch (err) {
      console.error('Failed to load suggested enrollments for admin tab:', err);
      setError('Failed to load family enrollment suggestions.');
    } finally {
      setIsLoadingFamilyData(false);
    }
  }, []);

  const handleSelectionChange = (
    studentId: string,
    field: keyof Omit<ClassSelection, 'student_id'>,
    value: number | boolean | null
  ) => {
    setClassSelections((current) =>
      current.map((selection) => {
        if (selection.student_id !== studentId) return selection;
        return { ...selection, [field]: value };
      })
    );
  };

  const handleSubmit = async () => {
    if (!familyData || !suggestedData) return;

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await submitEnrollment({
        family_id: familyData.id,
        family_info: {
          family_name: familyData.family_name,
          address: familyData.address,
          city: familyData.city,
          state: familyData.state,
          zip_code: familyData.zip_code,
          diocese_id: familyData.diocese_id,
        },
        guardians: familyData.guardians.map((guardian) => ({
          id: guardian.id,
          name: guardian.name,
          email: guardian.email,
          phone: guardian.phone,
          relationship_to_family: guardian.relationship_to_family,
        })),
        students: familyData.students.map((student) => ({
          id: student.id,
          first_name: student.first_name,
          last_name: student.last_name,
          middle_name: student.middle_name,
          saint_name: student.saint_name,
          date_of_birth: student.date_of_birth,
          gender: student.gender,
          grade_level: student.grade_level,
          american_school: student.american_school,
          notes: student.notes,
        })),
        emergency_contacts: familyData.emergency_contacts.map((contact) => ({
          id: contact.id,
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          relationship_to_family: contact.relationship_to_family,
        })),
        class_selections: classSelections,
        academic_year_id: suggestedData.academic_year_id,
      });

      setSuccessMessage(response.message);
      await loadFamilyEnrollmentData(familyData.id);
    } catch (err) {
      console.error('Failed to submit admin enrollment:', err);
      setError('Failed to submit enrollments.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const suggestionByStudent = useMemo(() => {
    if (!suggestedData) return new Map<string, StudentEnrollmentSuggestion>();
    return new Map(
      suggestedData.suggested_enrollments.map((entry) => [entry.student_id, entry])
    );
  }, [suggestedData]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Admin Enrollment</h2>
          <p className="text-sm text-gray-600 mt-1">
            Select a family from cached dashboard data, then adjust and submit.
          </p>
        </div>
        <div className="text-sm text-gray-600">
          {cachedFamilies.length} {cachedFamilies.length === 1 ? 'family' : 'families'} cached
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {successMessage}
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
        <label className="text-sm font-medium text-gray-700">Choose Family</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search families (supports Vietnamese)..."
            className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="rounded-lg border border-gray-200 max-h-72 overflow-y-auto">
          {filteredFamilies.length === 0 ? (
            <div className="px-3 py-4 text-sm text-gray-500">No families found.</div>
          ) : (
            filteredFamilies.slice(0, 100).map((family) => {
              const isSelected = family.id === selectedFamilyId;
              const guardianNames = (family.guardians || [])
                .map((guardian) => guardian.name)
                .filter(Boolean)
                .join(', ');
              const studentNames = (family.students || [])
                .map((student) => `${student.first_name} ${student.last_name}`.trim())
                .filter((name) => name.trim().length > 0)
                .join(', ');
              return (
                <button
                  key={family.id}
                  type="button"
                  onClick={() => {
                    if (selectedFamilyId === family.id) return;
                    setSelectedFamilyId(family.id);
                    loadFamilyEnrollmentData(family.id);
                  }}
                  className={`w-full text-left px-3 py-2 border-b last:border-b-0 transition-colors ${
                    isSelected
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : 'hover:bg-gray-50 text-gray-800'
                  }`}
                >
                  <p className="text-sm font-medium">{family.family_name || '(Unnamed family)'}</p>
                  <p className="text-xs text-gray-500">
                    {family.city || 'Unknown city'}, {family.state || 'Unknown state'}
                  </p>
                  <p className="mt-1 text-xs text-gray-600">
                    <span className="font-medium">Guardians:</span>{' '}
                    {guardianNames || 'None listed'}
                  </p>
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">Children:</span>{' '}
                    {studentNames || 'None listed'}
                  </p>
                </button>
              );
            })
          )}
        </div>
        {filteredFamilies.length > 100 && (
          <p className="text-xs text-gray-500">
            Showing first 100 matches. Keep typing to narrow results.
          </p>
        )}
      </div>

      {isLoadingFamilyData && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
          Loading suggested classes...
        </div>
      )}

      {familyData && suggestedData && !isLoadingFamilyData && (
        <div className="space-y-4">
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">
            Enrollment year: <span className="font-semibold">{suggestedData.academic_year_name}</span>
          </div>

          {familyData.students.map((student) => {
            const selection = classSelections.find((item) => item.student_id === student.id);
            const suggestion = suggestionByStudent.get(student.id);

            return (
              <div key={student.id} className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {student.first_name} {student.last_name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      School grade: {student.grade_level ?? 'Not set'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs text-indigo-700">
                    <Sparkles className="h-3.5 w-3.5" />
                    Suggested classes prefilled
                  </div>
                </div>

                {suggestion && (
                  <div className="text-xs text-gray-600 space-y-1">
                    {suggestion.suggested_classes.length > 0 && (
                      <p>
                        Suggested:&nbsp;
                        {suggestion.suggested_classes.map((item) => item.class_name).join(', ')}
                      </p>
                    )}
                    {suggestion.completed_programs.length > 0 && (
                      <p>Completed: {suggestion.completed_programs.join(', ')}</p>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">Giao Ly</label>
                    <select
                      value={
                        selection?.giao_ly_completed
                          ? 'completed'
                          : selection?.giao_ly_level?.toString() || ''
                      }
                      onChange={(event) => {
                        if (event.target.value === 'completed') {
                          handleSelectionChange(student.id, 'giao_ly_level', null);
                          handleSelectionChange(student.id, 'giao_ly_completed', true);
                          return;
                        }
                        if (event.target.value === '') {
                          handleSelectionChange(student.id, 'giao_ly_level', null);
                          handleSelectionChange(student.id, 'giao_ly_completed', false);
                          return;
                        }
                        handleSelectionChange(student.id, 'giao_ly_level', Number(event.target.value));
                        handleSelectionChange(student.id, 'giao_ly_completed', false);
                      }}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="">Not enrolling</option>
                      {LEVEL_OPTIONS.map((level) => (
                        <option key={level} value={level}>
                          Level {level}
                        </option>
                      ))}
                      <option value="completed">Already completed</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">Viet Ngu</label>
                    <select
                      value={
                        selection?.viet_ngu_completed
                          ? 'completed'
                          : selection?.viet_ngu_level?.toString() || ''
                      }
                      onChange={(event) => {
                        if (event.target.value === 'completed') {
                          handleSelectionChange(student.id, 'viet_ngu_level', null);
                          handleSelectionChange(student.id, 'viet_ngu_completed', true);
                          return;
                        }
                        if (event.target.value === '') {
                          handleSelectionChange(student.id, 'viet_ngu_level', null);
                          handleSelectionChange(student.id, 'viet_ngu_completed', false);
                          return;
                        }
                        handleSelectionChange(student.id, 'viet_ngu_level', Number(event.target.value));
                        handleSelectionChange(student.id, 'viet_ngu_completed', false);
                      }}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Not enrolling</option>
                      {LEVEL_OPTIONS.map((level) => (
                        <option key={level} value={level}>
                          Level {level}
                        </option>
                      ))}
                      <option value="completed">Already completed</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <label className="inline-flex items-center gap-2 text-sm text-gray-800">
                      <input
                        type="checkbox"
                        checked={selection?.register_for_tntt || false}
                        onChange={(event) =>
                          handleSelectionChange(student.id, 'register_for_tntt', event.target.checked)
                        }
                        className="h-4 w-4 rounded border-gray-300 text-blue-600"
                      />
                      Register for TNTT
                    </label>
                  </div>
                </div>
              </div>
            );
          })}

          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || classSelections.length === 0}
              className="px-5 py-2.5 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-60"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Enrollment'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
