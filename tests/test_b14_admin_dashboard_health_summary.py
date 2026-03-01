from __future__ import annotations

import json
from uuid import uuid4

from packages.core.auth import create_access_token, hash_password
from packages.core.database import SessionLocal
from packages.core.models import User


def _make_admin_headers() -> dict[str, str]:
    email = f"b14-dashboard-admin-{uuid4()}@example.test"
    with SessionLocal() as db:
        db.add(User(email=email, password_hash=hash_password("pw"), role="admin"))
        db.commit()
    token = create_access_token(subject=email, role="admin")
    return {"Authorization": f"Bearer {token}"}


def test_b14_dashboard_summary_requires_admin_auth(client) -> None:
    response = client.get("/admin/dashboard/health-summary")
    assert response.status_code in {401, 403}


def test_b14_dashboard_summary_contract(client) -> None:
    headers = _make_admin_headers()

    inquiry_response = client.post(
        "/v1/inquiries",
        json={
            "name": "B14 Dashboard Lead",
            "email": "b14-dashboard@example.test",
            "message": "Dashboard contract check",
            "source_page": "/en/contact",
            "intent": "general",
        },
    )
    assert inquiry_response.status_code == 201, inquiry_response.text

    response = client.get("/admin/dashboard/health-summary", headers=headers)
    assert response.status_code == 200, response.text
    body = response.json()

    assert isinstance(body.get("generated_at"), str)
    assert isinstance(body.get("data_freshness"), dict)
    assert isinstance(body.get("raw_metrics"), dict)
    assert isinstance(body.get("widgets"), list)
    assert isinstance(body.get("recent_inquiries"), list)
    assert isinstance(body.get("incomplete_widget_count"), int)
    assert isinstance(body.get("warnings"), list)

    expected_widget_keys = [
        "project_cover_coverage",
        "broken_media_count",
        "external_image_leakage_count",
        "pending_translations_count",
        "unpublished_drafts_count",
        "recent_leads_inquiries",
        "review_video_source_verification_pending",
        "last_import_mirror_status",
        "last_deploy_health_status",
    ]
    widget_rows = {item.get("key"): item for item in body["widgets"]}
    for key in expected_widget_keys:
        assert key in widget_rows
        row = widget_rows[key]
        assert isinstance(row.get("title"), str)
        assert row.get("status") in {"ok", "warn", "error", "unknown"}
        assert isinstance(row.get("summary"), str)
        assert isinstance(row.get("actions"), list)
        assert len(row["actions"]) >= 1
        for action in row["actions"]:
            assert str(action.get("url") or "").startswith("/admin/")

    for metric_key in [
        "project_cover_coverage",
        "media_integrity",
        "pending_translations",
        "unpublished_drafts",
        "recent_inquiries",
        "review_video_source_verification_pending",
        "last_import_status",
        "last_mirror_status",
        "last_deploy_health_status",
    ]:
        assert metric_key in body["raw_metrics"]

    pending_translations = body["raw_metrics"]["pending_translations"]
    assert isinstance(pending_translations.get("policy"), dict)
    assert isinstance(pending_translations.get("by_entity"), dict)


def test_b14_dashboard_deploy_widget_uses_telemetry_file(client, tmp_path, monkeypatch) -> None:
    telemetry_path = tmp_path / "deploy_telemetry.json"
    telemetry_path.write_text(
        json.dumps(
            {
                "generated_at": "2026-03-01T00:00:00+00:00",
                "deployed_at": "2026-03-01T00:00:00+00:00",
                "deploy_status": "ok",
                "smoke_passed": True,
                "build_sha": "abc123",
                "target_sha": "abc123",
                "source": "tests",
                "smoke": {
                    "healthz_code": "200",
                    "properties_code": "200",
                    "projects_code": "200",
                },
            }
        ),
        encoding="utf-8",
    )
    monkeypatch.setenv("FLOWBIZ_DEPLOY_TELEMETRY_PATH", str(telemetry_path))
    headers = _make_admin_headers()

    response = client.get("/admin/dashboard/health-summary", headers=headers)
    assert response.status_code == 200, response.text
    body = response.json()
    deploy_widget = {item.get("key"): item for item in body.get("widgets", [])}.get(
        "last_deploy_health_status"
    )
    assert deploy_widget is not None
    assert deploy_widget["status"] == "ok"
    assert body["raw_metrics"]["last_deploy_health_status"]["deploy_status"] == "ok"
    assert body["raw_metrics"]["last_deploy_health_status"]["build_sha"] == "abc123"


def test_b14_dashboard_deploy_widget_stays_unknown_without_telemetry(
    client, tmp_path, monkeypatch
) -> None:
    artifact_path = tmp_path / "b13_refresh_final_2026-03-01.json"
    artifact_path.write_text(
        json.dumps(
            {
                "generated_at": "2026-03-01T12:00:00+00:00",
                "warnings": [],
                "fetched": {"projects": 5},
                "written": {"projects": 5},
            }
        ),
        encoding="utf-8",
    )
    missing_telemetry_path = tmp_path / "missing_deploy_telemetry.json"
    monkeypatch.setenv("FLOWBIZ_DEPLOY_TELEMETRY_PATH", str(missing_telemetry_path))
    monkeypatch.setenv("FLOWBIZ_DEPLOY_ARTIFACT_PATH", str(artifact_path))
    headers = _make_admin_headers()

    response = client.get("/admin/dashboard/health-summary", headers=headers)
    assert response.status_code == 200, response.text
    body = response.json()
    deploy_widget = {item.get("key"): item for item in body.get("widgets", [])}.get(
        "last_deploy_health_status"
    )
    assert deploy_widget is not None
    assert deploy_widget["status"] == "unknown"
    assert body["raw_metrics"]["last_deploy_health_status"]["deploy_status"] == "unknown"
    assert body["raw_metrics"]["last_deploy_health_status"]["source"] == "telemetry_file_missing"
    assert body["raw_metrics"]["last_deploy_health_status"]["artifact_path"] == str(artifact_path)
