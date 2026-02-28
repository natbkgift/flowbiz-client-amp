from __future__ import annotations

import json
import sys
from pathlib import Path


def _write_json(path: Path, payload: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def test_b13_report_strict_detects_external_and_broken_refs(tmp_path: Path) -> None:
    import_dir = tmp_path / "import"
    public_root = tmp_path / "public"

    _write_json(
        import_dir / "projects.json",
        [
            {"slug": "ext-a", "name": "Ext A", "cover_image_url": "https://cdn.example/a.jpg"},
            {
                "slug": "loc-b",
                "name": "Loc B",
                "cover_image_url": "/media/project-covers/loc-b/cover.jpg",
            },
        ],
    )
    _write_json(import_dir / "project_cover_sources.json", [])

    from scripts import report_project_cover_coverage as mod

    original_argv = sys.argv
    try:
        sys.argv = [
            "report_project_cover_coverage.py",
            "--input-dir",
            str(import_dir),
            "--public-root",
            str(public_root),
            "--strict",
            "--no-write",
            "--quiet",
        ]
        exit_code = mod.main()
    finally:
        sys.argv = original_argv

    assert exit_code == 1


def test_b13_report_fail_on_warn_for_missing_cover(tmp_path: Path) -> None:
    import_dir = tmp_path / "import"
    public_root = tmp_path / "public"
    _write_json(
        import_dir / "projects.json", [{"slug": "p1", "name": "No Cover", "cover_image_url": ""}]
    )
    _write_json(import_dir / "project_cover_sources.json", [])

    from scripts import report_project_cover_coverage as mod

    original_argv = sys.argv
    try:
        sys.argv = [
            "report_project_cover_coverage.py",
            "--input-dir",
            str(import_dir),
            "--public-root",
            str(public_root),
            "--fail-on-warn",
            "--no-write",
            "--quiet",
        ]
        exit_code = mod.main()
    finally:
        sys.argv = original_argv

    assert exit_code == 2


def test_b13_report_write_json(tmp_path: Path) -> None:
    import_dir = tmp_path / "import"
    public_root = tmp_path / "public"
    out = tmp_path / "b13-report.json"

    cover_path = public_root / "media" / "project-covers" / "ok" / "cover.jpg"
    cover_path.parent.mkdir(parents=True, exist_ok=True)
    cover_path.write_bytes(b"ok")

    _write_json(
        import_dir / "projects.json",
        [{"slug": "ok", "name": "Ok", "cover_image_url": "/media/project-covers/ok/cover.jpg"}],
    )
    _write_json(import_dir / "project_cover_sources.json", [])

    from scripts import report_project_cover_coverage as mod

    original_argv = sys.argv
    try:
        sys.argv = [
            "report_project_cover_coverage.py",
            "--input-dir",
            str(import_dir),
            "--public-root",
            str(public_root),
            "--write",
            str(out),
            "--quiet",
        ]
        exit_code = mod.main()
    finally:
        sys.argv = original_argv

    assert exit_code == 0
    payload = json.loads(out.read_text(encoding="utf-8"))
    assert payload["summary"]["projects_total"] == 1


def test_b13_mirror_rewrites_external_to_local_media_path(tmp_path: Path, monkeypatch) -> None:
    import_dir = tmp_path / "import"
    public_root = tmp_path / "public"

    _write_json(
        import_dir / "projects.json",
        [{"slug": "demo", "name": "Demo", "cover_image_url": "https://cdn.example/demo.jpg"}],
    )
    _write_json(
        import_dir / "project_cover_sources.json",
        [
            {
                "project_slug": "demo",
                "approved_for_seed": True,
                "cover_image_url": "https://cdn.example/demo.jpg",
            }
        ],
    )

    from scripts import mirror_project_cover_images as mod

    def _fake_download(url: str, dest_path: Path, *, timeout: int) -> tuple[int, str | None]:
        dest_path.parent.mkdir(parents=True, exist_ok=True)
        dest_path.write_bytes(b"fake-jpeg")
        return len(b"fake-jpeg"), "image/jpeg"

    monkeypatch.setattr(mod, "_download_to_file", _fake_download)

    report = mod.mirror_project_covers(
        import_dir=import_dir,
        public_root=public_root,
        media_prefix="/media",
        media_subdir="project-covers",
        timeout=10,
        force=False,
        origin_for_local_media="",
        skip_local_file_check=False,
        write_changes=True,
    )

    assert report["summary"]["external_remaining_count"] == 0
    rewritten = json.loads((import_dir / "projects.json").read_text(encoding="utf-8"))
    assert str(rewritten[0]["cover_image_url"]).startswith("/media/project-covers/demo/")


def test_b13_mirror_idempotent_rerun_reuses_existing(tmp_path: Path, monkeypatch) -> None:
    import_dir = tmp_path / "import"
    public_root = tmp_path / "public"

    _write_json(
        import_dir / "projects.json",
        [{"slug": "same", "name": "Same", "cover_image_url": "https://cdn.example/same.jpg"}],
    )
    _write_json(
        import_dir / "project_cover_sources.json",
        [
            {
                "project_slug": "same",
                "approved_for_seed": True,
                "cover_image_url": "https://cdn.example/same.jpg",
            }
        ],
    )

    from scripts import mirror_project_cover_images as mod

    call_count = {"n": 0}

    def _fake_download(url: str, dest_path: Path, *, timeout: int) -> tuple[int, str | None]:
        call_count["n"] += 1
        dest_path.parent.mkdir(parents=True, exist_ok=True)
        dest_path.write_bytes(b"same-file")
        return len(b"same-file"), "image/jpeg"

    monkeypatch.setattr(mod, "_download_to_file", _fake_download)

    first = mod.mirror_project_covers(
        import_dir=import_dir,
        public_root=public_root,
        media_prefix="/media",
        media_subdir="project-covers",
        timeout=10,
        force=False,
        origin_for_local_media="",
        skip_local_file_check=False,
        write_changes=True,
    )
    second = mod.mirror_project_covers(
        import_dir=import_dir,
        public_root=public_root,
        media_prefix="/media",
        media_subdir="project-covers",
        timeout=10,
        force=False,
        origin_for_local_media="",
        skip_local_file_check=False,
        write_changes=True,
    )

    assert first["summary"]["mirrored_new_count"] == 1
    assert second["summary"]["unchanged_local_count"] == 1
    assert call_count["n"] == 1


def test_b13_import_warning_policy_ignores_optional_skips_by_default() -> None:
    from scripts import import_seed_data as mod

    results = [
        mod.StepResult(step="developers", skipped=1),
        mod.StepResult(step="areas", skipped=1),
        mod.StepResult(step="projects", skipped=0),
        mod.StepResult(step="team", skipped=1),
        mod.StepResult(step="units_buy", skipped=1),
    ]

    warning_steps = mod._warning_skipped_steps(results, warn_on_optional_skip=False)
    assert warning_steps == ["units_buy"]


def test_b13_import_warning_policy_can_include_optional_skips() -> None:
    from scripts import import_seed_data as mod

    results = [
        mod.StepResult(step="developers", skipped=1),
        mod.StepResult(step="areas", skipped=1),
        mod.StepResult(step="team", skipped=1),
    ]

    warning_steps = mod._warning_skipped_steps(results, warn_on_optional_skip=True)
    assert warning_steps == ["developers", "areas", "team"]
