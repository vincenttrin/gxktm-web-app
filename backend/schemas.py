from pydantic import BaseModel, Field
from datetime import date
from typing import Optional, List
from uuid import UUID


# --- Guardian/Parent Schemas ---
class GuardianBase(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    relationship_to_family: Optional[str] = None  # e.g., "Mother", "Father", "Guardian"


class GuardianCreate(GuardianBase):
    pass


class GuardianUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    relationship_to_family: Optional[str] = None


class GuardianResponse(GuardianBase):
    id: UUID
    family_id: UUID

    class Config:
        from_attributes = True


# --- Emergency Contact Schemas ---
class EmergencyContactBase(BaseModel):
    name: str
    email: Optional[str] = None
    phone: str
    relationship_to_family: Optional[str] = None  # e.g., "Aunt", "Grandmother", "Friend"


class EmergencyContactCreate(EmergencyContactBase):
    pass


class EmergencyContactUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    relationship_to_family: Optional[str] = None


class EmergencyContactResponse(EmergencyContactBase):
    id: UUID
    family_id: UUID

    class Config:
        from_attributes = True


# --- Student Schemas ---
class StudentBase(BaseModel):
    first_name: str
    last_name: str
    middle_name: Optional[str] = None
    saint_name: Optional[str] = None
    date_of_birth: date
    gender: Optional[str] = None
    grade_level: Optional[int] = None
    american_school: Optional[str] = None
    notes: Optional[str] = None


class StudentCreate(StudentBase):
    pass


class StudentUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    middle_name: Optional[str] = None
    saint_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    grade_level: Optional[int] = None
    american_school: Optional[str] = None
    notes: Optional[str] = None


class StudentResponse(StudentBase):
    id: UUID
    family_id: UUID

    class Config:
        from_attributes = True


# --- Family Schemas ---
class FamilyBase(BaseModel):
    family_name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    diocese_id: Optional[str] = None


class FamilyCreate(FamilyBase):
    guardians: List[GuardianCreate] = []
    students: List[StudentCreate] = []
    emergency_contacts: List[EmergencyContactCreate] = []


class FamilyUpdate(BaseModel):
    family_name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    diocese_id: Optional[str] = None


class FamilyResponse(FamilyBase):
    id: UUID
    guardians: List[GuardianResponse] = []
    students: List[StudentResponse] = []
    emergency_contacts: List[EmergencyContactResponse] = []

    class Config:
        from_attributes = True


# --- Paginated Response ---
class PaginatedFamilyResponse(BaseModel):
    items: List[FamilyResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# --- Academic Year Schemas ---
class AcademicYearBase(BaseModel):
    name: str
    is_current: bool = False


class AcademicYearResponse(AcademicYearBase):
    id: int

    class Config:
        from_attributes = True