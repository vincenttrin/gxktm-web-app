// Enrollment Types for the public enrollment portal

// Family lookup response
export interface FamilyLookupResponse {
  is_existing_family: boolean;
  family_id: string | null;
  family_name: string | null;
  guardian_name: string | null;
}

// Academic Year
export interface AcademicYear {
  id: number;
  name: string;
  is_current: boolean;
}

// Program (Giao Ly, Viet Ngu)
export interface Program {
  id: number;
  name: string;
}

// Class for enrollment
export interface EnrollmentClass {
  id: string;
  name: string;
  program_id: number;
  program_name: string | null;
  academic_year_id: number;
}

// Classes response with grouping
export interface ClassesResponse {
  classes: EnrollmentClass[];
  grouped_by_program: Record<string, EnrollmentClass[]>;
}

// Suggested class for a student
export interface SuggestedClass {
  class_id: string;
  class_name: string;
  program_name: string | null;
  previous_class_name: string;
  is_auto_suggested: boolean;
}

// Student enrollment suggestion
export interface StudentEnrollmentSuggestion {
  student_id: string;
  student_name: string;
  suggested_classes: SuggestedClass[];
}

// Suggested enrollments response
export interface SuggestedEnrollmentsResponse {
  family_id: string;
  academic_year_id: number;
  academic_year_name: string;
  suggested_enrollments: StudentEnrollmentSuggestion[];
}

// Guardian for enrollment form
export interface EnrollmentGuardian {
  id?: string;
  name: string;
  email: string | null;
  phone: string | null;
  relationship_to_family: string | null;
}

// Student for enrollment form
export interface EnrollmentStudent {
  id?: string;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  saint_name: string | null;
  date_of_birth: string | null;
  gender: string | null;
  grade_level: number | null;
  american_school: string | null;
  notes: string | null;
}

// Emergency contact for enrollment form
export interface EnrollmentEmergencyContact {
  id?: string;
  name: string;
  email: string | null;
  phone: string;
  relationship_to_family: string | null;
}

// Family data for enrollment form
export interface EnrollmentFamily {
  id?: string;
  family_name: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  diocese_id: string | null;
  guardians: EnrollmentGuardian[];
  students: EnrollmentStudent[];
  emergency_contacts: EnrollmentEmergencyContact[];
}

// Selected enrollment for a student
export interface SelectedEnrollment {
  student_id: string;
  class_id: string;
  class_name: string;
  program_name: string | null;
  is_auto_suggested: boolean;
}

// Enrollment wizard state
export interface EnrollmentWizardState {
  step: EnrollmentStep;
  userEmail: string | null;
  isExistingFamily: boolean;
  familyId: string | null;
  
  // Original data from database
  originalFamily: EnrollmentFamily | null;
  
  // Current form state (edited data)
  formState: FormState;
  
  // Academic year and classes
  academicYear: AcademicYear | null;
  availableClasses: EnrollmentClass[];
  programs: Program[];
  
  // Suggestions from auto-progression
  suggestedEnrollments: StudentEnrollmentSuggestion[];
  
  // Changes summary for review
  changesSummary: ChangesSummary | null;
  
  // Loading and error states
  isLoading: boolean;
  error: string | null;
  
  // Submission state
  isSubmitting: boolean;
}

// Enrollment steps
export type EnrollmentStep = 
  | 'family-info'
  | 'guardians'
  | 'children'
  | 'emergency-contacts'
  | 'class-selection'
  | 'review'
  | 'confirmation';

// Class selection for each child
export interface ClassSelection {
  student_id: string;
  giao_ly_level: number | null; // 1-9 or null if not enrolling
  viet_ngu_level: number | null; // 1-9 or null if not enrolling
  giao_ly_completed: boolean; // true if completed level 9
  viet_ngu_completed: boolean; // true if completed level 9
}

// Form validation state
export interface FormValidation {
  isValid: boolean;
  errors: Record<string, string>;
}

// Form state for editing
export interface FormState {
  family: EnrollmentFamily;
  guardians: EnrollmentGuardian[];
  children: EnrollmentStudent[];
  emergencyContacts: EnrollmentEmergencyContact[];
  classSelections: ClassSelection[];
  validation: {
    family: FormValidation;
    guardians: FormValidation;
    children: FormValidation;
    emergencyContacts: FormValidation;
    classSelections: FormValidation;
  };
}

// Changes tracking
export interface ChangesSummary {
  family: {
    hasChanges: boolean;
    changes: Partial<EnrollmentFamily>;
  };
  guardians: {
    hasChanges: boolean;
    added: EnrollmentGuardian[];
    modified: EnrollmentGuardian[];
    removed: string[]; // IDs
  };
  children: {
    hasChanges: boolean;
    added: EnrollmentStudent[];
    modified: EnrollmentStudent[];
    removed: string[]; // IDs
  };
  emergencyContacts: {
    hasChanges: boolean;
    added: EnrollmentEmergencyContact[];
    modified: EnrollmentEmergencyContact[];
    removed: string[]; // IDs
  };
  enrollments: ClassSelection[];
}

// Enrollment step info for progress display
export interface EnrollmentStepInfo {
  id: EnrollmentStep;
  title: string;
  description: string;
  number: number;
}

// Updated enrollment steps for Phase 2
export const ENROLLMENT_STEPS: EnrollmentStepInfo[] = [
  {
    id: 'family-info',
    title: 'Family Info',
    description: 'Family details and address',
    number: 1,
  },
  {
    id: 'guardians',
    title: 'Parents/Guardians',
    description: 'Parent and guardian information',
    number: 2,
  },
  {
    id: 'children',
    title: 'Children',
    description: 'Student information',
    number: 3,
  },
  {
    id: 'emergency-contacts',
    title: 'Emergency Contacts',
    description: 'Emergency contact details',
    number: 4,
  },
  {
    id: 'class-selection',
    title: 'Class Selection',
    description: 'Choose classes for your children',
    number: 5,
  },
  {
    id: 'review',
    title: 'Review',
    description: 'Review your enrollment',
    number: 6,
  },
  {
    id: 'confirmation',
    title: 'Confirmation',
    description: 'Enrollment complete',
    number: 7,
  },
];
