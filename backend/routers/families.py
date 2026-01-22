from uuid import UUID
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload
import math

from database import get_db
from models import Family, Guardian, EmergencyContact, Student, AcademicYear
from schemas import (
    FamilyCreate,
    FamilyUpdate,
    FamilyResponse,
    PaginatedFamilyResponse,
    GuardianCreate,
    GuardianUpdate,
    GuardianResponse,
    StudentCreate,
    StudentUpdate,
    StudentResponse,
    EmergencyContactCreate,
    EmergencyContactUpdate,
    EmergencyContactResponse,
    AcademicYearResponse,
)

router = APIRouter(prefix="/api/families", tags=["families"])


# --- Family CRUD ---

@router.get("", response_model=PaginatedFamilyResponse)
async def get_families(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
    sort_by: Optional[str] = Query("family_name"),
    sort_order: Optional[str] = Query("asc"),
    db: AsyncSession = Depends(get_db),
):
    """Get all families with pagination, search, and sorting."""
    
    # Base query with eager loading
    query = select(Family).options(
        selectinload(Family.guardians),
        selectinload(Family.students),
        selectinload(Family.emergency_contacts),
    )
    
    # Apply search filter
    if search:
        search_pattern = f"%{search}%"
        query = query.where(
            or_(
                Family.family_name.ilike(search_pattern),
                Family.city.ilike(search_pattern),
                Family.state.ilike(search_pattern),
                Family.zip_code.ilike(search_pattern),
            )
        )
    
    # Apply sorting
    sort_column = getattr(Family, sort_by, Family.family_name)
    if sort_order == "desc":
        sort_column = sort_column.desc()
    query = query.order_by(sort_column)
    
    # Get total count
    count_query = select(func.count()).select_from(Family)
    if search:
        search_pattern = f"%{search}%"
        count_query = count_query.where(
            or_(
                Family.family_name.ilike(search_pattern),
                Family.city.ilike(search_pattern),
                Family.state.ilike(search_pattern),
                Family.zip_code.ilike(search_pattern),
            )
        )
    
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    # Apply pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)
    
    result = await db.execute(query)
    families = result.scalars().all()
    
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    
    return PaginatedFamilyResponse(
        items=families,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/{family_id}", response_model=FamilyResponse)
async def get_family(family_id: UUID, db: AsyncSession = Depends(get_db)):
    """Get a single family by ID."""
    result = await db.execute(
        select(Family)
        .options(
            selectinload(Family.guardians),
            selectinload(Family.students),
            selectinload(Family.emergency_contacts),
        )
        .where(Family.id == family_id)
    )
    family = result.scalar_one_or_none()
    
    if not family:
        raise HTTPException(status_code=404, detail="Family not found")
    
    return family


@router.post("", response_model=FamilyResponse, status_code=201)
async def create_family(family_data: FamilyCreate, db: AsyncSession = Depends(get_db)):
    """Create a new family with optional guardians, students, and emergency contacts."""
    
    # Create the family
    family = Family(
        family_name=family_data.family_name,
        address=family_data.address,
        city=family_data.city,
        state=family_data.state,
        zip_code=family_data.zip_code,
        diocese_id=family_data.diocese_id,
    )
    db.add(family)
    await db.flush()  # Get the family ID
    
    # Create guardians
    for guardian_data in family_data.guardians:
        guardian = Guardian(
            family_id=family.id,
            name=guardian_data.name,
            email=guardian_data.email,
            phone=guardian_data.phone,
            relationship_to_family=guardian_data.relationship_to_family,
        )
        db.add(guardian)
    
    # Create students
    for student_data in family_data.students:
        student = Student(
            family_id=family.id,
            first_name=student_data.first_name,
            last_name=student_data.last_name,
            middle_name=student_data.middle_name,
            saint_name=student_data.saint_name,
            date_of_birth=student_data.date_of_birth,
            gender=student_data.gender,
            grade_level=student_data.grade_level,
            american_school=student_data.american_school,
            notes=student_data.notes,
        )
        db.add(student)
    
    # Create emergency contacts
    for contact_data in family_data.emergency_contacts:
        contact = EmergencyContact(
            family_id=family.id,
            name=contact_data.name,
            email=contact_data.email,
            phone=contact_data.phone,
            relationship_to_family=contact_data.relationship_to_family,
        )
        db.add(contact)
    
    await db.commit()
    
    # Reload with relationships
    result = await db.execute(
        select(Family)
        .options(
            selectinload(Family.guardians),
            selectinload(Family.students),
            selectinload(Family.emergency_contacts),
        )
        .where(Family.id == family.id)
    )
    return result.scalar_one()


@router.put("/{family_id}", response_model=FamilyResponse)
async def update_family(
    family_id: UUID, family_data: FamilyUpdate, db: AsyncSession = Depends(get_db)
):
    """Update a family's basic information."""
    result = await db.execute(select(Family).where(Family.id == family_id))
    family = result.scalar_one_or_none()
    
    if not family:
        raise HTTPException(status_code=404, detail="Family not found")
    
    # Update fields if provided
    update_data = family_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(family, field, value)
    
    await db.commit()
    
    # Reload with relationships
    result = await db.execute(
        select(Family)
        .options(
            selectinload(Family.guardians),
            selectinload(Family.students),
            selectinload(Family.emergency_contacts),
        )
        .where(Family.id == family_id)
    )
    return result.scalar_one()


@router.delete("/{family_id}", status_code=204)
async def delete_family(family_id: UUID, db: AsyncSession = Depends(get_db)):
    """Delete a family and all related data."""
    result = await db.execute(select(Family).where(Family.id == family_id))
    family = result.scalar_one_or_none()
    
    if not family:
        raise HTTPException(status_code=404, detail="Family not found")
    
    await db.delete(family)
    await db.commit()
    return None


# --- Guardian CRUD ---

@router.post("/{family_id}/guardians", response_model=GuardianResponse, status_code=201)
async def create_guardian(
    family_id: UUID, guardian_data: GuardianCreate, db: AsyncSession = Depends(get_db)
):
    """Add a guardian to a family."""
    # Verify family exists
    result = await db.execute(select(Family).where(Family.id == family_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Family not found")
    
    guardian = Guardian(
        family_id=family_id,
        name=guardian_data.name,
        email=guardian_data.email,
        phone=guardian_data.phone,
        relationship_to_family=guardian_data.relationship_to_family,
    )
    db.add(guardian)
    await db.commit()
    await db.refresh(guardian)
    return guardian


@router.put("/{family_id}/guardians/{guardian_id}", response_model=GuardianResponse)
async def update_guardian(
    family_id: UUID,
    guardian_id: UUID,
    guardian_data: GuardianUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update a guardian."""
    result = await db.execute(
        select(Guardian).where(Guardian.id == guardian_id, Guardian.family_id == family_id)
    )
    guardian = result.scalar_one_or_none()
    
    if not guardian:
        raise HTTPException(status_code=404, detail="Guardian not found")
    
    update_data = guardian_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(guardian, field, value)
    
    await db.commit()
    await db.refresh(guardian)
    return guardian


@router.delete("/{family_id}/guardians/{guardian_id}", status_code=204)
async def delete_guardian(
    family_id: UUID, guardian_id: UUID, db: AsyncSession = Depends(get_db)
):
    """Delete a guardian."""
    result = await db.execute(
        select(Guardian).where(Guardian.id == guardian_id, Guardian.family_id == family_id)
    )
    guardian = result.scalar_one_or_none()
    
    if not guardian:
        raise HTTPException(status_code=404, detail="Guardian not found")
    
    await db.delete(guardian)
    await db.commit()
    return None


# --- Student CRUD ---

@router.post("/{family_id}/students", response_model=StudentResponse, status_code=201)
async def create_student(
    family_id: UUID, student_data: StudentCreate, db: AsyncSession = Depends(get_db)
):
    """Add a student to a family."""
    # Verify family exists
    result = await db.execute(select(Family).where(Family.id == family_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Family not found")
    
    student = Student(
        family_id=family_id,
        first_name=student_data.first_name,
        last_name=student_data.last_name,
        middle_name=student_data.middle_name,
        saint_name=student_data.saint_name,
        date_of_birth=student_data.date_of_birth,
        gender=student_data.gender,
        grade_level=student_data.grade_level,
        american_school=student_data.american_school,
        notes=student_data.notes,
    )
    db.add(student)
    await db.commit()
    await db.refresh(student)
    return student


@router.put("/{family_id}/students/{student_id}", response_model=StudentResponse)
async def update_student(
    family_id: UUID,
    student_id: UUID,
    student_data: StudentUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update a student."""
    result = await db.execute(
        select(Student).where(Student.id == student_id, Student.family_id == family_id)
    )
    student = result.scalar_one_or_none()
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    update_data = student_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(student, field, value)
    
    await db.commit()
    await db.refresh(student)
    return student


@router.delete("/{family_id}/students/{student_id}", status_code=204)
async def delete_student(
    family_id: UUID, student_id: UUID, db: AsyncSession = Depends(get_db)
):
    """Delete a student."""
    result = await db.execute(
        select(Student).where(Student.id == student_id, Student.family_id == family_id)
    )
    student = result.scalar_one_or_none()
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    await db.delete(student)
    await db.commit()
    return None


# --- Emergency Contact CRUD ---

@router.post(
    "/{family_id}/emergency-contacts",
    response_model=EmergencyContactResponse,
    status_code=201,
)
async def create_emergency_contact(
    family_id: UUID,
    contact_data: EmergencyContactCreate,
    db: AsyncSession = Depends(get_db),
):
    """Add an emergency contact to a family."""
    # Verify family exists
    result = await db.execute(select(Family).where(Family.id == family_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Family not found")
    
    contact = EmergencyContact(
        family_id=family_id,
        name=contact_data.name,
        email=contact_data.email,
        phone=contact_data.phone,
        relationship_to_family=contact_data.relationship_to_family,
    )
    db.add(contact)
    await db.commit()
    await db.refresh(contact)
    return contact


@router.put(
    "/{family_id}/emergency-contacts/{contact_id}",
    response_model=EmergencyContactResponse,
)
async def update_emergency_contact(
    family_id: UUID,
    contact_id: UUID,
    contact_data: EmergencyContactUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update an emergency contact."""
    result = await db.execute(
        select(EmergencyContact).where(
            EmergencyContact.id == contact_id, EmergencyContact.family_id == family_id
        )
    )
    contact = result.scalar_one_or_none()
    
    if not contact:
        raise HTTPException(status_code=404, detail="Emergency contact not found")
    
    update_data = contact_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(contact, field, value)
    
    await db.commit()
    await db.refresh(contact)
    return contact


@router.delete("/{family_id}/emergency-contacts/{contact_id}", status_code=204)
async def delete_emergency_contact(
    family_id: UUID, contact_id: UUID, db: AsyncSession = Depends(get_db)
):
    """Delete an emergency contact."""
    result = await db.execute(
        select(EmergencyContact).where(
            EmergencyContact.id == contact_id, EmergencyContact.family_id == family_id
        )
    )
    contact = result.scalar_one_or_none()
    
    if not contact:
        raise HTTPException(status_code=404, detail="Emergency contact not found")
    
    await db.delete(contact)
    await db.commit()
    return None


# --- Academic Years ---

academic_year_router = APIRouter(prefix="/api/academic-years", tags=["academic-years"])


@academic_year_router.get("", response_model=list[AcademicYearResponse])
async def get_academic_years(db: AsyncSession = Depends(get_db)):
    """Get all academic years."""
    result = await db.execute(select(AcademicYear).order_by(AcademicYear.name.desc()))
    return result.scalars().all()


@academic_year_router.get("/current", response_model=AcademicYearResponse)
async def get_current_academic_year(db: AsyncSession = Depends(get_db)):
    """Get the current academic year."""
    result = await db.execute(
        select(AcademicYear).where(AcademicYear.is_current == True)
    )
    year = result.scalar_one_or_none()
    
    if not year:
        raise HTTPException(status_code=404, detail="No current academic year set")
    
    return year
