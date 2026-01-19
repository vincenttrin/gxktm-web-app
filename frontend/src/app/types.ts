// frontend/src/types.ts

export interface ClassItem {
  id: string;
  name: string;
  room_number?: string;
}

export interface Program {
  id: number;
  name: string;
  classes: ClassItem[];
}

export interface Guardian {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  relationship_to_family: string;
}

export interface Student {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  grade_level?: number;
}

export interface Family {
  id: string;
  family_name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  guardians: Guardian[];
  students: Student[];
}