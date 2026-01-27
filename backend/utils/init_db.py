import asyncio
from database import engine, Base
# Import all models to make sure they are registered with Base.metadata
from models import AcademicYear, Family, Guardian, EmergencyContact, Program, Class, Student, Enrollment

async def init_db():
    async with engine.begin() as conn:
        # Uncomment the line below if you want to DROP all tables and start fresh (WARNING: DATA LOSS)
        # await conn.run_sync(Base.metadata.drop_all)
        
        # Create all tables defined in the models
        await conn.run_sync(Base.metadata.create_all)
    
    print("✅ Database tables created successfully!")

if __name__ == "__main__":
    print("Initializing database...")
    asyncio.run(init_db())
