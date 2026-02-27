# MASTER EXECUTION BLUEPRINT

**Project: AMP Pattaya -- Real Estate Intelligence Platform**

---

## Purpose

This blueprint is the single source of truth for building AMP Pattaya as a production-grade Real Estate Intelligence Platform. Every document is sequenced so that AI Agents and Dev teams can execute phase-by-phase without backtracking.

**Rule:** Complete each phase before starting the next. Never skip Phase 0.

---

## Document Index

### PHASE 0 -- Strategic Foundation (Lock before everything)

| # | Document | Location | Status |
|---|----------|----------|--------|
| 00 | Master Blueprint | `00_strategy/00_MASTER_BLUEPRINT.md` | REQUIRED |

### PHASE 1 -- Information Architecture

| # | Document | Location | Status |
|---|----------|----------|--------|
| 01 | Master Sitemap | `01_architecture/01_MASTER_SITEMAP.md` | REQUIRED |
| 02 | URL Structure Guideline | `01_architecture/02_URL_STRUCTURE_GUIDELINE.md` | REQUIRED |
| 03 | Index Matrix | `01_architecture/03_INDEX_MATRIX.md` | REQUIRED |
| 04 | XML Sitemap Strategy | `01_architecture/04_XML_SITEMAP_STRATEGY.md` | REQUIRED |

### PHASE 2 -- Data Architecture

| # | Document | Location | Status |
|---|----------|----------|--------|
| 05 | Database Schema | `02_data/05_DATABASE_SCHEMA.md` | REQUIRED |
| 06 | Property Type Standard | `02_data/06_PROPERTY_TYPE_STANDARD.md` | REQUIRED |
| 07 | Product Template Spec | `02_data/07_PRODUCT_TEMPLATE_SPEC.md` | REQUIRED |

### PHASE 3 -- SEO & Linking Layer

| # | Document | Location | Status |
|---|----------|----------|--------|
| 08 | Content Pillar Map | `03_seo/08_CONTENT_PILLAR_MAP.md` | REQUIRED |
| 09 | Internal Linking Blueprint | `03_seo/09_INTERNAL_LINKING_BLUEPRINT.md` | REQUIRED |
| 10 | Schema Markup Plan | `03_seo/10_SCHEMA_MARKUP_PLAN.md` | REQUIRED |
| 11 | Crawl Optimization Plan | `03_seo/11_CRAWL_OPTIMIZATION_PLAN.md` | REQUIRED |

### PHASE 4 -- Conversion & Funnel Layer

| # | Document | Location | Status |
|---|----------|----------|--------|
| 12 | Funnel Design | `04_conversion/12_FUNNEL_DESIGN.md` | REQUIRED |
| 13 | CTA Standard | `04_conversion/13_CTA_STANDARD.md` | REQUIRED |

### PHASE 5 -- Data Population Plan

| # | Document | Location | Status |
|---|----------|----------|--------|
| 14 | Data Import Sequence | `05_data_population/14_DATA_IMPORT_SEQUENCE.md` | REQUIRED |
| 15 | Content Standard | `05_data_population/15_CONTENT_STANDARD.md` | REQUIRED |

### PHASE 6 -- QA & Release Control

| # | Document | Location | Status |
|---|----------|----------|--------|
| 16 | QA Checklist | `06_release/16_QA_CHECKLIST.md` | REQUIRED |
| 17 | Release Protocol | `06_release/17_RELEASE_PROTOCOL.md` | REQUIRED |

---

## PR Structure (Phase-based)

Each phase maps to one or more PRs. Never merge a later-phase PR before its dependencies.

| PR | Scope | Depends On |
|----|-------|------------|
| PR-01 | Master Sitemap + URL Structure | Phase 0 locked |
| PR-02 | Index Matrix + XML Sitemap | PR-01 |
| PR-03 | Database Schema + Property Types | PR-01 |
| PR-04 | Product Templates | PR-03 |
| PR-05 | Internal Linking | PR-01, PR-03 |
| PR-06 | Schema Markup | PR-04 |
| PR-07 | Funnel + CTA Integration | PR-04, PR-05 |
| PR-08 | Data Import | PR-03, PR-04 |
| PR-09 | QA + SEO Fix | PR-01 through PR-08 |
| PR-10 | Launch | PR-09 approved |

---

## Execution Rules

1. **Phase 0 must be locked** before any development starts
2. **Sitemap must be final** before URL structure is implemented
3. **Database schema must be approved** before data import begins
4. **Templates must be built** before data is populated
5. **Content Pillar Map must exist** before any content is written
6. **Canonical rules must be set** before pages are indexed
7. **QA must pass** before any launch

## Prohibited Actions

- Importing data before templates are complete
- Writing content before Pillar Map is approved
- Enabling index before canonical strategy is finalized
- Indexing dynamic filter pages
- Merging PRs out of dependency order

---

## Tech Stack Reference

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React 18, TypeScript, TailwindCSS |
| Backend API | FastAPI, Python 3.11+, SQLAlchemy 2.0 |
| Database | PostgreSQL (primary), MongoDB (content automation) |
| Migrations | Alembic |
| Content Automation | Express, Node.js, Mongoose |
| Auth | JWT + RBAC (PyJWT, bcrypt) |
| Deployment | Docker, GitHub Actions, Nginx |
| Domain | amppattaya.com |
| Locales | EN (primary), TH |
