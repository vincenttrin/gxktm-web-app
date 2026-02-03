from uuid import UUID
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload
import math

from database import get_db
from auth import require_admin, UserInfo
from models import Family, Guardian, EmergencyContact, Student, AcademicYear, Payment, Enrollment
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
    FamilyWithPaymentResponse,
    PaginatedFamilyWithPaymentResponse,
    FamilyPaymentStatus,
    PaymentStatusEnum,
    PaymentResponse,
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


@router.get("/all", response_model=list[FamilyResponse])
async def get_all_families(
    db: AsyncSession = Depends(get_db),
):
    """Get all families without pagination for client-side caching.
    This endpoint returns all families with their related data in a single request,
    optimized for client-side search and filtering.
    """
    query = select(Family).options(
        selectinload(Family.guardians),
        selectinload(Family.students),
        selectinload(Family.emergency_contacts),
    ).order_by(Family.family_name)
    
    result = await db.execute(query)
    families = result.scalars().all()
    
    return families


@router.get("/with-payments", response_model=PaginatedFamilyWithPaymentResponse)
async def get_families_with_payments(
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=100),
    search: Optional[str] = Query(None),
    sort_by: Optional[str] = Query("family_name"),
    sort_order: Optional[str] = Query("asc"),
    payment_status: Optional[PaymentStatusEnum] = Query(None),
    school_year: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Get all families with their payment status for the current school year."""
    
    # Base query with eager loading
    query = select(Family).options(
        selectinload(Family.guardians),
        selectinload(Family.students).selectinload(Student.enrollments),
        selectinload(Family.emergency_contacts),
        selectinload(Family.payments),
    )
    
    # Apply search filter
    if search:
        search_pattern = f"%{search}%"
        query = query.where(
            or_(
                Family.family_name.ilike(search_pattern),
                Family.city.ilike(search_pattern),
                Family.state.ilike(search_pattern),
            )
        )
    
    # Apply sorting
    sort_column = getattr(Family, sort_by, Family.family_name)
    if sort_order == "desc":
        sort_column = sort_column.desc()
    query = query.order_by(sort_column)
    
    # Get total count (before pagination)
    count_query = select(func.count()).select_from(Family)
    if search:
        search_pattern = f"%{search}%"
        count_query = count_query.where(
            or_(
                Family.family_name.ilike(search_pattern),
                Family.city.ilike(search_pattern),
                Family.state.ilike(search_pattern),
            )
        )
    
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    # Apply pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)
    
    result = await db.execute(query)
    families = result.scalars().all()
    
    # Build response with payment status
    family_items = []
    for family in families:
        # Get payment for school year
        payment_info = None
        if school_year:
            for payment in family.payments:
                if payment.school_year == school_year:
                    payment_info = FamilyPaymentStatus(
                        payment_status=PaymentStatusEnum(payment.payment_status),
                        amount_due=payment.amount_due,
                        amount_paid=payment.amount_paid,
                        school_year=payment.school_year,
                    )
                    break
        
        # If no payment record exists, consider as unpaid
        if not payment_info and school_year:
            payment_info = FamilyPaymentStatus(
                payment_status=PaymentStatusEnum.UNPAID,
                amount_due=None,
                amount_paid=0,
                school_year=school_year,
            )
        
        # Count enrolled classes
        enrolled_count = 0
        for student in family.students:
            enrolled_count += len(student.enrollments)
        
        # Apply payment status filter
        if payment_status and payment_info:
            if payment_info.payment_status != payment_status:
                continue
        
        family_items.append({
            "id": family.id,
            "family_name": family.family_name,
            "address": family.address,
            "city": family.city,
            "state": family.state,
            "zip_code": family.zip_code,
            "diocese_id": family.diocese_id,
            "guardians": family.guardians,
            "students": family.students,
            "emergency_contacts": family.emergency_contacts,
            "payment_status": payment_info,
            "enrolled_class_count": enrolled_count,
        })
    
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    
    return PaginatedFamilyWithPaymentResponse(
        items=family_items,
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
async def create_family(
    family_data: FamilyCreate,
    db: AsyncSession = Depends(get_db),
    user: UserInfo = Depends(require_admin),
):
    """Create a new family with optional guardians, students, and emergency contacts. (Admin only)"""
    
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
    family_id: UUID,
    family_data: FamilyUpdate,
    db: AsyncSession = Depends(get_db),
    user: UserInfo = Depends(require_admin),
):
    """Update a family's basic information. (Admin only)"""
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
async def delete_family(
    family_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: UserInfo = Depends(require_admin),
):
    """Delete a family and all related data. (Admin only)"""
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
    family_id: UUID,
    guardian_data: GuardianCreate,
    db: AsyncSession = Depends(get_db),
    user: UserInfo = Depends(require_admin),
):
    """Add a guardian to a family. (Admin only)"""
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
    user: UserInfo = Depends(require_admin),
):
    """Update a guardian. (Admin only)"""
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
    family_id: UUID,
    guardian_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: UserInfo = Depends(require_admin),
):
    """Delete a guardian. (Admin only)"""
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
    family_id: UUID,
    student_data: StudentCreate,
    db: AsyncSession = Depends(get_db),
    user: UserInfo = Depends(require_admin),
):
    """Add a student to a family. (Admin only)"""
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
    user: UserInfo = Depends(require_admin),
):
    """Update a student. (Admin only)"""
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
    family_id: UUID,
    student_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: UserInfo = Depends(require_admin),
):
    """Delete a student. (Admin only)"""
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
    user: UserInfo = Depends(require_admin),
):
    """Add an emergency contact to a family. (Admin only)"""
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
    user: UserInfo = Depends(require_admin),
):
    """Update an emergency contact. (Admin only)"""
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
    family_id: UUID,
    contact_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: UserInfo = Depends(require_admin),
):
    """Delete an emergency contact. (Admin only)"""
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
    """Get all academic years, sorted by start_year descending (newest first)."""
    from sqlalchemy import desc
    result = await db.execute(
        select(AcademicYear).order_by(desc(AcademicYear.start_year), desc(AcademicYear.id))
    )
    return result.scalars().all()


@academic_year_router.get("/current", response_model=AcademicYearResponse)
async def get_current_academic_year(db: AsyncSession = Depends(get_db)):
    """
    Get the current/newest academic year.
    Returns the year with highest start_year (newest).
    """
    from sqlalchemy import desc
    result = await db.execute(
        select(AcademicYear)
        .order_by(desc(AcademicYear.start_year), desc(AcademicYear.id))
        .limit(1)
    )
    year = result.scalar_one_or_none()
    
    if not year:
        raise HTTPException(status_code=404, detail="No school year configured")
    
    return year


# --- Family Payment History ---

@router.get("/{family_id}/payments", response_model=list[PaymentResponse])
async def get_family_payments(
    family_id: UUID, db: AsyncSession = Depends(get_db)
):
    """Get payment history for a family."""
    # Verify family exists
    family_result = await db.execute(select(Family).where(Family.id == family_id))
    if not family_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Family not found")
    
    result = await db.execute(
        select(Payment)
        .where(Payment.family_id == family_id)
        .order_by(Payment.school_year.desc())
    )
    return result.scalars().all()
