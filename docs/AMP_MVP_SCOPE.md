# AMP MVP Scope Definition

> 🎯 กำหนดขอบเขต MVP สำหรับ Asset Management Property

## MVP Goal

**ปล่อย MVP ภายใน 8 สัปดาห์** ที่สามารถ:
1. รับ Lead จาก LINE Official Account
2. AI Chat ตอบคำถามพื้นฐานเรื่อง property (Thai/English)
3. Route lead ไปยัง sales ที่เหมาะสม
4. ค้นหา property ตาม criteria

---

## ✅ In Scope (MVP)

### Phase 0: Foundation (Week 1-2)

| Task | Deliverable | Priority |
|------|-------------|----------|
| Project documentation | README, Business Lens, Architecture | P0 |
| Property database structure | Google Sheets template | P0 |
| Lead tracking template | Google Sheets template | P0 |
| Content calendar template | Google Sheets template | P1 |
| Contribution guidelines | CONTRIBUTING.md | P1 |

### Phase 1: Core Infrastructure (Week 3-4)

| Task | Deliverable | Priority |
|------|-------------|----------|
| Lead schema | `packages/core/schemas/lead.py` | P0 |
| Property schema | `packages/core/schemas/property.py` | P0 |
| Appointment schema | `packages/core/schemas/appointment.py` | P1 |
| LINE webhook handler | `apps/api/routes/webhooks/line.py` | P0 |
| Health/Meta endpoints | Already exists | ✅ Done |

### Phase 2: Core Agents (Week 5-8)

| Agent | Features | Priority |
|-------|----------|----------|
| **Lead Router Agent** | Basic lead scoring, Assignment rules | P0 |
| **AI Sale Chat Agent** | Thai/English chatbot, Property Q&A, Human handover | P0 |
| **Listing Agent** | Property search, Basic matching | P1 |

### MVP Feature Matrix

```
┌─────────────────────────────────────────────────────────────────┐
│                    MVP FEATURE MATRIX                           │
├─────────────────────────────────────────────────────────────────┤
│  Feature                          │ MVP │ v1.1 │ v1.2 │ v2.0   │
├───────────────────────────────────┼─────┼──────┼──────┼────────┤
│  LINE Chat Integration            │ ✅  │      │      │        │
│  Thai Language Support            │ ✅  │      │      │        │
│  English Language Support         │ ✅  │      │      │        │
│  Basic Lead Scoring               │ ✅  │      │      │        │
│  Property Search (text)           │ ✅  │      │      │        │
│  Human Handover                   │ ✅  │      │      │        │
├───────────────────────────────────┼─────┼──────┼──────┼────────┤
│  Facebook Messenger               │     │ ✅   │      │        │
│  Ads/Promotion Agent              │     │ ✅   │      │        │
│  Content/Branding Agent           │     │ ✅   │      │        │
├───────────────────────────────────┼─────┼──────┼──────┼────────┤
│  Analytics Dashboard              │     │      │ ✅   │        │
│  Predictive Analytics             │     │      │ ✅   │        │
│  Ops/Document Agent               │     │      │ ✅   │        │
├───────────────────────────────────┼─────┼──────┼──────┼────────┤
│  Chinese Language                 │     │      │      │ ✅     │
│  Russian Language                 │     │      │      │ ✅     │
│  WhatsApp Integration             │     │      │      │ ✅     │
│  Advanced ML Models               │     │      │      │ ✅     │
└─────────────────────────────────────────────────────────────────┘
```

---

## ❌ Out of Scope (MVP)

### Deferred to v1.1 (Post-MVP)

| Feature | Reason for Deferral |
|---------|---------------------|
| Ads/Promotion Agent | Focus on lead handling first |
| Content/Branding Agent | Manual content is acceptable initially |
| Facebook Messenger | LINE is primary channel |

### Deferred to v1.2

| Feature | Reason for Deferral |
|---------|---------------------|
| Analytics Agent | Need data first |
| Ops/Document Agent | Manual process acceptable |
| Advanced dashboards | Basic reporting sufficient |

### Not In Project Scope (Never)

| Feature | Reason |
|---------|--------|
| UI/Frontend | Use LINE/Messenger as interface |
| Payment processing | Use external payment providers |
| Legal document generation | Legal review required |
| Full CRM system | Use external CRM (HubSpot, etc.) |
| Mobile app | Focus on chat channels |

---

## MVP Architecture (Simplified)

```
┌─────────────────────────────────────────────────────────────┐
│                    MVP ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────┐                                               │
│  │  LINE   │                                               │
│  │   OA    │                                               │
│  └────┬────┘                                               │
│       │                                                     │
│       ▼                                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              FastAPI Application                     │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │   │
│  │  │   Webhook   │  │ Lead Router │  │  AI Sale    │ │   │
│  │  │   Handler   │─▶│   Agent     │─▶│ Chat Agent  │ │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘ │   │
│  └─────────────────────────────────────────────────────┘   │
│       │                                                     │
│       ▼                                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   Data Layer                         │   │
│  │  ┌─────────────┐  ┌─────────────┐                   │   │
│  │  │   Google    │  │   OpenAI    │                   │   │
│  │  │   Sheets    │  │    GPT-4    │                   │   │
│  │  │  (Property) │  │   (LLM)     │                   │   │
│  │  └─────────────┘  └─────────────┘                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Success Criteria

### Functional Requirements

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| F1 | LINE webhook receives messages | Messages logged correctly |
| F2 | AI responds in Thai | Response is grammatically correct |
| F3 | AI responds in English | Response is grammatically correct |
| F4 | Property search works | Returns relevant results |
| F5 | Lead routing works | Lead assigned to correct sales |
| F6 | Human handover works | Sales receives notification |

### Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NF1 | AI response time | < 5 seconds |
| NF2 | System uptime | > 99% |
| NF3 | Concurrent conversations | 10+ |
| NF4 | Error rate | < 1% |

### Quality Gates

| Gate | Criteria | Required |
|------|----------|----------|
| Unit Tests | Coverage > 70% | Yes |
| Integration Tests | All endpoints tested | Yes |
| Manual Testing | QA sign-off | Yes |
| Security | No critical vulnerabilities | Yes |
| Documentation | All features documented | Yes |

---

## MVP Timeline

### Week-by-Week Schedule

```
┌─────────────────────────────────────────────────────────────────────┐
│                       MVP TIMELINE (8 WEEKS)                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Week 1  │████████│ Foundation Docs (PR-001)                       │
│  Week 2  │████████│ Templates + Ops Pack (PR-002, PR-003, PR-004)  │
│  Week 3  │████████│ Core Schemas (PR-005)                          │
│  Week 4  │████████│ LINE Integration (PR-006)                      │
│  Week 5  │████████│ Lead Router Agent (PR-007)                     │
│  Week 6  │████████│ AI Sale Chat Agent - Core (PR-008)             │
│  Week 7  │████████│ AI Sale Chat Agent - RAG (PR-008)              │
│  Week 8  │████████│ Integration + Testing                          │
│                                                                     │
│  ──────────────────────────────────────────────────────────────    │
│  Legend: ████ = Development  ▓▓▓▓ = Testing  ░░░░ = Buffer         │
└─────────────────────────────────────────────────────────────────────┘
```

### Milestones

| Milestone | Week | Deliverable |
|-----------|------|-------------|
| M1: Foundation Complete | 2 | All docs + templates ready |
| M2: Infrastructure Ready | 4 | Schemas + LINE webhook working |
| M3: Lead Router Live | 5 | Basic lead scoring working |
| M4: AI Chat Beta | 7 | Chat responds correctly |
| M5: MVP Launch | 8 | All features integrated |

---

## Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| LINE API issues | Medium | High | Have fallback error handling |
| AI response quality | Medium | Medium | Extensive prompt testing |
| Timeline slip | Medium | Medium | Buffer week included |
| Integration issues | Low | High | Early integration testing |

---

## Post-MVP Roadmap

### v1.1 (Week 9-12)
- [ ] Ads/Promotion Agent
- [ ] Content/Branding Agent
- [ ] Facebook Messenger integration

### v1.2 (Week 13-16)
- [ ] Analytics Agent
- [ ] Dashboard
- [ ] Ops/Document Agent

### v2.0 (Week 17+)
- [ ] Chinese language support
- [ ] Russian language support
- [ ] WhatsApp Business
- [ ] Advanced ML predictions
- [ ] Full automation suite
- [ ] Custom ML models

---

## Related Documents

- [AMP Business Lens](AMP_BUSINESS_LENS.md)
- [AMP Architecture Blueprint](AMP_ARCHITECTURE_BLUEPRINT.md)
- [Contributing Guide](../CONTRIBUTING.md)
