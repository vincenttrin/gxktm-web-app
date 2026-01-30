'use client';

import { useState } from 'react';
import { X, Plus, Trash2, User, GraduationCap, AlertCircle } from 'lucide-react';
import { createFamily, updateFamily } from '@/lib/api';
import {
  Family,
  FamilyCreate,
  FamilyUpdate,
  GuardianCreate,
  StudentCreate,
  EmergencyContactCreate,
} from '@/types/family';

interface FamilyModalProps {
  family?: Family;
  onClose: () => void;
  onSuccess: () => void;
  showToast: (message: string, type: 'success' | 'error') => void;
}

export default function FamilyModal({
  family,
  onClose,
  onSuccess,
  showToast,
}: FamilyModalProps) {
  const isEditing = !!family;
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'guardians' | 'students' | 'emergency'>('info');

  // Form State
  const [familyName, setFamilyName] = useState(family?.family_name || '');
  const [address, setAddress] = useState(family?.address || '');
  const [city, setCity] = useState(family?.city || '');
  const [state, setState] = useState(family?.state || '');
  const [zipCode, setZipCode] = useState(family?.zip_code || '');
  const [dioceseId, setDioceseId] = useState(family?.diocese_id || '');

  // Guardians (only for create mode)
  const [guardians, setGuardians] = useState<GuardianCreate[]>(
    family?.guardians.map((g) => ({
      name: g.name,
      email: g.email,
      phone: g.phone,
      relationship_to_family: g.relationship_to_family,
    })) || []
  );

  // Students (only for create mode)
  const [students, setStudents] = useState<StudentCreate[]>(
    family?.students.map((s) => ({
      first_name: s.first_name,
      last_name: s.last_name,
      middle_name: s.middle_name,
      saint_name: s.saint_name,
      date_of_birth: s.date_of_birth,
      gender: s.gender,
      grade_level: s.grade_level,
      american_school: s.american_school,
      notes: s.notes,
    })) || []
  );

  // Emergency Contacts (only for create mode)
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContactCreate[]>(
    family?.emergency_contacts.map((c) => ({
      name: c.name,
      email: c.email,
      phone: c.phone,
      relationship_to_family: c.relationship_to_family,
    })) || []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isEditing) {
        const updateData: FamilyUpdate = {
          family_name: familyName || null,
          address: address || null,
          city: city || null,
          state: state || null,
          zip_code: zipCode || null,
          diocese_id: dioceseId || null,
        };
        await updateFamily(family.id, updateData);
      } else {
        const createData: FamilyCreate = {
          family_name: familyName || null,
          address: address || null,
          city: city || null,
          state: state || null,
          zip_code: zipCode || null,
          diocese_id: dioceseId || null,
          guardians,
          students,
          emergency_contacts: emergencyContacts,
        };
        await createFamily(createData);
      }
      onSuccess();
    } catch (error) {
      console.error('Failed to save family:', error);
      showToast(`Failed to ${isEditing ? 'update' : 'create'} family`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const addGuardian = () => {
    setGuardians([
      ...guardians,
      { name: '', email: '', phone: '', relationship_to_family: '' },
    ]);
  };

  const updateGuardian = (index: number, field: keyof GuardianCreate, value: string) => {
    const updated = [...guardians];
    updated[index] = { ...updated[index], [field]: value };
    setGuardians(updated);
  };

  const removeGuardian = (index: number) => {
    setGuardians(guardians.filter((_, i) => i !== index));
  };

  const addStudent = () => {
    setStudents([
      ...students,
      {
        first_name: '',
        last_name: '',
        date_of_birth: '',
        middle_name: '',
        saint_name: '',
        gender: '',
        grade_level: null,
        american_school: '',
        notes: '',
      },
    ]);
  };

  const updateStudent = (index: number, field: keyof StudentCreate, value: string | number | null) => {
    const updated = [...students];
    updated[index] = { ...updated[index], [field]: value };
    setStudents(updated);
  };

  const removeStudent = (index: number) => {
    setStudents(students.filter((_, i) => i !== index));
  };

  const addEmergencyContact = () => {
    setEmergencyContacts([
      ...emergencyContacts,
      { name: '', email: '', phone: '', relationship_to_family: '' },
    ]);
  };

  const updateEmergencyContact = (index: number, field: keyof EmergencyContactCreate, value: string) => {
    const updated = [...emergencyContacts];
    updated[index] = { ...updated[index], [field]: value };
    setEmergencyContacts(updated);
  };

  const removeEmergencyContact = (index: number) => {
    setEmergencyContacts(emergencyContacts.filter((_, i) => i !== index));
  };

  const TabButton = ({
    tab,
    label,
    icon: Icon,
    count,
  }: {
    tab: typeof activeTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    count?: number;
  }) => (
    <button
      type="button"
      onClick={() => setActiveTab(tab)}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
        activeTab === tab
          ? 'bg-blue-100 text-blue-700'
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
      {count !== undefined && count > 0 && (
        <span className="ml-1 px-1.5 py-0.5 text-xs bg-gray-200 rounded-full">
          {count}
        </span>
      )}
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditing ? 'Edit Family' : 'Create New Family'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 px-6 py-3 border-b border-gray-100 bg-gray-50">
            <TabButton tab="info" label="Family Info" icon={User} />
            {!isEditing && (
              <>
                <TabButton
                  tab="guardians"
                  label="Guardians"
                  icon={User}
                  count={guardians.length}
                />
                <TabButton
                  tab="students"
                  label="Students"
                  icon={GraduationCap}
                  count={students.length}
                />
                <TabButton
                  tab="emergency"
                  label="Emergency"
                  icon={AlertCircle}
                  count={emergencyContacts.length}
                />
              </>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-220px)]">
              {/* Family Info Tab */}
              {activeTab === 'info' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Family Name
                    </label>
                    <input
                      type="text"
                      value={familyName}
                      onChange={(e) => setFamilyName(e.target.value)}
                      placeholder="e.g., Smith Family"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-700"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Street address"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-700"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="City"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-700"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        State
                      </label>
                      <input
                        type="text"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        placeholder="State"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-700"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ZIP Code
                      </label>
                      <input
                        type="text"
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                        placeholder="ZIP"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-700"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Diocese ID (Optional)
                    </label>
                    <input
                      type="text"
                      value={dioceseId}
                      onChange={(e) => setDioceseId(e.target.value)}
                      placeholder="Diocese identifier"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-700"
                    />
                  </div>
                </div>
              )}

              {/* Guardians Tab */}
              {activeTab === 'guardians' && !isEditing && (
                <div className="space-y-4">
                  {guardians.map((guardian, index) => (
                    <div
                      key={index}
                      className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">
                          Guardian {index + 1}
                        </h4>
                        <button
                          type="button"
                          onClick={() => removeGuardian(index)}
                          className="p-1 text-red-500 hover:bg-red-100 rounded transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={guardian.name}
                          onChange={(e) =>
                            updateGuardian(index, 'name', e.target.value)
                          }
                          placeholder="Full name *"
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-700"
                          required
                        />
                        <input
                          type="text"
                          value={guardian.relationship_to_family || ''}
                          onChange={(e) =>
                            updateGuardian(index, 'relationship_to_family', e.target.value)
                          }
                          placeholder="Relationship (e.g., Mother)"
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-700"
                        />
                        <input
                          type="email"
                          value={guardian.email || ''}
                          onChange={(e) =>
                            updateGuardian(index, 'email', e.target.value)
                          }
                          placeholder="Email"
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-700"
                        />
                        <input
                          type="tel"
                          value={guardian.phone || ''}
                          onChange={(e) =>
                            updateGuardian(index, 'phone', e.target.value)
                          }
                          placeholder="Phone"
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-700"
                        />
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addGuardian}
                    className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Add Guardian
                  </button>
                </div>
              )}

              {/* Students Tab */}
              {activeTab === 'students' && !isEditing && (
                <div className="space-y-4">
                  {students.map((student, index) => (
                    <div
                      key={index}
                      className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">
                          Student {index + 1}
                        </h4>
                        <button
                          type="button"
                          onClick={() => removeStudent(index)}
                          className="p-1 text-red-500 hover:bg-red-100 rounded transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <input
                          type="text"
                          value={student.first_name}
                          onChange={(e) =>
                            updateStudent(index, 'first_name', e.target.value)
                          }
                          placeholder="First name *"
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-700"
                          required
                        />
                        <input
                          type="text"
                          value={student.middle_name || ''}
                          onChange={(e) =>
                            updateStudent(index, 'middle_name', e.target.value)
                          }
                          placeholder="Middle name"
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-700"
                        />
                        <input
                          type="text"
                          value={student.last_name}
                          onChange={(e) =>
                            updateStudent(index, 'last_name', e.target.value)
                          }
                          placeholder="Last name *"
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-700"
                          required
                        />
                        <input
                          type="text"
                          value={student.saint_name || ''}
                          onChange={(e) =>
                            updateStudent(index, 'saint_name', e.target.value)
                          }
                          placeholder="Saint name"
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-700"
                        />
                        <input
                          type="date"
                          value={student.date_of_birth || ''}
                          onChange={(e) =>
                            updateStudent(index, 'date_of_birth', e.target.value)
                          }
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-700"
                          required
                        />
                        <select
                          value={student.gender || ''}
                          onChange={(e) =>
                            updateStudent(index, 'gender', e.target.value)
                          }
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-gray-700"
                        >
                          <option value="">Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                        <input
                          type="number"
                          value={student.grade_level ?? ''}
                          onChange={(e) =>
                            updateStudent(
                              index,
                              'grade_level',
                              e.target.value ? parseInt(e.target.value) : null
                            )
                          }
                          placeholder="Grade level"
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-700"
                        />
                        <input
                          type="text"
                          value={student.american_school || ''}
                          onChange={(e) =>
                            updateStudent(index, 'american_school', e.target.value)
                          }
                          placeholder="School"
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-700 col-span-2"
                        />
                      </div>
                      <textarea
                        value={student.notes || ''}
                        onChange={(e) =>
                          updateStudent(index, 'notes', e.target.value)
                        }
                        placeholder="Notes"
                        rows={2}
                        className="mt-3 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none text-gray-700"
                      />
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addStudent}
                    className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Add Student
                  </button>
                </div>
              )}

              {/* Emergency Contacts Tab */}
              {activeTab === 'emergency' && !isEditing && (
                <div className="space-y-4">
                  {emergencyContacts.map((contact, index) => (
                    <div
                      key={index}
                      className="p-4 bg-orange-50 rounded-lg border border-orange-200"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">
                          Emergency Contact {index + 1}
                        </h4>
                        <button
                          type="button"
                          onClick={() => removeEmergencyContact(index)}
                          className="p-1 text-red-500 hover:bg-red-100 rounded transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={contact.name}
                          onChange={(e) =>
                            updateEmergencyContact(index, 'name', e.target.value)
                          }
                          placeholder="Full name *"
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-700"
                          required
                        />
                        <input
                          type="text"
                          value={contact.relationship_to_family || ''}
                          onChange={(e) =>
                            updateEmergencyContact(
                              index,
                              'relationship_to_family',
                              e.target.value
                            )
                          }
                          placeholder="Relationship"
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-700"
                        />
                        <input
                          type="tel"
                          value={contact.phone}
                          onChange={(e) =>
                            updateEmergencyContact(index, 'phone', e.target.value)
                          }
                          placeholder="Phone *"
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-700"
                          required
                        />
                        <input
                          type="email"
                          value={contact.email || ''}
                          onChange={(e) =>
                            updateEmergencyContact(index, 'email', e.target.value)
                          }
                          placeholder="Email"
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-700"
                        />
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addEmergencyContact}
                    className="flex items-center gap-2 px-4 py-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Add Emergency Contact
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading
                  ? 'Saving...'
                  : isEditing
                  ? 'Save Changes'
                  : 'Create Family'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
