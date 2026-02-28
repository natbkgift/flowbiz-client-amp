from __future__ import annotations

import pytest

from packages.core.crm_follow_up import normalize_follow_up_status


def test_normalize_follow_up_status_accepts_canonical_values():
    assert normalize_follow_up_status("pending") == "pending"
    assert normalize_follow_up_status("Scheduled") == "scheduled"
    assert normalize_follow_up_status("no-response") == "no_response"


def test_normalize_follow_up_status_rejects_unknown():
    with pytest.raises(ValueError):
        normalize_follow_up_status("later")
