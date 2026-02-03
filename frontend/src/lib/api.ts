import {
  Family,
  FamilyCreate,
  FamilyUpdate,
  FamilyQueryParams,
  PaginatedFamilyResponse,
  Guardian,
  GuardianCreate,
  Student,
  StudentCreate,
  EmergencyContact,
  EmergencyContactCreate,
  AcademicYear,
  Program,
  ClassItem,
  ClassWithEnrollments,
  ClassCreate,
  ClassUpdate,
  ClassQueryParams,
  Enrollment,
  Payment,
  PaymentCreate,
  PaymentUpdate,
  PaymentQueryParams,
  PaginatedPaymentResponse,
  PaymentSummary,
  FamilyWithPayment,
  FamilyWithPaymentQueryParams,
  PaginatedFamilyWithPaymentResponse,
  ManualEnrollmentCreate,
  ManualEnrollmentResponse,
  BulkEnrollmentCreate,
  BulkEnrollmentResponse,
  StudentEnrollmentInfo,
  SchoolYear,
  SchoolYearWithStats,
  SchoolYearCreate,
  SchoolYearUpdate,
  SchoolYearTransitionRequest,
  SchoolYearTransitionResponse,
  SchoolYearAutoCreateCheck,
  SchoolYearTransitionCheck,
} from '@/types/family';
import { createClient } from '@/utils/supabase/client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class ApiError extends Error {
  status: number;
  
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * Get the current user's access token for API calls
 * This is used to authenticate admin API requests
 */
async function getAuthHeaders(): Promise<HeadersInit> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session?.access_token) {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    };
  }
  
  return {
    'Content-Type': 'application/json',
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      errorData.detail || `HTTP error! status: ${response.status}`,
      response.status
    );
  }
  
  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }
  
  return response.json();
}

// --- Family API ---

export async function getAllFamilies(): Promise<Family[]> {
  const response = await fetch(`${API_BASE_URL}/api/families/all`, {
    cache: 'no-store',
  });
  
  return handleResponse<Family[]>(response);
}

export async function getFamilies(params: FamilyQueryParams = {}): Promise<PaginatedFamilyResponse> {
  const searchParams = new URLSearchParams();
  
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.page_size) searchParams.set('page_size', params.page_size.toString());
  if (params.search) searchParams.set('search', params.search);
  if (params.sort_by) searchParams.set('sort_by', params.sort_by);
  if (params.sort_order) searchParams.set('sort_order', params.sort_order);
  
  const response = await fetch(
    `${API_BASE_URL}/api/families?${searchParams.toString()}`,
    { cache: 'no-store' }
  );
  
  return handleResponse<PaginatedFamilyResponse>(response);
}

export async function getFamily(familyId: string): Promise<Family> {
  const response = await fetch(`${API_BASE_URL}/api/families/${familyId}`, {
    cache: 'no-store',
  });
  
  return handleResponse<Family>(response);
}

export async function createFamily(data: FamilyCreate): Promise<Family> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/api/families`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  
  return handleResponse<Family>(response);
}

export async function updateFamily(familyId: string, data: FamilyUpdate): Promise<Family> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/api/families/${familyId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(data),
  });
  
  return handleResponse<Family>(response);
}

export async function deleteFamily(familyId: string): Promise<void> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/api/families/${familyId}`, {
    method: 'DELETE',
    headers,
  });
  
  return handleResponse<void>(response);
}

// --- Guardian API ---

export async function createGuardian(familyId: string, data: GuardianCreate): Promise<Guardian> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/api/families/${familyId}/guardians`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  
  return handleResponse<Guardian>(response);
}

export async function updateGuardian(
  familyId: string,
  guardianId: string,
  data: Partial<GuardianCreate>
): Promise<Guardian> {
  const headers = await getAuthHeaders();
  const response = await fetch(
    `${API_BASE_URL}/api/families/${familyId}/guardians/${guardianId}`,
    {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    }
  );
  
  return handleResponse<Guardian>(response);
}

export async function deleteGuardian(familyId: string, guardianId: string): Promise<void> {
  const headers = await getAuthHeaders();
  const response = await fetch(
    `${API_BASE_URL}/api/families/${familyId}/guardians/${guardianId}`,
    { method: 'DELETE', headers }
  );
  
  return handleResponse<void>(response);
}

// --- Student API ---

export async function createStudent(familyId: string, data: StudentCreate): Promise<Student> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/api/families/${familyId}/students`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  
  return handleResponse<Student>(response);
}

export async function updateStudent(
  familyId: string,
  studentId: string,
  data: Partial<StudentCreate>
): Promise<Student> {
  const headers = await getAuthHeaders();
  const response = await fetch(
    `${API_BASE_URL}/api/families/${familyId}/students/${studentId}`,
    {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    }
  );
  
  return handleResponse<Student>(response);
}

export async function deleteStudent(familyId: string, studentId: string): Promise<void> {
  const headers = await getAuthHeaders();
  const response = await fetch(
    `${API_BASE_URL}/api/families/${familyId}/students/${studentId}`,
    { method: 'DELETE', headers }
  );
  
  return handleResponse<void>(response);
}

// --- Emergency Contact API ---

export async function createEmergencyContact(
  familyId: string,
  data: EmergencyContactCreate
): Promise<EmergencyContact> {
  const headers = await getAuthHeaders();
  const response = await fetch(
    `${API_BASE_URL}/api/families/${familyId}/emergency-contacts`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    }
  );
  
  return handleResponse<EmergencyContact>(response);
}

export async function updateEmergencyContact(
  familyId: string,
  contactId: string,
  data: Partial<EmergencyContactCreate>
): Promise<EmergencyContact> {
  const headers = await getAuthHeaders();
  const response = await fetch(
    `${API_BASE_URL}/api/families/${familyId}/emergency-contacts/${contactId}`,
    {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    }
  );
  
  return handleResponse<EmergencyContact>(response);
}

export async function deleteEmergencyContact(
  familyId: string,
  contactId: string
): Promise<void> {
  const headers = await getAuthHeaders();
  const response = await fetch(
    `${API_BASE_URL}/api/families/${familyId}/emergency-contacts/${contactId}`,
    { method: 'DELETE', headers }
  );
  
  return handleResponse<void>(response);
}

// --- Academic Year API (Legacy - for backward compatibility) ---

export async function getAcademicYears(): Promise<AcademicYear[]> {
  const response = await fetch(`${API_BASE_URL}/api/academic-years`, {
    cache: 'no-store',
  });
  
  return handleResponse<AcademicYear[]>(response);
}

export async function getCurrentAcademicYear(): Promise<AcademicYear> {
  const response = await fetch(`${API_BASE_URL}/api/academic-years/current`, {
    cache: 'no-store',
  });
  
  return handleResponse<AcademicYear>(response);
}

// --- School Year API (New comprehensive model) ---

export async function getSchoolYears(includeArchived: boolean = false): Promise<SchoolYearWithStats[]> {
  const params = new URLSearchParams();
  if (includeArchived) params.set('include_archived', 'true');
  
  const response = await fetch(`${API_BASE_URL}/api/school-years?${params.toString()}`, {
    cache: 'no-store',
  });
  
  return handleResponse<SchoolYearWithStats[]>(response);
}

export async function getNewestSchoolYear(): Promise<SchoolYear> {
  const response = await fetch(`${API_BASE_URL}/api/school-years/newest`, {
    cache: 'no-store',
  });
  
  return handleResponse<SchoolYear>(response);
}

export async function getActiveSchoolYear(): Promise<SchoolYear> {
  const response = await fetch(`${API_BASE_URL}/api/school-years/active`, {
    cache: 'no-store',
  });
  
  return handleResponse<SchoolYear>(response);
}

export async function getSchoolYear(schoolYearId: number): Promise<SchoolYearWithStats> {
  const response = await fetch(`${API_BASE_URL}/api/school-years/${schoolYearId}`, {
    cache: 'no-store',
  });
  
  return handleResponse<SchoolYearWithStats>(response);
}

export async function createSchoolYear(data: SchoolYearCreate): Promise<SchoolYear> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/api/school-years`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  
  return handleResponse<SchoolYear>(response);
}

export async function updateSchoolYear(
  schoolYearId: number,
  data: SchoolYearUpdate
): Promise<SchoolYear> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/api/school-years/${schoolYearId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(data),
  });
  
  return handleResponse<SchoolYear>(response);
}

export async function transitionSchoolYear(
  newActiveYearId: number
): Promise<SchoolYearTransitionResponse> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/api/school-years/transition`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ new_active_year_id: newActiveYearId }),
  });
  
  return handleResponse<SchoolYearTransitionResponse>(response);
}

export async function deleteSchoolYear(schoolYearId: number): Promise<void> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/api/school-years/${schoolYearId}`, {
    method: 'DELETE',
    headers,
  });
  
  return handleResponse<void>(response);
}

export async function checkAutoCreateSchoolYear(): Promise<SchoolYearAutoCreateCheck> {
  const response = await fetch(`${API_BASE_URL}/api/school-years/check-auto-create`, {
    method: 'POST',
  });
  
  return handleResponse<SchoolYearAutoCreateCheck>(response);
}

export async function checkTransitionNeeded(): Promise<SchoolYearTransitionCheck> {
  const response = await fetch(`${API_BASE_URL}/api/school-years/check-transition`, {
    method: 'POST',
  });
  
  return handleResponse<SchoolYearTransitionCheck>(response);
}

export async function copyClassesFromPreviousYear(
  schoolYearId: number,
  sourceYearId?: number
): Promise<{ success: boolean; message: string; copied_count: number }> {
  const params = new URLSearchParams();
  if (sourceYearId) {
    params.set('source_year_id', sourceYearId.toString());
  }
  
  const headers = await getAuthHeaders();
  const response = await fetch(
    `${API_BASE_URL}/api/school-years/${schoolYearId}/copy-classes?${params.toString()}`,
    {
      method: 'POST',
      headers,
    }
  );
  
  return handleResponse<{ success: boolean; message: string; copied_count: number }>(response);
}

// --- Program API ---

export async function getPrograms(): Promise<Program[]> {
  const response = await fetch(`${API_BASE_URL}/api/programs`, {
    cache: 'no-store',
  });
  
  return handleResponse<Program[]>(response);
}

// --- Class API ---

export async function getClasses(params: ClassQueryParams = {}): Promise<ClassItem[]> {
  const searchParams = new URLSearchParams();
  
  // Prefer school_year_id over legacy academic_year_id
  if (params.school_year_id) {
    searchParams.set('school_year_id', params.school_year_id.toString());
  } else if (params.academic_year_id) {
    searchParams.set('academic_year_id', params.academic_year_id.toString());
  }
  if (params.program_id) {
    searchParams.set('program_id', params.program_id.toString());
  }
  
  const response = await fetch(
    `${API_BASE_URL}/api/classes?${searchParams.toString()}`,
    { cache: 'no-store' }
  );
  
  return handleResponse<ClassItem[]>(response);
}

export async function getClass(classId: string): Promise<ClassWithEnrollments> {
  const response = await fetch(`${API_BASE_URL}/api/classes/${classId}`, {
    cache: 'no-store',
  });
  
  return handleResponse<ClassWithEnrollments>(response);
}

export async function createClass(data: ClassCreate): Promise<ClassItem> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/api/classes`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  
  return handleResponse<ClassItem>(response);
}

export async function updateClass(classId: string, data: ClassUpdate): Promise<ClassItem> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/api/classes/${classId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(data),
  });
  
  return handleResponse<ClassItem>(response);
}

export async function deleteClass(classId: string): Promise<void> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/api/classes/${classId}`, {
    method: 'DELETE',
    headers,
  });
  
  return handleResponse<void>(response);
}

// --- Enrollment API ---

export async function enrollStudent(
  classId: string,
  studentId: string
): Promise<Enrollment> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/api/classes/${classId}/enrollments`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ student_id: studentId, class_id: classId }),
  });
  
  return handleResponse<Enrollment>(response);
}

export async function unenrollStudent(
  classId: string,
  studentId: string
): Promise<void> {
  const headers = await getAuthHeaders();
  const response = await fetch(
    `${API_BASE_URL}/api/classes/${classId}/enrollments/${studentId}`,
    { method: 'DELETE', headers }
  );
  
  return handleResponse<void>(response);
}

// --- Export API ---

export function getClassExportUrl(classId: string): string {
  return `${API_BASE_URL}/api/classes/${classId}/export/csv`;
}

// --- Payment API ---

export async function getPayments(params: PaymentQueryParams = {}): Promise<PaginatedPaymentResponse> {
  const searchParams = new URLSearchParams();
  
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.page_size) searchParams.set('page_size', params.page_size.toString());
  if (params.school_year) searchParams.set('school_year', params.school_year);
  if (params.payment_status) searchParams.set('payment_status', params.payment_status);
  if (params.search) searchParams.set('search', params.search);
  if (params.sort_by) searchParams.set('sort_by', params.sort_by);
  if (params.sort_order) searchParams.set('sort_order', params.sort_order);
  
  const response = await fetch(
    `${API_BASE_URL}/api/payments?${searchParams.toString()}`,
    { cache: 'no-store' }
  );
  
  return handleResponse<PaginatedPaymentResponse>(response);
}

export async function getPaymentSummary(schoolYear?: string): Promise<PaymentSummary> {
  const searchParams = new URLSearchParams();
  if (schoolYear) searchParams.set('school_year', schoolYear);
  
  const response = await fetch(
    `${API_BASE_URL}/api/payments/summary?${searchParams.toString()}`,
    { cache: 'no-store' }
  );
  
  return handleResponse<PaymentSummary>(response);
}

export async function getPayment(paymentId: string): Promise<Payment> {
  const response = await fetch(`${API_BASE_URL}/api/payments/${paymentId}`, {
    cache: 'no-store',
  });
  
  return handleResponse<Payment>(response);
}

export async function createPayment(data: PaymentCreate): Promise<Payment> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/api/payments`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  
  return handleResponse<Payment>(response);
}

export async function updatePayment(paymentId: string, data: PaymentUpdate): Promise<Payment> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/api/payments/${paymentId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(data),
  });
  
  return handleResponse<Payment>(response);
}

export async function deletePayment(paymentId: string): Promise<void> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/api/payments/${paymentId}`, {
    method: 'DELETE',
    headers,
  });
  
  return handleResponse<void>(response);
}

export async function markFamilyAsPaid(
  familyId: string,
  schoolYear: string,
  amountPaid?: number,
  paymentMethod?: string,
  notes?: string
): Promise<Payment> {
  const searchParams = new URLSearchParams();
  searchParams.set('school_year', schoolYear);
  if (amountPaid !== undefined) searchParams.set('amount_paid', amountPaid.toString());
  if (paymentMethod) searchParams.set('payment_method', paymentMethod);
  if (notes) searchParams.set('notes', notes);
  
  const headers = await getAuthHeaders();
  const response = await fetch(
    `${API_BASE_URL}/api/payments/mark-paid/${familyId}?${searchParams.toString()}`,
    { method: 'POST', headers }
  );
  
  return handleResponse<Payment>(response);
}

export function getPaymentsExportUrl(schoolYear?: string, paymentStatus?: string): string {
  const searchParams = new URLSearchParams();
  if (schoolYear) searchParams.set('school_year', schoolYear);
  if (paymentStatus) searchParams.set('payment_status', paymentStatus);
  return `${API_BASE_URL}/api/payments/export/csv?${searchParams.toString()}`;
}

export async function getFamilyPayments(familyId: string): Promise<Payment[]> {
  const response = await fetch(`${API_BASE_URL}/api/families/${familyId}/payments`, {
    cache: 'no-store',
  });
  
  return handleResponse<Payment[]>(response);
}

// --- Enrolled Families Payment API ---

import type {
  EnrolledFamiliesResponse,
  EnrolledFamiliesSummary,
} from '@/types/family';

export async function getEnrolledFamilies(): Promise<EnrolledFamiliesResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/payments/enrolled-families`,
    { cache: 'no-store' }
  );
  
  return handleResponse<EnrolledFamiliesResponse>(response);
}

export async function getEnrolledFamiliesSummary(): Promise<EnrolledFamiliesSummary> {
  const response = await fetch(
    `${API_BASE_URL}/api/payments/enrolled-families/summary`,
    { cache: 'no-store' }
  );
  
  return handleResponse<EnrolledFamiliesSummary>(response);
}

// --- Families with Payment Status API ---

export async function getFamiliesWithPayments(
  params: FamilyWithPaymentQueryParams = {}
): Promise<PaginatedFamilyWithPaymentResponse> {
  const searchParams = new URLSearchParams();
  
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.page_size) searchParams.set('page_size', params.page_size.toString());
  if (params.search) searchParams.set('search', params.search);
  if (params.sort_by) searchParams.set('sort_by', params.sort_by);
  if (params.sort_order) searchParams.set('sort_order', params.sort_order);
  if (params.payment_status) searchParams.set('payment_status', params.payment_status);
  if (params.school_year) searchParams.set('school_year', params.school_year);
  
  const response = await fetch(
    `${API_BASE_URL}/api/families/with-payments?${searchParams.toString()}`,
    { cache: 'no-store' }
  );
  
  return handleResponse<PaginatedFamilyWithPaymentResponse>(response);
}

// --- Manual Enrollment API ---

export async function getStudentsWithEnrollments(
  search?: string,
  familyId?: string
): Promise<StudentEnrollmentInfo[]> {
  const searchParams = new URLSearchParams();
  if (search) searchParams.set('search', search);
  if (familyId) searchParams.set('family_id', familyId);
  
  const headers = await getAuthHeaders();
  const response = await fetch(
    `${API_BASE_URL}/api/enrollments/students?${searchParams.toString()}`,
    { cache: 'no-store', headers }
  );
  
  return handleResponse<StudentEnrollmentInfo[]>(response);
}

export async function manualEnrollStudent(
  data: ManualEnrollmentCreate
): Promise<ManualEnrollmentResponse> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/api/enrollments/manual`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  
  return handleResponse<ManualEnrollmentResponse>(response);
}

export async function bulkEnrollStudents(
  data: BulkEnrollmentCreate
): Promise<BulkEnrollmentResponse> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/api/enrollments/bulk`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  
  return handleResponse<BulkEnrollmentResponse>(response);
}

export async function getStudentEnrollments(studentId: string): Promise<ClassItem[]> {
  const headers = await getAuthHeaders();
  const response = await fetch(
    `${API_BASE_URL}/api/enrollments/student/${studentId}/classes`,
    { cache: 'no-store', headers }
  );
  
  return handleResponse<ClassItem[]>(response);
}

export async function removeEnrollment(studentId: string, classId: string): Promise<void> {
  const headers = await getAuthHeaders();
  const response = await fetch(
    `${API_BASE_URL}/api/enrollments/${studentId}/${classId}`,
    { method: 'DELETE', headers }
  );
  
  return handleResponse<void>(response);
}

// --- Admin User Management API ---

export interface AdminUser {
  id: string;
  email: string;
  role: 'admin' | 'user';
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed: boolean;
}

export interface AdminUserCounts {
  total: number;
  admin_count: number;
  user_count: number;
}

export interface UserRoleUpdateResponse {
  id: string;
  email: string;
  role: string;
  message: string;
}

export async function getAdminUsers(
  page: number = 1,
  perPage: number = 50,
  search?: string
): Promise<AdminUser[]> {
  const headers = await getAuthHeaders();
  const searchParams = new URLSearchParams();
  searchParams.set('page', page.toString());
  searchParams.set('per_page', perPage.toString());
  if (search) searchParams.set('search', search);
  
  const response = await fetch(
    `${API_BASE_URL}/api/admin/users?${searchParams.toString()}`,
    { headers, cache: 'no-store' }
  );
  
  return handleResponse<AdminUser[]>(response);
}

export async function getAdminUserCounts(): Promise<AdminUserCounts> {
  const headers = await getAuthHeaders();
  const response = await fetch(
    `${API_BASE_URL}/api/admin/users/count`,
    { headers, cache: 'no-store' }
  );
  
  return handleResponse<AdminUserCounts>(response);
}

export async function updateUserRole(
  userId: string,
  role: 'admin' | 'user'
): Promise<UserRoleUpdateResponse> {
  const headers = await getAuthHeaders();
  const response = await fetch(
    `${API_BASE_URL}/api/admin/users/${userId}/role`,
    {
      method: 'PUT',
      headers,
      body: JSON.stringify({ role }),
    }
  );
  
  return handleResponse<UserRoleUpdateResponse>(response);
}

export { ApiError };
