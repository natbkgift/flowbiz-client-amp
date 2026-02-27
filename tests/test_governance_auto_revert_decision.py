from scripts.governance.decide_auto_revert import decide_auto_revert


def test_allow_revert_for_attributed_migration_failure() -> None:
    result = decide_auto_revert(
        target_sha="abc123",
        current_head_sha="abc123",
        changed_files=["alembic/versions/0032_example.py"],
        failed_gates=["check_migrations.py"],
    )
    assert result["allow_revert"] is True
    assert result["reasons"] == []


def test_block_revert_for_stale_head() -> None:
    result = decide_auto_revert(
        target_sha="abc123",
        current_head_sha="def456",
        changed_files=["apps/api/routes/admin_home_composer.py"],
        failed_gates=["diff_openapi.py"],
    )
    assert result["allow_revert"] is False
    assert "stale_target_not_branch_head" in result["reasons"]


def test_block_revert_for_unattributed_contract_failure() -> None:
    result = decide_auto_revert(
        target_sha="abc123",
        current_head_sha="abc123",
        changed_files=["admin-app/app/home-composer/page.tsx"],
        failed_gates=["diff_openapi_baseline_ops_schema.py"],
    )
    assert result["allow_revert"] is False
    assert "unattributed_gate_failure" in result["reasons"]
    assert result["unattributed_failed_gates"] == ["diff_openapi_baseline_ops_schema.py"]
