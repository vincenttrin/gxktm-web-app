// Family Types
export interface Guardian {
  id: string;
  family_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  relationship_to_family: string | null;
}

export interface Student {
  id: string;
  family_id: string;
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

export interface EmergencyContact {
  id: string;
  family_id: string;
  name: string;
  email: string | null;
  phone: string;
  relationship_to_family: string | null;
}

export interface Family {
  id: string;
  family_name: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  diocese_id: string | null;
  guardians: Guardian[];
  students: Student[];
  emergency_contacts: EmergencyContact[];
}

export interface PaginatedFamilyResponse {
  items: Family[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// Create/Update Types
export interface GuardianCreate {
  name: string;
  email?: string | null;
  phone?: string | null;
  relationship_to_family?: string | null;
}

export interface StudentCreate {
  first_name: string;
  last_name: string;
  middle_name?: string | null;
  saint_name?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  grade_level?: number | null;
  american_school?: string | null;
  notes?: string | null;
}

export interface EmergencyContactCreate {
  name: string;
  email?: string | null;
  phone: string;
  relationship_to_family?: string | null;
}

export interface FamilyCreate {
  family_name?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  diocese_id?: string | null;
  guardians?: GuardianCreate[];
  students?: StudentCreate[];
  emergency_contacts?: EmergencyContactCreate[];
}

export interface FamilyUpdate {
  family_name?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  diocese_id?: string | null;
}

// Academic Year Types
export interface AcademicYear {
  id: number;
  name: string;
  is_current: boolean;
}

// Program Types
export interface Program {
  id: number;
  name: string;
}

// Class Types
export interface ClassItem {
  id: string;
  name: string;
  program_id: number;
  academic_year_id: number;
  program: Program | null;
  enrollment_count?: number;
}

export interface StudentWithFamily {
  id: string;
  family_id: string;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  saint_name: string | null;
  date_of_birth: string | null;
  gender: string | null;
  grade_level: number | null;
  american_school: string | null;
  notes: string | null;
  family_name: string | null;
}

export interface Enrollment {
  id: string;
  student_id: string;
  class_id: string;
  student: StudentWithFamily | null;
}

export interface ClassWithEnrollments extends ClassItem {
  enrollments: Enrollment[];
  enrollment_count: number;
}

export interface ClassCreate {
  name: string;
  program_id: number;
  academic_year_id: number;
}

export interface ClassUpdate {
  name?: string;
  program_id?: number;
  academic_year_id?: number;
}

// Payment Types
export type PaymentStatus = 'unpaid' | 'partial' | 'paid' | 'refunded';

export interface Payment {
  id: string;
  family_id: string;
  school_year: string;
  amount_due: number | null;
  amount_paid: number;
  payment_status: PaymentStatus;
  payment_date: string | null;
  payment_method: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
  family_name?: string | null;
}

export interface PaymentCreate {
  family_id: string;
  school_year: string;
  amount_due?: number | null;
  amount_paid?: number;
  payment_date?: string | null;
  payment_method?: string | null;
  notes?: string | null;
}

export interface PaymentUpdate {
  amount_due?: number | null;
  amount_paid?: number | null;
  payment_status?: PaymentStatus | null;
  payment_date?: string | null;
  payment_method?: string | null;
  notes?: string | null;
}

export interface PaginatedPaymentResponse {
  items: Payment[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface PaymentSummary {
  total_families: number;
  paid_count: number;
  partial_count: number;
  unpaid_count: number;
  total_amount_due: number;
  total_amount_paid: number;
}

export interface PaymentQueryParams {
  page?: number;
  page_size?: number;
  school_year?: string;
  payment_status?: PaymentStatus;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// Family with Payment Status
export interface FamilyPaymentStatus {
  payment_status: PaymentStatus;
  amount_due: number | null;
  amount_paid: number;
  school_year: string;
}

export interface FamilyWithPayment extends Family {
  payment_status: FamilyPaymentStatus | null;
  enrolled_class_count: number;
}

export interface PaginatedFamilyWithPaymentResponse {
  items: FamilyWithPayment[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// Manual Enrollment Types
export interface ManualEnrollmentCreate {
  student_id: string;
  class_ids: string[];
}

export interface ManualEnrollmentResponse {
  student_id: string;
  enrolled_class_ids: string[];
  already_enrolled_class_ids: string[];
  message: string;
}

export interface BulkEnrollmentCreate {
  class_id: string;
  student_ids: string[];
}

export interface BulkEnrollmentResponse {
  class_id: string;
  enrolled_student_ids: string[];
  already_enrolled_student_ids: string[];
  message: string;
}

export interface StudentEnrollmentInfo {
  id: string;
  family_id: string;
  first_name: string;
  last_name: string;
  family_name: string | null;
  enrolled_classes: ClassItem[];
}

// API Query Parameters
export interface FamilyQueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface FamilyWithPaymentQueryParams extends FamilyQueryParams {
  payment_status?: PaymentStatus;
  school_year?: string;
}

export interface ClassQueryParams {
  academic_year_id?: number;
  program_id?: number;
}
