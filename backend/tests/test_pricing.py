from utils.pricing import calculate_base_tuition


def test_calculate_base_tuition_standard_tiers():
    assert calculate_base_tuition(0) == 0.0
    assert calculate_base_tuition(1) == 125.0
    assert calculate_base_tuition(2) == 250.0
    assert calculate_base_tuition(3) == 315.0
    assert calculate_base_tuition(4) == 375.0


def test_calculate_base_tuition_external_diocese_nx_multiplier():
    assert calculate_base_tuition(1, "nx001") == 225.0
    assert calculate_base_tuition(2, "ABC-NX-22") == 450.0
    assert calculate_base_tuition(3, "  xnx  ") == 675.0


def test_calculate_base_tuition_tntt_only_students():
    assert calculate_base_tuition(1, None, tntt_only_count=1) == 50.0
    assert calculate_base_tuition(3, "nx001", tntt_only_count=3) == 150.0


def test_calculate_base_tuition_mixed_tntt_only_and_standard_students():
    # 1 TNTT-only student ($50) + 1 non-TNTT student (standard tier 1 = $125)
    assert calculate_base_tuition(2, None, tntt_only_count=1) == 175.0
    # 1 TNTT-only student ($50) + 2 non-TNTT students (external diocese: 2 * $225)
    assert calculate_base_tuition(3, "nx001", tntt_only_count=1) == 500.0
