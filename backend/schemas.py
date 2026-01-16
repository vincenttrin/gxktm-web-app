from pydantic import BaseModel
from datetime import date
from typing import Optional, List
from uuid import UUID

class StudentCreate(BaseModel):
    first_name: str
    middle_name: Optional[str] = None
    last_name: str
    date_of_birth: date
    allergies: Optional[str] = None
    gender: Optional[str] = None
    class_ids: List[UUID] = []