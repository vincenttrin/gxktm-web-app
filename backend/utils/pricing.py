from typing import Optional

from schemas import StudentWithEnrollmentStatus


def normalize_program_name(program_name: Optional[str]) -> str:
    return program_name.lower().strip() if program_name else ""


def is_giao_ly_program(program_name: Optional[str]) -> bool:
    normalized = normalize_program_name(program_name)
    return "giao ly" in normalized or "giáo lý" in normalized


def is_viet_ngu_program(program_name: Optional[str]) -> bool:
    normalized = normalize_program_name(program_name)
    return "viet ngu" in normalized or "việt ngữ" in normalized


def is_tntt_program(program_name: Optional[str]) -> bool:
    return "tntt" in normalize_program_name(program_name)


def calculate_base_tuition(enrolled_count: int, diocese_id: Optional[str]) -> float:
    if enrolled_count <= 0:
        return 0.0

    if diocese_id and "nx" in diocese_id.lower():
        return enrolled_count * 225.0

    tuition_schedule = {1: 125.0, 2: 250.0, 3: 315.0}
    return tuition_schedule.get(enrolled_count, 375.0)


def calculate_tntt_surcharge(students: list[StudentWithEnrollmentStatus]) -> float:
    surcharge_total = 0.0

    for student in students:
        has_tntt = False
        has_giao_ly = False
        has_viet_ngu = False

        for enrolled_class in student.enrolled_classes:
            program_name = enrolled_class.program_name
            has_tntt = has_tntt or is_tntt_program(program_name)
            has_giao_ly = has_giao_ly or is_giao_ly_program(program_name)
            has_viet_ngu = has_viet_ngu or is_viet_ngu_program(program_name)

        if has_tntt:
            surcharge_total += 30.0 if (has_giao_ly and has_viet_ngu) else 50.0

    return surcharge_total

