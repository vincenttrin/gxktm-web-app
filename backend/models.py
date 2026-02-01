import uuid
from datetime import datetime
from decimal import Decimal
from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Date, Text, DateTime, Numeric, Enum as SQLAlchemyEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from database import Base
import enum


class PaymentStatus(str, enum.Enum):
    UNPAID = "unpaid"
    PARTIAL = "partial"
    PAID = "paid"
    REFUNDED = "refunded"


class SchoolYearStatus(str, enum.Enum):
    UPCOMING = "upcoming"  # Future year, enrollment may be open
    ACTIVE = "active"      # Current year with classes running
    ARCHIVED = "archived"  # Past year, read-only


# 1. Academic Year (Enhanced for School Year Management)
class AcademicYear(Base):
    __tablename__ = "academic_years"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)  # e.g., "2025-2026"
    start_year = Column(Integer, nullable=True)  # e.g., 2025
    end_year = Column(Integer, nullable=True)  # e.g., 2026
    is_current = Column(Boolean, default=False)  # Legacy field, kept for compatibility
    is_active = Column(Boolean, default=False)  # Whether classes are currently running
    enrollment_open = Column(Boolean, default=True)  # Whether accepting new enrollments
    transition_date = Column(Date, nullable=True)  # When this year becomes active (e.g., July 1)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship to classes
    classes = relationship("Class", back_populates="academic_year")

# 2. Family - Main unit for authentication and information management
class Family(Base):
    __tablename__ = "families"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    family_name = Column(String)  # e.g., "Smith Family"
    address = Column(String)
    city = Column(String)
    state = Column(String)
    zip_code = Column(String)
    diocese_id = Column(String, nullable=True)  # Optional diocese identifier
    # created_at = Column(DateTime, default=datetime.utcnow)
    # updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    guardians = relationship("Guardian", back_populates="family", cascade="all, delete-orphan")
    emergency_contacts = relationship("EmergencyContact", back_populates="family", cascade="all, delete-orphan")
    students = relationship("Student", back_populates="family")
    payments = relationship("Payment", back_populates="family", cascade="all, delete-orphan")

# 3. Guardian (Parent/Guardian)
class Guardian(Base):
    __tablename__ = "guardians"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    family_id = Column(UUID(as_uuid=True), ForeignKey("families.id"), nullable=False)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True)
    phone = Column(String)
    relationship_to_family = Column(String)  # e.g., "Mother", "Father", "Guardian"
    
    family = relationship("Family", back_populates="guardians")

# 4. Emergency Contact
class EmergencyContact(Base):
    __tablename__ = "emergency_contacts"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    family_id = Column(UUID(as_uuid=True), ForeignKey("families.id"), nullable=False)
    name = Column(String, nullable=False)
    email = Column(String, index=True)
    phone = Column(String, nullable=False)
    relationship_to_family = Column(String)  # e.g., "Aunt", "Grandmother", "Friend"
    
    family = relationship("Family", back_populates="emergency_contacts")

# 3. Program
class Program(Base):
    __tablename__ = "programs"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    
    classes = relationship("Class", back_populates="program")

# 4. Class
class Class(Base):
    __tablename__ = "classes"
    # We use UUID(as_uuid=True) so Python handles it as an object, not a string
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String)
    program_id = Column(Integer, ForeignKey("programs.id"))
    academic_year_id = Column(Integer, ForeignKey("academic_years.id"))
    
    program = relationship("Program", back_populates="classes")
    academic_year = relationship("AcademicYear", back_populates="classes")
    enrollments = relationship("Enrollment", back_populates="assigned_class")

# 5. Student
class Student(Base):
    __tablename__ = "students"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    family_id = Column(UUID(as_uuid=True), ForeignKey("families.id"))
    first_name = Column(String)
    last_name = Column(String)
    middle_name = Column(String, nullable=True)
    saint_name = Column(String, nullable=True)
    date_of_birth = Column(Date)
    gender = Column(String, nullable=True)
    grade_level = Column(Integer, nullable=True)
    american_school = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    
    enrollments = relationship("Enrollment", back_populates="student")
    family = relationship("Family", back_populates="students")

# 6. Link Tables
class Enrollment(Base):
    __tablename__ = "enrollments"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # Foreign Keys must also be UUIDs
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id"))
    class_id = Column(UUID(as_uuid=True), ForeignKey("classes.id"))
    
    student = relationship("Student", back_populates="enrollments")
    assigned_class = relationship("Class", back_populates="enrollments")


# 7. Payment Tracking
class Payment(Base):
    __tablename__ = "payments"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    family_id = Column(UUID(as_uuid=True), ForeignKey("families.id"), nullable=False)
    school_year = Column(String, nullable=False)  # e.g., "2024-2025"
    amount_due = Column(Numeric(10, 2), nullable=True)
    amount_paid = Column(Numeric(10, 2), default=0)
    payment_status = Column(SQLAlchemyEnum(PaymentStatus), default=PaymentStatus.UNPAID)
    payment_date = Column(DateTime, nullable=True)
    payment_method = Column(String, nullable=True)  # 'cash', 'check', 'venmo', 'zelle', etc.
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    family = relationship("Family", back_populates="payments")
