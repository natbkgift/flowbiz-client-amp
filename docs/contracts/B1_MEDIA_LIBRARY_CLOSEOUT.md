# B1 Media Library Closeout (2026-02-27)

## Scope
Production-ready B1 implementation delivered for backend API + entity integration + no-hotlink hardening + tests.

## B1 Requirement Mapping

| B1 Requirement | Endpoint / Implementation | Test Coverage | DoD |
|---|---|---|---|
| 1) Upload single/multi images | `POST /admin/media/upload`, `POST /admin/media/upload-multi` | `test_media_upload_single_and_multi` | PASS |
| 2) Local/our storage only, no runtime hotlink | Files stored under `storage/media/library`; returned as `/media/library/...` | `test_media_upload_single_and_multi`, `test_no_hotlink_block_admin_and_filter_public` | PASS |
| 3) Optimized variants WebP + AVIF fallback | Variant generation in `packages/core/media_library.py`; WebP required best-effort, AVIF optional with explicit availability/error flags in sidecar + API response | `test_media_upload_single_and_multi` (presence of metadata paths/flags by API contract), replace flow exercises regen | PASS |
| 4) Full metadata fields | Title, alt EN/TH, caption EN/TH, tags, width/height, mime, checksum, source_url, rights/license fields, credit, focal, crop_hint (sidecar) | `test_media_patch_archive_restore_and_usage` + upload tests | PASS |
| 5) Select cover image | `PUT /admin/media/properties/{id}/gallery`, `PUT /admin/media/projects/{id}/gallery` | `test_entity_gallery_cover_and_reorder` | PASS |
| 6) Reorder gallery | Same gallery endpoints (`images` order persisted) | `test_entity_gallery_cover_and_reorder` | PASS |
| 7) Replace image safely preserve references | `POST /admin/media/{id}/replace` replaces file in place and keeps `storage_path` stable | `test_media_replace_preserves_references` | PASS |
| 8) Soft delete/archive + restore | `POST /admin/media/{id}/archive`, `POST /admin/media/{id}/restore` | `test_media_patch_archive_restore_and_usage` | PASS |
| 9) Prevent broken references (usage map + warn/block) | `GET /admin/media/{id}/usage`; archive blocks when in use unless override | `test_media_patch_archive_restore_and_usage` | PASS |
| 10) Admin preview | All media APIs return `preview_url` and local storage path | upload/detail tests | PASS |

## Additional Hardening Delivered
- Enforced local `/media/...` in admin write flows for projects (`/admin/projects`) and article hero ingest (`/admin/content/articles/{slug}/hero-image/ingest`).
- Public APIs hardened to avoid hotlink output (`v1/projects`, `v1/domain`, `v1/content`).

## Test Execution
- `python -m pytest -q` => **22 passed, 1 warning**
- Admin frontend tests:
  - `npm test -- --runInBand` => FAIL (script missing)
  - `npm run test:a1` => FAIL in local env (`vitest` not installed)

## Remaining Constraints / Team Inputs Needed
1. AVIF generation depends on Pillow/codec support in runtime; API reports explicit availability and error flags, but production image stack should confirm AVIF codec package availability.
2. Admin-app local test environment is missing `vitest` binary/package installation; frontend CI setup confirmation needed.
3. `crop_hint` and extended `source_metadata` are persisted in media sidecar JSON (`storage/media/library/.meta/{id}.json`) to avoid immediate DB migration risk. If product requires queryable DB columns, a follow-up migration should be planned.
