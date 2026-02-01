from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import Optional, List
from uuid import UUID
from enum import Enum
from decimal import Decimal


class PaymentStatusEnum(str, Enum):
    UNPAID = "unpaid"
    PARTIAL = "partial"
    PAID = "paid"
    REFUNDED = "refunded"


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


# --- School Year Status Enum ---
class SchoolYearStatusEnum(str, Enum):
    UPCOMING = "upcoming"
    ACTIVE = "active"
    ARCHIVED = "archived"


# --- Academic Year Schemas (Enhanced for School Year Management) ---
class AcademicYearBase(BaseModel):
    name: str
    is_current: bool = False


class AcademicYearCreate(AcademicYearBase):
    start_year: Optional[int] = None
    end_year: Optional[int] = None
    is_active: bool = False
    enrollment_open: bool = True
    transition_date: Optional[date] = None


class AcademicYearUpdate(BaseModel):
    name: Optional[str] = None
    is_active: Optional[bool] = None
    enrollment_open: Optional[bool] = None
    transition_date: Optional[date] = None


class AcademicYearResponse(AcademicYearBase):
    id: int
    start_year: Optional[int] = None
    end_year: Optional[int] = None
    is_active: bool = False
    enrollment_open: bool = True
    transition_date: Optional[date] = None
    created_at: Optional[datetime] = None
    status: Optional[str] = None  # Computed: upcoming, active, or archived
    enrolled_students_count: Optional[int] = None  # Computed: number of enrolled students

    class Config:
        from_attributes = True


class SchoolYearWithStats(AcademicYearResponse):
    """Academic year with additional statistics for admin display."""
    class_count: int = 0
    enrolled_students_count: int = 0


class SchoolYearTransitionRequest(BaseModel):
    """Request to trigger school year transition."""
    new_active_year_id: int


class SchoolYearTransitionResponse(BaseModel):
    """Response after school year transition."""
    success: bool
    message: str
    previous_active_year_id: Optional[int] = None
    new_active_year_id: int


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


# --- Payment Schemas ---

class PaymentBase(BaseModel):
    family_id: UUID
    school_year: str
    amount_due: Optional[Decimal] = None
    amount_paid: Optional[Decimal] = Field(default=Decimal("0"))
    payment_date: Optional[date] = None
    payment_method: Optional[str] = None
    notes: Optional[str] = None


class PaymentCreate(PaymentBase):
    pass


class PaymentUpdate(BaseModel):
    amount_due: Optional[Decimal] = None
    amount_paid: Optional[Decimal] = None
    payment_status: Optional[PaymentStatusEnum] = None
    payment_date: Optional[date] = None
    payment_method: Optional[str] = None
    notes: Optional[str] = None


class PaymentResponse(BaseModel):
    id: UUID
    family_id: UUID
    school_year: str
    amount_due: Optional[Decimal] = None
    amount_paid: Optional[Decimal] = None
    payment_status: str
    payment_date: Optional[date] = None
    payment_method: Optional[str] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    family_name: Optional[str] = None

    class Config:
        from_attributes = True


class PaymentWithFamily(PaymentResponse):
    family_name: Optional[str] = None


class PaginatedPaymentResponse(BaseModel):
    items: List[PaymentResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class PaymentSummary(BaseModel):
    total_families: int
    paid_count: int
    partial_count: int
    unpaid_count: int
    total_amount_due: float
    total_amount_paid: float


# --- Family with Payment Status Schemas ---

class FamilyPaymentStatus(BaseModel):
    payment_status: PaymentStatusEnum
    amount_due: Optional[Decimal] = None
    amount_paid: Optional[Decimal] = None
    school_year: str


class FamilyWithPaymentResponse(FamilyResponse):
    payment_status: Optional[FamilyPaymentStatus] = None
    enrolled_class_count: int = 0


class PaginatedFamilyWithPaymentResponse(BaseModel):
    items: List[FamilyWithPaymentResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# --- Manual Enrollment Schemas ---

class ManualEnrollmentCreate(BaseModel):
    student_id: UUID
    class_ids: List[UUID]


class ManualEnrollmentResponse(BaseModel):
    student_id: UUID
    enrolled_class_ids: List[str]
    already_enrolled_class_ids: List[str]
    message: str


class BulkEnrollmentCreate(BaseModel):
    class_id: UUID
    student_ids: List[UUID]


class BulkEnrollmentResponse(BaseModel):
    class_id: UUID
    enrolled_student_ids: List[str]
    already_enrolled_student_ids: List[str]
    message: str


class StudentEnrollmentInfo(BaseModel):
    id: UUID
    family_id: UUID
    first_name: str
    last_name: str
    family_name: Optional[str] = None
    enrolled_classes: List[ClassResponse] = []

    class Config:
        from_attributes = True


# --- Enrolled Family Payment Schemas ---

class GuardianSimple(BaseModel):
    """Simplified guardian info for payment tracking."""
    name: str
    
    class Config:
        from_attributes = True


class EnrolledClassInfo(BaseModel):
    """Class info for enrolled student."""
    id: UUID
    name: str
    program_name: Optional[str] = None
    
    class Config:
        from_attributes = True


class StudentWithEnrollmentStatus(BaseModel):
    """Student info with enrollment status for payment tracking."""
    id: UUID
    first_name: str
    last_name: str
    is_enrolled: bool = False  # Whether enrolled in current year
    enrolled_classes: List[EnrolledClassInfo] = []  # Classes enrolled in
    
    class Config:
        from_attributes = True


# Keep StudentSimple for backward compatibility
class StudentSimple(BaseModel):
    """Simplified student info for payment tracking."""
    first_name: str
    last_name: str
    
    class Config:
        from_attributes = True


class EnrolledFamilyPayment(BaseModel):
    """Family with enrollment and payment info for payment tracking."""
    id: UUID
    family_name: Optional[str] = None
    guardians: List[GuardianSimple] = []
    students: List[StudentWithEnrollmentStatus] = []  # Updated to include enrollment status
    enrolled_count: int = 0  # Number of students enrolled
    payment_status: str = "unpaid"  # unpaid, partial, paid
    amount_due: Optional[float] = None
    amount_paid: float = 0
    payment_date: Optional[datetime] = None
    payment_method: Optional[str] = None
    
    class Config:
        from_attributes = True


class EnrolledFamiliesResponse(BaseModel):
    """Response for enrolled families endpoint."""
    items: List[EnrolledFamilyPayment]
    total: int
    academic_year_id: int
    academic_year_name: str


class EnrolledFamiliesSummary(BaseModel):
    """Summary stats for enrolled families."""
    total_enrolled_families: int
    paid_count: int
    partial_count: int
    unpaid_count: int
    total_amount_due: float
    total_amount_paid: float
    academic_year_name: str