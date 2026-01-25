'use client';

import { useEnrollment } from '../EnrollmentContext';
import { WizardNavigation } from './WizardNavigation';

export function ReviewStep() {
  const { state, goToPreviousStep, setStep } = useEnrollment();
  const { family, selectedEnrollments, academicYear, isLoading } = state;
  
  // Group enrollments by student
  const enrollmentsByStudent = family?.students.map((student) => ({
    student,
    enrollments: selectedEnrollments.filter((e) => e.student_id === student.id),
  })) || [];
  
  const handleSubmit = async () => {
    // TODO: Implement submission in Phase 2
    // For now, just move to confirmation
    setStep('confirmation');
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Review Your Enrollment</h2>
        <p className="mt-1 text-sm text-gray-600">
          Please review all information before submitting your enrollment for {academicYear?.name}.
        </p>
      </div>
      
      {/* Family Summary Card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Family Information
          </h3>
        </div>
        <div className="p-6">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Family Name</dt>
              <dd className="mt-1 text-sm text-gray-900">{family?.family_name || 'Not provided'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Address</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {family?.address ? (
                  <>
                    {family.address}
                    {family.city && `, ${family.city}`}
                    {family.state && `, ${family.state}`}
                    {family.zip_code && ` ${family.zip_code}`}
                  </>
                ) : (
                  'Not provided'
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Parents/Guardians</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {family?.guardians.map((g) => g.name).join(', ') || 'Not provided'}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Emergency Contact</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {family?.emergency_contacts[0] 
                  ? `${family.emergency_contacts[0].name} (${family.emergency_contacts[0].phone})`
                  : 'Not provided'}
              </dd>
            </div>
          </dl>
        </div>
      </div>
      
      {/* Enrollments Summary */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Class Enrollments
          </h3>
        </div>
        <div className="divide-y divide-gray-100">
          {enrollmentsByStudent.map(({ student, enrollments }) => (
            <div key={student.id} className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-green-600 font-medium">
                    {student.first_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">
                    {student.first_name} {student.last_name}
                  </h4>
                  {student.saint_name && (
                    <p className="text-xs text-gray-500">Saint Name: {student.saint_name}</p>
                  )}
                </div>
              </div>
              
              {enrollments.length > 0 ? (
                <div className="ml-13 space-y-2">
                  {enrollments.map((enrollment) => (
                    <div
                      key={enrollment.class_id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          enrollment.program_name?.toLowerCase().includes('giao') ||
                          enrollment.program_name?.toLowerCase().includes('giáo')
                            ? 'bg-indigo-500'
                            : enrollment.program_name?.toLowerCase().includes('viet') ||
                              enrollment.program_name?.toLowerCase().includes('việt')
                            ? 'bg-green-500'
                            : 'bg-gray-500'
                        }`} />
                        <span className="text-sm font-medium text-gray-900">
                          {enrollment.class_name}
                        </span>
                        {enrollment.is_auto_suggested && (
                          <span className="text-xs text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded">
                            ★ Auto-suggested
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">{enrollment.program_name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic ml-13">No classes selected</p>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Total summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-900">Enrollment Summary</p>
            <p className="text-xs text-blue-700 mt-1">
              {family?.students.length || 0} student{(family?.students.length || 0) !== 1 ? 's' : ''} enrolling in {selectedEnrollments.length} class{selectedEnrollments.length !== 1 ? 'es' : ''}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-blue-600">Academic Year</p>
            <p className="text-sm font-semibold text-blue-900">{academicYear?.name}</p>
          </div>
        </div>
      </div>
      
      {/* Terms/Agreement - placeholder */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            defaultChecked
          />
          <span className="text-sm text-gray-700">
            I confirm that the information provided is accurate and I agree to enroll my child(ren) in the selected classes for {academicYear?.name}. I understand that payment information will be sent separately.
          </span>
        </label>
      </div>
      
      {/* Navigation */}
      <WizardNavigation
        onBack={goToPreviousStep}
        backLabel="Back to Class Selection"
        showNext={false}
        showSubmit={true}
        onSubmit={handleSubmit}
        submitLabel="Submit Enrollment"
        isLoading={isLoading}
      />
    </div>
  );
}
