# Phase 5.1 Manual QA Closeout (Home)

## 1) LeadForm Manual Verification (`/en`, `/th`)

- Source evidence: `ops/logs/phase5_1/phase5_1_manual_closeout_report.json`
- Screenshots:
  - `ops/logs/phase5_1/screenshots/en_form_error.png`
  - `ops/logs/phase5_1/screenshots/en_form_success.png`
  - `ops/logs/phase5_1/screenshots/th_form_error.png`
  - `ops/logs/phase5_1/screenshots/th_form_success.png`

### Result
- `/en` error path: PASS (500 mocked response, UI error message shown)
- `/en` success path: PASS (200 mocked response, success message shown)
- `/th` error path: PASS (500 mocked response, localized UI error shown)
- `/th` success path: PASS (200 mocked response, localized success shown)

## 2) Scroll Depth Dedupe (25/50/75)

- Tracker source: `admin-app/components/analytics/ScrollDepthTracker.tsx`
- Evidence source: `ops/logs/phase5_1/phase5_1_manual_closeout_report.json`

### Scenario summary
- `/en` run: depth counts = 25:1, 50:1, 75:1
- `/th` run: depth counts = 25:1, 50:1, 75:1
- No duplicate threshold fires within the test page session.

## 3) Analytics Request Sanity

- Frontend endpoint call updated to canonical path: `/api/v1/events/`
- Backend schema updated to accept new event types (`experiment_exposure`, `experiment_outcome`, `segment_entry_click`, `scroll_depth`)
- Evidence statuses: all observed analytics responses are 201 in the latest run.

## 4) Accessibility/Keyboard Smoke

- Tab-focus run captured in report for both locales.
- Required nav targets are reachable via keyboard in both locales.
- Focus-visible states are present during traversal.

## 5) Minimal Fixes Applied

1. CSP dev-mode compatibility fix (`unsafe-eval` only in non-production) to allow JS hydration in local dev QA.
2. Analytics endpoint canonicalization (`/api/v1/events/`) to avoid redirect responses.
3. Backend analytics event-type schema parity with frontend tracked events.
4. QA script hardening:
   - robust form checkbox targeting,
   - post-LCP wait for deferred analytics mount,
   - richer event diagnostics.

## 6) Verification Commands Run

- `npm --prefix admin-app run test -- __tests__/security.test.ts` ✅
- `npm --prefix admin-app run build` ✅
- `D:/FlowBiz/flowbiz-client-amp/.venv/Scripts/python.exe -m py_compile .\packages\core\schemas\analytics.py .\apps\api\routes\v1\analytics.py` ✅

## 7) Final Verdict

**Ready to merge/ship (Home scope): YES**

All Phase 5.1 closeout acceptance checks for Home (lead form manual proof, scroll depth dedupe sanity, analytics compatibility) pass in the latest evidence set.
