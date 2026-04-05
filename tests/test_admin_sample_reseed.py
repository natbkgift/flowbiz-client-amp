from __future__ import annotations

import copy
import sys
from pathlib import Path

from scripts import admin_sample_reseed as mod


class _FakeClient:
    def __init__(self) -> None:
        self.patch_calls: list[tuple[str, object]] = []
        self.post_calls: list[tuple[str, object, object, object]] = []

    def patch(self, path: str, *, json_body: object) -> object:
        self.patch_calls.append((path, json_body))
        if path.startswith("/admin/developers/"):
            return {"developer": {"id": "developer-existing"}}
        if path.startswith("/admin/properties/"):
            return {"id": "property-existing"}
        if path.startswith("/admin/media/"):
            return {"media": {"id": "media-existing"}}
        return {}

    def post(
        self,
        path: str,
        *,
        json_body: object | None = None,
        files: object | None = None,
        data: object | None = None,
    ) -> object:
        self.post_calls.append((path, json_body, files, data))
        if path == "/admin/developers":
            return {"developer": {"id": "developer-created"}}
        if path == "/admin/properties":
            return {"id": "property-created"}
        if path == "/admin/media/upload":
            return {
                "media": {
                    "id": "media-created",
                    "storage_path": "/media/library/media-created.jpg",
                    "title": "created",
                }
            }
        return {}


class _FakeApiClient:
    def __init__(self, *args: object, **kwargs: object) -> None:
        self.args = args
        self.kwargs = kwargs

    def close(self) -> None:
        return None


def _base_report() -> dict[str, object]:
    return {
        "uploaded_media_list": [],
        "reused_media_list": [],
        "created_records_by_entity": {
            key: []
            for key in [
                "developers",
                "areas",
                "projects",
                "properties",
                "testimonials",
                "articles",
                "videos",
                "company",
            ]
        },
        "updated_records_by_entity": {
            key: []
            for key in [
                "developers",
                "areas",
                "projects",
                "properties",
                "testimonials",
                "articles",
                "videos",
                "company",
            ]
        },
        "published_records_by_entity": {
            key: []
            for key in [
                "developers",
                "areas",
                "projects",
                "properties",
                "testimonials",
                "articles",
                "videos",
            ]
        },
    }


def test_admin_sample_reseed_reuses_existing_media_without_upload(
    tmp_path: Path,
    monkeypatch,
) -> None:
    source_dir = tmp_path / "assets"
    source_dir.mkdir(parents=True, exist_ok=True)
    (source_dir / "hero.jpg").write_bytes(b"demo-image")

    monkeypatch.setattr(
        mod,
        "WORKSPACE_ROOT",
        tmp_path,
    )
    monkeypatch.setattr(
        mod,
        "MEDIA_SOURCES",
        [{"key": "hero", "path": "assets/hero.jpg", "title": "Demo Hero"}],
    )

    report = _base_report()
    client = _FakeClient()
    existing_media = {
        "hero": {
            "media_id": "media-existing",
            "path": "/media/library/media-existing.jpg",
            "title": "Old title",
        }
    }

    result = mod.upload_media_bundle(client, report, existing_media=existing_media)

    assert result == {
        "hero": {
            "media_id": "media-existing",
            "path": "/media/library/media-existing.jpg",
            "title": "Demo Hero",
        }
    }
    assert report["uploaded_media_list"] == []
    assert report["reused_media_list"] == [
        {
            "key": "hero",
            "media_id": "media-existing",
            "path": "/media/library/media-existing.jpg",
            "source_note": "Reused existing preview reseed media asset.",
        }
    ]
    assert [path for path, _payload in client.patch_calls] == ["/admin/media/media-existing"]
    assert client.post_calls == []


def test_admin_sample_reseed_upserts_existing_developer_and_property(monkeypatch) -> None:
    monkeypatch.setattr(
        mod,
        "DEVELOPERS",
        [
            {
                "slug": "demo-dev",
                "name": "Demo Dev",
                "website": "https://localhost/demo-dev",
                "tier": "premium",
                "logo_media": "logo",
                "cover_media": "cover",
                "profile": {"en": "profile"},
                "summary": {"en": "summary"},
                "source_note": "note",
                "trust_proof": {"approval_status": "approved", "legal_approved": True},
            }
        ],
    )
    monkeypatch.setattr(
        mod,
        "PROJECTS",
        [
            {
                "slug": "demo-project",
                "area_slug": "demo-area",
                "developer_slug": "demo-dev",
            }
        ],
    )
    monkeypatch.setattr(
        mod,
        "PROPERTY_SPECS",
        [
            (
                "demo-project",
                "demo-property",
                "Demo Property",
                1230000,
                1,
                1,
                35,
                "Demo Address",
                "new",
            )
        ],
    )

    media = {
        "logo": {"path": "/media/library/logo.jpg", "media_id": "logo-id", "title": "logo"},
        "cover": {"path": "/media/library/cover.jpg", "media_id": "cover-id", "title": "cover"},
        "project_hero_a": {"path": "/media/library/project-a.jpg", "media_id": "a", "title": "a"},
        "project_hero_b": {"path": "/media/library/project-b.jpg", "media_id": "b", "title": "b"},
        "project_hero_c": {"path": "/media/library/project-c.jpg", "media_id": "c", "title": "c"},
        "project_hero_d": {"path": "/media/library/project-d.jpg", "media_id": "d", "title": "d"},
        "project_hero_e": {"path": "/media/library/project-e.jpg", "media_id": "e", "title": "e"},
        "project_hero_f": {"path": "/media/library/project-f.jpg", "media_id": "f", "title": "f"},
        "project_hero_g": {"path": "/media/library/project-g.jpg", "media_id": "g", "title": "g"},
        "project_hero_h": {"path": "/media/library/project-h.jpg", "media_id": "h", "title": "h"},
        "area_jomtien": {
            "path": "/media/library/area-jomtien.jpg",
            "media_id": "ij",
            "title": "ij",
        },
        "area_pratumnak": {
            "path": "/media/library/area-pratumnak.jpg",
            "media_id": "ip",
            "title": "ip",
        },
        "area_wongamat": {
            "path": "/media/library/area-wongamat.jpg",
            "media_id": "iw",
            "title": "iw",
        },
        "area_central": {
            "path": "/media/library/area-central.jpg",
            "media_id": "ic",
            "title": "ic",
        },
        "area_najomtien": {
            "path": "/media/library/area-najomtien.jpg",
            "media_id": "in",
            "title": "in",
        },
    }
    report = _base_report()
    client = _FakeClient()

    developer_ids = mod.create_developers(
        client,
        media,
        report,
        existing_by_slug={"demo-dev": {"id": "developer-existing", "slug": "demo-dev"}},
    )
    property_ids = mod.create_properties(
        client,
        media,
        {"demo-area": "area-id"},
        developer_ids,
        {"demo-project": "project-id"},
        report,
        existing_by_source_id={
            "demo-local-demo-property": {
                "id": "property-existing",
                "source_id": "demo-local-demo-property",
            }
        },
    )

    assert developer_ids == {"demo-dev": "developer-existing"}
    assert property_ids == {"demo-property": "property-existing"}
    assert ("/admin/developers/developer-existing",) == (client.patch_calls[0][0],)
    assert any(
        path == "/admin/properties/property-existing" for path, _payload in client.patch_calls
    )
    assert not any(path == "/admin/developers" for path, _json, _files, _data in client.post_calls)
    assert not any(path == "/admin/properties" for path, _json, _files, _data in client.post_calls)
    assert report["created_records_by_entity"]["developers"] == []
    assert report["created_records_by_entity"]["properties"] == []
    assert report["updated_records_by_entity"]["developers"] == [
        {"slug": "demo-dev", "id": "developer-existing"}
    ]
    assert report["updated_records_by_entity"]["properties"] == [
        {
            "slug": "demo-property",
            "id": "property-existing",
            "source_id": "demo-local-demo-property",
        }
    ]


def test_admin_sample_reseed_main_rerun_keeps_counts_stable(monkeypatch, tmp_path: Path) -> None:
    snapshots = {
        "developers": [
            {"id": f"developer-{index}", "slug": row["slug"]}
            for index, row in enumerate(mod.DEVELOPERS)
        ],
        "areas": [
            {"id": f"area-{index}", "slug": row["slug"]} for index, row in enumerate(mod.AREAS)
        ],
        "projects": [
            {"id": f"project-{index}", "slug": row["slug"]}
            for index, row in enumerate(mod.PROJECTS)
        ],
        "properties": [
            {
                "id": f"property-{index}",
                "slug": spec[1],
                "source_id": f"demo-local-{spec[1]}",
            }
            for index, spec in enumerate(mod.PROPERTY_SPECS)
        ],
        "testimonials": [
            {
                "id": f"testimonial-{index}",
                "attribution_name": row["attribution_name"],
                "context": row["context"],
            }
            for index, row in enumerate(mod.TESTIMONIALS)
        ],
        "articles": [{"slug": row["slug"], "status": "published"} for row in mod.ARTICLES],
        "videos": [{"slug": row["slug"], "status": "published"} for row in mod.VIDEOS],
        "company": [{"slug": row["slug"]} for row in mod.COMPANY_PAGES],
        "media": [
            {
                "id": f"media-{index}",
                "storage_path": f"/media/library/media-{index}.jpg",
                "title": row["title"],
                "tags": ["demo", "preview-reseed", row["key"]],
            }
            for index, row in enumerate(mod.MEDIA_SOURCES)
        ],
    }
    captured: dict[str, object] = {}

    monkeypatch.setattr(mod, "WORKSPACE_ROOT", tmp_path)
    monkeypatch.setattr(
        mod,
        "ensure_local_preview_gate",
        lambda api_base, admin_base: {
            "current_base_url": admin_base,
            "api_base_url": api_base,
            "current_environment_name": "preview",
            "workspace_identifier": mod.WORKSPACE_NAME,
            "non_production_confirmed": True,
            "production_public_base_url_used": False,
        },
    )
    monkeypatch.setattr(mod, "ApiClient", _FakeApiClient)
    monkeypatch.setattr(
        mod,
        "fetch_entity",
        lambda client, entity: copy.deepcopy(snapshots[entity]),
    )
    monkeypatch.setattr(
        mod,
        "write_backup",
        lambda backup_dir, entity, items, stamp: {
            "path": str(backup_dir / f"{stamp}_{entity}.json"),
            "count": len(items),
            "verified_readable_non_empty": True,
        },
    )
    monkeypatch.setattr(
        mod,
        "upload_media_bundle",
        lambda client, report, existing_media: {
            row["key"]: {
                "media_id": f"media-{index}",
                "path": f"/media/library/media-{index}.jpg",
                "title": row["title"],
            }
            for index, row in enumerate(mod.MEDIA_SOURCES)
        },
    )
    monkeypatch.setattr(
        mod,
        "create_developers",
        lambda client, media, report, existing_by_slug: {
            row["slug"]: f"developer-{index}" for index, row in enumerate(mod.DEVELOPERS)
        },
    )
    monkeypatch.setattr(
        mod,
        "create_areas",
        lambda client, media, report, existing_by_slug: {
            row["slug"]: f"area-{index}" for index, row in enumerate(mod.AREAS)
        },
    )
    monkeypatch.setattr(
        mod,
        "create_projects",
        lambda client, media, area_ids, developer_ids, report, existing_by_slug: {
            row["slug"]: f"project-{index}" for index, row in enumerate(mod.PROJECTS)
        },
    )
    monkeypatch.setattr(mod, "publish_developers", lambda client, developer_ids, report: None)
    monkeypatch.setattr(
        mod,
        "create_properties",
        lambda client, media, area_ids, developer_ids, project_ids, report, existing_by_source_id: {
            spec[1]: f"property-{index}" for index, spec in enumerate(mod.PROPERTY_SPECS)
        },
    )
    monkeypatch.setattr(mod, "create_testimonials", lambda client, report, existing_by_key: None)
    monkeypatch.setattr(
        mod,
        "create_articles",
        lambda client, media, report, existing_by_slug: None,
    )
    monkeypatch.setattr(
        mod,
        "create_videos",
        lambda client, media, report, existing_by_slug: None,
    )
    monkeypatch.setattr(
        mod,
        "upsert_company_pages",
        lambda client, report, existing_by_slug: None,
    )
    monkeypatch.setattr(
        mod,
        "verify_public_urls",
        lambda client, property_slug, project_slugs, report: report["public_urls_verified"].append(
            {"url": "/en/developers", "status": "PASS", "http_status": 200, "notes": []}
        ),
    )
    monkeypatch.setattr(
        mod,
        "save_report",
        lambda report: captured.setdefault("report", copy.deepcopy(report)),
    )

    original_argv = sys.argv
    try:
        sys.argv = ["admin_sample_reseed.py", "--execute"]
        exit_code = mod.main()
    finally:
        sys.argv = original_argv

    assert exit_code == 0
    report = captured["report"]
    assert report["before_counts"] == report["after_counts"]
    assert report["before_counts"] == {
        "developers": 4,
        "areas": 5,
        "projects": 8,
        "properties": 18,
        "testimonials": 6,
        "articles": 6,
        "videos": 4,
        "company": 3,
        "media": 23,
    }
    assert report["uploaded_media_list"] == []
    assert report["deleted_records_by_entity"] == {
        "developers": [],
        "areas": [],
        "projects": [],
        "properties": [],
        "testimonials": [],
        "articles": [],
        "videos": [],
        "company": [],
        "media": [],
    }
    assert report["final_readiness_summary"]["mode"] == "execute"
    assert all(report["final_readiness_summary"]["minimum_targets_met"].values())
