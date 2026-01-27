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
    date_of_birth: Optional[date] = None
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


class AcademicYearCreate(AcademicYearBase):
    pass


class AcademicYearResponse(AcademicYearBase):
    id: int

    class Config:
        from_attributes = True


# --- Program Schemas ---
class ProgramBase(BaseModel):
    name: str


class ProgramCreate(ProgramBase):
    pass


class ProgramResponse(ProgramBase):
    id: int

    class Config:
        from_attributes = True


# --- Class Schemas ---
class ClassBase(BaseModel):
    name: str
    program_id: int
    academic_year_id: int


class ClassCreate(ClassBase):
    pass


class ClassUpdate(BaseModel):
    name: Optional[str] = None
    program_id: Optional[int] = None
    academic_year_id: Optional[int] = None


class ClassResponse(ClassBase):
    id: UUID
    program: Optional[ProgramResponse] = None

    class Config:
        from_attributes = True


class ClassWithEnrollmentCount(ClassResponse):
    enrollment_count: int = 0


# --- Enrollment Schemas ---
class EnrollmentBase(BaseModel):
    student_id: UUID
    class_id: UUID


class EnrollmentCreate(EnrollmentBase):
    pass


class StudentWithFamily(StudentBase):
    id: UUID
    family_id: UUID
    family_name: Optional[str] = None

    class Config:
        from_attributes = True


class EnrollmentResponse(BaseModel):
    id: UUID
    student_id: UUID
    class_id: UUID
    student: Optional[StudentWithFamily] = None

    class Config:
        from_attributes = True


class ClassWithEnrollments(ClassResponse):
    enrollments: List[EnrollmentResponse] = []
    enrollment_count: int = 0


# --- Enrollment Submission Schemas (for public enrollment portal) ---
class EnrollmentGuardianSubmission(BaseModel):
    """Guardian data for enrollment submission. ID is optional for new guardians."""
    id: Optional[str] = None  # Can be a UUID string for existing or temp ID for new
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    relationship_to_family: Optional[str] = None


class EnrollmentEmergencyContactSubmission(BaseModel):
    """Emergency contact data for enrollment submission. ID is optional for new contacts."""
    id: Optional[str] = None  # Can be a UUID string for existing or temp ID for new
    name: str
    email: Optional[str] = None
    phone: str
    relationship_to_family: Optional[str] = None


class EnrollmentStudentSubmission(BaseModel):
    """Student data for enrollment submission. ID is optional for new students."""
    id: Optional[str] = None  # Can be a UUID string for existing or temp ID (e.g., "new-123") for new
    first_name: str
    last_name: str
    middle_name: Optional[str] = None
    vietnamese_name: Optional[str] = None  # Vietnamese name (optional)
    saint_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    grade_level: Optional[int] = None  # American school grade level
    american_school: Optional[str] = None
    special_needs: Optional[str] = None  # Special needs or notes
    notes: Optional[str] = None


class ClassSelectionSubmission(BaseModel):
    """Class selection for a student during enrollment."""
    student_id: str  # Can be a UUID for existing students or a temp ID (e.g., "new-123") for new students
    giao_ly_level: Optional[int] = None  # 1-9, None means not enrolling
    viet_ngu_level: Optional[int] = None  # 1-9, None means not enrolling
    giao_ly_completed: bool = False  # True if already completed all levels
    viet_ngu_completed: bool = False  # True if already completed all levels


class FamilyInfoSubmission(BaseModel):
    """Family information for enrollment submission."""
    family_name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    diocese_id: Optional[str] = None


class EnrollmentSubmissionRequest(BaseModel):
    """
    Complete enrollment submission request.
    This is the main payload for submitting family enrollment data.
    """
    family_id: Optional[UUID] = None  # None for new families
    family_info: FamilyInfoSubmission
    guardians: List[EnrollmentGuardianSubmission]
    students: List[EnrollmentStudentSubmission]
    emergency_contacts: List[EnrollmentEmergencyContactSubmission]
    class_selections: List[ClassSelectionSubmission]
    academic_year_id: int


class EnrollmentSubmissionResponse(BaseModel):
    """Response after successful enrollment submission."""
    success: bool
    family_id: UUID
    enrollment_ids: List[UUID]
    message: str