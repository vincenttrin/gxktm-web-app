'use client';

import { useState } from 'react';
import { useEnrollment } from '../EnrollmentContext';
import { WizardNavigation } from './WizardNavigation';
import { EnrollmentGuardian } from '@/types/enrollment';

export function GuardiansStep() {
  const { state, updateFormGuardians, goToNextStep, goToPreviousStep } = useEnrollment();
  const { formState, isLoading } = state;
  const guardians = formState.guardians;
  
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedGuardian, setEditedGuardian] = useState<EnrollmentGuardian>({
    name: '',
    email: null,
    phone: null,
    relationship_to_family: null,
  });
  
  const handleAddNew = () => {
    setEditedGuardian({
      name: '',
      email: null,
      phone: null,
      relationship_to_family: null,
    });
    setEditingIndex(-1); // -1 indicates new guardian
  };
  
  const handleEdit = (index: number) => {
    setEditedGuardian({ ...guardians[index] });
    setEditingIndex(index);
  };
  
  const handleSave = () => {
    const updatedGuardians = [...guardians];
    
    if (editingIndex === -1) {
      // Adding new guardian
      const newGuardian = { ...editedGuardian, id: `new-${Date.now()}` };
      updatedGuardians.push(newGuardian);
    } else if (editingIndex !== null) {
      // Editing existing guardian
      updatedGuardians[editingIndex] = editedGuardian;
    }
    
    updateFormGuardians(updatedGuardians);
    setEditingIndex(null);
  };
  
  const handleCancel = () => {
    setEditingIndex(null);
  };
  
  const handleDelete = (index: number) => {
    if (confirm('Are you sure you want to remove this guardian?')) {
      const updatedGuardians = guardians.filter((_, i) => i !== index);
      updateFormGuardians(updatedGuardians);
    }
  };
  
  const canContinue = guardians.length > 0 && guardians.every(g => g.name.trim().length > 0);
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Parents & Guardians</h2>
          <p className="mt-1 text-sm text-gray-600">
            Add or update parent and guardian information. At least one guardian is required.
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
            Add Guardian
          </button>
        )}
      </div>
      
      {/* Guardians List/Form */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Guardians ({guardians.length})
          </h3>
        </div>
        
        <div className="divide-y divide-gray-100">
          {guardians.map((guardian, index) => (
            <div key={guardian.id || index} className="p-6">
              {editingIndex === index ? (
                <div className="space-y-4">
                  {/* Editing form */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={editedGuardian.name}
                        onChange={(e) => setEditedGuardian({ ...editedGuardian, name: e.target.value })}
                        className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-all"
                        placeholder="John Smith"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Relationship
                      </label>
                      <select
                        value={editedGuardian.relationship_to_family || ''}
                        onChange={(e) => setEditedGuardian({ 
                          ...editedGuardian, 
                          relationship_to_family: e.target.value || null 
                        })}
                        className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-all"
                      >
                        <option value="">Select relationship</option>
                        <option value="Father">Father</option>
                        <option value="Mother">Mother</option>
                        <option value="Guardian">Guardian</option>
                        <option value="Grandfather">Grandfather</option>
                        <option value="Grandmother">Grandmother</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={editedGuardian.email || ''}
                        onChange={(e) => setEditedGuardian({ 
                          ...editedGuardian, 
                          email: e.target.value || null 
                        })}
                        className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-all"
                        placeholder="john@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={editedGuardian.phone || ''}
                        onChange={(e) => setEditedGuardian({ 
                          ...editedGuardian, 
                          phone: e.target.value || null 
                        })}
                        className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-all"
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>
                  
                  {/* Form Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleSave}
                      disabled={!editedGuardian.name.trim()}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Save
                    </button>
                    <button
                      onClick={handleCancel}
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-medium text-sm">
                        {guardian.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{guardian.name}</p>
                      <div className="text-xs text-gray-500 space-y-0.5">
                        {guardian.relationship_to_family && (
                          <p>{guardian.relationship_to_family}</p>
                        )}
                        {guardian.email && (
                          <p>{guardian.email}</p>
                        )}
                        {guardian.phone && (
                          <p>{guardian.phone}</p>
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
                      Edit
                    </button>
                    {guardians.length > 1 && (
                      <button
                        onClick={() => handleDelete(index)}
                        className="inline-flex items-center gap-1 rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 shadow-sm hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-all"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {/* New Guardian Form */}
          {editingIndex === -1 && (
            <div className="p-6 bg-gray-50">
              <h4 className="text-md font-semibold text-gray-900 mb-4">Add New Guardian</h4>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={editedGuardian.name}
                      onChange={(e) => setEditedGuardian({ ...editedGuardian, name: e.target.value })}
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-all"
                      placeholder="John Smith"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Relationship
                    </label>
                    <select
                      value={editedGuardian.relationship_to_family || ''}
                      onChange={(e) => setEditedGuardian({ 
                        ...editedGuardian, 
                        relationship_to_family: e.target.value || null 
                      })}
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-all"
                    >
                      <option value="">Select relationship</option>
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Guardian">Guardian</option>
                      <option value="Grandfather">Grandfather</option>
                      <option value="Grandmother">Grandmother</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={editedGuardian.email || ''}
                      onChange={(e) => setEditedGuardian({ 
                        ...editedGuardian, 
                        email: e.target.value || null 
                      })}
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-all"
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={editedGuardian.phone || ''}
                      onChange={(e) => setEditedGuardian({ 
                        ...editedGuardian, 
                        phone: e.target.value || null 
                      })}
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-all"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>
                
                {/* Form Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={handleSave}
                    disabled={!editedGuardian.name.trim()}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Add Guardian
                  </button>
                  <button
                    onClick={handleCancel}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Empty state */}
          {guardians.length === 0 && editingIndex !== -1 && (
            <div className="p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No guardians added yet</h3>
              <p className="mt-2 text-gray-500">
                Add at least one parent or guardian to continue with enrollment.
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Validation Message */}
      {guardians.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-amber-900">At least one guardian required</p>
              <p className="text-sm text-amber-700 mt-1">
                Please add at least one parent or guardian to continue with enrollment.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Navigation */}
      <WizardNavigation
        onBack={goToPreviousStep}
        onNext={goToNextStep}
        backLabel="Back to Family Info"
        nextLabel="Continue to Children"
        isLoading={isLoading}
        isNextDisabled={editingIndex !== null || !canContinue}
      />
    </div>
  );
}