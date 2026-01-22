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
  date_of_birth: string;
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
  date_of_birth: string;
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

// API Query Parameters
export interface FamilyQueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}
