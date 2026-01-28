import os
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from database import get_db
from models import Program, Student, Enrollment, Family
from routers.families import router as families_router, academic_year_router
from routers.classes import router as classes_router, program_router
from routers.payments import router as payments_router
from routers.admin_enrollments import router as enrollments_router


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


@app.get("/")
def read_root():
    return {"message": "Sunday School API is running!"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

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