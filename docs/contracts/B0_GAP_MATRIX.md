# B0 Gap Matrix (Backend Foundation + Data Contracts)

Legend: PASS = compliant, PARTIAL = usable with drift risk, FAIL = contract broken

| Surface | Status | Verified Assets | Current Strength | Gap | Risk | Priority |
|---|---|---|---|---|---|---|
| Home Composer | PASS | `v1/home_composer.py`, `admin_home_composer.py`, `schemas/home_composer.py`, `models.HomeComposerConfig` | Strong locale guard, draft/publish lifecycle, validation on publish | None | Low | Closed |
| Domain (Areas/Developers/Agents) | PASS | `v1/domain.py`, `admin_domain.py`, `schemas/domain.py`, `models.Area/Developer/Agent` | Public/admin split and pagination are stable | P0 default drift closed via model+migration alignment | Low | Closed |
| Projects | PASS | `v1/projects.py`, `admin_projects.py`, `schemas/projects.py`, `models.Project` | Deterministic list/detail/evaluation and governance guard | No P0 blocker | Low | Closed |
| Properties + Company | PASS | `v1/properties.py`, `admin_properties.py`, `schemas/property_api.py`, `models.Property/CompanyInfo` | No-hotlink output + governance checks + canonical precedence lock | P0 canonical-vs-legacy drift closed | Low | Closed |
| Content | PASS | `v1/content.py`, `admin_content.py`, `schemas/content.py`, `models.Article/MediaAsset` | Publishability and rights governance enforced | No P0 blocker | Low | Closed |
| CRM / Inquiries | PASS | `v1/crm.py`, `admin_crm.py`, `schemas/crm.py`, `models.Inquiry/LeadAssignment/AuditLog` | Anti-abuse + audit trail + transition controls | P0 total/filter determinism closed at query-level | Low | Closed |

## Summary
- PASS: 6/6
- PARTIAL: 0/6
- FAIL: 0/6

## B0.P0 Closure Evidence
1. Domain default alignment completed in model + migration/backfill.
2. Canonical-vs-legacy precedence locked in property read/write paths with backward compatibility.
3. `is_spam` pagination/total semantics made deterministic at query layer.
