'use client';

import Link from 'next/link';
import { useEnrollment } from '../EnrollmentContext';

export function ConfirmationStep() {
  const { state } = useEnrollment();
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
    };
  });
  
  return (
    <div className="space-y-8">
      {/* Success Banner */}
      <div className="text-center">
        <div className="mx-auto h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
          <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-gray-900">Enrollment Submitted!</h2>
        <p className="mt-2 text-lg text-gray-600">
          Thank you for enrolling with us for the {academicYear?.name || 'upcoming'} academic year.
        </p>
      </div>
      
      {/* Confirmation Details */}
      <div className="bg-green-50 rounded-xl border border-green-200 p-6">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-green-900">Confirmation Email Sent</h3>
            <p className="text-sm text-green-700 mt-1">
              A confirmation email has been sent to your registered email address with all the enrollment details.
              Please check your inbox (and spam folder) for the confirmation.
            </p>
          </div>
        </div>
      </div>
      
      {/* Enrollment Summary */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Enrollment Summary</h3>
          <p className="text-sm text-gray-600 mt-1">
            Family: {family.family_name || 'Not specified'}
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
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* What's Next */}
      <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">What&apos;s Next?</h3>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs font-bold">1</span>
            </div>
            <p className="text-sm text-blue-800">
              <span className="font-medium">Check your email</span> – You will receive a confirmation email with enrollment details and next steps.
            </p>
          </li>
          <li className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs font-bold">2</span>
            </div>
            <p className="text-sm text-blue-800">
              <span className="font-medium">Complete payment</span> – Tuition payment information will be sent separately. Payment is due before the first day of class.
            </p>
          </li>
          <li className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs font-bold">3</span>
            </div>
            <p className="text-sm text-blue-800">
              <span className="font-medium">Mark your calendar</span> – The first day of class will be announced via email. Please arrive 15 minutes early for registration.
            </p>
          </li>
        </ul>
      </div>
      
      {/* Contact Information */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Questions?</h3>
        <p className="text-sm text-gray-600 mb-4">
          If you have any questions about your enrollment or need to make changes, please contact us:
        </p>
        <div className="flex flex-wrap gap-4">
          <a 
            href="mailto:gxktm@example.com" 
            className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            gxktm@example.com
          </a>
          <a 
            href="tel:+15551234567" 
            className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            (555) 123-4567
          </a>
        </div>
      </div>
      
      {/* Action Button */}
      <div className="flex justify-center pt-4">
        <Link 
          href="/enroll"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-8 py-3 text-sm font-medium text-white shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Return to Home
        </Link>
      </div>
    </div>
  );
}
