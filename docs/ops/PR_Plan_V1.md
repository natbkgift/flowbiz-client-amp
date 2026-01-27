## 📋 แผน PR ใหม่ — AMP Development Plan (Revised)

### ✅ **เสร็จแล้ว (PR-001 to PR-004)**

| PR | Title | Status |
|----|-------|--------|
| PR-001 | Master PR — Vision + Business Lens + Blueprint + MVP + Governance | ✅ Done |
| PR-002 | Ops OS Pack — Ads + Social + Landing + Tracking Checklist | ✅ Done |
| PR-003 | Data OS Pack — Property Database + Templates + LINE Summary | ✅ Done |
| PR-004 | KPI & Reporting Pack — Metrics + Budget + Reports | ✅ Done |

---

### 🌐 **Phase X: Website MVP (amppattaya.com)**

> **เป้าหมาย:** ให้มีเว็บใช้งานจริงก่อน — Lead capture + SEO + Speed-to-Lead

#### **PR-005: Consolidated Blueprint v0.2**

| Issue # | หัวข้อ | รายละเอียด |
|---------|--------|-----------|
| 20 | Merge 5 blueprints into single doc | รวม Backend/Frontend/Mobile/Theme เข้าด้วยกัน  | ✅ Done |
| 21 | Align folder structure with codebase | ปรับ blueprint ให้ตรงกับ `apps/`, `packages/`  | ✅ Done |
| 22 | Add missing specs (security, rate limit) | เพิ่ม spec ที่ขาดหาย  | ✅ Done |

---

#### **PR-006: Database & Core Models**

| Issue # | หัวข้อ | รายละเอียด |
|---------|--------|-----------|
| 23 | Add database dependencies (SQLAlchemy, asyncpg, Alembic) | เพิ่ม deps ใน pyproject.toml |
| 24 | Create Pydantic enums (`packages/core/schemas/enums.py`) | PropertyStatus, Intent, Type, etc. |
| 25 | Create SQLAlchemy models (`packages/core/models/`) | properties, leads, events, sync_runs, etc. |
| 26 | Setup Alembic migrations | Initial migration สำหรับ tables ทั้งหมด |
| 27 | Database connection config | `packages/core/database.py` + env vars |

---

#### **PR-007: Pydantic Schemas & API Contracts**

| Issue # | หัวข้อ | รายละเอียด |
|---------|--------|-----------|
| 28 | Property schemas (request/response) | PropertyListResponse, PropertyDetailResponse |
| 29 | Lead schemas | LeadCreateRequest, LeadResponse |
| 30 | Event schemas | EventCreateRequest |
| 31 | Sync/QA schemas | SyncRunResponse, QAIssueResponse |
| 32 | Reason codes enum | QA reason codes (MISSING_MEDIA, etc.) |

---

#### **PR-008: Public Read API**

| Issue # | หัวข้อ | รายละเอียด |
|---------|--------|-----------|
| 33 | `GET /v1/public/properties` | List with filters, pagination, sort |
| 34 | `GET /v1/public/properties/{id}` | Detail + media + computed fields |
| 35 | `GET /v1/public/landing-links` | Areas, beds, price buckets for SEO |
| 36 | Property repository (`apps/api/repos/`) | DB access layer |
| 37 | Publish gate domain logic | `apps/api/domain/publish_gate.py` |

---

#### **PR-009: Google Sheet Sync + QA Report**

| Issue # | หัวข้อ | รายละเอียด |
|---------|--------|-----------|
| 38 | Google Sheets service (`apps/services/google_sheets.py`) | Service account integration |
| 39 | Sync job (`apps/jobs/sync_sheet.py`) | Pull → validate → upsert |
| 40 | `POST /v1/admin/sync/google-sheet` | Trigger sync endpoint |
| 41 | `GET /v1/admin/reports/qa/latest` | QA report with reason codes |
| 42 | `GET /v1/admin/export/properties.json` | Export for generator |
| 43 | Admin API key authentication | X-API-Key header validation |

---

#### **PR-010: Lead Endpoint + Notifications**

| Issue # | หัวข้อ | รายละเอียด |
|---------|--------|-----------|
| 44 | `POST /v1/leads` endpoint | Lead submission |
| 45 | Input validation (phone, honeypot) | Thai phone format, hp must be empty |
| 46 | Rate limiting | 5 leads/IP/hour |
| 47 | Deduplication logic | Same phone+property within 10 min |
| 48 | LINE OA service (`apps/services/line_messaging.py`) | Send notification to group |
| 49 | Email service (`apps/services/email_sender.py`) | SMTP notification |
| 50 | `POST /v1/line/webhook` | Capture groupId |
| 51 | `GET /v1/admin/line/targets` | List known targets |

---

#### **PR-011: Events + Observability**

| Issue # | หัวข้อ | รายละเอียด |
|---------|--------|-----------|
| 52 | `POST /v1/events` endpoint | Track events |
| 53 | Event repository | DB access for events |
| 54 | Structured JSON logging | request_id, lead_id, run_id |
| 55 | Enhanced `/healthz` | Check DB connectivity |
| 56 | CORS configuration | Limit to amppattaya.com |

---

#### **PR-012: Frontend Templates + Static Assets**

| Issue # | หัวข้อ | รายละเอียด |
|---------|--------|-----------|
| 57 | Base HTML template (`templates/base.html`) | Header, footer, sticky CTA |
| 58 | Home template (`templates/home.html`) | Hero, search, featured |
| 59 | Listing template (`templates/listing.html`) | Filters, grid, pagination |
| 60 | Detail template (`templates/detail.html`) | Gallery, form, JSON-LD |
| 61 | Thank-you template (`templates/thank-you.html`) | Confirmation page |
| 62 | CSS design tokens (`static/css/site.css`) | Colors, typography, spacing |
| 63 | Lead form JS (`static/js/lead.js`) | Form submission + validation |
| 64 | Event tracking JS (`static/js/events.js`) | Track view_detail, clicks |

---

#### **PR-013: Generator + Deploy**

| Issue # | หัวข้อ | รายละเอียด |
|---------|--------|-----------|
| 65 | Generator render (`apps/jobs/generator/render.py`) | Fetch API → render HTML |
| 66 | Sitemap generation | sitemap.xml with TH/EN URLs |
| 67 | SEO tags (canonical, hreflang, OG) | Per-page metadata |
| 68 | Deploy job (`apps/jobs/generator/deploy.py`) | SFTP to Hostinger |
| 69 | Manifest + rollback | `_deploy_tmp/`, `_deploy_prev/` |
| 70 | Incremental build logic | content_hash comparison |

---

#### **PR-014: Mobile Responsive + Sticky CTA**

| Issue # | หัวข้อ | รายละเอียด |
|---------|--------|-----------|
| 71 | Responsive CSS breakpoints | XS/S/M/Tablet/Desktop |
| 72 | Sticky conversion bar | LINE + Call buttons (mobile) |
| 73 | Filter bottom sheet | Mobile filter UX |
| 74 | Gallery viewer | Swipe, full-screen |
| 75 | Form accessibility | Touch targets, contrast |

---

### 📊 **Phase X Summary**

| PR | Title | Issues | Est. Days |
|----|-------|--------|-----------|
| PR-005 | Consolidated Blueprint v0.2 | 3 | 1 |
| PR-006 | Database & Core Models | 5 | 2 |
| PR-007 | Pydantic Schemas & API Contracts | 5 | 1 |
| PR-008 | Public Read API | 5 | 2 |
| PR-009 | Google Sheet Sync + QA Report | 6 | 3 |
| PR-010 | Lead Endpoint + Notifications | 8 | 3 |
| PR-011 | Events + Observability | 5 | 1 |
| PR-012 | Frontend Templates + Static Assets | 8 | 3 |
| PR-013 | Generator + Deploy | 6 | 3 |
| PR-014 | Mobile Responsive + Sticky CTA | 5 | 2 |
| **Total** | | **56 issues** | **~21 days** |

---

### 🏗️ **Phase 1: Core Infrastructure** (หลัง Phase X)

| PR | Title | รายละเอียด |
|----|-------|-----------|
| PR-015 | System Contracts v1 | Lead/Listing/Appointment schemas expansion |
| PR-016 | Integration Stubs v1 | LINE/Facebook/Google Drive API interfaces |
| PR-017 | Dashboard Skeleton v1 | FlowBiz Dashboard layout + auth |

---

### 🤖 **Phase 2: AI Agents Development** (หลัง Phase 1)

| PR | Title | รายละเอียด |
|----|-------|-----------|
| PR-018 | Lead Router Agent v1 | Scoring + assignment |
| PR-019 | AI Sale Chat Agent v1 | Thai/EN chatbot + RAG |
| PR-020 | Listing/Project Agent v1 | Auto-tagging + search |
| PR-021 | Ads/Promotion Agent v1 | Ad copy + analysis |
| PR-022 | Content/Branding Agent v1 | Content generation |
| PR-023 | Ops/Document Agent v1 | Contract + checklist |
| PR-024 | Analytics Agent v1 | Dashboard + predictions |

---

### 🔗 **Phase 3: Integration & Testing (Weeks 13-16)**

#### **PR-020: System Integration v1 (End-to-End Wiring)**

| Issue # | หัวข้อ Issue | รายละเอียด |
|---------|-------------|-----------|
| 62 | Agent Orchestration Layer | ระบบจัดการ agents ทั้งหมด |
| 63 | Event Bus / Message Queue | ระบบสื่อสารระหว่าง agents |
| 64 | End-to-End Flow Testing | ทดสอบ flow ทั้งระบบ |

#### **PR-021: UAT Pack v1 (Test Scripts + Bug Triage)**

| Issue # | หัวข้อ Issue | รายละเอียด |
|---------|-------------|-----------|
| 65 | UAT Test Scripts | Scripts สำหรับ User Acceptance Test |
| 66 | Bug Triage Workflow | กระบวนการจัดการ bugs |
| 67 | Test Coverage Report | รายงาน test coverage |

#### **PR-022: Performance & Load Testing v1**

| Issue # | หัวข้อ Issue | รายละเอียด |
|---------|-------------|-----------|
| 68 | Load Testing Setup | ตั้งค่า load testing tools |
| 69 | Performance Benchmarks | กำหนด benchmarks |
| 70 | Optimization Recommendations | ข้อเสนอแนะการ optimize |

#### **PR-023: Security Audit Readiness v1**

| Issue # | หัวข้อ Issue | รายละเอียด |
|---------|-------------|-----------|
| 71 | Security Checklist | Checklist ด้านความปลอดภัย |
| 72 | Vulnerability Scanning | Scan หาช่องโหว่ |
| 73 | Data Privacy Compliance | ตรวจสอบ PDPA compliance |

---

### 🚀 **Phase 4: Launch & Optimization (Weeks 17-20)**

#### **PR-024: Soft Launch v1**

| Issue # | หัวข้อ Issue | รายละเอียด |
|---------|-------------|-----------|
| 74 | Internal Beta Release | Release สำหรับทีมภายใน |
| 75 | Limited User Onboarding | Onboard ผู้ใช้กลุ่มแรก |
| 76 | Feedback Collection System | ระบบเก็บ feedback |

#### **PR-025: Full Launch v1**

| Issue # | หัวข้อ Issue | รายละเอียด |
|---------|-------------|-----------|
| 77 | Production Deployment | Deploy ขึ้น production |
| 78 | All Features Activation | เปิดใช้งานทุก features |
| 79 | Launch Communication | สื่อสารการ launch |

#### **PR-026: Monitoring & Rapid Fix Loop v1**

| Issue # | หัวข้อ Issue | รายละเอียด |
|---------|-------------|-----------|
| 80 | Monitoring Dashboard | Dashboard monitor ระบบ |
| 81 | Alerting System | ระบบแจ้งเตือน |
| 82 | Hotfix Process | กระบวนการแก้ไขด่วน |

#### **PR-027: Optimization Loop v1**

| Issue # | หัวข้อ Issue | รายละเอียด |
|---------|-------------|-----------|
| 83 | Usage Analytics Review | วิเคราะห์การใช้งานจริง |
| 84 | Performance Optimization | ปรับปรุงประสิทธิภาพ |
| 85 | Feature Enhancement Backlog | Backlog สำหรับพัฒนาต่อ |

