# AMP Pattaya Executive Status

Date: 2026-03-15

## Executive Summary

AMP Pattaya repo is no longer a redesign prototype; it is a largely implemented V1 advisory website with production-grade CRM/admin foundations, while several V2 platform modules remain partial or missing.

Thai executive rendering:

AMP Pattaya repo ไม่ใช่ prototype สำหรับงาน redesign แล้ว แต่เป็น V1 advisory website ที่ implement ไปมากและมีฐาน CRM/admin ระดับ production แล้ว ขณะที่ V2 platform modules หลายส่วนยังอยู่ในสถานะ partial หรือยังไม่มี

## What This Means

The current repo should be described as:

- a live advisory website, not a concept build
- production-ready on the V1 website/advisory scope
- already backed by serious admin and CRM operations
- not yet the full end-to-end proptech platform described by the full master blueprint

## V1 Status

`V1 — Website / Advisory Experience: production-ready`

The implemented V1 surface already includes:

- advisory-led home experience
- segment pages and foreign-buyer/investment guidance
- project, listing, area, and insight detail routes
- reusable public components and conversion forms
- CRM/admin foundations for inquiry handling and operational monitoring
- responsive, SEO, and validation coverage that supports production use

Representative evidence:

- `admin-app/app/(site)/[locale]/page.tsx`
- `admin-app/app/(site)/[locale]/projects/[slug]/page.tsx`
- `admin-app/app/(site)/[locale]/property/[slug]/page.tsx`
- `admin-app/app/(site)/[locale]/areas/[slug]/page.tsx`
- `admin-app/app/(site)/[locale]/blog/[slug]/page.tsx`
- `apps/api/routes/admin_crm.py`
- `apps/api/routes/admin_dashboard.py`

## V2 Status

`V2 — Platform Modules: partial / missing depending on module`

Modules with real foundations or partial implementation:

- advanced search
- investor tools
- lead automation maturity
- AI matching foundations
- market intelligence signals
- foreign buyer content/system foundations

Modules still missing as product surfaces:

- saved shortlist
- deal room / document vault
- acquisition system as an application layer

## Operational Proof

Current repo and production proof points support a `V1 production-ready` statement:

- `ruff check .` passes
- `pytest -q` passes
- `npm --prefix admin-app run lint` passes
- admin live smoke passes on production
- admin dashboard health summary reports `warningCount: 0`
- admin dashboard health summary reports `incompleteWidgetCount: 0`
- public sample routes return `200`
- public sample routes no longer expose `Coming soon`, `pending publication`, `not published yet`, or `TODO:` copy

## What We Should Say

Use:

`AMP Pattaya repo is no longer a redesign prototype; it is a largely implemented V1 advisory website with production-grade CRM/admin foundations, while several V2 platform modules remain partial or missing.`

Avoid:

- `Everything is done`
- `The whole blueprint is done`
- `The redesign is still unfinished`

Those statements collapse two different truths:

- V1 website scope is already real and operational
- V2 platform scope is still roadmap territory in several areas

## Recommended Next Priorities

If the goal is to convert this repo from `V1 production-ready` into `V1 + selective V2 expansion`, the highest-leverage next steps are:

1. advanced search upgrade
2. investor tools expansion, especially a dedicated buying-cost estimator
3. foreign buyer hub consolidation
4. public market intelligence module
5. saved shortlist as the bridge into future deal-room capability

## Board / Investor Reading

The correct investor-level interpretation is not that AMP Pattaya is a mere prototype, and not that the full master platform has already shipped.

The accurate interpretation is:

- the advisory website is substantially built and operational
- the operational/admin backbone is stronger than a normal redesign project
- the next value creation comes from selectively layering V2 platform modules on top of an already usable V1 business surface
