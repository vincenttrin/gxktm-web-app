'use client';

import { useState } from 'react';
import { useEnrollment } from '../EnrollmentContext';
import { WizardNavigation } from './WizardNavigation';
import { EnrollmentFamily } from '@/types/enrollment';

export function FamilyInfoStep() {
  const { state, updateFormFamily, goToNextStep } = useEnrollment();
  const { formState, isLoading } = state;
  const family = formState.family;
  
  const [isEditing, setIsEditing] = useState(!state.isExistingFamily);
  const [editedFamily, setEditedFamily] = useState<EnrollmentFamily>({ ...family });
  
  const handleSave = () => {
    updateFormFamily(editedFamily);
    setIsEditing(false);
  };
  
  const handleCancel = () => {
    setEditedFamily({ ...family });
    setIsEditing(false);
  };
  
  const handleEdit = () => {
    setEditedFamily({ ...family });
    setIsEditing(true);
  };
  
  const handleContinue = () => {
    if (isEditing) {
      handleSave();
    }
    goToNextStep();
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Family Information</h2>
          <p className="mt-1 text-sm text-gray-600">
            {state.isExistingFamily
              ? 'Review and update your family information below.'
              : 'Please enter your family information to get started.'}
          </p>
        </div>
        {state.isExistingFamily && !isEditing && (
          <button
            onClick={handleEdit}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
        )}
      </div>
      
      {/* Family Information Form/Display */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Family Details
        </h3>
        
        {isEditing ? (
          <div className="space-y-4">
            {/* Family Name */}
            <div>
              <label htmlFor="family_name" className="block text-sm font-medium text-gray-700 mb-1">
                Family Name
              </label>
              <input
                type="text"
                id="family_name"
                value={editedFamily.family_name || ''}
                onChange={(e) => setEditedFamily({ ...editedFamily, family_name: e.target.value })}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-all"
                placeholder="Smith Family"
              />
            </div>
            
            {/* Address */}
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Street Address
              </label>
              <input
                type="text"
                id="address"
                value={editedFamily.address || ''}
                onChange={(e) => setEditedFamily({ ...editedFamily, address: e.target.value })}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-all"
                placeholder="123 Main Street"
              />
            </div>
            
            {/* City, State, Zip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-1">
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  id="city"
                  value={editedFamily.city || ''}
                  onChange={(e) => setEditedFamily({ ...editedFamily, city: e.target.value })}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-all"
                  placeholder="Houston"
                />
              </div>
              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                  State
                </label>
                <input
                  type="text"
                  id="state"
                  value={editedFamily.state || ''}
                  onChange={(e) => setEditedFamily({ ...editedFamily, state: e.target.value })}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-all"
                  placeholder="TX"
                  maxLength={2}
                />
              </div>
              <div>
                <label htmlFor="zip_code" className="block text-sm font-medium text-gray-700 mb-1">
                  ZIP Code
                </label>
                <input
                  type="text"
                  id="zip_code"
                  value={editedFamily.zip_code || ''}
                  onChange={(e) => setEditedFamily({ ...editedFamily, zip_code: e.target.value })}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-all"
                  placeholder="77001"
                />
              </div>
            </div>
            
            {/* Diocese ID */}
            <div>
              <label htmlFor="diocese_id" className="block text-sm font-medium text-gray-700 mb-1">
                Diocese ID <span className="text-gray-400 text-xs">(Optional)</span>
              </label>
              <input
                type="text"
                id="diocese_id"
                value={editedFamily.diocese_id || ''}
                onChange={(e) => setEditedFamily({ ...editedFamily, diocese_id: e.target.value })}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-all"
                placeholder="Diocese identifier"
              />
            </div>
            
            {/* Edit Actions */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSave}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save Changes
              </button>
              {state.isExistingFamily && (
                <button
                  onClick={handleCancel}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        ) : (
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
                    {family.city && <>, {family.city}</>}
                    {family.state && <>, {family.state}</>}
                    {family.zip_code && <> {family.zip_code}</>}
                  </>
                ) : (
                  'Not provided'
                )}
              </dd>
            </div>
            {family.diocese_id && (
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Diocese ID</dt>
                <dd className="mt-1 text-sm text-gray-900">{family.diocese_id}</dd>
              </div>
            )}
          </dl>
        )}
      </div>
      
      {/* Navigation */}
      <WizardNavigation
        showBack={false}
        onNext={handleContinue}
        nextLabel="Continue to Parents/Guardians"
        isLoading={isLoading}
      />
    </div>
  );
}
