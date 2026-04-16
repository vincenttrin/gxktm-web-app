'use client';

import { useState } from 'react';
import { useEnrollment } from '../EnrollmentContext';
import { submitEnrollment, EnrollmentSubmissionRequest } from '@/lib/enrollmentApi';
import { useTranslation } from '@/lib/i18n';

export function ReviewStep() {
  const { state, setStep, goToPreviousStep, setSubmitting, setError } = useEnrollment();
  const { formState, academicYear, isLoading, isSubmitting } = state;
  const { family, guardians, children, emergencyContacts, classSelections } = formState;
  const { t } = useTranslation();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [hasParentalConsent, setHasParentalConsent] = useState(false);

  const handleSubmit = async () => {
    setShowConfirmDialog(false);
    if (!hasParentalConsent) {
      setError('Parental consent is required before submitting the registration.');
      return;
    }
    if (!academicYear) {
      setError('No academic year configured. Please contact administration.');
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      // Build the submission request
      const request: EnrollmentSubmissionRequest = {
        family_id: family.id || null,
        family_info: {
          family_name: family.family_name || null,
          address: family.address || null,
          city: family.city || null,
          state: family.state || null,
          zip_code: family.zip_code || null,
          diocese_id: family.diocese_id || null,
        },
        guardians: guardians.map(g => ({
          id: g.id || null,
          name: g.name,
          email: g.email || null,
          phone: g.phone || null,
          relationship_to_family: g.relationship_to_family || null,
        })),
        students: children.map(c => ({
          id: c.id || null,
          first_name: c.first_name,
          last_name: c.last_name,
          middle_name: c.middle_name || null,
          vietnamese_name: c.vietnamese_name || null,
          saint_name: c.saint_name || null,
          date_of_birth: c.date_of_birth || null,
          gender: c.gender || null,
          grade_level: c.grade_level || null,
          american_school: c.american_school || null,
          special_needs: c.special_needs || null,
          notes: c.notes || null,
        })),
        emergency_contacts: emergencyContacts.map(ec => ({
          id: ec.id || null,
          name: ec.name,
          email: ec.email || null,
          phone: ec.phone,
          relationship_to_family: ec.relationship_to_family || null,
        })),
        class_selections: classSelections
          .filter(s => s.student_id) // Only include selections with valid student IDs
          .map(s => ({
            student_id: s.student_id,
            giao_ly_level: s.giao_ly_level,
            viet_ngu_level: s.viet_ngu_level,
            giao_ly_completed: s.giao_ly_completed,
            viet_ngu_completed: s.viet_ngu_completed,
            register_for_tntt: s.register_for_tntt,
          })),
        academic_year_id: academicYear.id,
      };
      
      // Submit the enrollment
      const response = await submitEnrollment(request);
      
      if (response.success) {
        // Move to confirmation step
        setStep('confirmation');
      } else {
        throw new Error(response.message || 'Failed to submit enrollment');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to submit enrollment');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Helper to get class selection summary for a child
  const getEnrollmentSummary = (studentId: string | undefined) => {
    if (!studentId) return { giaoLy: null, vietNgu: null, tntt: false };
    const selection = classSelections.find(s => s.student_id === studentId);
    if (!selection) return { giaoLy: null, vietNgu: null, tntt: false };
    
    return {
      giaoLy: selection.giao_ly_completed 
        ? 'Completed' 
        : selection.giao_ly_level 
          ? `Level ${selection.giao_ly_level}` 
          : null,
      vietNgu: selection.viet_ngu_completed 
        ? 'Completed' 
        : selection.viet_ngu_level 
          ? `Level ${selection.viet_ngu_level}` 
          : null,
      tntt: selection.register_for_tntt,
    };
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{t('wizard.review.title')}</h2>
        <p className="mt-1 text-sm text-gray-600">
          {t('wizard.review.description')}
        </p>
        {academicYear && (
          <p className="mt-2 text-sm font-medium text-blue-600">
            {t('wizard.classSelection.academicYear')}: {academicYear.name}
          </p>
        )}
      </div>
      
      {/* Family Information Section */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div 
          className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors"
          onClick={() => setStep('family-info')}
        >
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            {t('wizard.review.familyInformation')}
          </h3>
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            {t('common.edit')}
          </button>
        </div>
        <div className="p-6">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">{t('wizard.review.familyName')}</dt>
              <dd className="mt-1 text-sm text-gray-900">{family.family_name || t('common.notSpecified')}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">{t('wizard.review.diocese')}</dt>
              <dd className="mt-1 text-sm text-gray-900">{family.diocese_id || t('common.notSpecified')}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">{t('wizard.review.address')}</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {family.address ? (
                  <>
                    {family.address}
                    {family.city && `, ${family.city}`}
                    {family.state && `, ${family.state}`}
                    {family.zip_code && ` ${family.zip_code}`}
                  </>
                ) : (
                  t('common.notSpecified')
                )}
              </dd>
            </div>
          </dl>
        </div>
      </div>
      
      {/* Guardians Section */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div 
          className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors"
          onClick={() => setStep('guardians')}
        >
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {t('wizard.review.parentsGuardians', { count: guardians.length })}
          </h3>
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            {t('common.edit')}
          </button>
        </div>
        <div className="divide-y divide-gray-100">
          {guardians.map((guardian, index) => (
            <div key={guardian.id || index} className="px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 font-medium text-sm">
                    {guardian.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{guardian.name}</p>
                  <p className="text-xs text-gray-500">
                    {guardian.relationship_to_family && `${guardian.relationship_to_family} • `}
                    {guardian.phone || guardian.email || t('common.noContactInfo')}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Children & Class Enrollments Section */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div 
          className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors"
          onClick={() => setStep('children')}
        >
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {t('wizard.review.studentsEnrollments', { count: children.length })}
          </h3>
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            {t('common.edit')}
          </button>
        </div>
        <div className="divide-y divide-gray-100">
          {children.map((child, index) => {
            const enrollment = getEnrollmentSummary(child.id);
            return (
              <div key={child.id || index} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-green-600 font-medium">
                        {child.first_name.charAt(0)}{child.last_name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {child.first_name} {child.last_name}
                        {child.vietnamese_name && (
                          <span className="text-gray-500 ml-1">({child.vietnamese_name})</span>
                        )}
                      </p>
                      {child.date_of_birth && (
                        <p className="text-xs text-gray-500">
                          {t('wizard.review.dob')}: {new Date(child.date_of_birth).toLocaleDateString()}
                          {child.grade_level && ` • ${t('wizard.review.grade')} ${child.grade_level}`}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {enrollment.giaoLy && (
                      <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                        Giáo Lý: {enrollment.giaoLy}
                      </span>
                    )}
                    {enrollment.vietNgu && (
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                        Việt Ngữ: {enrollment.vietNgu}
                      </span>
                    )}
                    {enrollment.tntt && (
                      <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800">
                        TNTT
                      </span>
                    )}
                    {!enrollment.giaoLy && !enrollment.vietNgu && !enrollment.tntt && (
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                        {t('wizard.review.noEnrollment')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div 
          className="bg-gray-50 px-6 py-3 border-t border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
          onClick={() => setStep('class-selection')}
        >
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            {t('wizard.review.editClassSelections')}
          </button>
        </div>
      </div>
      
      {/* Emergency Contacts Section */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div 
          className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors"
          onClick={() => setStep('emergency-contacts')}
        >
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            {t('wizard.review.emergencyContacts', { count: emergencyContacts.length })}
          </h3>
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            {t('common.edit')}
          </button>
        </div>
        <div className="divide-y divide-gray-100">
          {emergencyContacts.map((contact, index) => (
            <div key={contact.id || index} className="px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                  <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{contact.name}</p>
                  <p className="text-xs text-gray-500">
                    {contact.relationship_to_family && `${contact.relationship_to_family} • `}
                    {contact.phone}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Parental Consent */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={hasParentalConsent}
            onChange={(event) => setHasParentalConsent(event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
          />
          <div className="space-y-3 text-sm text-gray-800 leading-6">
            <p>
              I hereby grant permission for my child/children to participate in all KGD programs at Immaculate Heart of Mary Church. I am committed to supporting my child/children in adhering to all regulations, guidelines, and requirements established by KGD and the parish.
            </p>
            <p>
              Tôi đồng ý cho con/em của tôi tham gia các chương trình của KGD tại Giáo xứ Trái Tim Vô Nhiễm Đức Mẹ. Tôi cam kết hỗ trợ và hướng dẫn con/em của tôi tuân thủ mọi nội quy, quy định và yêu cầu do KGD và giáo xứ đề ra.
            </p>
          </div>
        </label>
        {!hasParentalConsent && (
          <p className="mt-3 text-sm font-medium text-amber-700">
            {t('wizard.review.parentalConsentMessage')}
          </p>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <button
          onClick={goToPreviousStep}
          disabled={isLoading || isSubmitting}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t('wizard.review.backToClassSelection')}
        </button>
        
        <button
          onClick={() => setShowConfirmDialog(true)}
          disabled={isLoading || isSubmitting || !hasParentalConsent}
          className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-8 py-3 text-sm font-medium text-white shadow-sm hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isSubmitting ? (
            <>
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              {t('common.submitting')}
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {t('wizard.review.submitEnrollment')}
            </>
          )}
        </button>
      </div>
      
      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{t('wizard.review.confirmSubmission')}</h3>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              {t('wizard.review.confirmMessage', { year: academicYear?.name || 'current' })}
            </p>
            <p className="text-sm text-gray-500 mb-6">
              {state.isExistingFamily
                ? t('wizard.review.existingFamilyNote')
                : t('wizard.review.newFamilyNote')}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-all"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSubmit}
                disabled={!hasParentalConsent}
                className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-500 transition-all"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {t('wizard.review.confirmAndSubmit')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
