from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware  # <--- NEW IMPORT
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from database import get_db
from models import Program, Student, Enrollment # Import your models
from schemas import StudentCreate  # Import your Pydantic schemas

app = FastAPI()

# --- 1. SETUP CORS ---
# This allows your Next.js app (http://localhost:3000) to talk to this API
origins = [
    "http://localhost:3000",
    "http://localhost",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

@app.post("/students")
async def create_student(student: StudentCreate, db: AsyncSession = Depends(get_db)):
    new_student = Student(
        first_name=student.first_name,
        last_name=student.last_name,
        middle_name=student.middle_name,
        date_of_birth=student.date_of_birth,
        allergies=student.allergies,
        gender=student.gender
    )
    db.add(new_student)
    for c_id in student.class_ids:
        enrollment = Enrollment(
            student_id=new_student.id,
            class_id=c_id
        )
        db.add(enrollment)
    await db.commit()
    return {"status": "success", "student_id": new_student.id}