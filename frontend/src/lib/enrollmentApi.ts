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

export { EnrollmentApiError };
