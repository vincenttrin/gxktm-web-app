'use client';

import { useState, useCallback } from 'react';
import {
  X,
  Plus,
  Edit2,
  Trash2,
  Save,
  User,
  GraduationCap,
  AlertCircle,
  Phone,
  Mail,
  Home,
  Check,
} from 'lucide-react';
import {
  updateFamily,
  createGuardian,
  updateGuardian,
  deleteGuardian,
  createStudent,
  updateStudent,
  deleteStudent,
  createEmergencyContact,
  updateEmergencyContact,
  deleteEmergencyContact,
} from '@/lib/api';
import {
  Family,
  FamilyUpdate,
  Guardian,
  GuardianCreate,
  Student,
  StudentCreate,
  EmergencyContact,
  EmergencyContactCreate,
} from '@/types/family';

type TabType = 'info' | 'guardians' | 'students' | 'emergency';

interface FamilyDetailModalProps {
  family: Family;
  onClose: () => void;
  onUpdate: (updatedFamily: Family) => void;
  showToast: (message: string, type: 'success' | 'error') => void;
}

// Helper to format nullable string for display
const displayValue = (value: string | null | undefined): string => value || '-';

export default function FamilyDetailModal({
  family,
  onClose,
  onUpdate,
  showToast,
}: FamilyDetailModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [isLoading, setIsLoading] = useState(false);
  const [localFamily, setLocalFamily] = useState<Family>(family);

  // Edit states
  const [editingFamilyInfo, setEditingFamilyInfo] = useState(false);
  const [editingGuardianId, setEditingGuardianId] = useState<string | null>(null);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);

  // Add states
  const [isAddingGuardian, setIsAddingGuardian] = useState(false);
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [isAddingContact, setIsAddingContact] = useState(false);

  // Delete confirmation
  const [deletingGuardianId, setDeletingGuardianId] = useState<string | null>(null);
  const [deletingStudentId, setDeletingStudentId] = useState<string | null>(null);
  const [deletingContactId, setDeletingContactId] = useState<string | null>(null);

  // Form states for family info
  const [familyForm, setFamilyForm] = useState({
    family_name: localFamily.family_name || '',
    address: localFamily.address || '',
    city: localFamily.city || '',
    state: localFamily.state || '',
    zip_code: localFamily.zip_code || '',
    diocese_id: localFamily.diocese_id || '',
  });

  // New guardian form
  const [newGuardian, setNewGuardian] = useState<GuardianCreate>({
    name: '',
    email: '',
    phone: '',
    relationship_to_family: '',
  });

  // Editing guardian form
  const [editGuardianForm, setEditGuardianForm] = useState<GuardianCreate>({
    name: '',
    email: '',
    phone: '',
    relationship_to_family: '',
  });

  // New student form
  const [newStudent, setNewStudent] = useState<StudentCreate>({
    first_name: '',
    last_name: '',
    middle_name: '',
    saint_name: '',
    date_of_birth: '',
    gender: '',
    grade_level: null,
    american_school: '',
    notes: '',
  });

  // Editing student form
  const [editStudentForm, setEditStudentForm] = useState<StudentCreate>({
    first_name: '',
    last_name: '',
    middle_name: '',
    saint_name: '',
    date_of_birth: '',
    gender: '',
    grade_level: null,
    american_school: '',
    notes: '',
  });

  // New emergency contact form
  const [newContact, setNewContact] = useState<EmergencyContactCreate>({
    name: '',
    email: '',
    phone: '',
    relationship_to_family: '',
  });

  // Editing emergency contact form
  const [editContactForm, setEditContactForm] = useState<EmergencyContactCreate>({
    name: '',
    email: '',
    phone: '',
    relationship_to_family: '',
  });

  // Update local family and notify parent
  const updateLocalFamily = useCallback((updated: Family) => {
    setLocalFamily(updated);
    onUpdate(updated);
  }, [onUpdate]);

  // --- Family Info ---
  const handleSaveFamilyInfo = async () => {
    setIsLoading(true);
    try {
      const updateData: FamilyUpdate = {
        family_name: familyForm.family_name || null,
        address: familyForm.address || null,
        city: familyForm.city || null,
        state: familyForm.state || null,
        zip_code: familyForm.zip_code || null,
        diocese_id: familyForm.diocese_id || null,
      };
      const updated = await updateFamily(localFamily.id, updateData);
      updateLocalFamily(updated);
      setEditingFamilyInfo(false);
      showToast('Family information updated', 'success');
    } catch (error) {
      console.error('Failed to update family:', error);
      showToast('Failed to update family information', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Guardian CRUD ---
  const handleAddGuardian = async () => {
    if (!newGuardian.name.trim()) {
      showToast('Guardian name is required', 'error');
      return;
    }
    setIsLoading(true);
    try {
      const created = await createGuardian(localFamily.id, newGuardian);
      updateLocalFamily({
        ...localFamily,
        guardians: [...localFamily.guardians, created],
      });
      setNewGuardian({ name: '', email: '', phone: '', relationship_to_family: '' });
      setIsAddingGuardian(false);
      showToast('Guardian added successfully', 'success');
    } catch (error) {
      console.error('Failed to add guardian:', error);
      showToast('Failed to add guardian', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const startEditGuardian = (guardian: Guardian) => {
    setEditGuardianForm({
      name: guardian.name,
      email: guardian.email || '',
      phone: guardian.phone || '',
      relationship_to_family: guardian.relationship_to_family || '',
    });
    setEditingGuardianId(guardian.id);
  };

  const handleUpdateGuardian = async (guardianId: string) => {
    if (!editGuardianForm.name.trim()) {
      showToast('Guardian name is required', 'error');
      return;
    }
    setIsLoading(true);
    try {
      const updated = await updateGuardian(localFamily.id, guardianId, editGuardianForm);
      updateLocalFamily({
        ...localFamily,
        guardians: localFamily.guardians.map((g) =>
          g.id === guardianId ? updated : g
        ),
      });
      setEditingGuardianId(null);
      showToast('Guardian updated successfully', 'success');
    } catch (error) {
      console.error('Failed to update guardian:', error);
      showToast('Failed to update guardian', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteGuardian = async (guardianId: string) => {
    setIsLoading(true);
    try {
      await deleteGuardian(localFamily.id, guardianId);
      updateLocalFamily({
        ...localFamily,
        guardians: localFamily.guardians.filter((g) => g.id !== guardianId),
      });
      setDeletingGuardianId(null);
      showToast('Guardian deleted successfully', 'success');
    } catch (error) {
      console.error('Failed to delete guardian:', error);
      showToast('Failed to delete guardian', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Student CRUD ---
  const handleAddStudent = async () => {
    if (!newStudent.first_name.trim() || !newStudent.last_name.trim()) {
      showToast('First name and last name are required', 'error');
      return;
    }
    setIsLoading(true);
    try {
      const studentData = {
        ...newStudent,
        date_of_birth: newStudent.date_of_birth || null,
        grade_level: newStudent.grade_level || null,
      };
      const created = await createStudent(localFamily.id, studentData);
      updateLocalFamily({
        ...localFamily,
        students: [...localFamily.students, created],
      });
      setNewStudent({
        first_name: '',
        last_name: '',
        middle_name: '',
        saint_name: '',
        date_of_birth: '',
        gender: '',
        grade_level: null,
        american_school: '',
        notes: '',
      });
      setIsAddingStudent(false);
      showToast('Student added successfully', 'success');
    } catch (error) {
      console.error('Failed to add student:', error);
      showToast('Failed to add student', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const startEditStudent = (student: Student) => {
    setEditStudentForm({
      first_name: student.first_name,
      last_name: student.last_name,
      middle_name: student.middle_name || '',
      saint_name: student.saint_name || '',
      date_of_birth: student.date_of_birth || '',
      gender: student.gender || '',
      grade_level: student.grade_level,
      american_school: student.american_school || '',
      notes: student.notes || '',
    });
    setEditingStudentId(student.id);
  };

  const handleUpdateStudent = async (studentId: string) => {
    if (!editStudentForm.first_name.trim() || !editStudentForm.last_name.trim()) {
      showToast('First name and last name are required', 'error');
      return;
    }
    setIsLoading(true);
    try {
      const studentData = {
        ...editStudentForm,
        date_of_birth: editStudentForm.date_of_birth || null,
        grade_level: editStudentForm.grade_level || null,
      };
      const updated = await updateStudent(localFamily.id, studentId, studentData);
      updateLocalFamily({
        ...localFamily,
        students: localFamily.students.map((s) =>
          s.id === studentId ? updated : s
        ),
      });
      setEditingStudentId(null);
      showToast('Student updated successfully', 'success');
    } catch (error) {
      console.error('Failed to update student:', error);
      showToast('Failed to update student', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    setIsLoading(true);
    try {
      await deleteStudent(localFamily.id, studentId);
      updateLocalFamily({
        ...localFamily,
        students: localFamily.students.filter((s) => s.id !== studentId),
      });
      setDeletingStudentId(null);
      showToast('Student deleted successfully', 'success');
    } catch (error) {
      console.error('Failed to delete student', error);
      showToast('Failed to delete student. They may be enrolled in classes.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Emergency Contact CRUD ---
  const handleAddContact = async () => {
    if (!newContact.name.trim() || !newContact.phone.trim()) {
      showToast('Name and phone are required', 'error');
      return;
    }
    setIsLoading(true);
    try {
      const created = await createEmergencyContact(localFamily.id, newContact);
      updateLocalFamily({
        ...localFamily,
        emergency_contacts: [...localFamily.emergency_contacts, created],
      });
      setNewContact({ name: '', email: '', phone: '', relationship_to_family: '' });
      setIsAddingContact(false);
      showToast('Emergency contact added successfully', 'success');
    } catch (error) {
      console.error('Failed to add emergency contact:', error);
      showToast('Failed to add emergency contact', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const startEditContact = (contact: EmergencyContact) => {
    setEditContactForm({
      name: contact.name,
      email: contact.email || '',
      phone: contact.phone,
      relationship_to_family: contact.relationship_to_family || '',
    });
    setEditingContactId(contact.id);
  };

  const handleUpdateContact = async (contactId: string) => {
    if (!editContactForm.name.trim() || !editContactForm.phone.trim()) {
      showToast('Name and phone are required', 'error');
      return;
    }
    setIsLoading(true);
    try {
      const updated = await updateEmergencyContact(localFamily.id, contactId, editContactForm);
      updateLocalFamily({
        ...localFamily,
        emergency_contacts: localFamily.emergency_contacts.map((c) =>
          c.id === contactId ? updated : c
        ),
      });
      setEditingContactId(null);
      showToast('Emergency contact updated successfully', 'success');
    } catch (error) {
      console.error('Failed to update emergency contact:', error);
      showToast('Failed to update emergency contact', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    setIsLoading(true);
    try {
      await deleteEmergencyContact(localFamily.id, contactId);
      updateLocalFamily({
        ...localFamily,
        emergency_contacts: localFamily.emergency_contacts.filter((c) => c.id !== contactId),
      });
      setDeletingContactId(null);
      showToast('Emergency contact deleted successfully', 'success');
    } catch (error) {
      console.error('Failed to delete emergency contact:', error);
      showToast('Failed to delete emergency contact', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper: Age calculator
  const getAge = (dateOfBirth: string | null) => {
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

  // Tab button component
  const TabButton = ({
    tab,
    label,
    icon: Icon,
    count,
    color,
  }: {
    tab: TabType;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    count: number;
    color: string;
  }) => (
    <button
      type="button"
      onClick={() => setActiveTab(tab)}
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
        activeTab === tab
          ? `${color} shadow-sm`
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
      <span
        className={`ml-1 px-2 py-0.5 text-xs rounded-full ${
          activeTab === tab ? 'bg-white/30' : 'bg-gray-200'
        }`}
      >
        {count}
      </span>
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
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {localFamily.family_name || 'Family Details'}
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Manage family members and information
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 px-6 py-3 border-b border-gray-100 bg-gray-50 overflow-x-auto">
            <TabButton
              tab="info"
              label="Family Info"
              icon={Home}
              count={0}
              color="bg-blue-100 text-blue-700"
            />
            <TabButton
              tab="guardians"
              label="Parents/Guardians"
              icon={User}
              count={localFamily.guardians.length}
              color="bg-purple-100 text-purple-700"
            />
            <TabButton
              tab="students"
              label="Children"
              icon={GraduationCap}
              count={localFamily.students.length}
              color="bg-green-100 text-green-700"
            />
            <TabButton
              tab="emergency"
              label="Emergency Contacts"
              icon={AlertCircle}
              count={localFamily.emergency_contacts.length}
              color="bg-orange-100 text-orange-700"
            />
          </div>

          {/* Content */}
          <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-180px)]">
            {/* Family Info Tab */}
            {activeTab === 'info' && (
              <div className="space-y-4">
                {editingFamilyInfo ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Family Name
                      </label>
                      <input
                        type="text"
                        value={familyForm.family_name}
                        onChange={(e) =>
                          setFamilyForm({ ...familyForm, family_name: e.target.value })
                        }
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
                        value={familyForm.address}
                        onChange={(e) =>
                          setFamilyForm({ ...familyForm, address: e.target.value })
                        }
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
                          value={familyForm.city}
                          onChange={(e) =>
                            setFamilyForm({ ...familyForm, city: e.target.value })
                          }
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
                          value={familyForm.state}
                          onChange={(e) =>
                            setFamilyForm({ ...familyForm, state: e.target.value })
                          }
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
                          value={familyForm.zip_code}
                          onChange={(e) =>
                            setFamilyForm({ ...familyForm, zip_code: e.target.value })
                          }
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
                        value={familyForm.diocese_id}
                        onChange={(e) =>
                          setFamilyForm({ ...familyForm, diocese_id: e.target.value })
                        }
                        placeholder="Diocese identifier"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-700"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={() => {
                          setFamilyForm({
                            family_name: localFamily.family_name || '',
                            address: localFamily.address || '',
                            city: localFamily.city || '',
                            state: localFamily.state || '',
                            zip_code: localFamily.zip_code || '',
                            diocese_id: localFamily.diocese_id || '',
                          });
                          setEditingFamilyInfo(false);
                        }}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        disabled={isLoading}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveFamilyInfo}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        <Save className="h-4 w-4" />
                        Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-end">
                      <button
                        onClick={() => setEditingFamilyInfo(true)}
                        className="flex items-center gap-2 px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm"
                      >
                        <Edit2 className="h-4 w-4" />
                        Edit
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-gray-500">Family Name</p>
                        <p className="font-medium text-gray-900">
                          {displayValue(localFamily.family_name)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Diocese ID</p>
                        <p className="font-medium text-gray-900">
                          {displayValue(localFamily.diocese_id)}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="font-medium text-gray-900">
                        {displayValue(localFamily.address)}
                      </p>
                      <p className="text-gray-600">
                        {[localFamily.city, localFamily.state, localFamily.zip_code]
                          .filter(Boolean)
                          .join(', ') || '-'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Guardians Tab */}
            {activeTab === 'guardians' && (
              <div className="space-y-4">
                {/* Add Guardian Button */}
                {!isAddingGuardian && (
                  <div className="flex justify-end">
                    <button
                      onClick={() => setIsAddingGuardian(true)}
                      className="flex items-center gap-2 px-3 py-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors text-sm"
                    >
                      <Plus className="h-4 w-4" />
                      Add Guardian
                    </button>
                  </div>
                )}

                {/* Add Guardian Form */}
                {isAddingGuardian && (
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <h4 className="font-medium text-purple-900 mb-3">Add New Guardian</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={newGuardian.name}
                        onChange={(e) =>
                          setNewGuardian({ ...newGuardian, name: e.target.value })
                        }
                        placeholder="Full name *"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-gray-700"
                      />
                      <input
                        type="text"
                        value={newGuardian.relationship_to_family || ''}
                        onChange={(e) =>
                          setNewGuardian({
                            ...newGuardian,
                            relationship_to_family: e.target.value,
                          })
                        }
                        placeholder="Relationship (e.g., Mother)"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-gray-700"
                      />
                      <input
                        type="email"
                        value={newGuardian.email || ''}
                        onChange={(e) =>
                          setNewGuardian({ ...newGuardian, email: e.target.value })
                        }
                        placeholder="Email"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-gray-700"
                      />
                      <input
                        type="tel"
                        value={newGuardian.phone || ''}
                        onChange={(e) =>
                          setNewGuardian({ ...newGuardian, phone: e.target.value })
                        }
                        placeholder="Phone"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-gray-700"
                      />
                    </div>
                    <div className="flex justify-end gap-2 mt-3">
                      <button
                        onClick={() => {
                          setNewGuardian({
                            name: '',
                            email: '',
                            phone: '',
                            relationship_to_family: '',
                          });
                          setIsAddingGuardian(false);
                        }}
                        className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm"
                        disabled={isLoading}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddGuardian}
                        disabled={isLoading}
                        className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm disabled:opacity-50"
                      >
                        <Check className="h-4 w-4" />
                        Add
                      </button>
                    </div>
                  </div>
                )}

                {/* Guardians List */}
                {localFamily.guardians.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <User className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>No guardians added yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {localFamily.guardians.map((guardian) => (
                      <div
                        key={guardian.id}
                        className="p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                      >
                        {editingGuardianId === guardian.id ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <input
                                type="text"
                                value={editGuardianForm.name}
                                onChange={(e) =>
                                  setEditGuardianForm({
                                    ...editGuardianForm,
                                    name: e.target.value,
                                  })
                                }
                                placeholder="Full name *"
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-gray-700"
                              />
                              <input
                                type="text"
                                value={editGuardianForm.relationship_to_family || ''}
                                onChange={(e) =>
                                  setEditGuardianForm({
                                    ...editGuardianForm,
                                    relationship_to_family: e.target.value,
                                  })
                                }
                                placeholder="Relationship"
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-gray-700"
                              />
                              <input
                                type="email"
                                value={editGuardianForm.email || ''}
                                onChange={(e) =>
                                  setEditGuardianForm({
                                    ...editGuardianForm,
                                    email: e.target.value,
                                  })
                                }
                                placeholder="Email"
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-gray-700"
                              />
                              <input
                                type="tel"
                                value={editGuardianForm.phone || ''}
                                onChange={(e) =>
                                  setEditGuardianForm({
                                    ...editGuardianForm,
                                    phone: e.target.value,
                                  })
                                }
                                placeholder="Phone"
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-gray-700"
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => setEditingGuardianId(null)}
                                className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm"
                                disabled={isLoading}
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleUpdateGuardian(guardian.id)}
                                disabled={isLoading}
                                className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm disabled:opacity-50"
                              >
                                <Check className="h-4 w-4" />
                                Save
                              </button>
                            </div>
                          </div>
                        ) : deletingGuardianId === guardian.id ? (
                          <div className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                            <p className="text-red-700 text-sm">
                              Delete {guardian.name}?
                            </p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setDeletingGuardianId(null)}
                                className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded text-sm"
                                disabled={isLoading}
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleDeleteGuardian(guardian.id)}
                                disabled={isLoading}
                                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm disabled:opacity-50"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">
                                  {guardian.name}
                                </span>
                                {guardian.relationship_to_family && (
                                  <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">
                                    {guardian.relationship_to_family}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                                {guardian.email && (
                                  <span className="flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    {guardian.email}
                                  </span>
                                )}
                                {guardian.phone && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {guardian.phone}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => startEditGuardian(guardian)}
                                className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setDeletingGuardianId(guardian.id)}
                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Students Tab */}
            {activeTab === 'students' && (
              <div className="space-y-4">
                {/* Add Student Button */}
                {!isAddingStudent && (
                  <div className="flex justify-end">
                    <button
                      onClick={() => setIsAddingStudent(true)}
                      className="flex items-center gap-2 px-3 py-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors text-sm"
                    >
                      <Plus className="h-4 w-4" />
                      Add Child
                    </button>
                  </div>
                )}

                {/* Add Student Form */}
                {isAddingStudent && (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-900 mb-3">Add New Child</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={newStudent.first_name}
                        onChange={(e) =>
                          setNewStudent({ ...newStudent, first_name: e.target.value })
                        }
                        placeholder="First name *"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-gray-700"
                      />
                      <input
                        type="text"
                        value={newStudent.last_name}
                        onChange={(e) =>
                          setNewStudent({ ...newStudent, last_name: e.target.value })
                        }
                        placeholder="Last name *"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-gray-700"
                      />
                      <input
                        type="text"
                        value={newStudent.middle_name || ''}
                        onChange={(e) =>
                          setNewStudent({ ...newStudent, middle_name: e.target.value })
                        }
                        placeholder="Middle name"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-gray-700"
                      />
                      <input
                        type="text"
                        value={newStudent.saint_name || ''}
                        onChange={(e) =>
                          setNewStudent({ ...newStudent, saint_name: e.target.value })
                        }
                        placeholder="Saint name"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-gray-700"
                      />
                      <input
                        type="date"
                        value={newStudent.date_of_birth || ''}
                        onChange={(e) =>
                          setNewStudent({ ...newStudent, date_of_birth: e.target.value })
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-gray-700"
                      />
                      <select
                        value={newStudent.gender || ''}
                        onChange={(e) =>
                          setNewStudent({ ...newStudent, gender: e.target.value })
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-gray-700"
                      >
                        <option value="">Select gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                      <input
                        type="number"
                        value={newStudent.grade_level ?? ''}
                        onChange={(e) =>
                          setNewStudent({
                            ...newStudent,
                            grade_level: e.target.value ? parseInt(e.target.value) : null,
                          })
                        }
                        placeholder="Grade level"
                        min="1"
                        max="12"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-gray-700"
                      />
                      <input
                        type="text"
                        value={newStudent.american_school || ''}
                        onChange={(e) =>
                          setNewStudent({ ...newStudent, american_school: e.target.value })
                        }
                        placeholder="American school"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-gray-700"
                      />
                    </div>
                    <div className="mt-3">
                      <textarea
                        value={newStudent.notes || ''}
                        onChange={(e) =>
                          setNewStudent({ ...newStudent, notes: e.target.value })
                        }
                        placeholder="Notes"
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-gray-700"
                      />
                    </div>
                    <div className="flex justify-end gap-2 mt-3">
                      <button
                        onClick={() => {
                          setNewStudent({
                            first_name: '',
                            last_name: '',
                            middle_name: '',
                            saint_name: '',
                            date_of_birth: '',
                            gender: '',
                            grade_level: null,
                            american_school: '',
                            notes: '',
                          });
                          setIsAddingStudent(false);
                        }}
                        className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm"
                        disabled={isLoading}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddStudent}
                        disabled={isLoading}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm disabled:opacity-50"
                      >
                        <Check className="h-4 w-4" />
                        Add
                      </button>
                    </div>
                  </div>
                )}

                {/* Students List */}
                {localFamily.students.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <GraduationCap className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>No children added yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {localFamily.students.map((student) => (
                      <div
                        key={student.id}
                        className="p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                      >
                        {editingStudentId === student.id ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <input
                                type="text"
                                value={editStudentForm.first_name}
                                onChange={(e) =>
                                  setEditStudentForm({
                                    ...editStudentForm,
                                    first_name: e.target.value,
                                  })
                                }
                                placeholder="First name *"
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-gray-700"
                              />
                              <input
                                type="text"
                                value={editStudentForm.last_name}
                                onChange={(e) =>
                                  setEditStudentForm({
                                    ...editStudentForm,
                                    last_name: e.target.value,
                                  })
                                }
                                placeholder="Last name *"
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-gray-700"
                              />
                              <input
                                type="text"
                                value={editStudentForm.middle_name || ''}
                                onChange={(e) =>
                                  setEditStudentForm({
                                    ...editStudentForm,
                                    middle_name: e.target.value,
                                  })
                                }
                                placeholder="Middle name"
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-gray-700"
                              />
                              <input
                                type="text"
                                value={editStudentForm.saint_name || ''}
                                onChange={(e) =>
                                  setEditStudentForm({
                                    ...editStudentForm,
                                    saint_name: e.target.value,
                                  })
                                }
                                placeholder="Saint name"
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-gray-700"
                              />
                              <input
                                type="date"
                                value={editStudentForm.date_of_birth || ''}
                                onChange={(e) =>
                                  setEditStudentForm({
                                    ...editStudentForm,
                                    date_of_birth: e.target.value,
                                  })
                                }
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-gray-700"
                              />
                              <select
                                value={editStudentForm.gender || ''}
                                onChange={(e) =>
                                  setEditStudentForm({
                                    ...editStudentForm,
                                    gender: e.target.value,
                                  })
                                }
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-gray-700"
                              >
                                <option value="">Select gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                              </select>
                              <input
                                type="number"
                                value={editStudentForm.grade_level ?? ''}
                                onChange={(e) =>
                                  setEditStudentForm({
                                    ...editStudentForm,
                                    grade_level: e.target.value
                                      ? parseInt(e.target.value)
                                      : null,
                                  })
                                }
                                placeholder="Grade level"
                                min="1"
                                max="12"
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-gray-700"
                              />
                              <input
                                type="text"
                                value={editStudentForm.american_school || ''}
                                onChange={(e) =>
                                  setEditStudentForm({
                                    ...editStudentForm,
                                    american_school: e.target.value,
                                  })
                                }
                                placeholder="American school"
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-gray-700"
                              />
                            </div>
                            <textarea
                              value={editStudentForm.notes || ''}
                              onChange={(e) =>
                                setEditStudentForm({
                                  ...editStudentForm,
                                  notes: e.target.value,
                                })
                              }
                              placeholder="Notes"
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-gray-700"
                            />
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => setEditingStudentId(null)}
                                className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm"
                                disabled={isLoading}
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleUpdateStudent(student.id)}
                                disabled={isLoading}
                                className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm disabled:opacity-50"
                              >
                                <Check className="h-4 w-4" />
                                Save
                              </button>
                            </div>
                          </div>
                        ) : deletingStudentId === student.id ? (
                          <div className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                            <p className="text-red-700 text-sm">
                              Delete {student.first_name} {student.last_name}?
                            </p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setDeletingStudentId(null)}
                                className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded text-sm"
                                disabled={isLoading}
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleDeleteStudent(student.id)}
                                disabled={isLoading}
                                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm disabled:opacity-50"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">
                                  {student.first_name}{' '}
                                  {student.middle_name && `${student.middle_name} `}
                                  {student.last_name}
                                </span>
                                {student.saint_name && (
                                  <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded-full">
                                    St. {student.saint_name}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                                {student.date_of_birth && (
                                  <span>
                                    Age: {getAge(student.date_of_birth)}
                                  </span>
                                )}
                                {student.gender && <span>{student.gender}</span>}
                                {student.grade_level && (
                                  <span>Grade {student.grade_level}</span>
                                )}
                                {student.american_school && (
                                  <span>{student.american_school}</span>
                                )}
                              </div>
                              {student.notes && (
                                <p className="mt-1 text-xs text-gray-400 italic">
                                  {student.notes}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => startEditStudent(student)}
                                className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setDeletingStudentId(student.id)}
                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Emergency Contacts Tab */}
            {activeTab === 'emergency' && (
              <div className="space-y-4">
                {/* Add Contact Button */}
                {!isAddingContact && (
                  <div className="flex justify-end">
                    <button
                      onClick={() => setIsAddingContact(true)}
                      className="flex items-center gap-2 px-3 py-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors text-sm"
                    >
                      <Plus className="h-4 w-4" />
                      Add Emergency Contact
                    </button>
                  </div>
                )}

                {/* Add Contact Form */}
                {isAddingContact && (
                  <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <h4 className="font-medium text-orange-900 mb-3">
                      Add New Emergency Contact
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={newContact.name}
                        onChange={(e) =>
                          setNewContact({ ...newContact, name: e.target.value })
                        }
                        placeholder="Full name *"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-gray-700"
                      />
                      <input
                        type="text"
                        value={newContact.relationship_to_family || ''}
                        onChange={(e) =>
                          setNewContact({
                            ...newContact,
                            relationship_to_family: e.target.value,
                          })
                        }
                        placeholder="Relationship (e.g., Aunt)"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-gray-700"
                      />
                      <input
                        type="tel"
                        value={newContact.phone}
                        onChange={(e) =>
                          setNewContact({ ...newContact, phone: e.target.value })
                        }
                        placeholder="Phone *"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-gray-700"
                      />
                      <input
                        type="email"
                        value={newContact.email || ''}
                        onChange={(e) =>
                          setNewContact({ ...newContact, email: e.target.value })
                        }
                        placeholder="Email"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-gray-700"
                      />
                    </div>
                    <div className="flex justify-end gap-2 mt-3">
                      <button
                        onClick={() => {
                          setNewContact({
                            name: '',
                            email: '',
                            phone: '',
                            relationship_to_family: '',
                          });
                          setIsAddingContact(false);
                        }}
                        className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm"
                        disabled={isLoading}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddContact}
                        disabled={isLoading}
                        className="flex items-center gap-1 px-3 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm disabled:opacity-50"
                      >
                        <Check className="h-4 w-4" />
                        Add
                      </button>
                    </div>
                  </div>
                )}

                {/* Contacts List */}
                {localFamily.emergency_contacts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <AlertCircle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>No emergency contacts added yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {localFamily.emergency_contacts.map((contact) => (
                      <div
                        key={contact.id}
                        className="p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                      >
                        {editingContactId === contact.id ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <input
                                type="text"
                                value={editContactForm.name}
                                onChange={(e) =>
                                  setEditContactForm({
                                    ...editContactForm,
                                    name: e.target.value,
                                  })
                                }
                                placeholder="Full name *"
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-gray-700"
                              />
                              <input
                                type="text"
                                value={editContactForm.relationship_to_family || ''}
                                onChange={(e) =>
                                  setEditContactForm({
                                    ...editContactForm,
                                    relationship_to_family: e.target.value,
                                  })
                                }
                                placeholder="Relationship"
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-gray-700"
                              />
                              <input
                                type="tel"
                                value={editContactForm.phone}
                                onChange={(e) =>
                                  setEditContactForm({
                                    ...editContactForm,
                                    phone: e.target.value,
                                  })
                                }
                                placeholder="Phone *"
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-gray-700"
                              />
                              <input
                                type="email"
                                value={editContactForm.email || ''}
                                onChange={(e) =>
                                  setEditContactForm({
                                    ...editContactForm,
                                    email: e.target.value,
                                  })
                                }
                                placeholder="Email"
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-gray-700"
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => setEditingContactId(null)}
                                className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm"
                                disabled={isLoading}
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleUpdateContact(contact.id)}
                                disabled={isLoading}
                                className="flex items-center gap-1 px-3 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm disabled:opacity-50"
                              >
                                <Check className="h-4 w-4" />
                                Save
                              </button>
                            </div>
                          </div>
                        ) : deletingContactId === contact.id ? (
                          <div className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                            <p className="text-red-700 text-sm">
                              Delete {contact.name}?
                            </p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setDeletingContactId(null)}
                                className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded text-sm"
                                disabled={isLoading}
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleDeleteContact(contact.id)}
                                disabled={isLoading}
                                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm disabled:opacity-50"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">
                                  {contact.name}
                                </span>
                                {contact.relationship_to_family && (
                                  <span className="px-2 py-0.5 text-xs bg-orange-100 text-orange-700 rounded-full">
                                    {contact.relationship_to_family}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {contact.phone}
                                </span>
                                {contact.email && (
                                  <span className="flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    {contact.email}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => startEditContact(contact)}
                                className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setDeletingContactId(contact.id)}
                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
          <div className="bg-white rounded-lg p-4 shadow-lg flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span className="text-gray-700">Saving...</span>
          </div>
        </div>
      )}
    </div>
  );
}
