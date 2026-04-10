# A8 Developer Content Readiness

> Note
> For future public content governance, use `docs/AMP_PUBLISH_GATE_RULES_V1.md` as the cross-site publish authority.
> This file remains the detailed developer-specific readiness contract and should be read together with the new publish-gate rules when developer pages are affected.

Purpose: prevent TODO fallback on `/developers/[slug]` by enforcing publish requirements.

## Backend Gate (enforced)
Developer publish is blocked unless all requirements below are met:

1. `profile` (or `summary`) has real text in at least one locale (`en`/`th`).
2. `source_note` is present.
3. `trust_proof` has non-empty content.
4. `trust_proof` contains approval metadata from content/legal.
5. Developer is linked to at least one `published` project.
6. At least one linked published project is in a `published` area.

When blocked, API returns:
- `code = developer_publish_requirements_missing`
- `missing[]` with exact unmet keys.

## Readiness Endpoint
Use before publish:

- `GET /admin/developers/{developer_id}/publish-readiness`

Response includes:
- `ready` (boolean)
- `missing[]`
- profile locale availability
- trust proof approval detection
- project/area linkage counts and slugs

## Trust Proof Approval Metadata
At least one approval marker must exist in `trust_proof`, for example:

```json
{
  "licenses": ["EEC-1234"],
  "approval_status": "approved",
  "legal_approved": true
}
```

Accepted approval markers:
- Boolean: `legal_approved`, `content_approved`, `verified`, `approved`, `is_approved`
- Status string: `approval_status`, `legal_status`, `content_status`, `verification_status`, `status`
  - value in: `approved`, `verified`, `legal_approved`, `content_approved`

## Suggested Team Workflow
1. Content team provides profile/about EN+TH where available.
2. Legal/content reviewer adds trust proof and approval metadata.
3. Ops links developer to published projects and confirms areas are published.
4. Run publish-readiness endpoint until `ready=true`.
5. Publish developer.
