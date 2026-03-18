from __future__ import annotations

import json
from pathlib import Path


def test_platform_deploy_history_normalizes_run_dir_env(client, monkeypatch, tmp_path: Path) -> None:
    history_dir = tmp_path / "deploy-history"
    older_run = history_dir / "run-20260318T001000Z-abc12345"
    newer_run = history_dir / "run-20260318T002000Z-def67890"
    older_run.mkdir(parents=True)
    newer_run.mkdir(parents=True)

    (older_run / "telemetry.json").write_text(
        json.dumps({"target_sha": "abc12345", "build_sha": "abc1234"}),
        encoding="utf-8",
    )
    (newer_run / "telemetry.json").write_text(
        json.dumps({"target_sha": "def67890", "build_sha": "def6789"}),
        encoding="utf-8",
    )

    monkeypatch.setenv("FLOWBIZ_DEPLOY_HISTORY_DIR", str(newer_run))

    response = client.get("/platform/deploy-history", params={"limit": 5})
    assert response.status_code == 200

    payload = response.json()
    assert payload["ok"] is True
    assert payload["count"] == 2
    assert payload["history_dir"] == str(history_dir)
    assert payload["items"][0]["target_sha"] == "def67890"
    assert payload["items"][1]["target_sha"] == "abc12345"