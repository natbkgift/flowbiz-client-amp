# A11 Smart Finder / Compare Closeout

Date: 2026-02-28

## Scope
- Smart Finder upgraded to guided multi-step flow on:
  - `/en/smart-finder`
  - `/th/smart-finder`
- Compare page delivered on:
  - `/en/compare`
  - `/th/compare`
  - `/compare` (default locale)

## Checklist
- Smart Finder guided steps (budget/purpose/timeline/preferences): DONE
- Result summary + shortlist CTA: DONE
- Fallback when no matches: DONE
- Compare table/cards: DONE
- Sticky headers on desktop: DONE
- Collapse rows on mobile: DONE
- Tracking:
  - step progression: DONE
  - compare usage: DONE
  - CTA to consultation: DONE
- No broken state with incomplete data: DONE
- Keyboard usable baseline: DONE
- EN/TH support: DONE
- Responsive mobile/desktop/4K: DONE

## Notes
- Runtime media usage remains local/safe (`/media/...` or allowed internal hosts).
- Missing source metadata now resolves with deterministic policy:
  - `source_domain` from `source_meta`/URL/linked media asset, else `flowbiz.com` (local) or `unknown`
  - `rights_status` from `source_meta`/linked media asset, else `pending_review`
- Smart Finder matching uses explicit modes:
  - `weighted` (score-based ranking)
  - `strict` (all selected constraints required)
- Backfill utility for existing records:
  - `scripts/backfill_property_source_meta.py`
  - Dry-run: `python scripts/backfill_property_source_meta.py`
  - Write: `python scripts/backfill_property_source_meta.py --write`
