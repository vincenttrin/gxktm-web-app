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
  family: EnrollmentFamily | null;
  academicYear: AcademicYear | null;
  availableClasses: EnrollmentClass[];
  suggestedEnrollments: StudentEnrollmentSuggestion[];
  selectedEnrollments: SelectedEnrollment[];
  isLoading: boolean;
  error: string | null;
}

// Enrollment steps
export type EnrollmentStep = 
  | 'authentication'
  | 'family-info'
  | 'class-selection'
  | 'review'
  | 'confirmation';

// Enrollment step info for progress display
export interface EnrollmentStepInfo {
  id: EnrollmentStep;
  title: string;
  description: string;
  number: number;
}

export const ENROLLMENT_STEPS: EnrollmentStepInfo[] = [
  {
    id: 'authentication',
    title: 'Sign In',
    description: 'Verify your email',
    number: 1,
  },
  {
    id: 'family-info',
    title: 'Family Information',
    description: 'Review or add family details',
    number: 2,
  },
  {
    id: 'class-selection',
    title: 'Class Selection',
    description: 'Choose classes for your children',
    number: 3,
  },
  {
    id: 'review',
    title: 'Review',
    description: 'Review your enrollment',
    number: 4,
  },
  {
    id: 'confirmation',
    title: 'Confirmation',
    description: 'Enrollment complete',
    number: 5,
  },
];
