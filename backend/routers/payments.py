"""
Payments Router - Admin payment tracking and management.

This router provides endpoints for:
- CRUD operations on payments
- Quick mark-as-paid functionality
- Payment summaries and reports
- CSV export

All write operations require admin privileges.
"""

from uuid import UUID
from datetime import datetime, date
from typing import Optional
from io import StringIO
import csv

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_
from sqlalchemy.orm import selectinload
import math

from database import get_db
from auth import require_admin, UserInfo
from models import Payment, Family, PaymentStatus, Student, Enrollment, Class, AcademicYear, Guardian
from schemas import (
    PaymentCreate,
    PaymentUpdate,
    PaymentResponse,
    PaymentWithFamily,
    PaginatedPaymentResponse,
    PaymentSummary,
    PaymentStatusEnum,
    EnrolledFamilyPayment,
    EnrolledFamiliesResponse,
    EnrolledFamiliesSummary,
    StudentWithEnrollmentStatus,
    EnrolledClassInfo,
)

router = APIRouter(prefix="/api/payments", tags=["payments"])


# --- Payment CRUD ---

@router.get("", response_model=PaginatedPaymentResponse)
async def get_payments(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    school_year: Optional[str] = Query(None, description="Legacy: Filter by school year string"),
    school_year_id: Optional[int] = Query(None, description="Filter by school year ID"),
    payment_status: Optional[PaymentStatusEnum] = Query(None),
    search: Optional[str] = Query(None),
    sort_by: Optional[str] = Query("created_at"),
    sort_order: Optional[str] = Query("desc"),
    db: AsyncSession = Depends(get_db),
):
    """Get all payments with pagination, filtering, and sorting."""
    
    # Base query with family info
    query = select(Payment).options(selectinload(Payment.family))
    
    # Apply filters - prefer school_year_id over legacy school_year string
    if school_year_id:
        query = query.where(Payment.school_year_id == school_year_id)
    elif school_year:
        query = query.where(Payment.school_year == school_year)
    
    if payment_status:
        query = query.where(Payment.payment_status == payment_status.value)
    
    if search:
        search_pattern = f"%{search}%"
        # Join with Family for searching by family name
        query = query.join(Family).where(
            Family.family_name.ilike(search_pattern)
        )
    
    # Apply sorting
    sort_column = getattr(Payment, sort_by, Payment.created_at)
    if sort_order == "desc":
        sort_column = sort_column.desc()
    query = query.order_by(sort_column)
    
    # Get total count
    count_query = select(func.count()).select_from(Payment)
    if school_year_id:
        count_query = count_query.where(Payment.school_year_id == school_year_id)
    elif school_year:
        count_query = count_query.where(Payment.school_year == school_year)
    if payment_status:
        count_query = count_query.where(Payment.payment_status == payment_status.value)
    if search:
        count_query = count_query.join(Family).where(
            Family.family_name.ilike(f"%{search}%")
        )
    
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    # Apply pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)
    
    result = await db.execute(query)
    payments = result.scalars().all()
    
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    
    # Transform to include family_name
    payment_items = []
    for payment in payments:
        payment_dict = {
            "id": payment.id,
            "family_id": payment.family_id,
            "school_year": payment.school_year,
            "amount_due": float(payment.amount_due) if payment.amount_due else None,
            "amount_paid": float(payment.amount_paid) if payment.amount_paid else 0,
            "payment_status": payment.payment_status,
            "payment_date": payment.payment_date,
            "payment_method": payment.payment_method,
            "notes": payment.notes,
            "created_at": payment.created_at,
            "updated_at": payment.updated_at,
            "family_name": payment.family.family_name if payment.family else None,
        }
        payment_items.append(payment_dict)
    
    return PaginatedPaymentResponse(
        items=payment_items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/summary", response_model=PaymentSummary)
async def get_payment_summary(
    school_year: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Get payment summary statistics for a school year."""
    
    base_query = select(Payment)
    if school_year:
        base_query = base_query.where(Payment.school_year == school_year)
    
    result = await db.execute(base_query)
    payments = result.scalars().all()
    
    # Also count families that don't have payments yet
    family_count_result = await db.execute(select(func.count()).select_from(Family))
    total_families = family_count_result.scalar() or 0
    
    paid_count = sum(1 for p in payments if p.payment_status == PaymentStatus.PAID.value)
    partial_count = sum(1 for p in payments if p.payment_status == PaymentStatus.PARTIAL.value)
    unpaid_count = total_families - paid_count - partial_count
    
    total_amount_due = sum(float(p.amount_due or 0) for p in payments)
    total_amount_paid = sum(float(p.amount_paid or 0) for p in payments)
    
    return PaymentSummary(
        total_families=total_families,
        paid_count=paid_count,
        partial_count=partial_count,
        unpaid_count=unpaid_count,
        total_amount_due=total_amount_due,
        total_amount_paid=total_amount_paid,
    )


# --- Enrolled Families (for payment tracking) ---

@router.get("/enrolled-families", response_model=EnrolledFamiliesResponse)
async def get_enrolled_families(
    academic_year_id: Optional[int] = Query(None, description="Filter by academic year ID"),
    db: AsyncSession = Depends(get_db),
):
    """
    Get all families that have students enrolled in classes for the current/newest school year.
    This endpoint is specifically for payment tracking - only shows families who need to pay.
    Returns family info, guardian names, student names, enrollment count, and payment status.
    """
    from sqlalchemy import desc
    
    # Determine which school year to use
    current_year = None
    current_year_id = academic_year_id
    
    if academic_year_id:
        # Use provided academic year ID
        year_result = await db.execute(
            select(AcademicYear).where(AcademicYear.id == academic_year_id)
        )
        current_year = year_result.scalar_one_or_none()
    else:
        # Get the newest school year
        year_result = await db.execute(
            select(AcademicYear)
            .order_by(desc(AcademicYear.start_year), desc(AcademicYear.id))
            .limit(1)
        )
        current_year = year_result.scalar_one_or_none()
        if current_year:
            current_year_id = current_year.id
    
    if not current_year:
        raise HTTPException(status_code=404, detail="No school year configured")
    
    current_year_name = current_year.name
    
    # Get all classes for current year
    classes_result = await db.execute(
        select(Class.id).where(Class.academic_year_id == current_year_id)
    )
    current_year_class_ids = [row[0] for row in classes_result.fetchall()]
    
    if not current_year_class_ids:
        return EnrolledFamiliesResponse(
            items=[],
            total=0,
            academic_year_id=current_year_id,
            academic_year_name=current_year_name,
        )
    
    # Get families with enrollments in current year classes
    # This query finds distinct families that have at least one student enrolled
    enrolled_families_query = (
        select(Family)
        .options(
            selectinload(Family.guardians),
            selectinload(Family.students).selectinload(Student.enrollments).selectinload(Enrollment.assigned_class),
            selectinload(Family.payments),
        )
        .join(Student, Student.family_id == Family.id)
        .join(Enrollment, Enrollment.student_id == Student.id)
        .where(Enrollment.class_id.in_(current_year_class_ids))
        .distinct()
    )
    
    result = await db.execute(enrolled_families_query)
    families = result.scalars().unique().all()
    
    # Build class cache with program names for quick lookup
    class_cache = {}
    classes_result = await db.execute(
        select(Class)
        .options(selectinload(Class.program))
        .where(Class.id.in_(current_year_class_ids))
    )
    for cls in classes_result.scalars().all():
        class_cache[cls.id] = {
            "id": cls.id,
            "name": cls.name,
            "program_name": cls.program.name if cls.program else None,
        }
    
    # Build response with payment info
    enrolled_family_items = []
    school_year = current_year_name
    
    for family in families:
        # Build enriched student data with enrollment status
        students_with_status = []
        enrolled_count = 0
        
        for student in family.students:
            # Find enrolled classes for this student in current year
            student_enrolled_classes = []
            for enrollment in student.enrollments if hasattr(student, 'enrollments') else []:
                if enrollment.class_id in current_year_class_ids:
                    class_info = class_cache.get(enrollment.class_id)
                    if class_info:
                        student_enrolled_classes.append(EnrolledClassInfo(
                            id=class_info["id"],
                            name=class_info["name"],
                            program_name=class_info["program_name"],
                        ))
            
            is_enrolled = len(student_enrolled_classes) > 0
            if is_enrolled:
                enrolled_count += 1
            
            students_with_status.append(StudentWithEnrollmentStatus(
                id=student.id,
                first_name=student.first_name,
                last_name=student.last_name,
                is_enrolled=is_enrolled,
                enrolled_classes=student_enrolled_classes,
            ))
        
        # Get payment info for this school year
        payment = next(
            (p for p in family.payments if p.school_year == school_year),
            None
        )
        
        enrolled_family_items.append(EnrolledFamilyPayment(
            id=family.id,
            family_name=family.family_name,
            guardians=[{"name": g.name} for g in family.guardians],
            students=students_with_status,
            enrolled_count=enrolled_count,
            payment_status=payment.payment_status if payment else "unpaid",
            amount_due=float(payment.amount_due) if payment and payment.amount_due else None,
            amount_paid=float(payment.amount_paid) if payment and payment.amount_paid else 0,
            payment_date=payment.payment_date if payment else None,
            payment_method=payment.payment_method if payment else None,
        ))
    
    # Sort by family name
    enrolled_family_items.sort(key=lambda f: f.family_name or "")
    
    return EnrolledFamiliesResponse(
        items=enrolled_family_items,
        total=len(enrolled_family_items),
        academic_year_id=current_year.id,
        academic_year_name=current_year.name,
    )


@router.get("/enrolled-families/summary", response_model=EnrolledFamiliesSummary)
async def get_enrolled_families_summary(
    db: AsyncSession = Depends(get_db),
):
    """Get summary statistics for enrolled families payment tracking."""
    from sqlalchemy import desc
    
    # Get the newest academic year
    year_result = await db.execute(
        select(AcademicYear)
        .order_by(desc(AcademicYear.start_year), desc(AcademicYear.id))
        .limit(1)
    )
    current_year = year_result.scalar_one_or_none()
    
    if not current_year:
        raise HTTPException(status_code=404, detail="No school year configured")
    
    # Get enrolled families data
    enrolled_data = await get_enrolled_families(db=db)
    
    # Calculate summary
    paid_count = sum(1 for f in enrolled_data.items if f.payment_status == "paid")
    partial_count = sum(1 for f in enrolled_data.items if f.payment_status == "partial")
    unpaid_count = sum(1 for f in enrolled_data.items if f.payment_status == "unpaid")
    total_amount_due = sum(f.amount_due or 0 for f in enrolled_data.items)
    total_amount_paid = sum(f.amount_paid or 0 for f in enrolled_data.items)
    
    return EnrolledFamiliesSummary(
        total_enrolled_families=enrolled_data.total,
        paid_count=paid_count,
        partial_count=partial_count,
        unpaid_count=unpaid_count,
        total_amount_due=total_amount_due,
        total_amount_paid=total_amount_paid,
        academic_year_name=current_year.name,
    )


@router.post("", response_model=PaymentResponse, status_code=201)
async def create_payment(
    payment_data: PaymentCreate,
    db: AsyncSession = Depends(get_db),
    user: UserInfo = Depends(require_admin),
):
    """Create a new payment record. (Admin only)"""
    
    # Verify family exists
    family_result = await db.execute(
        select(Family).where(Family.id == payment_data.family_id)
    )
    family = family_result.scalar_one_or_none()
    if not family:
        raise HTTPException(status_code=404, detail="Family not found")
    
    # Calculate payment status
    amount_due = payment_data.amount_due or 0
    amount_paid = payment_data.amount_paid or 0
    
    if amount_paid >= amount_due and amount_due > 0:
        status = PaymentStatus.PAID.value
    elif amount_paid > 0:
        status = PaymentStatus.PARTIAL.value
    else:
        status = PaymentStatus.UNPAID.value
    
    payment = Payment(
        family_id=payment_data.family_id,
        school_year=payment_data.school_year,
        amount_due=amount_due,
        amount_paid=amount_paid,
        payment_status=status,
        payment_date=payment_data.payment_date,
        payment_method=payment_data.payment_method,
        notes=payment_data.notes,
    )
    
    db.add(payment)
    await db.commit()
    await db.refresh(payment)
    
    return payment


@router.get("/{payment_id}", response_model=PaymentResponse)
async def get_payment(
    payment_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get a specific payment by ID."""
    result = await db.execute(
        select(Payment).where(Payment.id == payment_id)
    )
    payment = result.scalar_one_or_none()
    
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    return payment


@router.put("/{payment_id}", response_model=PaymentResponse)
async def update_payment(
    payment_id: UUID,
    payment_data: PaymentUpdate,
    db: AsyncSession = Depends(get_db),
    user: UserInfo = Depends(require_admin),
):
    """Update an existing payment. (Admin only)"""
    result = await db.execute(
        select(Payment).where(Payment.id == payment_id)
    )
    payment = result.scalar_one_or_none()
    
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    update_data = payment_data.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(payment, field, value)
    
    # Recalculate status if amounts changed
    if "amount_paid" in update_data or "amount_due" in update_data:
        amount_due = payment.amount_due or 0
        amount_paid = payment.amount_paid or 0
        
        if amount_paid >= amount_due and amount_due > 0:
            payment.payment_status = PaymentStatus.PAID.value
        elif amount_paid > 0:
            payment.payment_status = PaymentStatus.PARTIAL.value
        else:
            payment.payment_status = PaymentStatus.UNPAID.value
    
    await db.commit()
    await db.refresh(payment)
    
    return payment


@router.delete("/{payment_id}", status_code=204)
async def delete_payment(
    payment_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: UserInfo = Depends(require_admin),
):
    """Delete a payment record. (Admin only)"""
    result = await db.execute(
        select(Payment).where(Payment.id == payment_id)
    )
    payment = result.scalar_one_or_none()
    
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    await db.delete(payment)
    await db.commit()
    return None


@router.post("/mark-paid/{family_id}", response_model=PaymentResponse)
async def mark_family_as_paid(
    family_id: UUID,
    school_year: str = Query(...),
    amount: Optional[float] = Query(None),
    payment_method: Optional[str] = Query("cash"),
    notes: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    user: UserInfo = Depends(require_admin),
):
    """Quick action to mark a family as paid for a school year. (Admin only)"""
    
    # Verify family exists
    family_result = await db.execute(
        select(Family).where(Family.id == family_id)
    )
    family = family_result.scalar_one_or_none()
    if not family:
        raise HTTPException(status_code=404, detail="Family not found")
    
    # Check if payment record already exists
    existing_result = await db.execute(
        select(Payment).where(
            and_(Payment.family_id == family_id, Payment.school_year == school_year)
        )
    )
    existing_payment = existing_result.scalar_one_or_none()
    
    if existing_payment:
        # Update existing payment
        existing_payment.payment_status = PaymentStatus.PAID.value
        existing_payment.payment_date = date.today()
        existing_payment.payment_method = payment_method
        if amount:
            existing_payment.amount_paid = amount
            existing_payment.amount_due = amount
        else:
            existing_payment.amount_paid = existing_payment.amount_due or 0
        if notes:
            existing_payment.notes = notes
        
        await db.commit()
        await db.refresh(existing_payment)
        return existing_payment
    else:
        # Create new payment record
        payment = Payment(
            family_id=family_id,
            school_year=school_year,
            amount_due=amount or 0,
            amount_paid=amount or 0,
            payment_status=PaymentStatus.PAID.value,
            payment_date=date.today(),
            payment_method=payment_method,
            notes=notes,
        )
        db.add(payment)
        await db.commit()
        await db.refresh(payment)
        return payment


# --- Export ---

@router.get("/export/csv")
async def export_payments_csv(
    school_year: Optional[str] = Query(None),
    payment_status: Optional[PaymentStatusEnum] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Export payments to CSV."""
    
    query = select(Payment).options(selectinload(Payment.family))
    
    if school_year:
        query = query.where(Payment.school_year == school_year)
    
    if payment_status:
        query = query.where(Payment.payment_status == payment_status.value)
    
    query = query.order_by(Payment.school_year.desc(), Payment.created_at.desc())
    
    result = await db.execute(query)
    payments = result.scalars().all()
    
    # Create CSV
    output = StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow([
        "Family Name",
        "School Year",
        "Amount Due",
        "Amount Paid",
        "Status",
        "Payment Date",
        "Payment Method",
        "Notes",
    ])
    
    # Data rows
    for payment in payments:
        writer.writerow([
            payment.family.family_name if payment.family else "Unknown",
            payment.school_year,
            float(payment.amount_due) if payment.amount_due else "",
            float(payment.amount_paid) if payment.amount_paid else 0,
            payment.payment_status,
            payment.payment_date.isoformat() if payment.payment_date else "",
            payment.payment_method or "",
            payment.notes or "",
        ])
    
    output.seek(0)
    
    filename = f"payments_{school_year or 'all'}_{datetime.now().strftime('%Y%m%d')}.csv"
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
