'use client';

import { useState } from 'react';
import { useEnrollment } from '../EnrollmentContext';
import { useTranslation } from '@/lib/i18n';
import { WizardNavigation } from './WizardNavigation';
import { EnrollmentEmergencyContact } from '@/types/enrollment';

export function EmergencyContactsStep() {
  const { state, updateFormEmergencyContacts, goToNextStep, goToPreviousStep } = useEnrollment();
  const { t } = useTranslation();
  const { formState, isLoading } = state;
  const contacts = formState.emergencyContacts;
  
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showSaveValidationErrors, setShowSaveValidationErrors] = useState(false);
  const [editedContact, setEditedContact] = useState<EnrollmentEmergencyContact>({
    name: '',
    email: null,
    phone: '',
    relationship_to_family: null,
  });

  const isEditedNameValid = editedContact.name.trim().length > 0;
  const isEditedPhoneValid = editedContact.phone.trim().length > 0;
  const shouldShowPhoneError = showSaveValidationErrors && !isEditedPhoneValid;
  
  const handleAddNew = () => {
    setShowSaveValidationErrors(false);
    setEditedContact({
      name: '',
      email: null,
      phone: '',
      relationship_to_family: null,
    });
    setEditingIndex(-1); // -1 indicates new contact
  };
  
  const handleEdit = (index: number) => {
    setShowSaveValidationErrors(false);
    setEditedContact({ ...contacts[index] });
    setEditingIndex(index);
  };
  
  const handleSave = () => {
    if (!isEditedNameValid || !isEditedPhoneValid) {
      setShowSaveValidationErrors(true);
      return;
    }

    const updatedContacts = [...contacts];
    
    if (editingIndex === -1) {
      // Adding new contact
      const newContact = { ...editedContact, id: `new-${Date.now()}` };
      updatedContacts.push(newContact);
    } else if (editingIndex !== null) {
      // Editing existing contact
      updatedContacts[editingIndex] = editedContact;
    }
    
    updateFormEmergencyContacts(updatedContacts);
    setShowSaveValidationErrors(false);
    setEditingIndex(null);
  };
  
  const handleCancel = () => {
    setShowSaveValidationErrors(false);
    setEditingIndex(null);
  };
  
  const handleDelete = (index: number) => {
    if (confirm(t('wizard.emergencyContacts.confirmRemove'))) {
      const updatedContacts = contacts.filter((_, i) => i !== index);
      updateFormEmergencyContacts(updatedContacts);
    }
  };
  
  const canContinue = contacts.length > 0 && contacts.every(c => 
    c.name.trim().length > 0 && 
    c.phone.trim().length > 0
  );
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('wizard.emergencyContacts.title')}</h2>
          <p className="mt-1 text-sm text-gray-600">
            {t('wizard.emergencyContacts.description')}
          </p>
        </div>
        {editingIndex === null && (
          <button
            onClick={handleAddNew}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('wizard.emergencyContacts.addContact')}
          </button>
        )}
      </div>
      
      {/* Contacts List/Form */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            {t('wizard.emergencyContacts.contactsCount', { count: contacts.length })}
          </h3>
        </div>
        
        <div className="divide-y divide-gray-100">
          {contacts.map((contact, index) => (
            <div key={contact.id || index} className="p-6">
              {editingIndex === index ? (
                <div className="space-y-4">
                  {/* Editing form */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('wizard.emergencyContacts.fullName')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={editedContact.name}
                        onChange={(e) => setEditedContact({ ...editedContact, name: e.target.value })}
                        className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-all"
                        placeholder="Jane Doe"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('wizard.emergencyContacts.relationship')}
                      </label>
                      <select
                        value={editedContact.relationship_to_family || ''}
                        onChange={(e) => setEditedContact({
                          ...editedContact,
                          relationship_to_family: e.target.value || null
                        })}
                        className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-all"
                      >
                        <option value="">{t('wizard.emergencyContacts.selectRelationship')}</option>
                        <option value="Aunt">{t('wizard.emergencyContacts.relationships.aunt')}</option>
                        <option value="Uncle">{t('wizard.emergencyContacts.relationships.uncle')}</option>
                        <option value="Grandparent">{t('wizard.emergencyContacts.relationships.grandparent')}</option>
                        <option value="Neighbor">{t('wizard.emergencyContacts.relationships.neighbor')}</option>
                        <option value="Family Friend">{t('wizard.emergencyContacts.relationships.familyFriend')}</option>
                        <option value="Godparent">{t('wizard.emergencyContacts.relationships.godparent')}</option>
                        <option value="Other">{t('wizard.emergencyContacts.relationships.other')}</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('wizard.emergencyContacts.phoneNumber')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={editedContact.phone}
                        onChange={(e) => setEditedContact({ ...editedContact, phone: e.target.value })}
                        required
                        aria-required="true"
                        aria-invalid={shouldShowPhoneError}
                        aria-describedby={shouldShowPhoneError ? 'emergency-contact-phone-error' : undefined}
                        className={`block w-full rounded-lg border px-3 py-2 text-gray-900 placeholder-gray-400 transition-all ${shouldShowPhoneError ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:ring-opacity-20' : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20'}`}
                        placeholder="(555) 123-4567"
                      />
                      {shouldShowPhoneError && (
                        <p id="emergency-contact-phone-error" className="mt-1 text-xs text-red-600">
                          {t('wizard.emergencyContacts.phoneNumberRequired')}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('wizard.emergencyContacts.emailAddress')}
                      </label>
                      <input
                        type="email"
                        value={editedContact.email || ''}
                        onChange={(e) => setEditedContact({
                          ...editedContact,
                          email: e.target.value || null
                        })}
                        className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-all"
                        placeholder="jane@example.com"
                      />
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleSave}
                      disabled={!isEditedNameValid}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {t('common.save')}
                    </button>
                    <button
                      onClick={handleCancel}
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
                    >
                      {t('common.cancel')}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                      <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{contact.name}</p>
                      <div className="text-xs text-gray-500 space-y-0.5">
                        {contact.relationship_to_family && (
                          <p>{contact.relationship_to_family}</p>
                        )}
                        <p className="font-medium text-gray-600">{contact.phone}</p>
                        {contact.email && (
                          <p>{contact.email}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(index)}
                      className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      {t('common.edit')}
                    </button>
                    {contacts.length > 1 && (
                      <button
                        onClick={() => handleDelete(index)}
                        className="inline-flex items-center gap-1 rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 shadow-sm hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-all"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        {t('common.remove')}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {/* New Contact Form */}
          {editingIndex === -1 && (
            <div className="p-6 bg-gray-50">
              <h4 className="text-md font-semibold text-gray-900 mb-4">{t('wizard.emergencyContacts.addEmergencyContact')}</h4>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('wizard.emergencyContacts.fullName')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editedContact.name}
                      onChange={(e) => setEditedContact({ ...editedContact, name: e.target.value })}
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-all"
                      placeholder="Jane Doe"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('wizard.emergencyContacts.relationship')}
                    </label>
                    <select
                      value={editedContact.relationship_to_family || ''}
                      onChange={(e) => setEditedContact({
                        ...editedContact,
                        relationship_to_family: e.target.value || null
                      })}
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-all"
                    >
                      <option value="">{t('wizard.emergencyContacts.selectRelationship')}</option>
                      <option value="Aunt">{t('wizard.emergencyContacts.relationships.aunt')}</option>
                      <option value="Uncle">{t('wizard.emergencyContacts.relationships.uncle')}</option>
                      <option value="Grandparent">{t('wizard.emergencyContacts.relationships.grandparent')}</option>
                      <option value="Neighbor">{t('wizard.emergencyContacts.relationships.neighbor')}</option>
                      <option value="Family Friend">{t('wizard.emergencyContacts.relationships.familyFriend')}</option>
                      <option value="Godparent">{t('wizard.emergencyContacts.relationships.godparent')}</option>
                      <option value="Other">{t('wizard.emergencyContacts.relationships.other')}</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('wizard.emergencyContacts.phoneNumber')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={editedContact.phone}
                      onChange={(e) => setEditedContact({ ...editedContact, phone: e.target.value })}
                      required
                      aria-required="true"
                      aria-invalid={shouldShowPhoneError}
                      aria-describedby={shouldShowPhoneError ? 'emergency-contact-phone-error' : undefined}
                      className={`block w-full rounded-lg border px-3 py-2 text-gray-900 placeholder-gray-400 transition-all ${shouldShowPhoneError ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:ring-opacity-20' : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20'}`}
                      placeholder="(555) 123-4567"
                    />
                    {shouldShowPhoneError && (
                      <p id="emergency-contact-phone-error" className="mt-1 text-xs text-red-600">
                        {t('wizard.emergencyContacts.phoneNumberRequired')}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('wizard.emergencyContacts.emailAddress')}
                    </label>
                    <input
                      type="email"
                      value={editedContact.email || ''}
                      onChange={(e) => setEditedContact({
                        ...editedContact,
                        email: e.target.value || null
                      })}
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-all"
                      placeholder="jane@example.com"
                    />
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={handleSave}
                    disabled={!isEditedNameValid}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {t('wizard.emergencyContacts.addContact')}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Empty state */}
          {contacts.length === 0 && editingIndex !== -1 && (
            <div className="p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">{t('wizard.emergencyContacts.noContactsYet')}</h3>
              <p className="mt-2 text-gray-500">
                {t('wizard.emergencyContacts.noContactsDesc')}
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Validation Message */}
      {contacts.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-amber-900">{t('wizard.emergencyContacts.atLeastOneRequired')}</p>
              <p className="text-sm text-amber-700 mt-1">
                {t('wizard.emergencyContacts.atLeastOneRequiredDesc')}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Editing in progress message */}
      {editingIndex !== null && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-blue-800">
              {t('common.saveOrCancel')}
            </p>
          </div>
        </div>
      )}
      
      {/* Navigation */}
      {/* Navigation */}
      <WizardNavigation
        onBack={goToPreviousStep}
        onNext={goToNextStep}
        backLabel={t('wizard.emergencyContacts.backToChildren')}
        nextLabel={t('wizard.emergencyContacts.continueToClassSelection')}
        isLoading={isLoading}
        isNextDisabled={editingIndex !== null || !canContinue}
      />
    </div>
  );
}