from pydantic import BaseModel
from datetime import date
from typing import Optional, List
from uuid import UUID

class ParentBase(BaseModel):
    first_name: str
    last_name: str
    email: str
    phone: str
    relationship_to_family: Optional[str] = None  # e.g., "Mother", "Father", "Guardian"

class StudentBase(BaseModel):
    first_name: str
    middle_name: Optional[str] = None
    last_name: str
    date_of_birth: date
    allergies: Optional[str] = None
    gender: Optional[str] = None
    class_ids: List[UUID] = []

class EmergencyContactBase(BaseModel):
    first_name: str
    last_name: str
    email: Optional[str] = None
    phone: str
    relationship_to_family: Optional[str] = None  # e.g., "Aunt", "Grandmother", "Friend"

# --- Creation Models (Incoming Data) ---

class FamilyCreate(BaseModel):
    address: str
    city: str
    state: str
    zip_code: str

    parents: List[ParentBase]
    students: List[StudentBase]
    emergency_contacts: List[EmergencyContactBase]

# --- Response Models (Outgoing Data) ---

class ParentResponse(ParentBase):
    id: UUID

    class Config:
        from_attributes = True

class StudentResponse(StudentBase):
    id: UUID

    class Config:
        from_attributes = True

class FamilyResponse(BaseModel):
    id: UUID
    address: str
    city: str
    state: str
    zip_code: str
    parents: List[ParentResponse]
    students: List[StudentResponse]
    emergency_contacts: List["EmergencyContactResponse"]

    class Config:
        from_attributes = True

class EmergencyContactResponse(EmergencyContactBase):
    id: UUID

    class Config:
        from_attributes = True