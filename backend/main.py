import os
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from database import get_db
from models import Program, Student, Enrollment, Family
from auth import get_current_user, require_admin, UserInfo
from routers.families import router as families_router, academic_year_router
from routers.classes import router as classes_router, program_router
from routers.payments import router as payments_router
from routers.admin_enrollments import router as enrollments_router
from routers.enrollment_portal import router as enrollment_portal_router
from routers.school_years import router as school_years_router
from routers.admin_users import router as admin_users_router


app = FastAPI(title="Sunday School Admin API", version="1.0.0")

# --- 1. SETUP CORS ---
# This allows your Next.js app (http://localhost:3000) to talk to this API
raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
origins = [origin.strip() for origin in raw_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Include Routers ---
app.include_router(families_router)
app.include_router(academic_year_router)
app.include_router(classes_router)
app.include_router(program_router)
app.include_router(payments_router)
app.include_router(enrollments_router)
app.include_router(enrollment_portal_router)
app.include_router(school_years_router)
app.include_router(admin_users_router)


@app.get("/")
def read_root():
    return {"message": "Sunday School API is running!"}

@app.get("/health")
def health_check():
    return {"status": "ok"}


# --- Auth Endpoints ---

@app.get("/api/auth/me", tags=["auth"])
async def get_current_user_info(user: UserInfo = Depends(get_current_user)):
    """
    Get the current authenticated user's information.
    
    Returns user ID, email, and role.
    Requires a valid Supabase JWT token.
    """
    return {
        "id": user.id,
        "email": user.email,
        "role": user.role,
        "is_admin": user.is_admin,
    }


@app.get("/api/auth/admin-check", tags=["auth"])
async def check_admin_status(user: UserInfo = Depends(require_admin)):
    """
    Verify that the current user has admin privileges.
    
    Returns 403 if user is not an admin.
    Useful for validating admin access from the frontend.
    """
    return {
        "id": user.id,
        "email": user.email,
        "role": user.role,
        "is_admin": True,
    }