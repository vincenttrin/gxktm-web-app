'use client';

import { useState } from 'react';
import { useEnrollment } from '../EnrollmentContext';
import { WizardNavigation } from './WizardNavigation';
import { EnrollmentFamily } from '@/types/enrollment';
import { useTranslation } from '@/lib/i18n';

export function FamilyInfoStep() {
  const { state, updateFormFamily, goToNextStep } = useEnrollment();
  const { t } = useTranslation();
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
  
  // Validate that family name is provided (minimum required field)
  const isFamilyNameValid = isEditing 
    ? (editedFamily.family_name?.trim().length ?? 0) > 0
    : (family.family_name?.trim().length ?? 0) > 0;
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('wizard.familyInfo.title')}</h2>
          <p className="mt-1 text-sm text-gray-600">
            {state.isExistingFamily
              ? t('wizard.familyInfo.descriptionExisting')
              : t('wizard.familyInfo.descriptionNew')}
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
            {t('common.edit')}
          </button>
        )}
      </div>
      
      {/* Family Information Form/Display */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          {t('wizard.familyInfo.familyDetails')}
        </h3>
        
        {isEditing ? (
          <div className="space-y-4">
            {/* Family Name */}
            <div>
              <label htmlFor="family_name" className="block text-sm font-medium text-gray-700 mb-1">
                {t('wizard.familyInfo.familyName')} <span className="text-red-500">*</span>
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
                {t('wizard.familyInfo.streetAddress')}
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
                  {t('wizard.familyInfo.city')}
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
                  {t('wizard.familyInfo.state')}
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
                  {t('wizard.familyInfo.zipCode')}
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
                {t('wizard.familyInfo.dioceseId')} <span className="text-gray-400 text-xs">({t('common.optional')})</span>
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
                {t('common.saveChanges')}
              </button>
              {state.isExistingFamily && (
                <button
                  onClick={handleCancel}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
                >
                  {t('common.cancel')}
                </button>
              )}
            </div>
          </div>
        ) : (
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t('wizard.familyInfo.familyName')}</dt>
              <dd className="mt-1 text-sm text-gray-900">{family.family_name || t('common.notProvided')}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t('wizard.familyInfo.address')}</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {family.address ? (
                  <>
                    {family.address}
                    {family.city && <>, {family.city}</>}
                    {family.state && <>, {family.state}</>}
                    {family.zip_code && <> {family.zip_code}</>}
                  </>
                ) : (
                  t('common.notProvided')
                )}
              </dd>
            </div>
            {family.diocese_id && (
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t('wizard.familyInfo.dioceseId')}</dt>
                <dd className="mt-1 text-sm text-gray-900">{family.diocese_id}</dd>
              </div>
            )}
          </dl>
        )}
      </div>
      
      {/* Validation */}
      {!isFamilyNameValid && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-amber-900">{t('wizard.familyInfo.familyNameRequired')}</p>
              <p className="text-sm text-amber-700 mt-1">
                {t('wizard.familyInfo.familyNameRequiredDesc')}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Navigation */}
      <WizardNavigation
        showBack={false}
        onNext={handleContinue}
        nextLabel={t('wizard.familyInfo.continueToGuardians')}
        isLoading={isLoading}
        isNextDisabled={!isFamilyNameValid}
      />
    </div>
  );
}
