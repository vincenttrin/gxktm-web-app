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
} from '@/types/family';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class ApiError extends Error {
  status: number;
  
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
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
  const response = await fetch(`${API_BASE_URL}/api/families`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  return handleResponse<Family>(response);
}

export async function updateFamily(familyId: string, data: FamilyUpdate): Promise<Family> {
  const response = await fetch(`${API_BASE_URL}/api/families/${familyId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  return handleResponse<Family>(response);
}

export async function deleteFamily(familyId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/families/${familyId}`, {
    method: 'DELETE',
  });
  
  return handleResponse<void>(response);
}

// --- Guardian API ---

export async function createGuardian(familyId: string, data: GuardianCreate): Promise<Guardian> {
  const response = await fetch(`${API_BASE_URL}/api/families/${familyId}/guardians`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  return handleResponse<Guardian>(response);
}

export async function updateGuardian(
  familyId: string,
  guardianId: string,
  data: Partial<GuardianCreate>
): Promise<Guardian> {
  const response = await fetch(
    `${API_BASE_URL}/api/families/${familyId}/guardians/${guardianId}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }
  );
  
  return handleResponse<Guardian>(response);
}

export async function deleteGuardian(familyId: string, guardianId: string): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/families/${familyId}/guardians/${guardianId}`,
    { method: 'DELETE' }
  );
  
  return handleResponse<void>(response);
}

// --- Student API ---

export async function createStudent(familyId: string, data: StudentCreate): Promise<Student> {
  const response = await fetch(`${API_BASE_URL}/api/families/${familyId}/students`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  return handleResponse<Student>(response);
}

export async function updateStudent(
  familyId: string,
  studentId: string,
  data: Partial<StudentCreate>
): Promise<Student> {
  const response = await fetch(
    `${API_BASE_URL}/api/families/${familyId}/students/${studentId}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }
  );
  
  return handleResponse<Student>(response);
}

export async function deleteStudent(familyId: string, studentId: string): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/families/${familyId}/students/${studentId}`,
    { method: 'DELETE' }
  );
  
  return handleResponse<void>(response);
}

// --- Emergency Contact API ---

export async function createEmergencyContact(
  familyId: string,
  data: EmergencyContactCreate
): Promise<EmergencyContact> {
  const response = await fetch(
    `${API_BASE_URL}/api/families/${familyId}/emergency-contacts`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
  const response = await fetch(
    `${API_BASE_URL}/api/families/${familyId}/emergency-contacts/${contactId}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }
  );
  
  return handleResponse<EmergencyContact>(response);
}

export async function deleteEmergencyContact(
  familyId: string,
  contactId: string
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/families/${familyId}/emergency-contacts/${contactId}`,
    { method: 'DELETE' }
  );
  
  return handleResponse<void>(response);
}

// --- Academic Year API ---

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

export { ApiError };
