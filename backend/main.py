import os
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from database import get_db
from models import Program, Student, Enrollment, Family
from routers.families import router as families_router, academic_year_router


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


@app.get("/")
def read_root():
    return {"message": "Sunday School API is running!"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

# --- 2. NEW ENDPOINT: Get All Programs & Classes ---
@app.get("/programs")
async def get_programs(db: AsyncSession = Depends(get_db)):
    # specific query that "eager loads" the classes for each program
    # This prevents the "N+1" query problem
    result = await db.execute(
        select(Program).options(selectinload(Program.classes))
    )
    programs = result.scalars().all()
    return programs

@app.get("/families")
async def get_families(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Family).options(
            selectinload(Family.guardians),
            selectinload(Family.students)
        )
    )
    families = result.scalars().all()
    return families

# @app.post("/students")
# async def create_student(student: StudentCreate, db: AsyncSession = Depends(get_db)):
#     new_student = Student(
#         first_name=student.first_name,
#         last_name=student.last_name,
#         middle_name=student.middle_name,
#         date_of_birth=student.date_of_birth,
#         allergies=student.allergies,
#         gender=student.gender
#     )
#     db.add(new_student)
#     await db.flush()  # Ensure new_student.id is populated
#     print(f"Creating student with ID: {new_student.id}")
#     for c_id in student.class_ids:
#         enrollment = Enrollment(
#             student_id=new_student.id,
#             class_id=c_id
#         )
#         db.add(enrollment)
#     await db.commit()
#     return {"status": "success", "student_id": new_student.id}