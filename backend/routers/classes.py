import csv
import io
from uuid import UUID
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from database import get_db
from models import Class, Program, Enrollment, Student, Family, AcademicYear
from schemas import (
    ClassCreate,
    ClassUpdate,
    ClassResponse,
    ClassWithEnrollmentCount,
    ClassWithEnrollments,
    EnrollmentCreate,
    EnrollmentResponse,
    ProgramResponse,
)

router = APIRouter(prefix="/api/classes", tags=["classes"])


# --- Class CRUD ---

@router.get("", response_model=list[ClassWithEnrollmentCount])
async def get_classes(
    academic_year_id: Optional[int] = Query(None),
    program_id: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Get all classes, optionally filtered by academic year and/or program."""
    query = select(Class).options(selectinload(Class.program))
    
    if academic_year_id:
        query = query.where(Class.academic_year_id == academic_year_id)
    
    if program_id:
        query = query.where(Class.program_id == program_id)
    
    query = query.order_by(Class.name)
    
    result = await db.execute(query)
    classes = result.scalars().all()
    
    # Get enrollment counts for each class
    classes_with_counts = []
    for cls in classes:
        count_query = select(func.count()).select_from(Enrollment).where(
            Enrollment.class_id == cls.id
        )
        count_result = await db.execute(count_query)
        enrollment_count = count_result.scalar() or 0
        
        classes_with_counts.append(
            ClassWithEnrollmentCount(
                id=cls.id,
                name=cls.name,
                program_id=cls.program_id,
                academic_year_id=cls.academic_year_id,
                program=ProgramResponse(id=cls.program.id, name=cls.program.name) if cls.program else None,
                enrollment_count=enrollment_count,
            )
        )
    
    return classes_with_counts


@router.get("/{class_id}", response_model=ClassWithEnrollments)
async def get_class(class_id: UUID, db: AsyncSession = Depends(get_db)):
    """Get a single class with all enrolled students."""
    result = await db.execute(
        select(Class)
        .options(
            selectinload(Class.program),
            selectinload(Class.enrollments).selectinload(Enrollment.student).selectinload(Student.family),
        )
        .where(Class.id == class_id)
    )
    cls = result.scalar_one_or_none()
    
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Build response with student family info
    enrollments_with_family = []
    for enrollment in cls.enrollments:
        student = enrollment.student
        family_name = student.family.family_name if student.family else None
        
        enrollments_with_family.append({
            "id": enrollment.id,
            "student_id": student.id,
            "class_id": cls.id,
            "student": {
                "id": student.id,
                "family_id": student.family_id,
                "first_name": student.first_name,
                "last_name": student.last_name,
                "middle_name": student.middle_name,
                "saint_name": student.saint_name,
                "date_of_birth": student.date_of_birth,
                "gender": student.gender,
                "grade_level": student.grade_level,
                "american_school": student.american_school,
                "notes": student.notes,
                "family_name": family_name,
            }
        })
    
    return ClassWithEnrollments(
        id=cls.id,
        name=cls.name,
        program_id=cls.program_id,
        academic_year_id=cls.academic_year_id,
        program=ProgramResponse(id=cls.program.id, name=cls.program.name) if cls.program else None,
        enrollments=enrollments_with_family,
        enrollment_count=len(cls.enrollments),
    )


@router.post("", response_model=ClassResponse, status_code=201)
async def create_class(class_data: ClassCreate, db: AsyncSession = Depends(get_db)):
    """Create a new class."""
    # Verify program exists
    program_result = await db.execute(
        select(Program).where(Program.id == class_data.program_id)
    )
    if not program_result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Program not found")
    
    # Verify academic year exists
    year_result = await db.execute(
        select(AcademicYear).where(AcademicYear.id == class_data.academic_year_id)
    )
    if not year_result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Academic year not found")
    
    new_class = Class(
        name=class_data.name,
        program_id=class_data.program_id,
        academic_year_id=class_data.academic_year_id,
    )
    db.add(new_class)
    await db.commit()
    
    # Reload with program
    result = await db.execute(
        select(Class).options(selectinload(Class.program)).where(Class.id == new_class.id)
    )
    return result.scalar_one()


@router.put("/{class_id}", response_model=ClassResponse)
async def update_class(
    class_id: UUID, class_data: ClassUpdate, db: AsyncSession = Depends(get_db)
):
    """Update a class."""
    result = await db.execute(select(Class).where(Class.id == class_id))
    cls = result.scalar_one_or_none()
    
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")
    
    update_data = class_data.model_dump(exclude_unset=True)
    
    # Verify program exists if being updated
    if "program_id" in update_data:
        program_result = await db.execute(
            select(Program).where(Program.id == update_data["program_id"])
        )
        if not program_result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Program not found")
    
    # Verify academic year exists if being updated
    if "academic_year_id" in update_data:
        year_result = await db.execute(
            select(AcademicYear).where(AcademicYear.id == update_data["academic_year_id"])
        )
        if not year_result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Academic year not found")
    
    for field, value in update_data.items():
        setattr(cls, field, value)
    
    await db.commit()
    
    # Reload with program
    result = await db.execute(
        select(Class).options(selectinload(Class.program)).where(Class.id == class_id)
    )
    return result.scalar_one()


@router.delete("/{class_id}", status_code=204)
async def delete_class(class_id: UUID, db: AsyncSession = Depends(get_db)):
    """Delete a class and all associated enrollments."""
    result = await db.execute(select(Class).where(Class.id == class_id))
    cls = result.scalar_one_or_none()
    
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Delete associated enrollments first
    await db.execute(
        Enrollment.__table__.delete().where(Enrollment.class_id == class_id)
    )
    
    await db.delete(cls)
    await db.commit()
    return None


# --- Enrollment Management ---

@router.post("/{class_id}/enrollments", response_model=EnrollmentResponse, status_code=201)
async def enroll_student(
    class_id: UUID, enrollment_data: EnrollmentCreate, db: AsyncSession = Depends(get_db)
):
    """Enroll a student in a class."""
    # Verify class exists
    class_result = await db.execute(select(Class).where(Class.id == class_id))
    if not class_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Verify student exists
    student_result = await db.execute(
        select(Student).where(Student.id == enrollment_data.student_id)
    )
    if not student_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Check if already enrolled
    existing = await db.execute(
        select(Enrollment).where(
            Enrollment.class_id == class_id,
            Enrollment.student_id == enrollment_data.student_id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Student already enrolled in this class")
    
    enrollment = Enrollment(
        student_id=enrollment_data.student_id,
        class_id=class_id,
    )
    db.add(enrollment)
    await db.commit()
    await db.refresh(enrollment)
    
    return enrollment


@router.delete("/{class_id}/enrollments/{student_id}", status_code=204)
async def unenroll_student(
    class_id: UUID, student_id: UUID, db: AsyncSession = Depends(get_db)
):
    """Remove a student enrollment from a class."""
    result = await db.execute(
        select(Enrollment).where(
            Enrollment.student_id == student_id, Enrollment.class_id == class_id
        )
    )
    enrollment = result.scalar_one_or_none()
    
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    
    await db.delete(enrollment)
    await db.commit()
    return None


# --- Export Functionality ---

@router.get("/{class_id}/export/csv")
async def export_class_csv(class_id: UUID, db: AsyncSession = Depends(get_db)):
    """Export class roster as CSV file."""
    # Get class with enrollments
    result = await db.execute(
        select(Class)
        .options(
            selectinload(Class.program),
            selectinload(Class.enrollments).selectinload(Enrollment.student).selectinload(Student.family),
        )
        .where(Class.id == class_id)
    )
    cls = result.scalar_one_or_none()
    
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Create CSV in memory
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header info
    writer.writerow(["Class Name:", cls.name])
    writer.writerow(["Program:", cls.program.name if cls.program else "N/A"])
    writer.writerow(["Total Students:", len(cls.enrollments)])
    writer.writerow([])  # Empty row
    
    # Write student headers
    writer.writerow([
        "First Name",
        "Last Name",
        "Middle Name",
        "Saint Name",
        "Date of Birth",
        "Gender",
        "Grade Level",
        "School",
        "Family Name",
        "Notes",
    ])
    
    # Write student data
    for enrollment in cls.enrollments:
        student = enrollment.student
        family_name = student.family.family_name if student.family else ""
        
        writer.writerow([
            student.first_name or "",
            student.last_name or "",
            student.middle_name or "",
            student.saint_name or "",
            str(student.date_of_birth) if student.date_of_birth else "",
            student.gender or "",
            str(student.grade_level) if student.grade_level else "",
            student.american_school or "",
            family_name,
            student.notes or "",
        ])
    
    # Prepare response
    output.seek(0)
    filename = f"{cls.name.replace(' ', '_')}_roster.csv"
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


# --- Programs API ---

program_router = APIRouter(prefix="/api/programs", tags=["programs"])


@program_router.get("", response_model=list[ProgramResponse])
async def get_programs(db: AsyncSession = Depends(get_db)):
    """Get all programs."""
    result = await db.execute(select(Program).order_by(Program.name))
    return result.scalars().all()


@program_router.post("", response_model=ProgramResponse, status_code=201)
async def create_program(name: str, db: AsyncSession = Depends(get_db)):
    """Create a new program."""
    program = Program(name=name)
    db.add(program)
    await db.commit()
    await db.refresh(program)
    return program
