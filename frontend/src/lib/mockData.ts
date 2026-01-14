// frontend/src/lib/mockData.ts
import { Program } from "../app/types";

export const MOCK_PROGRAMS: Program[] = [
  {
    id: 1,
    name: "TNTT (VEYM)",
    classes: [
      { id: "c1", name: "Chien Con", room_number: "101" },
      { id: "c2", name: "Au Nhi", room_number: "102" },
      { id: "c3", name: "Thieu Nhi", room_number: "103" }
    ]
  },
  {
    id: 2,
    name: "Vietnamese School",
    classes: [
      { id: "v1", name: "Level 1", room_number: "201" },
      { id: "v2", name: "Level 2", room_number: "202" }
    ]
  }
];