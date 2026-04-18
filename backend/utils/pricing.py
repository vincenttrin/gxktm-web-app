from typing import Optional

def calculate_base_tuition(
    enrolled_count: int,
    diocese_id: Optional[str] = None,
    tntt_only_count: int = 0,
) -> float:
    if enrolled_count <= 0:
        return 0.0

    normalized_tntt_only_count = max(tntt_only_count, 0)
    non_tntt_only_count = max(enrolled_count - normalized_tntt_only_count, 0)
    total = float(normalized_tntt_only_count * 50)

    if non_tntt_only_count <= 0:
        return total

    normalized_diocese_id = (diocese_id or "").strip().lower()
    if "nx" in normalized_diocese_id:
        return total + float(non_tntt_only_count * 225)

    tuition_schedule = {1: 125.0, 2: 250.0, 3: 315.0}
    return total + float(tuition_schedule.get(non_tntt_only_count, 375.0))
