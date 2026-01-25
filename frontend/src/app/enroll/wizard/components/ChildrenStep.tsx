'use client';

import { useState } from 'react';
import { useEnrollment } from '../EnrollmentContext';
import { WizardNavigation } from './WizardNavigation';
import { EnrollmentStudent } from '@/types/enrollment';

export function ChildrenStep() {
  const { state, updateFormChildren, goToNextStep, goToPreviousStep } = useEnrollment();
  const { formState, isLoading } = state;
  const children = formState.children;
  
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedChild, setEditedChild] = useState<EnrollmentStudent>({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    grade_level: null,
    vietnamese_name: null,
    special_needs: null,
  });
  
  const handleAddNew = () => {
    setEditedChild({
      first_name: '',
      last_name: '',
      date_of_birth: '',
      grade_level: null,
      vietnamese_name: null,
      special_needs: null,
    });
    setEditingIndex(-1); // -1 indicates new child
  };
  
  const handleEdit = (index: number) => {
    setEditedChild({ ...children[index] });
    setEditingIndex(index);
  };
  
  const handleSave = () => {
    const updatedChildren = [...children];
    
    if (editingIndex === -1) {
      // Adding new child
      const newChild = { ...editedChild, id: `new-${Date.now()}` };
      updatedChildren.push(newChild);
    } else if (editingIndex !== null) {
      // Editing existing child
      updatedChildren[editingIndex] = editedChild;
    }
    
    updateFormChildren(updatedChildren);
    setEditingIndex(null);
  };
  
  const handleCancel = () => {
    setEditingIndex(null);
  };
  
  const handleDelete = (index: number) => {
    if (confirm('Are you sure you want to remove this child?')) {
      const updatedChildren = children.filter((_, i) => i !== index);
      updateFormChildren(updatedChildren);
    }
  };
  
  const canContinue = children.length > 0 && children.every(c => 
    c.first_name.trim().length > 0 && 
    c.last_name.trim().length > 0 && 
    c.date_of_birth.trim().length > 0
  );
  
  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Children & Students</h2>
          <p className="mt-1 text-sm text-gray-600">
            Add or update information for children who will be enrolled. At least one child is required.
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
            Add Child
          </button>
        )}
      </div>
      
      {/* Children List/Form */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Students ({children.length})
          </h3>
        </div>
        
        <div className="divide-y divide-gray-100">
          {children.map((child, index) => (
            <div key={child.id || index} className="p-6">
              {editingIndex === index ? (
                <div className="space-y-4">
                  {/* Editing form */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        value={editedChild.first_name}
                        onChange={(e) => setEditedChild({ ...editedChild, first_name: e.target.value })}
                        className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-all"
                        placeholder="John"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        value={editedChild.last_name}
                        onChange={(e) => setEditedChild({ ...editedChild, last_name: e.target.value })}
                        className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-all"
                        placeholder="Smith"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date of Birth *
                      </label>
                      <input
                        type="date"
                        value={editedChild.date_of_birth}
                        onChange={(e) => setEditedChild({ ...editedChild, date_of_birth: e.target.value })}
                        className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Vietnamese Name
                      </label>
                      <input
                        type="text"
                        value={editedChild.vietnamese_name || ''}
                        onChange={(e) => setEditedChild({ 
                          ...editedChild, 
                          vietnamese_name: e.target.value || null 
                        })}
                        className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-all"
                        placeholder="Tên tiếng Việt"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Grade Level
                      </label>
                      <select
                        value={editedChild.grade_level || ''}
                        onChange={(e) => setEditedChild({ 
                          ...editedChild, 
                          grade_level: e.target.value ? parseInt(e.target.value) : null 
                        })}
                        className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-all"
                      >
                        <option value="">Select grade level</option>
                        <option value="1">Grade 1</option>
                        <option value="2">Grade 2</option>
                        <option value="3">Grade 3</option>
                        <option value="4">Grade 4</option>
                        <option value="5">Grade 5</option>
                        <option value="6">Grade 6</option>
                        <option value="7">Grade 7</option>
                        <option value="8">Grade 8</option>
                        <option value="9">Grade 9</option>
                        <option value="10">Grade 10</option>
                        <option value="11">Grade 11</option>
                        <option value="12">Grade 12</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      {editedChild.date_of_birth && (
                        <div className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2 w-full">
                          <span className="font-medium">Age:</span> {calculateAge(editedChild.date_of_birth)} years old
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Special Needs / Notes
                    </label>
                    <textarea
                      value={editedChild.special_needs || ''}
                      onChange={(e) => setEditedChild({ 
                        ...editedChild, 
                        special_needs: e.target.value || null 
                      })}
                      rows={3}
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-all"
                      placeholder="Any allergies, medical conditions, learning accommodations, or other notes..."
                    />
                  </div>
                  
                  {/* Form Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleSave}
                      disabled={!editedChild.first_name.trim() || !editedChild.last_name.trim() || !editedChild.date_of_birth.trim()}
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
                    <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-green-600 font-medium">
                        {child.first_name.charAt(0).toUpperCase()}{child.last_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {child.first_name} {child.last_name}
                        {child.vietnamese_name && (
                          <span className="text-gray-500 ml-2">({child.vietnamese_name})</span>
                        )}
                      </p>
                      <div className="text-xs text-gray-500 space-y-0.5">
                        {child.date_of_birth && (
                          <p>Born: {new Date(child.date_of_birth).toLocaleDateString()} • Age: {calculateAge(child.date_of_birth)}</p>
                        )}
                        {child.grade_level && (
                          <p>Grade {child.grade_level}</p>
                        )}
                        {child.special_needs && (
                          <p className="text-amber-600">Special needs: {child.special_needs}</p>
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
                    {children.length > 1 && (
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
          
          {/* New Child Form */}
          {editingIndex === -1 && (
            <div className="p-6 bg-gray-50">
              <h4 className="text-md font-semibold text-gray-900 mb-4">Add New Student</h4>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={editedChild.first_name}
                      onChange={(e) => setEditedChild({ ...editedChild, first_name: e.target.value })}
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-all"
                      placeholder="John"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={editedChild.last_name}
                      onChange={(e) => setEditedChild({ ...editedChild, last_name: e.target.value })}
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-all"
                      placeholder="Smith"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date of Birth *
                    </label>
                    <input
                      type="date"
                      value={editedChild.date_of_birth}
                      onChange={(e) => setEditedChild({ ...editedChild, date_of_birth: e.target.value })}
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vietnamese Name
                    </label>
                    <input
                      type="text"
                      value={editedChild.vietnamese_name || ''}
                      onChange={(e) => setEditedChild({ 
                        ...editedChild, 
                        vietnamese_name: e.target.value || null 
                      })}
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-all"
                      placeholder="Tên tiếng Việt"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Grade Level
                    </label>
                    <select
                      value={editedChild.grade_level || ''}
                      onChange={(e) => setEditedChild({ 
                        ...editedChild, 
                        grade_level: e.target.value ? parseInt(e.target.value) : null 
                      })}
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-all"
                    >
                      <option value="">Select grade level</option>
                      <option value="1">Grade 1</option>
                      <option value="2">Grade 2</option>
                      <option value="3">Grade 3</option>
                      <option value="4">Grade 4</option>
                      <option value="5">Grade 5</option>
                      <option value="6">Grade 6</option>
                      <option value="7">Grade 7</option>
                      <option value="8">Grade 8</option>
                      <option value="9">Grade 9</option>
                      <option value="10">Grade 10</option>
                      <option value="11">Grade 11</option>
                      <option value="12">Grade 12</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    {editedChild.date_of_birth && (
                      <div className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2 w-full">
                        <span className="font-medium">Age:</span> {calculateAge(editedChild.date_of_birth)} years old
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Special Needs / Notes
                  </label>
                  <textarea
                    value={editedChild.special_needs || ''}
                    onChange={(e) => setEditedChild({ 
                      ...editedChild, 
                      special_needs: e.target.value || null 
                    })}
                    rows={3}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-all"
                    placeholder="Any allergies, medical conditions, learning accommodations, or other notes..."
                  />
                </div>
                
                {/* Form Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={handleSave}
                    disabled={!editedChild.first_name.trim() || !editedChild.last_name.trim() || !editedChild.date_of_birth.trim()}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Add Student
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
          {children.length === 0 && editingIndex !== -1 && (
            <div className="p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No students added yet</h3>
              <p className="mt-2 text-gray-500">
                Add at least one child to continue with enrollment.
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Validation Message */}
      {children.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-amber-900">At least one student required</p>
              <p className="text-sm text-amber-700 mt-1">
                Please add at least one child to continue with enrollment.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Navigation */}
      <WizardNavigation
        onBack={goToPreviousStep}
        onNext={goToNextStep}
        backLabel="Back to Guardians"
        nextLabel="Continue to Emergency Contacts"
        isLoading={isLoading}
        isNextDisabled={editingIndex !== null || !canContinue}
      />
    </div>
  );
}