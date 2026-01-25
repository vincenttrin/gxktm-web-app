'use client';

import { useEnrollment } from '../EnrollmentContext';
import { WizardNavigation } from './WizardNavigation';

export function FamilyInfoStep() {
  const { state, goToNextStep } = useEnrollment();
  const { family, isExistingFamily, isLoading } = state;
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Family Information</h2>
        <p className="mt-1 text-sm text-gray-600">
          {isExistingFamily
            ? 'Please review and update your family information below.'
            : 'Please enter your family information to get started.'}
        </p>
      </div>
      
      {/* Family info display/form - placeholder for Phase 2 */}
      {family ? (
        <div className="space-y-6">
          {/* Family Details Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Family Details
            </h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Family Name</dt>
                <dd className="mt-1 text-sm text-gray-900">{family.family_name || 'Not provided'}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Address</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {family.address ? (
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
            </dl>
          </div>
          
          {/* Guardians Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Parents/Guardians
            </h3>
            {family.guardians.length > 0 ? (
              <div className="space-y-3">
                {family.guardians.map((guardian, index) => (
                  <div key={guardian.id || index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-medium text-sm">
                        {guardian.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{guardian.name}</p>
                      <p className="text-xs text-gray-500">
                        {guardian.relationship_to_family && `${guardian.relationship_to_family} • `}
                        {guardian.email || guardian.phone || 'No contact info'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">No guardians added yet.</p>
            )}
          </div>
          
          {/* Students Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Children
            </h3>
            {family.students.length > 0 ? (
              <div className="space-y-3">
                {family.students.map((student, index) => (
                  <div key={student.id || index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-green-600 font-medium text-sm">
                        {student.first_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {student.first_name} {student.last_name}
                        {student.saint_name && ` (${student.saint_name})`}
                      </p>
                      <p className="text-xs text-gray-500">
                        {student.date_of_birth && `DOB: ${student.date_of_birth}`}
                        {student.grade_level && ` • Grade ${student.grade_level}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">No children added yet.</p>
            )}
          </div>
          
          {/* Emergency Contacts Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Emergency Contacts
            </h3>
            {family.emergency_contacts.length > 0 ? (
              <div className="space-y-3">
                {family.emergency_contacts.map((contact, index) => (
                  <div key={contact.id || index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                      <svg className="h-5 w-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{contact.name}</p>
                      <p className="text-xs text-gray-500">
                        {contact.relationship_to_family && `${contact.relationship_to_family} • `}
                        {contact.phone}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">No emergency contacts added yet.</p>
            )}
          </div>
          
          {/* Edit info note - for Phase 2 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-blue-900">Need to update your information?</p>
                <p className="text-sm text-blue-700 mt-1">
                  You&apos;ll be able to edit family information, add new children, and update contact details in the next phase.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-500">Loading family information...</p>
        </div>
      )}
      
      {/* Navigation */}
      <WizardNavigation
        showBack={false}
        onNext={goToNextStep}
        nextLabel="Continue to Class Selection"
        isLoading={isLoading}
        isNextDisabled={!family || family.students.length === 0}
      />
      
      {/* Warning if no students */}
      {family && family.students.length === 0 && (
        <p className="text-center text-sm text-amber-600">
          Please add at least one child to continue with enrollment.
        </p>
      )}
    </div>
  );
}
