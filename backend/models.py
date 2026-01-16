import uuid
from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Date, Text
from sqlalchemy.dialects.postgresql import UUID  # <--- SPECIAL POSTGRES TYPE
from sqlalchemy.orm import relationship
from database import Base

# 1. Academic Year
class AcademicYear(Base):
    __tablename__ = "academic_years"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String) 
    is_current = Column(Boolean, default=False)

# 2. Profile
class Profile(Base):
    __tablename__ = "profiles"
    # User ID from Supabase is a UUID, so we must match it
    id = Column(UUID(as_uuid=True), primary_key=True) 
    full_name = Column(String)
    role = Column(String, default="parent")

    guardianships = relationship("StudentGuardian", back_populates="guardian")

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
    enrollments = relationship("Enrollment", back_populates="assigned_class")

# 5. Student
class Student(Base):
    __tablename__ = "students"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    first_name = Column(String)
    last_name = Column(String)
    middle_name = Column(String, nullable=True)
    allergies = Column(Text, nullable=True)
    gender = Column(String, nullable=True)
    date_of_birth = Column(Date)
    
    enrollments = relationship("Enrollment", back_populates="student")
    guardians = relationship("StudentGuardian", back_populates="student")

# 6. Link Tables
class Enrollment(Base):
    __tablename__ = "enrollments"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # Foreign Keys must also be UUIDs
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id"))
    class_id = Column(UUID(as_uuid=True), ForeignKey("classes.id"))
    
    student = relationship("Student", back_populates="enrollments")
    assigned_class = relationship("Class", back_populates="enrollments")

class StudentGuardian(Base):
    __tablename__ = "student_guardians"
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id"), primary_key=True)
    guardian_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id"), primary_key=True)
    
    student = relationship("Student", back_populates="guardians")
    guardian = relationship("Profile", back_populates="guardianships")