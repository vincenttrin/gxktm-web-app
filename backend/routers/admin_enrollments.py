"""
Enrollments Router - Admin manual enrollment management.

This router provides endpoints for:
- Manual student enrollment by admins
- Bulk enrollment of students into classes
- Viewing student enrollments
- Removing enrollments
"""

from uuid import UUID
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload

from database import get_db
from models import Student, Class, Enrollment, Family
from schemas import (
    ManualEnrollmentCreate,
    ManualEnrollmentResponse,
    BulkEnrollmentCreate,
    BulkEnrollmentResponse,
    StudentEnrollmentInfo,
    ClassResponse,
)

router = APIRouter(prefix="/api/enrollments", tags=["enrollments"])


# --- Get Students with Enrollments ---

@router.get("/students", response_model=List[StudentEnrollmentInfo])
async def get_students_with_enrollments(
    search: Optional[str] = Query(None),
    family_id: Optional[UUID] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Get students with their current class enrollments."""
    
    query = select(Student).options(
        selectinload(Student.family),
        selectinload(Student.enrollments).selectinload(Enrollment.class_),
    )
    
    if family_id:
        query = query.where(Student.family_id == family_id)
    
    if search:
        search_pattern = f"%{search}%"
        query = query.join(Family).where(
            (Student.first_name.ilike(search_pattern)) |
            (Student.last_name.ilike(search_pattern)) |
            (Family.family_name.ilike(search_pattern))
        )
    
    result = await db.execute(query)
    students = result.scalars().all()
    
    student_infos = []
    for student in students:
        enrolled_classes = []
        for enrollment in student.enrollments:
            if enrollment.class_:
                enrolled_classes.append({
                    "id": str(enrollment.class_.id),
                    "name": enrollment.class_.name,
                    "program_id": enrollment.class_.program_id,
                    "academic_year_id": enrollment.class_.academic_year_id,
                    "program": None,  # Could load if needed
                })
        
        student_infos.append(StudentEnrollmentInfo(
            id=student.id,
            family_id=student.family_id,
            first_name=student.first_name,
            last_name=student.last_name,
            family_name=student.family.family_name if student.family else None,
            enrolled_classes=enrolled_classes,
        ))
    
    return student_infos


# --- Manual Enrollment ---

@router.post("/manual", response_model=ManualEnrollmentResponse)
async def manual_enroll_student(
    enrollment_data: ManualEnrollmentCreate,
    db: AsyncSession = Depends(get_db),
):
    """Manually enroll a student into one or more classes."""
    
    # Verify student exists
    student_result = await db.execute(
        select(Student).where(Student.id == enrollment_data.student_id)
    )
    student = student_result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    enrolled_class_ids = []
    already_enrolled_class_ids = []
    
    for class_id in enrollment_data.class_ids:
        # Verify class exists
        class_result = await db.execute(
            select(Class).where(Class.id == class_id)
        )
        class_obj = class_result.scalar_one_or_none()
        if not class_obj:
            continue  # Skip invalid class IDs
        
        # Check if already enrolled
        existing_result = await db.execute(
            select(Enrollment).where(
                and_(
                    Enrollment.student_id == enrollment_data.student_id,
                    Enrollment.class_id == class_id,
                )
            )
        )
        if existing_result.scalar_one_or_none():
            already_enrolled_class_ids.append(str(class_id))
            continue
        
        # Create enrollment
        enrollment = Enrollment(
            student_id=enrollment_data.student_id,
            class_id=class_id,
        )
        db.add(enrollment)
        enrolled_class_ids.append(str(class_id))
    
    await db.commit()
    
    message = f"Enrolled in {len(enrolled_class_ids)} class(es)"
    if already_enrolled_class_ids:
        message += f", {len(already_enrolled_class_ids)} already enrolled"
    
    return ManualEnrollmentResponse(
        student_id=enrollment_data.student_id,
        enrolled_class_ids=enrolled_class_ids,
        already_enrolled_class_ids=already_enrolled_class_ids,
        message=message,
    )


# --- Bulk Enrollment ---

@router.post("/bulk", response_model=BulkEnrollmentResponse)
async def bulk_enroll_students(
    enrollment_data: BulkEnrollmentCreate,
    db: AsyncSession = Depends(get_db),
):
    """Enroll multiple students into a single class."""
    
    # Verify class exists
    class_result = await db.execute(
        select(Class).where(Class.id == enrollment_data.class_id)
    )
    class_obj = class_result.scalar_one_or_none()
    if not class_obj:
        raise HTTPException(status_code=404, detail="Class not found")
    
    enrolled_student_ids = []
    already_enrolled_student_ids = []
    
    for student_id in enrollment_data.student_ids:
        # Verify student exists
        student_result = await db.execute(
            select(Student).where(Student.id == student_id)
        )
        student = student_result.scalar_one_or_none()
        if not student:
            continue  # Skip invalid student IDs
        
        # Check if already enrolled
        existing_result = await db.execute(
            select(Enrollment).where(
                and_(
                    Enrollment.student_id == student_id,
                    Enrollment.class_id == enrollment_data.class_id,
                )
            )
        )
        if existing_result.scalar_one_or_none():
            already_enrolled_student_ids.append(str(student_id))
            continue
        
        # Create enrollment
        enrollment = Enrollment(
            student_id=student_id,
            class_id=enrollment_data.class_id,
        )
        db.add(enrollment)
        enrolled_student_ids.append(str(student_id))
    
    await db.commit()
    
    message = f"Enrolled {len(enrolled_student_ids)} student(s)"
    if already_enrolled_student_ids:
        message += f", {len(already_enrolled_student_ids)} already enrolled"
    
    return BulkEnrollmentResponse(
        class_id=enrollment_data.class_id,
        enrolled_student_ids=enrolled_student_ids,
        already_enrolled_student_ids=already_enrolled_student_ids,
        message=message,
    )


# --- Get Student Enrollments ---

@router.get("/student/{student_id}/classes", response_model=List[ClassResponse])
async def get_student_classes(
    student_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get all classes a student is enrolled in."""
    
    # Verify student exists
    student_result = await db.execute(
        select(Student).where(Student.id == student_id)
    )
    if not student_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Student not found")
    
    result = await db.execute(
        select(Class)
        .join(Enrollment)
        .where(Enrollment.student_id == student_id)
        .options(selectinload(Class.program))
    )
    classes = result.scalars().all()
    
    return classes


# --- Remove Enrollment ---

@router.delete("/{student_id}/{class_id}", status_code=204)
async def remove_enrollment(
    student_id: UUID,
    class_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Remove a student from a class."""
    
    result = await db.execute(
        select(Enrollment).where(
            and_(
                Enrollment.student_id == student_id,
                Enrollment.class_id == class_id,
            )
        )
    )
    enrollment = result.scalar_one_or_none()
    
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    
    await db.delete(enrollment)
    await db.commit()
    return None
