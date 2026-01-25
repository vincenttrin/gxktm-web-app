/**
 * Enrollment API Client
 * 
 * API functions for the public enrollment portal.
 * Handles family lookup, class listing, and enrollment operations.
 */

import {
  FamilyLookupResponse,
  AcademicYear,
  ClassesResponse,
  SuggestedEnrollmentsResponse,
  EnrollmentFamily,
  Program,
} from '@/types/enrollment';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class EnrollmentApiError extends Error {
  status: number;
  
  constructor(message: string, status: number) {
    super(message);
    this.name = 'EnrollmentApiError';
    this.status = status;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new EnrollmentApiError(
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

/**
 * Look up a family by guardian email address.
 * Used after magic link authentication to determine if user is existing or new family.
 */
export async function lookupFamilyByEmail(email: string): Promise<FamilyLookupResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/enrollment/lookup?email=${encodeURIComponent(email)}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
  
  return handleResponse<FamilyLookupResponse>(response);
}

/**
 * Get family data for enrollment.
 * Includes guardians, students, and emergency contacts.
 */
export async function getFamilyForEnrollment(familyId: string): Promise<EnrollmentFamily> {
  const response = await fetch(
    `${API_BASE_URL}/api/enrollment/family/${familyId}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
  
  return handleResponse<EnrollmentFamily>(response);
}

/**
 * Get the current academic year.
 */
export async function getCurrentAcademicYear(): Promise<AcademicYear> {
  const response = await fetch(
    `${API_BASE_URL}/api/enrollment/academic-years/current`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
  
  return handleResponse<AcademicYear>(response);
}

/**
 * Get available classes for enrollment.
 * Optionally filter by academic year and/or program.
 */
export async function getClassesForEnrollment(
  academicYearId?: number,
  programId?: number
): Promise<ClassesResponse> {
  const params = new URLSearchParams();
  if (academicYearId) {
    params.append('academic_year_id', academicYearId.toString());
  }
  if (programId) {
    params.append('program_id', programId.toString());
  }
  
  const queryString = params.toString();
  const url = `${API_BASE_URL}/api/enrollment/classes${queryString ? `?${queryString}` : ''}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  return handleResponse<ClassesResponse>(response);
}

/**
 * Get suggested enrollments for a family based on last year's enrollments.
 * Applies automatic grade progression.
 */
export async function getSuggestedEnrollments(familyId: string): Promise<SuggestedEnrollmentsResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/enrollment/family/${familyId}/suggested-enrollments`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
  
  return handleResponse<SuggestedEnrollmentsResponse>(response);
}

/**
 * Get all programs (Giao Ly, Viet Ngu, etc.)
 */
export async function getPrograms(): Promise<Program[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/enrollment/programs`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
  
  return handleResponse<Program[]>(response);
}

/**
 * Enrollment submission request payload
 */
export interface EnrollmentSubmissionRequest {
  family_id: string | null;
  family_info: {
    family_name: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    zip_code: string | null;
    diocese_id: string | null;
  };
  guardians: Array<{
    id?: string | null;
    name: string;
    email: string | null;
    phone: string | null;
    relationship_to_family: string | null;
  }>;
  students: Array<{
    id?: string | null;
    first_name: string;
    last_name: string;
    middle_name?: string | null;
    vietnamese_name?: string | null;
    saint_name?: string | null;
    date_of_birth?: string | null;
    gender?: string | null;
    grade_level?: number | null;
    american_school?: string | null;
    special_needs?: string | null;
    notes?: string | null;
  }>;
  emergency_contacts: Array<{
    id?: string | null;
    name: string;
    email?: string | null;
    phone: string;
    relationship_to_family: string | null;
  }>;
  class_selections: Array<{
    student_id: string;
    giao_ly_level: number | null;
    viet_ngu_level: number | null;
    giao_ly_completed: boolean;
    viet_ngu_completed: boolean;
  }>;
  academic_year_id: number;
}

/**
 * Enrollment submission response
 */
export interface EnrollmentSubmissionResponse {
  success: boolean;
  family_id: string;
  enrollment_ids: string[];
  message: string;
}

/**
 * Submit a complete family enrollment.
 * This is the main endpoint for submitting all enrollment data.
 */
export async function submitEnrollment(
  request: EnrollmentSubmissionRequest
): Promise<EnrollmentSubmissionResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/enrollment/submit`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    }
  );
  
  return handleResponse<EnrollmentSubmissionResponse>(response);
}

export { EnrollmentApiError };
