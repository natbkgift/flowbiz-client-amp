# B0 Media Field Audit (Canonical vs Legacy)

## Objective
Audit media-related fields across DB model + API schemas to prevent contract drift and runtime hotlink leakage.

## Canonical Policy (B0 Contract)
- Public/API-visible image paths must be local repository/storage paths (e.g. `/media/...` or local static path policy per endpoint).
- External URLs (`://`) must not be emitted by public property/content/project responses.
- Governance metadata for media rights must be present for publishable content where required by route policy.

## Field Inventory

### A) `properties`
Model (`Property`):
- Canonical (current direction):
  - `size_sqm`
  - `cover_image_url`
  - `floor`
  - `local_images`
- Legacy (compat retained):
  - `size`
  - `cover_image`
  - `floor_number`
- Shared media arrays:
  - `images`, `local_images`

API behavior:
- Public `v1/properties` and detail routes merge image sources and drop any item containing `://`.
- Output normalizes both `cover_image` and `cover_image_url` for compatibility.

Risk:
- Dual-write/dual-read ambiguity if clients treat legacy and canonical as equal without precedence rules.

### B) `projects`
Model (`Project`):
- `cover_image_url`, `hero_image_url`, `images`

API behavior:
- Admin project create/update/publish validates media governance via `evaluate_project_media_governance`.
- Candidate media endpoint returns `MediaAsset` records.

Risk:
- Loose `images` list schema with no field-level URI type constraints beyond governance function.

### C) `articles`
Model (`Article`):
- `hero_image_url`, `hero_media_asset_id`

API behavior:
- Public listing/detail requires `_hero_rights_ok`: local path + linked media asset + approved rights metadata.
- Admin hero ingest endpoint dedupes checksum and upserts source/rights metadata.

Risk:
- If rows are inserted outside API without `hero_media_asset_id` consistency, publishability becomes data-dependent and can hide content unexpectedly.

### D) `areas` and `developers`
Model:
- `Area.hero_image_url`
- `Developer.logo_url`

API behavior:
- Admin validate local `/media/` path + governance checks before persistence/publish.
- Public endpoints expose already-governed values.

Risk:
- Status/default drift can affect which records become publicly visible, not field format itself.

### E) `media_assets`
Model (`MediaAsset`) includes governance contract columns:
- Source: `source_url`, `source_page_url`, `source_domain`, `source_type`
- Rights/approval: `rights_status`, `approval_status`, notes/evidence fields
- Exception controls: `is_exception`, `exception_reason`

Strength:
- Centralized rights metadata supports deterministic publishability decisions.

## B0 Contract Lock Rules
1. Canonical precedence in read/write mapping:
   - `size_sqm > size`
   - `cover_image_url > cover_image`
   - `floor > floor_number`
2. Public responses must never emit hotlink media (`://`) for property/project/content surfaces governed by local policy.
3. Any publish flow must fail closed when governance errors exist.

## Recommendation for B0
- Keep legacy fields readable for compatibility but document them as compatibility-only.
- Enforce canonical write path in admin payload handling and migration scripts.
