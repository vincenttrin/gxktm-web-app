"""
Enrollment Router - Handles family enrollment for the public-facing enrollment portal.

This router provides endpoints for:
- Magic link authentication flow
- Family lookup by email
- Getting family data with pre-populated enrollments
- Class listing for current academic year
- Grade progression logic
"""

from uuid import UUID, uuid4
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc
from sqlalchemy.orm import selectinload
import re

from database import get_db
from models import Family, Guardian, Student, Enrollment, Class, AcademicYear, Program, EmergencyContact
from schemas import (
    FamilyResponse,
    ClassResponse,
    EnrollmentResponse,
    EnrollmentSubmissionRequest,
    EnrollmentSubmissionResponse,
)

router = APIRouter(prefix="/api/enrollment", tags=["enrollment"])


# --- Helper Functions ---

def try_parse_uuid(id_str: Optional[str]) -> Optional[UUID]:
    """
    Try to parse a string as a UUID.
    Returns None if the string is None, empty, or not a valid UUID.
    This handles temporary IDs like 'new-123456' gracefully.
    """
    if not id_str:
        return None
    try:
        return UUID(id_str)
    except (ValueError, AttributeError):
        return None


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


async def get_active_or_latest_academic_year(db: AsyncSession) -> AcademicYear:
    """Return the active academic year if available, otherwise the newest configured year."""
    active_result = await db.execute(
        select(AcademicYear)
        .where(AcademicYear.is_active.is_(True))
        .order_by(desc(AcademicYear.start_year), desc(AcademicYear.id))
        .limit(1)
    )
    active_year = active_result.scalar_one_or_none()
    if active_year:
        return active_year
    latest_result = await db.execute(
        select(AcademicYear)
        .order_by(desc(AcademicYear.start_year), desc(AcademicYear.id))
        .limit(1)
    )
    latest_year = latest_result.scalar_one_or_none()
    if not latest_year:
        raise HTTPException(
            status_code=404,
            detail="No school year configured. Please contact administration.",
        )
    return latest_year


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
    Get the current/newest school year for enrollment.
    
    This endpoint returns the newest school year (highest start_year).
    Parents always enroll into the newest year where enrollment is open.
    """
    academic_year = await get_active_or_latest_academic_year(db)
    
    # Check if enrollment is open
    if hasattr(academic_year, 'enrollment_open') and academic_year.enrollment_open is False:
        raise HTTPException(
            status_code=400,
            detail=f"Enrollment for {academic_year.name} is currently closed. Please contact administration."
        )
    
    return {
        "id": academic_year.id,
        "name": academic_year.name,
        "is_current": academic_year.is_current,
        "enrollment_open": getattr(academic_year, 'enrollment_open', True),
        "start_year": getattr(academic_year, 'start_year', None),
        "end_year": getattr(academic_year, 'end_year', None),
    }


@router.get("/school-year/current")
async def get_current_school_year_for_enrollment(
    db: AsyncSession = Depends(get_db),
):
    """
    Get the current/newest school year for enrollment.
    
    Returns the newest school year that parents should enroll into.
    """
    school_year = await get_active_or_latest_academic_year(db)
    
    if hasattr(school_year, 'enrollment_open') and school_year.enrollment_open is False:
        raise HTTPException(
            status_code=400,
            detail=f"Enrollment for {school_year.name} is currently closed. Please contact administration."
        )
    
    return {
        "id": school_year.id,
        "year_label": school_year.name,
        "name": school_year.name,
        "is_current": school_year.is_current,
        "enrollment_open": getattr(school_year, 'enrollment_open', True),
        "start_year": getattr(school_year, 'start_year', None),
        "end_year": getattr(school_year, 'end_year', None),
    }


@router.get("/classes")
async def get_classes_for_enrollment(
    academic_year_id: Optional[int] = Query(None, description="Filter by academic year"),
    program_id: Optional[int] = Query(None, description="Filter by program"),
    db: AsyncSession = Depends(get_db),
):
    """
    Get all available classes for the current/newest school year.
    Classes are grouped by program (Giao Ly, Viet Ngu).
    
    If no academic_year_id is provided, uses the newest school year.
    """
    target_academic_year_id = academic_year_id
    
    if not target_academic_year_id:
        current_year = await get_active_or_latest_academic_year(db)
        target_academic_year_id = current_year.id
    
    # Build query
    query = select(Class).options(selectinload(Class.program))
    
    conditions = []
    if target_academic_year_id:
        conditions.append(Class.academic_year_id == target_academic_year_id)
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
    current_year = await get_active_or_latest_academic_year(db)
    
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


@router.post("/submit", response_model=EnrollmentSubmissionResponse)
async def submit_enrollment(
    request: EnrollmentSubmissionRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Submit a complete family enrollment.
    
    This endpoint handles:
    - Creating new families or updating existing ones
    - Adding/updating/removing guardians
    - Adding/updating/removing students
    - Adding/updating/removing emergency contacts
    - Creating enrollments for selected classes
    
    The operation is transactional - all changes succeed or fail together.
    """
    from uuid import uuid4
    
    try:
        enrollment_ids = []
        
        # 1. Handle Family
        if request.family_id:
            # Update existing family
            family_result = await db.execute(
                select(Family).where(Family.id == request.family_id)
            )
            family = family_result.scalar_one_or_none()
            if not family:
                raise HTTPException(status_code=404, detail="Family not found")
            
            # Update family info
            family.family_name = request.family_info.family_name
            family.address = request.family_info.address
            family.city = request.family_info.city
            family.state = request.family_info.state
            family.zip_code = request.family_info.zip_code
            family.diocese_id = request.family_info.diocese_id
        else:
            # Create new family
            family = Family(
                id=uuid4(),
                family_name=request.family_info.family_name,
                address=request.family_info.address,
                city=request.family_info.city,
                state=request.family_info.state,
                zip_code=request.family_info.zip_code,
                diocese_id=request.family_info.diocese_id,
            )
            db.add(family)
            await db.flush()  # Get the family ID
        
        # 2. Handle Guardians
        # Get existing guardian IDs
        existing_guardian_ids = set()
        if request.family_id:
            guardians_result = await db.execute(
                select(Guardian).where(Guardian.family_id == family.id)
            )
            existing_guardians = guardians_result.scalars().all()
            existing_guardian_ids = {g.id for g in existing_guardians}
        
        # Process submitted guardians
        submitted_guardian_ids = set()
        for guardian_data in request.guardians:
            guardian_uuid = try_parse_uuid(guardian_data.id)
            if guardian_uuid and guardian_uuid in existing_guardian_ids:
                # Update existing guardian
                guardian_result = await db.execute(
                    select(Guardian).where(Guardian.id == guardian_uuid)
                )
                guardian = guardian_result.scalar_one()
                guardian.name = guardian_data.name
                guardian.email = guardian_data.email
                guardian.phone = guardian_data.phone
                guardian.relationship_to_family = guardian_data.relationship_to_family
                submitted_guardian_ids.add(guardian_uuid)
            else:
                # Create new guardian
                new_guardian = Guardian(
                    id=uuid4(),
                    family_id=family.id,
                    name=guardian_data.name,
                    email=guardian_data.email,
                    phone=guardian_data.phone,
                    relationship_to_family=guardian_data.relationship_to_family,
                )
                db.add(new_guardian)
        
        # Delete guardians that were not submitted (removed by user)
        guardians_to_delete = existing_guardian_ids - submitted_guardian_ids
        if guardians_to_delete:
            for gid in guardians_to_delete:
                await db.execute(
                    select(Guardian).where(Guardian.id == gid)
                )
                guardian_to_del = (await db.execute(
                    select(Guardian).where(Guardian.id == gid)
                )).scalar_one_or_none()
                if guardian_to_del:
                    await db.delete(guardian_to_del)
        
        # 3. Handle Students
        existing_student_ids = set()
        if request.family_id:
            students_result = await db.execute(
                select(Student).where(Student.family_id == family.id)
            )
            existing_students = students_result.scalars().all()
            existing_student_ids = {s.id for s in existing_students}
        
        # Map to store student IDs for enrollment creation
        # Maps submitted ID (string) to actual database student ID (UUID)
        student_id_map = {}
        
        submitted_student_ids = set()
        for idx, student_data in enumerate(request.students):
            student_uuid = try_parse_uuid(student_data.id)
            if student_uuid and student_uuid in existing_student_ids:
                # Update existing student
                student_result = await db.execute(
                    select(Student).where(Student.id == student_uuid)
                )
                student = student_result.scalar_one()
                student.first_name = student_data.first_name
                student.last_name = student_data.last_name
                student.middle_name = student_data.middle_name
                student.saint_name = student_data.saint_name
                student.date_of_birth = student_data.date_of_birth
                student.gender = student_data.gender
                student.grade_level = student_data.grade_level
                student.american_school = student_data.american_school
                student.notes = student_data.notes or student_data.special_needs
                submitted_student_ids.add(student_uuid)
                # Map the string ID to the UUID for class selection lookup
                student_id_map[student_data.id] = student.id
            else:
                # Create new student
                new_student = Student(
                    id=uuid4(),
                    family_id=family.id,
                    first_name=student_data.first_name,
                    last_name=student_data.last_name,
                    middle_name=student_data.middle_name,
                    saint_name=student_data.saint_name,
                    date_of_birth=student_data.date_of_birth,
                    gender=student_data.gender,
                    grade_level=student_data.grade_level,
                    american_school=student_data.american_school,
                    notes=student_data.notes or student_data.special_needs,
                )
                db.add(new_student)
                await db.flush()
                # Map the temporary string ID to the new UUID
                if student_data.id:
                    student_id_map[student_data.id] = new_student.id
        
        # Delete students that were not submitted (note: also deletes their enrollments via cascade)
        students_to_delete = existing_student_ids - submitted_student_ids
        if students_to_delete:
            for sid in students_to_delete:
                student_to_del = (await db.execute(
                    select(Student).where(Student.id == sid)
                )).scalar_one_or_none()
                if student_to_del:
                    await db.delete(student_to_del)
        
        # 4. Handle Emergency Contacts
        existing_ec_ids = set()
        if request.family_id:
            ec_result = await db.execute(
                select(EmergencyContact).where(EmergencyContact.family_id == family.id)
            )
            existing_ecs = ec_result.scalars().all()
            existing_ec_ids = {ec.id for ec in existing_ecs}
        
        submitted_ec_ids = set()
        for ec_data in request.emergency_contacts:
            ec_uuid = try_parse_uuid(ec_data.id)
            if ec_uuid and ec_uuid in existing_ec_ids:
                # Update existing emergency contact
                ec_result = await db.execute(
                    select(EmergencyContact).where(EmergencyContact.id == ec_uuid)
                )
                ec = ec_result.scalar_one()
                ec.name = ec_data.name
                ec.email = ec_data.email
                ec.phone = ec_data.phone
                ec.relationship_to_family = ec_data.relationship_to_family
                submitted_ec_ids.add(ec_uuid)
            else:
                # Create new emergency contact
                new_ec = EmergencyContact(
                    id=uuid4(),
                    family_id=family.id,
                    name=ec_data.name,
                    email=ec_data.email,
                    phone=ec_data.phone,
                    relationship_to_family=ec_data.relationship_to_family,
                )
                db.add(new_ec)
        
        # Delete emergency contacts that were not submitted
        ecs_to_delete = existing_ec_ids - submitted_ec_ids
        if ecs_to_delete:
            for ecid in ecs_to_delete:
                ec_to_del = (await db.execute(
                    select(EmergencyContact).where(EmergencyContact.id == ecid)
                )).scalar_one_or_none()
                if ec_to_del:
                    await db.delete(ec_to_del)
        
        # 5. Handle Class Enrollments
        # First, delete existing enrollments for this academic year
        # Get all classes for the current academic year
        classes_result = await db.execute(
            select(Class)
            .options(selectinload(Class.program))
            .where(Class.academic_year_id == request.academic_year_id)
        )
        current_year_classes = classes_result.scalars().all()
        class_name_to_id = {cls.name: cls.id for cls in current_year_classes}
        
        # Build program name to class map for level lookup
        giao_ly_classes = {}
        viet_ngu_classes = {}
        for cls in current_year_classes:
            if cls.program:
                level = parse_class_level(cls.name)
                if level:
                    if "Giao Ly" in cls.program.name or "Giáo Lý" in cls.name:
                        giao_ly_classes[level] = cls.id
                    elif "Viet Ngu" in cls.program.name or "Việt Ngữ" in cls.name:
                        viet_ngu_classes[level] = cls.id
        
        # Delete existing enrollments for students in current year classes
        for student_data in request.students:
            student_id = student_id_map.get(student_data.id)
            if student_id:
                # Delete existing enrollments for this student in current year
                existing_enrollments = (await db.execute(
                    select(Enrollment)
                    .where(Enrollment.student_id == student_id)
                    .where(Enrollment.class_id.in_([c.id for c in current_year_classes]))
                )).scalars().all()
                for enrollment in existing_enrollments:
                    await db.delete(enrollment)
        
        await db.flush()
        
        # Create new enrollments based on class selections
        for selection in request.class_selections:
            # Look up the actual UUID from our mapping
            student_id = student_id_map.get(selection.student_id)
            
            if not student_id:
                # If not in map, try to parse as UUID (for existing students)
                student_id = try_parse_uuid(selection.student_id)
            
            if not student_id:
                # Skip if we can't resolve the student ID
                continue
            
            # Create Giao Ly enrollment if level selected
            if selection.giao_ly_level and selection.giao_ly_level in giao_ly_classes:
                enrollment = Enrollment(
                    id=uuid4(),
                    student_id=student_id,
                    class_id=giao_ly_classes[selection.giao_ly_level],
                )
                db.add(enrollment)
                enrollment_ids.append(enrollment.id)
            
            # Create Viet Ngu enrollment if level selected
            if selection.viet_ngu_level and selection.viet_ngu_level in viet_ngu_classes:
                enrollment = Enrollment(
                    id=uuid4(),
                    student_id=student_id,
                    class_id=viet_ngu_classes[selection.viet_ngu_level],
                )
                db.add(enrollment)
                enrollment_ids.append(enrollment.id)
        
        # Commit all changes
        await db.commit()
        
        return EnrollmentSubmissionResponse(
            success=True,
            family_id=family.id,
            enrollment_ids=enrollment_ids,
            message=f"Enrollment submitted successfully. {len(enrollment_ids)} class enrollments created.",
        )
        
    except HTTPException:
        await db.rollback()
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to submit enrollment: {str(e)}"
        )
