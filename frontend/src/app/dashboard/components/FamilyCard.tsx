'use client';

import { useState } from 'react';
import {
  Edit2,
  Trash2,
  MapPin,
  Phone,
  Mail,
  Users,
  GraduationCap,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Family } from '@/types/family';

interface FamilyCardProps {
  family: Family;
  onEdit: () => void;
  onDelete: () => void;
}

export default function FamilyCard({
  family,
  onEdit,
  onDelete,
}: FamilyCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatAddress = () => {
    const parts = [family.address, family.city, family.state, family.zip_code].filter(
      Boolean
    );
    return parts.length > 0 ? parts.join(', ') : 'No address provided';
  };

  const getStudentAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      {/* Card Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {family.family_name || 'Unnamed Family'}
            </h3>
            <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{formatAddress()}</span>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-1 ml-2">
            <button
              onClick={onEdit}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Edit family"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={onDelete}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete family"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 space-y-4">
        {/* Stats Row */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-sm">
            <Users className="h-4 w-4 text-blue-500" />
            <span className="text-gray-600">
              {family.guardians.length} Guardian{family.guardians.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <GraduationCap className="h-4 w-4 text-green-500" />
            <span className="text-gray-600">
              {family.students.length} Student{family.students.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <AlertCircle className="h-4 w-4 text-orange-500" />
            <span className="text-gray-600">
              {family.emergency_contacts.length} Contact{family.emergency_contacts.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Guardians Preview */}
        {family.guardians.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Guardians
            </h4>
            {family.guardians.slice(0, 2).map((guardian) => (
              <div
                key={guardian.id}
                className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2"
              >
                <div>
                  <span className="font-medium text-gray-900">{guardian.name}</span>
                  {guardian.relationship_to_family && (
                    <span className="ml-2 text-xs text-gray-500">
                      ({guardian.relationship_to_family})
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-gray-500">
                  {guardian.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      <span className="text-xs">{guardian.phone}</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
            {family.guardians.length > 2 && !isExpanded && (
              <p className="text-xs text-gray-500">
                +{family.guardians.length - 2} more
              </p>
            )}
          </div>
        )}

        {/* Students Preview */}
        {family.students.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Students
            </h4>
            {family.students.slice(0, isExpanded ? undefined : 3).map((student) => (
              <div
                key={student.id}
                className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2"
              >
                <div>
                  <span className="font-medium text-gray-900">
                    {student.first_name} {student.last_name}
                  </span>
                  {student.saint_name && (
                    <span className="ml-2 text-xs text-gray-500">
                      (St. {student.saint_name})
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>Age: {getStudentAge(student.date_of_birth)}</span>
                  {student.grade_level && <span>Grade: {student.grade_level}</span>}
                </div>
              </div>
            ))}
            {family.students.length > 3 && !isExpanded && (
              <p className="text-xs text-gray-500">
                +{family.students.length - 3} more
              </p>
            )}
          </div>
        )}

        {/* Expanded Details */}
        {isExpanded && (
          <>
            {/* All Guardians (if more than 2) */}
            {family.guardians.length > 2 && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  All Guardians
                </h4>
                {family.guardians.slice(2).map((guardian) => (
                  <div
                    key={guardian.id}
                    className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2"
                  >
                    <div>
                      <span className="font-medium text-gray-900">{guardian.name}</span>
                      {guardian.relationship_to_family && (
                        <span className="ml-2 text-xs text-gray-500">
                          ({guardian.relationship_to_family})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-gray-500">
                      {guardian.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          <span className="text-xs">{guardian.email}</span>
                        </span>
                      )}
                      {guardian.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          <span className="text-xs">{guardian.phone}</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Emergency Contacts */}
            {family.emergency_contacts.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Emergency Contacts
                </h4>
                {family.emergency_contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-center justify-between text-sm bg-orange-50 rounded-lg px-3 py-2"
                  >
                    <div>
                      <span className="font-medium text-gray-900">{contact.name}</span>
                      {contact.relationship_to_family && (
                        <span className="ml-2 text-xs text-gray-500">
                          ({contact.relationship_to_family})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-gray-500">
                      <Phone className="h-3 w-3" />
                      <span className="text-xs">{contact.phone}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Diocese ID */}
            {family.diocese_id && (
              <div className="text-sm">
                <span className="text-gray-500">Diocese ID:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {family.diocese_id}
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Expand/Collapse Toggle */}
      {(family.guardians.length > 2 ||
        family.students.length > 3 ||
        family.emergency_contacts.length > 0 ||
        family.diocese_id) && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 border-t border-gray-100 flex items-center justify-center gap-1 transition-colors"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-4 w-4" />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" />
              Show More
            </>
          )}
        </button>
      )}
    </div>
  );
}
