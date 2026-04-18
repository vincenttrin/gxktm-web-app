'use client';

import Link from 'next/link';
import { useEnrollment } from '../EnrollmentContext';
import { useTranslation } from '@/lib/i18n';

export function ConfirmationStep() {
  const { state } = useEnrollment();
  const { t } = useTranslation();
  const { formState, academicYear } = state;
  const { family, children, classSelections } = formState;

  // Get enrollment summary
  const enrollmentSummary = children.map(child => {
    const selection = classSelections.find(s => s.student_id === child.id);
    return {
      name: `${child.first_name} ${child.last_name}`,
      giaoLy: selection?.giao_ly_completed
        ? 'Completed'
        : selection?.giao_ly_level
          ? `Level ${selection.giao_ly_level}`
          : null,
      vietNgu: selection?.viet_ngu_completed
        ? 'Completed'
        : selection?.viet_ngu_level
          ? `Level ${selection.viet_ngu_level}`
          : null,
      tntt: selection?.register_for_tntt ?? false,
    };
  });

  // Calculate tuition fee — only count students actually enrolled in classes
  const enrolledCount = children.filter(child => {
    const selection = classSelections.find(s => s.student_id === child.id);
    return selection && (selection.giao_ly_level !== null || selection.viet_ngu_level !== null || selection.register_for_tntt);
  }).length;
  const tuitionFee = (() => {
    if (enrolledCount === 0) return 0;
    const schedule: Record<number, number> = { 1: 125, 2: 250, 3: 315 };
    return schedule[enrolledCount] ?? 375;
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" style={{ margin: 0 }}>
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 sm:p-8 space-y-8">
          {/* Success Banner */}
          <div className="text-center">
            <div className="mx-auto h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
              <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">{t('wizard.confirmation.title')}</h2>
            <p className="mt-2 text-lg text-gray-600">
              {t('wizard.confirmation.thankYou', { year: academicYear?.name || 'upcoming' })}
            </p>
          </div>

          {/* Important Notice */}
          <div className="bg-red-50 rounded-xl border border-red-200 p-6">
            <h3 className="text-lg font-semibold text-red-900 mb-2">{t('wizard.confirmation.important')}</h3>
            <p className="text-sm text-red-800 font-medium">
              {t('wizard.confirmation.notFinalizedUntilPayment')}
            </p>
            <p className="text-sm text-red-800 mt-2">
              {t('wizard.confirmation.acceptedPaymentMethods')}
            </p>
            <p className="text-sm text-red-800 mt-2">
              {t('wizard.confirmation.refundPolicy')}
            </p>
          </div>

          {/* Enrollment Summary */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">{t('wizard.confirmation.enrollmentSummary')}</h3>
              <p className="text-sm text-gray-600 mt-1">
                {t('wizard.confirmation.family')}: {family.family_name || 'Not specified'}
              </p>
            </div>

            <div className="divide-y divide-gray-100">
              {enrollmentSummary.map((student, index) => (
                <div key={index} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                        <span className="text-green-600 font-medium text-sm">
                          {student.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <p className="font-medium text-gray-900">{student.name}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {student.giaoLy && (
                        <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800">
                          Giáo Lý: {student.giaoLy}
                        </span>
                      )}
                      {student.vietNgu && (
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                          Việt Ngữ: {student.vietNgu}
                        </span>
                      )}
                      {student.tntt && (
                        <span className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-800">
                          TNTT
                        </span>
                      )}
                      {!student.giaoLy && !student.vietNgu && !student.tntt && (
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600">
                          {t('wizard.classSelection.notEnrolling')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tuition Fee Summary */}
          <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-6">
            <h3 className="text-lg font-semibold text-emerald-900 mb-3">{t('wizard.confirmation.tuitionSummary')}</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-800">
                  {t('wizard.confirmation.studentsEnrolled', { count: enrolledCount })}
                </p>
              </div>
              <p className="text-2xl font-bold text-emerald-900">${tuitionFee.toFixed(2)}</p>
            </div>
          </div>

          {/* What's Next */}
          <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">{t('wizard.confirmation.whatsNext')}</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">1</span>
                </div>
                <p className="text-sm text-blue-800">
                  <span className="font-medium">{t('wizard.confirmation.completePayment')}</span> {t('wizard.confirmation.completePaymentDesc')}
                </p>
              </li>
              <li className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">2</span>
                </div>
                <p className="text-sm text-blue-800">
                  <span className="font-medium">{t('wizard.confirmation.markCalendar')}</span> {t('wizard.confirmation.markCalendarDesc')}
                </p>
              </li>
            </ul>
          </div>

          {/* Zelle Instructions */}
          <div className="bg-purple-50 rounded-xl border border-purple-200 p-6">
            <h3 className="text-lg font-semibold text-purple-900 mb-4">{t('wizard.confirmation.zelle')}</h3>
            <p className="text-sm text-purple-800">
              {t('wizard.confirmation.zelleInstructions', { email: 'khoigiaoduc3@gmail.com' })}
            </p>
          </div>

          {/* Contact Information */}
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('wizard.confirmation.questions')}</h3>
            <p className="text-sm text-gray-600 mb-4">
              {t('wizard.confirmation.questionsDesc')}
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href={`mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'giaoxukinhthanh@gmail.com'}`}
                className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'giaoxukinhthanh@gmail.com'}
              </a>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-center pt-4">
            <Link
              href={process.env.NEXT_PUBLIC_HOME_URL ? (process.env.NEXT_PUBLIC_HOME_URL.startsWith('http') ? process.env.NEXT_PUBLIC_HOME_URL : `https://${process.env.NEXT_PUBLIC_HOME_URL}`) : '/'}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-8 py-3 text-sm font-medium text-white shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              {t('wizard.confirmation.returnToHome')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
