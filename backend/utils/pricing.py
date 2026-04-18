from typing import Optional

def calculate_base_tuition(enrolled_count: int, diocese_id: Optional[str] = None) -> float:
    if enrolled_count <= 0:
        return 0.0

    tuition_schedule = {1: 125.0, 2: 250.0, 3: 315.0}
    return tuition_schedule.get(enrolled_count, 375.0)
