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
  DollarSign,
  UserPlus,
  MoreHorizontal,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { FamilyWithPayment } from '@/types/family';

interface FamilyCardWithPaymentProps {
  family: FamilyWithPayment;
  onEdit: () => void;
  onDelete: () => void;
  onMarkAsPaid: () => void;
  onEnrollStudent: (studentId: string, studentName: string) => void;
}

export default function FamilyCardWithPayment({
  family,
  onEdit,
  onDelete,
  onMarkAsPaid,
  onEnrollStudent,
}: FamilyCardWithPaymentProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const primaryGuardian = family.guardians[0];
  const additionalGuardians = family.guardians.slice(1);
  const studentCount = family.students.length;
  const paymentStatus = family.payment_status?.payment_status || 'unpaid';

  const getPaymentStatusBadge = () => {
    switch (paymentStatus) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
            <CheckCircle className="h-3 w-3" />
            Paid
          </span>
        );
      case 'partial':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">
            <Clock className="h-3 w-3" />
            Partial
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">
            <AlertCircle className="h-3 w-3" />
            Unpaid
          </span>
        );
    }
  };

  const getPaymentStatusColor = (): string => {
    switch (paymentStatus) {
      case 'paid':
        return 'border-l-green-500';
      case 'partial':
        return 'border-l-yellow-500';
      default:
        return 'border-l-red-500';
    }
  };

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 border-l-4 ${getPaymentStatusColor()}`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {family.family_name || 'Unnamed Family'}
              </h3>
              {getPaymentStatusBadge()}
            </div>
            {family.city && family.state && (
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {family.city}, {family.state}
              </p>
            )}
          </div>
          
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>
            
            {showMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowMenu(false)} 
                />
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                  <button
                    onClick={() => {
                      onEdit();
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit Family
                  </button>
                  <button
                    onClick={() => {
                      onMarkAsPaid();
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <DollarSign className="h-4 w-4" />
                    Record Payment
                  </button>
                  <hr className="my-1" />
                  <button
                    onClick={() => {
                      onDelete();
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Family
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="px-4 py-3 bg-gray-50 flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1.5 text-gray-600">
          <Users className="h-4 w-4" />
          <span>{studentCount} student{studentCount !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center gap-1.5 text-gray-600">
          <GraduationCap className="h-4 w-4" />
          <span>{family.enrolled_class_count} class{family.enrolled_class_count !== 1 ? 'es' : ''}</span>
        </div>
        {family.payment_status?.amount_paid !== undefined && family.payment_status.amount_paid > 0 && (
          <div className="flex items-center gap-1.5 text-gray-600">
            <DollarSign className="h-4 w-4" />
            <span>${family.payment_status.amount_paid}</span>
          </div>
        )}
      </div>

      {/* Primary Guardian */}
      {primaryGuardian && (
        <div className="p-4 border-b border-gray-100">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
            Primary Contact
          </p>
          <p className="font-medium text-gray-900">{primaryGuardian.name}</p>
          {primaryGuardian.relationship_to_family && (
            <p className="text-sm text-gray-500">
              {primaryGuardian.relationship_to_family}
            </p>
          )}
          <div className="mt-2 space-y-1">
            {primaryGuardian.email && (
              <a
                href={`mailto:${primaryGuardian.email}`}
                className="text-sm text-blue-600 hover:underline flex items-center gap-1.5"
              >
                <Mail className="h-3.5 w-3.5" />
                {primaryGuardian.email}
              </a>
            )}
            {primaryGuardian.phone && (
              <a
                href={`tel:${primaryGuardian.phone}`}
                className="text-sm text-blue-600 hover:underline flex items-center gap-1.5"
              >
                <Phone className="h-3.5 w-3.5" />
                {primaryGuardian.phone}
              </a>
            )}
          </div>
        </div>
      )}

      {/* Students */}
      {family.students.length > 0 && (
        <div className="p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
            Students
          </p>
          <div className="space-y-2">
            {family.students.map((student) => (
              <div
                key={student.id}
                className="flex items-center justify-between py-1"
              >
                <div>
                  <span className="text-sm font-medium text-gray-900">
                    {student.first_name} {student.last_name}
                  </span>
                  {student.grade_level && (
                    <span className="text-xs text-gray-500 ml-2">
                      Grade {student.grade_level}
                    </span>
                  )}
                </div>
                <button
                  onClick={() =>
                    onEnrollStudent(
                      student.id,
                      `${student.first_name} ${student.last_name}`
                    )
                  }
                  className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                  title="Enroll in class"
                >
                  <UserPlus className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expand/Collapse for more guardians */}
      {additionalGuardians.length > 0 && (
        <div className="border-t border-gray-100">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-1"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Hide {additionalGuardians.length} more guardian
                {additionalGuardians.length > 1 ? 's' : ''}
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Show {additionalGuardians.length} more guardian
                {additionalGuardians.length > 1 ? 's' : ''}
              </>
            )}
          </button>
          
          {isExpanded && (
            <div className="px-4 pb-4 space-y-3">
              {additionalGuardians.map((guardian) => (
                <div key={guardian.id} className="text-sm">
                  <p className="font-medium text-gray-900">{guardian.name}</p>
                  {guardian.relationship_to_family && (
                    <p className="text-gray-500 text-xs">
                      {guardian.relationship_to_family}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick Payment Action for Unpaid */}
      {paymentStatus !== 'paid' && (
        <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
          <button
            onClick={onMarkAsPaid}
            className="w-full py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
          >
            <DollarSign className="h-4 w-4" />
            Mark as Paid
          </button>
        </div>
      )}
    </div>
  );
}
