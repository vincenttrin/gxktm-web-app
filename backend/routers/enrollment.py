"""
Enrollment Router - Handles family enrollment for the public-facing enrollment portal.

This router provides endpoints for:
- Magic link authentication flow
- Family lookup by email
- Getting family data with pre-populated enrollments
- Class listing for current academic year
- Grade progression logic
"""

from uuid import UUID
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
import re

from database import get_db
from models import Family, Guardian, Student, Enrollment, Class, AcademicYear, Program
from schemas import (
    FamilyResponse,
    ClassResponse,
    EnrollmentResponse,
)

router = APIRouter(prefix="/api/enrollment", tags=["enrollment"])


# --- Helper Functions ---

def parse_class_level(class_name: str) -> Optional[int]:
    """
    Extract the numeric level from a class name.
    E.g., "Giao Ly 3" -> 3, "Viet Ngu 5" -> 5
    Returns None if no number found.
    """
    match = re.search(r'(\d+)$', class_name.strip())
    if match:
        return int(match.group(1))
    return None


def get_next_class_name(class_name: str) -> Optional[str]:
    """
    Get the next level class name for grade progression.
    E.g., "Giao Ly 3" -> "Giao Ly 4", "Viet Ngu 5" -> "Viet Ngu 6"
    Returns None if the class is at max level (9) or no level found.
    """
    level = parse_class_level(class_name)
    if level is None or level >= 9:
        return None
    
    # Replace the number at the end with the next level
    return re.sub(r'\d+$', str(level + 1), class_name.strip())


# --- Enrollment Endpoints ---

@router.get("/lookup")
async def lookup_family_by_email(
    email: str = Query(..., description="Email address to look up"),
    db: AsyncSession = Depends(get_db),
):
    """
    Look up a family by guardian email address.
    Returns family info if found, or indicates this is a new family.
    Used after magic link authentication to determine the enrollment flow.
    """
    # Search for a guardian with this email
    result = await db.execute(
        select(Guardian)
        .options(selectinload(Guardian.family))
        .where(Guardian.email == email)
    )
    guardian = result.scalar_one_or_none()
    
    if guardian and guardian.family:
        return {
            "is_existing_family": True,
            "family_id": str(guardian.family_id),
            "family_name": guardian.family.family_name,
            "guardian_name": guardian.name,
        }
    
    return {
        "is_existing_family": False,
        "family_id": None,
        "family_name": None,
        "guardian_name": None,
    }


@router.get("/family/{family_id}", response_model=FamilyResponse)
async def get_family_for_enrollment(
    family_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Get full family data for enrollment, including guardians, students, and emergency contacts.
    """
    result = await db.execute(
        select(Family)
        .options(
            selectinload(Family.guardians),
            selectinload(Family.students).selectinload(Student.enrollments).selectinload(Enrollment.assigned_class).selectinload(Class.program),
            selectinload(Family.emergency_contacts),
        )
        .where(Family.id == family_id)
    )
    family = result.scalar_one_or_none()
    
    if not family:
        raise HTTPException(status_code=404, detail="Family not found")
    
    return family


@router.get("/academic-years/current")
async def get_current_academic_year(
    db: AsyncSession = Depends(get_db),
):
    """
    Get the current (or upcoming) academic year for enrollment.
    """
    result = await db.execute(
        select(AcademicYear)
        .where(AcademicYear.is_current == True)
        .order_by(AcademicYear.id.desc())  # Get the latest one if multiple exist
        .limit(1)
    )
    academic_year = result.scalar_one_or_none()
    
    if not academic_year:
        raise HTTPException(
            status_code=404, 
            detail="No current academic year configured. Please contact administration."
        )
    
    return {
        "id": academic_year.id,
        "name": academic_year.name,
        "is_current": academic_year.is_current,
    }


@router.get("/classes")
async def get_classes_for_enrollment(
    academic_year_id: Optional[int] = Query(None, description="Filter by academic year"),
    program_id: Optional[int] = Query(None, description="Filter by program"),
    db: AsyncSession = Depends(get_db),
):
    """
    Get all available classes for the current academic year.
    Classes are grouped by program (Giao Ly, Viet Ngu).
    """
    # If no academic year specified, get the current one
    if academic_year_id is None:
        year_result = await db.execute(
            select(AcademicYear).where(AcademicYear.is_current == True)
        )
        current_year = year_result.scalar_one_or_none()
        if current_year:
            academic_year_id = current_year.id
    
    # Build query
    query = select(Class).options(selectinload(Class.program))
    
    conditions = []
    if academic_year_id:
        conditions.append(Class.academic_year_id == academic_year_id)
    if program_id:
        conditions.append(Class.program_id == program_id)
    
    if conditions:
        query = query.where(and_(*conditions))
    
    query = query.order_by(Class.name)
    
    result = await db.execute(query)
    classes = result.scalars().all()
    
    # Group by program
    programs_dict = {}
    for cls in classes:
        program_name = cls.program.name if cls.program else "Other"
        if program_name not in programs_dict:
            programs_dict[program_name] = []
        programs_dict[program_name].append({
            "id": str(cls.id),
            "name": cls.name,
            "program_id": cls.program_id,
            "program_name": program_name,
            "academic_year_id": cls.academic_year_id,
        })
    
    return {
        "classes": [
            {
                "id": str(cls.id),
                "name": cls.name,
                "program_id": cls.program_id,
                "program_name": cls.program.name if cls.program else None,
                "academic_year_id": cls.academic_year_id,
            }
            for cls in classes
        ],
        "grouped_by_program": programs_dict,
    }


@router.get("/family/{family_id}/suggested-enrollments")
async def get_suggested_enrollments(
    family_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Get suggested enrollments for a family based on last year's enrollments
    with automatic grade progression.
    
    Rules:
    - Move each child up one class level from last year
    - Exception: Students in level 9 classes (Giao Ly 9, Viet Ngu 9) are NOT pre-populated
    """
    # Get current academic year
    year_result = await db.execute(
        select(AcademicYear).where(AcademicYear.is_current == True)
    )
    current_year = year_result.scalar_one_or_none()
    
    if not current_year:
        raise HTTPException(status_code=404, detail="No current academic year configured")
    
    # Get all classes for current year (for matching)
    classes_result = await db.execute(
        select(Class)
        .options(selectinload(Class.program))
        .where(Class.academic_year_id == current_year.id)
    )
    current_classes = {cls.name: cls for cls in classes_result.scalars().all()}
    
    # Get family's students with their last year's enrollments
    family_result = await db.execute(
        select(Family)
        .options(
            selectinload(Family.students)
            .selectinload(Student.enrollments)
            .selectinload(Enrollment.assigned_class)
            .selectinload(Class.program)
        )
        .where(Family.id == family_id)
    )
    family = family_result.scalar_one_or_none()
    
    if not family:
        raise HTTPException(status_code=404, detail="Family not found")
    
    suggested_enrollments = []
    
    for student in family.students:
        student_suggestions = {
            "student_id": str(student.id),
            "student_name": f"{student.first_name} {student.last_name}",
            "suggested_classes": [],
        }
        
        # Get last year's enrollments (enrollments NOT in current year)
        last_year_enrollments = [
            e for e in student.enrollments 
            if e.assigned_class and e.assigned_class.academic_year_id != current_year.id
        ]
        
        for enrollment in last_year_enrollments:
            old_class = enrollment.assigned_class
            if not old_class:
                continue
            
            old_class_name = old_class.name
            old_level = parse_class_level(old_class_name)
            
            # Skip if already at max level (9)
            if old_level == 9:
                continue
            
            # Get the next class name
            next_class_name = get_next_class_name(old_class_name)
            
            if next_class_name and next_class_name in current_classes:
                next_class = current_classes[next_class_name]
                student_suggestions["suggested_classes"].append({
                    "class_id": str(next_class.id),
                    "class_name": next_class.name,
                    "program_name": next_class.program.name if next_class.program else None,
                    "previous_class_name": old_class_name,
                    "is_auto_suggested": True,
                })
        
        suggested_enrollments.append(student_suggestions)
    
    return {
        "family_id": str(family_id),
        "academic_year_id": current_year.id,
        "academic_year_name": current_year.name,
        "suggested_enrollments": suggested_enrollments,
    }


@router.get("/programs")
async def get_programs(
    db: AsyncSession = Depends(get_db),
):
    """
    Get all programs (Giao Ly, Viet Ngu, etc.)
    """
    result = await db.execute(select(Program))
    programs = result.scalars().all()
    
    return [
        {
            "id": p.id,
            "name": p.name,
        }
        for p in programs
    ]
