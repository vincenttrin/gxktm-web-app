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