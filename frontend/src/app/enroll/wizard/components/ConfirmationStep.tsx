'use client';

import { useEnrollment } from '../EnrollmentContext';
import Link from 'next/link';

export function ConfirmationStep() {
  const { state } = useEnrollment();
  const { family, selectedEnrollments, academicYear, userEmail } = state;
  
  // Group enrollments by student
  const enrollmentsByStudent = family?.students.map((student) => ({
    student,
    enrollments: selectedEnrollments.filter((e) => e.student_id === student.id),
  })) || [];
  
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Success Icon */}
      <div className="text-center">
        <div className="mx-auto h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
          <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-gray-900">Enrollment Complete!</h2>
        <p className="mt-3 text-lg text-gray-600">
          Thank you for enrolling your children for {academicYear?.name}.
        </p>
      </div>
      
      {/* Confirmation email notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-blue-900">Confirmation Email Sent</h3>
            <p className="mt-1 text-sm text-blue-700">
              A confirmation email has been sent to <strong>{userEmail}</strong> with a summary of your enrollment.
            </p>
          </div>
        </div>
      </div>
      
      {/* Enrollment Summary */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Enrollment Summary</h3>
          <p className="text-sm text-gray-500">{family?.family_name}</p>
        </div>
        <div className="divide-y divide-gray-100">
          {enrollmentsByStudent.map(({ student, enrollments }) => (
            <div key={student.id} className="p-6">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">
                {student.first_name} {student.last_name}
              </h4>
              <div className="space-y-2">
                {enrollments.map((enrollment) => (
                  <div
                    key={enrollment.class_id}
                    className="flex items-center gap-2 text-sm text-gray-700"
                  >
                    <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>{enrollment.class_name}</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-500">{enrollment.program_name}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Next Steps */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-amber-900 flex items-center gap-2">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Next Steps
        </h3>
        <ul className="mt-3 space-y-2 text-sm text-amber-800">
          <li className="flex items-start gap-2">
            <span className="font-medium">1.</span>
            <span>Payment information will be sent to you separately via email.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-medium">2.</span>
            <span>You will receive class schedules and teacher information before the school year begins.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-medium">3.</span>
            <span>If you need to make changes to your enrollment, please contact us.</span>
          </li>
        </ul>
      </div>
      
      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
        <Link
          href="/enroll"
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-all"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Return to Home
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-blue-500 transition-all"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print Summary
        </button>
      </div>
      
      {/* Support */}
      <p className="text-center text-sm text-gray-500 pt-4">
        Questions? Contact us at{' '}
        <a href="mailto:support@gxktm.org" className="text-blue-600 hover:underline">
          support@gxktm.org
        </a>
      </p>
    </div>
  );
}
