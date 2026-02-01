"""
School Years Router - Manages academic year lifecycle.

This router provides endpoints for:
- CRUD operations on school years
- Getting the active and newest school years
- Transitioning between school years
- School year statistics
"""

from datetime import date, datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from sqlalchemy.orm import selectinload

from database import get_db
from models import AcademicYear, Class, Enrollment
from schemas import (
    AcademicYearCreate,
    AcademicYearUpdate,
    AcademicYearResponse,
    SchoolYearWithStats,
    SchoolYearTransitionRequest,
    SchoolYearTransitionResponse,
)

router = APIRouter(prefix="/api/school-years", tags=["school-years"])


# --- Helper Functions ---

def compute_school_year_status(year: AcademicYear) -> str:
    """
    Compute the status of a school year based on its properties and current date.
    Returns: 'active', 'upcoming', or 'archived'
    """
    if year.is_active:
        return "active"
    
    today = date.today()
    
    # If transition_date is in the future, it's upcoming
    if year.transition_date and year.transition_date > today:
        return "upcoming"
    
    # If this year's end_year is less than current calendar year, it's archived
    if year.end_year and year.end_year < today.year:
        return "archived"
    
    # If start_year is greater than current year, it's upcoming
    if year.start_year and year.start_year > today.year:
        return "upcoming"
    
    # Default to upcoming if not active
    return "upcoming"


def parse_year_label(name: str) -> tuple[int, int]:
    """
    Parse a year label like "2025-2026" into (start_year, end_year).
    Returns (0, 0) if parsing fails.
    """
    try:
        parts = name.split("-")
        if len(parts) == 2:
            return int(parts[0]), int(parts[1])
    except (ValueError, IndexError):
        pass
    return 0, 0


async def get_enrollment_count_for_year(db: AsyncSession, year_id: int) -> int:
    """Get the total number of enrollments for a school year."""
    result = await db.execute(
        select(func.count(Enrollment.id))
        .join(Class, Enrollment.class_id == Class.id)
        .where(Class.academic_year_id == year_id)
    )
    return result.scalar() or 0


async def get_class_count_for_year(db: AsyncSession, year_id: int) -> int:
    """Get the total number of classes for a school year."""
    result = await db.execute(
        select(func.count(Class.id))
        .where(Class.academic_year_id == year_id)
    )
    return result.scalar() or 0


# --- School Year Endpoints ---

@router.get("", response_model=List[SchoolYearWithStats])
async def get_school_years(
    include_archived: bool = Query(False, description="Include archived years"),
    db: AsyncSession = Depends(get_db),
):
    """
    Get all school years with statistics.
    By default, excludes archived years unless include_archived=True.
    Returns years sorted by start_year descending (newest first).
    """
    query = select(AcademicYear).order_by(desc(AcademicYear.start_year), desc(AcademicYear.id))
    
    result = await db.execute(query)
    years = result.scalars().all()
    
    years_with_stats = []
    for year in years:
        status = compute_school_year_status(year)
        
        # Skip archived years if not requested
        if status == "archived" and not include_archived:
            continue
        
        class_count = await get_class_count_for_year(db, year.id)
        enrolled_count = await get_enrollment_count_for_year(db, year.id)
        
        years_with_stats.append(SchoolYearWithStats(
            id=year.id,
            name=year.name,
            is_current=year.is_current,
            start_year=year.start_year,
            end_year=year.end_year,
            is_active=year.is_active,
            enrollment_open=year.enrollment_open,
            transition_date=year.transition_date,
            created_at=year.created_at,
            status=status,
            class_count=class_count,
            enrolled_students_count=enrolled_count,
        ))
    
    return years_with_stats


@router.get("/newest", response_model=AcademicYearResponse)
async def get_newest_school_year(
    db: AsyncSession = Depends(get_db),
):
    """
    Get the newest school year (highest start_year).
    This is the year that should be used for:
    - Parent enrollment portal (enrolling students)
    - Admin dashboard default view
    """
    result = await db.execute(
        select(AcademicYear)
        .order_by(desc(AcademicYear.start_year), desc(AcademicYear.id))
        .limit(1)
    )
    year = result.scalar_one_or_none()
    
    if not year:
        raise HTTPException(
            status_code=404,
            detail="No school years configured. Please create a school year first."
        )
    
    status = compute_school_year_status(year)
    enrolled_count = await get_enrollment_count_for_year(db, year.id)
    
    return AcademicYearResponse(
        id=year.id,
        name=year.name,
        is_current=year.is_current,
        start_year=year.start_year,
        end_year=year.end_year,
        is_active=year.is_active,
        enrollment_open=year.enrollment_open,
        transition_date=year.transition_date,
        created_at=year.created_at,
        status=status,
        enrolled_students_count=enrolled_count,
    )


@router.get("/active", response_model=AcademicYearResponse)
async def get_active_school_year(
    db: AsyncSession = Depends(get_db),
):
    """
    Get the currently active school year (is_active=True).
    This is the year where classes are currently running.
    Falls back to newest year if no year is explicitly marked active.
    """
    # First, try to find explicitly active year
    result = await db.execute(
        select(AcademicYear)
        .where(AcademicYear.is_active == True)
        .limit(1)
    )
    year = result.scalar_one_or_none()
    
    # Fallback to newest year if no active year found
    if not year:
        result = await db.execute(
            select(AcademicYear)
            .order_by(desc(AcademicYear.start_year), desc(AcademicYear.id))
            .limit(1)
        )
        year = result.scalar_one_or_none()
    
    if not year:
        raise HTTPException(
            status_code=404,
            detail="No school years configured. Please create a school year first."
        )
    
    status = compute_school_year_status(year)
    enrolled_count = await get_enrollment_count_for_year(db, year.id)
    
    return AcademicYearResponse(
        id=year.id,
        name=year.name,
        is_current=year.is_current,
        start_year=year.start_year,
        end_year=year.end_year,
        is_active=year.is_active,
        enrollment_open=year.enrollment_open,
        transition_date=year.transition_date,
        created_at=year.created_at,
        status=status,
        enrolled_students_count=enrolled_count,
    )


@router.get("/{year_id}", response_model=SchoolYearWithStats)
async def get_school_year(
    year_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Get a specific school year by ID with statistics."""
    result = await db.execute(
        select(AcademicYear).where(AcademicYear.id == year_id)
    )
    year = result.scalar_one_or_none()
    
    if not year:
        raise HTTPException(status_code=404, detail="School year not found")
    
    status = compute_school_year_status(year)
    class_count = await get_class_count_for_year(db, year.id)
    enrolled_count = await get_enrollment_count_for_year(db, year.id)
    
    return SchoolYearWithStats(
        id=year.id,
        name=year.name,
        is_current=year.is_current,
        start_year=year.start_year,
        end_year=year.end_year,
        is_active=year.is_active,
        enrollment_open=year.enrollment_open,
        transition_date=year.transition_date,
        created_at=year.created_at,
        status=status,
        class_count=class_count,
        enrolled_students_count=enrolled_count,
    )


@router.post("", response_model=AcademicYearResponse, status_code=201)
async def create_school_year(
    year_data: AcademicYearCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new school year.
    
    If start_year and end_year are not provided, they will be parsed from the name.
    If transition_date is not provided, defaults to July 1st of the start year.
    """
    # Parse years from name if not provided
    start_year = year_data.start_year
    end_year = year_data.end_year
    
    if not start_year or not end_year:
        parsed_start, parsed_end = parse_year_label(year_data.name)
        start_year = start_year or parsed_start
        end_year = end_year or parsed_end
    
    # Default transition date to July 1st of start year
    transition_date = year_data.transition_date
    if not transition_date and start_year:
        transition_date = date(start_year, 7, 1)
    
    # Check for duplicate year name
    existing = await db.execute(
        select(AcademicYear).where(AcademicYear.name == year_data.name)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=400,
            detail=f"School year '{year_data.name}' already exists"
        )
    
    # If this is set as active, deactivate other years
    if year_data.is_active:
        await db.execute(
            select(AcademicYear).where(AcademicYear.is_active == True)
        )
        active_years_result = await db.execute(
            select(AcademicYear).where(AcademicYear.is_active == True)
        )
        for active_year in active_years_result.scalars():
            active_year.is_active = False
    
    new_year = AcademicYear(
        name=year_data.name,
        start_year=start_year,
        end_year=end_year,
        is_current=year_data.is_current,
        is_active=year_data.is_active,
        enrollment_open=year_data.enrollment_open,
        transition_date=transition_date,
        created_at=datetime.utcnow(),
    )
    
    db.add(new_year)
    await db.commit()
    await db.refresh(new_year)
    
    status = compute_school_year_status(new_year)
    
    return AcademicYearResponse(
        id=new_year.id,
        name=new_year.name,
        is_current=new_year.is_current,
        start_year=new_year.start_year,
        end_year=new_year.end_year,
        is_active=new_year.is_active,
        enrollment_open=new_year.enrollment_open,
        transition_date=new_year.transition_date,
        created_at=new_year.created_at,
        status=status,
    )


@router.put("/{year_id}", response_model=AcademicYearResponse)
async def update_school_year(
    year_id: int,
    year_data: AcademicYearUpdate,
    db: AsyncSession = Depends(get_db),
):
    """
    Update a school year.
    
    Note: Setting is_active=True will automatically deactivate other years.
    """
    result = await db.execute(
        select(AcademicYear).where(AcademicYear.id == year_id)
    )
    year = result.scalar_one_or_none()
    
    if not year:
        raise HTTPException(status_code=404, detail="School year not found")
    
    update_data = year_data.model_dump(exclude_unset=True)
    
    # If setting as active, deactivate other years
    if update_data.get("is_active") == True:
        active_years_result = await db.execute(
            select(AcademicYear).where(
                AcademicYear.is_active == True,
                AcademicYear.id != year_id
            )
        )
        for active_year in active_years_result.scalars():
            active_year.is_active = False
    
    # Update the year
    for field, value in update_data.items():
        setattr(year, field, value)
    
    # Keep is_current in sync with is_active for backward compatibility
    if "is_active" in update_data:
        year.is_current = update_data["is_active"]
    
    await db.commit()
    await db.refresh(year)
    
    status = compute_school_year_status(year)
    enrolled_count = await get_enrollment_count_for_year(db, year.id)
    
    return AcademicYearResponse(
        id=year.id,
        name=year.name,
        is_current=year.is_current,
        start_year=year.start_year,
        end_year=year.end_year,
        is_active=year.is_active,
        enrollment_open=year.enrollment_open,
        transition_date=year.transition_date,
        created_at=year.created_at,
        status=status,
        enrolled_students_count=enrolled_count,
    )


@router.post("/transition", response_model=SchoolYearTransitionResponse)
async def transition_school_year(
    request: SchoolYearTransitionRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Transition to a new active school year.
    
    This will:
    1. Set the previous active year as inactive (archived)
    2. Set the new year as active
    3. Keep is_current in sync for backward compatibility
    """
    # Get the new year
    result = await db.execute(
        select(AcademicYear).where(AcademicYear.id == request.new_active_year_id)
    )
    new_year = result.scalar_one_or_none()
    
    if not new_year:
        raise HTTPException(status_code=404, detail="Target school year not found")
    
    # Get current active year
    active_result = await db.execute(
        select(AcademicYear).where(AcademicYear.is_active == True)
    )
    old_active_year = active_result.scalar_one_or_none()
    previous_active_id = old_active_year.id if old_active_year else None
    
    # Deactivate old year
    if old_active_year and old_active_year.id != new_year.id:
        old_active_year.is_active = False
        old_active_year.is_current = False
    
    # Activate new year
    new_year.is_active = True
    new_year.is_current = True
    
    await db.commit()
    
    return SchoolYearTransitionResponse(
        success=True,
        message=f"Successfully transitioned to {new_year.name}",
        previous_active_year_id=previous_active_id,
        new_active_year_id=new_year.id,
    )


@router.delete("/{year_id}", status_code=204)
async def delete_school_year(
    year_id: int,
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a school year.
    
    Warning: This will fail if there are classes associated with this year.
    """
    result = await db.execute(
        select(AcademicYear).where(AcademicYear.id == year_id)
    )
    year = result.scalar_one_or_none()
    
    if not year:
        raise HTTPException(status_code=404, detail="School year not found")
    
    # Check for associated classes
    class_count = await get_class_count_for_year(db, year_id)
    if class_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete school year with {class_count} associated classes. Remove classes first."
        )
    
    await db.delete(year)
    await db.commit()


@router.post("/check-auto-create")
async def check_and_create_new_year(
    db: AsyncSession = Depends(get_db),
):
    """
    Check if a new school year should be created automatically.
    
    Logic:
    - In January (or configurable month), check if next year exists
    - If not, suggest creating it
    
    This endpoint can be called manually or by a scheduled job.
    Returns information about whether a new year should be created.
    """
    today = date.today()
    current_month = today.month
    current_calendar_year = today.year
    
    # Only suggest new year creation in January-February
    if current_month not in [1, 2]:
        return {
            "should_create": False,
            "reason": "New year creation is only suggested in January-February",
            "current_month": current_month,
        }
    
    # Check if next academic year exists
    # In January 2026, we'd want to ensure 2026-2027 exists
    next_year_label = f"{current_calendar_year}-{current_calendar_year + 1}"
    
    result = await db.execute(
        select(AcademicYear).where(AcademicYear.name == next_year_label)
    )
    existing = result.scalar_one_or_none()
    
    if existing:
        return {
            "should_create": False,
            "reason": f"School year {next_year_label} already exists",
            "existing_year_id": existing.id,
        }
    
    return {
        "should_create": True,
        "suggested_name": next_year_label,
        "suggested_start_year": current_calendar_year,
        "suggested_end_year": current_calendar_year + 1,
        "suggested_transition_date": f"{current_calendar_year}-07-01",
        "reason": f"School year {next_year_label} does not exist and should be created",
    }


@router.post("/check-transition")
async def check_transition_needed(
    db: AsyncSession = Depends(get_db),
):
    """
    Check if a school year transition should occur.
    
    Logic:
    - Find the newest year that is not active
    - Check if today >= transition_date
    - If yes, suggest transitioning
    
    This endpoint can be called manually or by a scheduled job.
    """
    today = date.today()
    
    # Get newest non-active year with a transition date
    result = await db.execute(
        select(AcademicYear)
        .where(
            AcademicYear.is_active == False,
            AcademicYear.transition_date != None
        )
        .order_by(desc(AcademicYear.start_year))
        .limit(1)
    )
    upcoming_year = result.scalar_one_or_none()
    
    if not upcoming_year:
        return {
            "should_transition": False,
            "reason": "No upcoming school year found with a transition date",
        }
    
    if upcoming_year.transition_date and today >= upcoming_year.transition_date:
        return {
            "should_transition": True,
            "year_id": upcoming_year.id,
            "year_name": upcoming_year.name,
            "transition_date": upcoming_year.transition_date.isoformat(),
            "reason": f"Transition date ({upcoming_year.transition_date}) has passed",
        }
    
    return {
        "should_transition": False,
        "upcoming_year_id": upcoming_year.id,
        "upcoming_year_name": upcoming_year.name,
        "transition_date": upcoming_year.transition_date.isoformat() if upcoming_year.transition_date else None,
        "days_until_transition": (upcoming_year.transition_date - today).days if upcoming_year.transition_date else None,
        "reason": "Transition date has not yet passed",
    }
