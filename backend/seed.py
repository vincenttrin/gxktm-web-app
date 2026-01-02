import asyncio
from sqlalchemy import select
from database import SessionLocal
from models import AcademicYear, Program, Class

# --- DATA CONFIGURATION ---

# 1. The Academic Year
CURRENT_YEAR = "2025-2026"

# 2. The Programs and their Classes (Divisions)
SEED_DATA = [
    {
        "name": "TNTT (VEYM)",
        "classes": ["Au Nhi Cap 1", "Au Nhi Cap 2", "Au Nhi Cap 3", "Thieu Nhi Cap 1", "Thieu Nhi Cap 2", "Thieu Nhi Cap 3", "Nghia Si Cap 1", "Nghia Si Cap 2", "Nghia Si Cap 3", "Hiep Si Cap 1", "Hiep Si Cap 2"]
    },
    {
        "name": "Viet Ngu",
        "classes": ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9"]
    },
    {
        "name": "Giao Ly",
        "classes": ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9"]
    }
]

async def seed_database():
    print("🌱 Starting Database Seed...")
    
    async with SessionLocal() as db:
        
        # --- STEP 1: Create Academic Year ---
        # Check if it exists first
        result = await db.execute(select(AcademicYear).where(AcademicYear.name == CURRENT_YEAR))
        year = result.scalars().first()
        
        if not year:
            print(f"   Creating Year: {CURRENT_YEAR}")
            year = AcademicYear(name=CURRENT_YEAR, is_current=True)
            db.add(year)
            await db.commit()
            await db.refresh(year)
        else:
            print(f"   Year {CURRENT_YEAR} already exists.")

        # --- STEP 2: Create Programs & Classes ---
        for program_data in SEED_DATA:
            # Check if Program exists
            result = await db.execute(select(Program).where(Program.name == program_data["name"]))
            program = result.scalars().first()
            
            if not program:
                print(f"   Creating Program: {program_data['name']}")
                program = Program(name=program_data["name"])
                db.add(program)
                await db.commit()
                await db.refresh(program)
            else:
                print(f"   Program {program_data['name']} already exists.")

            # Check and Create Classes for this Program
            for class_name in program_data["classes"]:
                # Check if class exists in this program and year
                # Note: We link classes to the Year so we know "Au Nhi" belongs to 2025-2026
                result = await db.execute(
                    select(Class).where(
                        Class.name == class_name,
                        Class.program_id == program.id,
                        Class.academic_year_id == year.id
                    )
                )
                existing_class = result.scalars().first()
                
                if not existing_class:
                    print(f"      + Adding Class: {class_name}")
                    new_class = Class(
                        name=class_name, 
                        program_id=program.id, 
                        academic_year_id=year.id
                    )
                    db.add(new_class)
                else:
                    print(f"      . Class {class_name} exists.")
            
            await db.commit() # Commit all classes for this program

    print("✅ Seeding Complete!")

if __name__ == "__main__":
    # Run the async function
    asyncio.run(seed_database())