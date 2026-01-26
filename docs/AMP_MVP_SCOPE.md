# AMP MVP Scope
## 8-Week Minimum Viable Product Definition

**Document Version:** 1.0  
**Last Updated:** 2026-01-26  
**Status:** Foundation Document  
**Timeline:** 8 weeks (56 days)

---

## Executive Summary

The AMP MVP focuses on delivering core value to Pattaya real estate agents: **automated property listing management** and **intelligent lead handling via LINE**. By narrowing scope to these two critical pain points, we can launch in 8 weeks with a product that immediately saves agents 15+ hours per week.

**MVP Philosophy:** Ship something agents will pay for on Day 1, not something technically impressive but unusable.

**Success Metric:** 10 paying customers within 2 weeks of launch.

---

## MVP Core Features

### 1. Multi-Platform Listing Management (Priority: CRITICAL)

**User Story:** As a real estate agent, I want to post property listings to multiple Thai platforms from one place, so I don't waste hours on repetitive data entry.

**Scope:**

✅ **IN SCOPE:**
- Create/edit property listings in AMP
- One-click publish to 3 platforms:
  - DDProperty (primary)
  - Hipflat (secondary)
  - Facebook Marketplace (free reach)
- Basic property data:
  - Title (Thai + English)
  - Description
  - Price, size, bedrooms, bathrooms
  - Location (province, district, address)
  - Property type (condo, house, villa, land)
  - Up to 10 images
- Listing status: Draft, Active, Sold, Expired
- Manual refresh/bump on platforms
- Basic listing performance (views, inquiries)

❌ **OUT OF SCOPE:**
- Additional platforms (PropertyGuru, Prakard) → Post-MVP
- Automated re-posting schedules → Post-MVP
- Advanced analytics per platform → Post-MVP
- Video uploads → Post-MVP
- 3D/virtual tours → Post-MVP
- Bulk import from Excel → Post-MVP

**Technical Implementation:**
- FastAPI endpoints for CRUD operations
- Platform adapters for DDProperty, Hipflat, Facebook
- PostgreSQL for listing storage
- Redis cache for platform rate limiting
- Retry logic with exponential backoff

**Acceptance Criteria:**
- [ ] Agent can create a listing in < 3 minutes
- [ ] Listing successfully posts to all 3 platforms in < 30 seconds
- [ ] 95% success rate on platform API calls
- [ ] Agent can see which platforms listing is live on
- [ ] Errors are clearly displayed with actionable messages

**Estimated Effort:** 18 days (Week 1-3)

---

### 2. LINE Bot for Lead Communication (Priority: CRITICAL)

**User Story:** As a real estate agent, I want my LINE account to automatically respond to property inquiries 24/7, so I never lose a hot lead to slow response times.

**Scope:**

✅ **IN SCOPE:**
- LINE Official Account setup and webhook
- Automated responses to common questions:
  - Property availability
  - Viewing schedule requests
  - Price confirmation
  - Location details
  - Contact information
- Natural language understanding (Thai + English)
- Intent classification:
  - General inquiry
  - Viewing request
  - Price negotiation
  - Already customer (follow-up)
- Lead capture from LINE conversations
- Escalation to human agent (manual takeover)
- Conversation history view in dashboard
- Basic lead information collection:
  - Name, phone number
  - Budget range
  - Preferred locations
  - Timeline (urgent, 1-3 months, 3-6 months)

❌ **OUT OF SCOPE:**
- Multi-turn complex conversations → Post-MVP
- Voice message transcription → Post-MVP
- Image recognition (property photos) → Post-MVP
- Automated viewing scheduling → Post-MVP
- Payment/deposit collection → Post-MVP
- Rich media messages (carousels, flex) → Post-MVP

**Technical Implementation:**
- LINE Messaging API integration
- FlowBiz AI Core for NLP and response generation
- Intent classifier with predefined templates
- Redis for conversation context (1-hour TTL)
- PostgreSQL for lead storage
- Human takeover flag in database

**Acceptance Criteria:**
- [ ] LINE bot responds within 5 seconds
- [ ] 80% intent classification accuracy
- [ ] Agent can review all conversations in dashboard
- [ ] Agent can "take over" conversation manually
- [ ] Lead data automatically saved to CRM
- [ ] No duplicate leads created

**Estimated Effort:** 15 days (Week 3-5)

---

### 3. Simple Lead Management Dashboard (Priority: HIGH)

**User Story:** As a real estate agent, I want to see all my leads in one place with their status and next actions, so I know who to follow up with today.

**Scope:**

✅ **IN SCOPE:**
- Lead list view with filters:
  - Status (New, Contacted, Viewing Scheduled, Negotiating, Won, Lost)
  - Source (LINE, Facebook, Walk-in, Referral)
  - Date range
- Lead detail page showing:
  - Contact information
  - Budget and preferences
  - Interaction history (LINE messages, notes)
  - Associated properties
- Manual lead creation (for offline sources)
- Simple lead scoring:
  - Hot (budget confirmed, urgent timeline)
  - Warm (interested, 1-3 month timeline)
  - Cold (browsing, 6+ month timeline)
- Quick actions:
  - Add note
  - Change status
  - Assign property
  - Mark as won/lost
- Basic statistics:
  - Total leads this month
  - Conversion rate
  - Response time average

❌ **OUT OF SCOPE:**
- AI-powered lead scoring → Post-MVP
- Automated nurture sequences → Post-MVP
- Email integration → Post-MVP
- Lead assignment to multiple agents → Post-MVP
- Advanced reporting → Post-MVP
- Lead import from other CRMs → Post-MVP

**Technical Implementation:**
- FastAPI REST API for lead management
- React or Vue.js for dashboard (or simple Jinja templates)
- PostgreSQL with indexes on status, created_at
- Server-side pagination
- Basic CSS framework (Tailwind or Bootstrap)

**Acceptance Criteria:**
- [ ] Dashboard loads in < 2 seconds
- [ ] Agent can filter leads by status
- [ ] Lead detail page shows complete history
- [ ] Quick actions save without page reload
- [ ] Mobile-responsive design

**Estimated Effort:** 12 days (Week 5-7)

---

### 4. Essential System Features (Priority: HIGH)

**User Story:** As a user, I need reliable authentication, health monitoring, and clear documentation to trust the system.

**Scope:**

✅ **IN SCOPE:**
- User authentication:
  - Email + password login
  - JWT tokens (7-day expiry)
  - Password reset flow
- User roles:
  - Agent (basic access)
  - Admin (full access, user management)
- Health monitoring:
  - `/healthz` endpoint with detailed checks
  - Database connectivity check
  - Redis connectivity check
  - External API status
- API documentation:
  - OpenAPI/Swagger auto-generated docs
  - Example requests/responses
- Error handling:
  - User-friendly error messages
  - Error logging with request IDs
- Basic admin panel:
  - User list and management
  - System statistics
  - Platform API status

❌ **OUT OF SCOPE:**
- OAuth (Google, Facebook) → Post-MVP
- Two-factor authentication → Post-MVP
- Advanced monitoring (Prometheus, Grafana) → Post-MVP
- Audit logs → Post-MVP
- RBAC beyond Agent/Admin → Post-MVP

**Technical Implementation:**
- FastAPI with JWT authentication
- Password hashing with bcrypt
- Structured logging (JSON format)
- Health check with timeout checks
- Admin panel with basic HTML templates

**Acceptance Criteria:**
- [ ] Users can register, login, reset password
- [ ] JWT tokens work correctly with expiry
- [ ] Health endpoint returns detailed status
- [ ] All errors logged with request IDs
- [ ] Admin can manage users

**Estimated Effort:** 8 days (Week 7-8)

---

## MVP Timeline (8 Weeks)

### Week 1-2: Foundation & Listing Agent (18 days)

**Week 1 (Days 1-7):**
- [ ] Project setup and repository initialization
- [ ] Database schema design and migrations
- [ ] FastAPI application structure
- [ ] Authentication system (JWT)
- [ ] User registration and login
- [ ] Basic admin panel

**Week 2 (Days 8-14):**
- [ ] Property listing CRUD API
- [ ] DDProperty API integration
- [ ] Hipflat API integration
- [ ] Facebook Marketplace integration
- [ ] Image upload to S3
- [ ] Listing dashboard (basic view)

**Deliverables:**
- ✅ Working authentication
- ✅ Agents can create and manage listings
- ✅ Listings auto-post to 3 platforms

---

### Week 3-4: LINE Bot & Communication Agent (15 days)

**Week 3 (Days 15-21):**
- [ ] LINE Official Account setup
- [ ] LINE webhook endpoint
- [ ] Message parsing and validation
- [ ] Intent classification model
- [ ] Response template system
- [ ] FlowBiz AI Core integration

**Week 4 (Days 22-28):**
- [ ] Lead capture from LINE messages
- [ ] Conversation context management
- [ ] Human agent escalation flow
- [ ] Conversation history view
- [ ] Testing with real LINE accounts

**Deliverables:**
- ✅ LINE bot responds to inquiries automatically
- ✅ Leads captured from conversations
- ✅ Agents can review conversation history

---

### Week 5-6: Lead Management Dashboard (12 days)

**Week 5 (Days 29-35):**
- [ ] Lead list API with filters
- [ ] Lead detail API
- [ ] Lead scoring logic (simple rules-based)
- [ ] Dashboard frontend (React/Vue or templates)
- [ ] Lead status workflow

**Week 6 (Days 36-42):**
- [ ] Quick actions (notes, status changes)
- [ ] Mobile-responsive design
- [ ] Statistics calculations
- [ ] Search and filter optimization
- [ ] Integration testing

**Deliverables:**
- ✅ Lead management dashboard
- ✅ Agents can track and manage leads
- ✅ Basic lead scoring implemented

---

### Week 7-8: Polish, Testing & Launch Prep (14 days)

**Week 7 (Days 43-49):**
- [ ] End-to-end testing
- [ ] Bug fixes from testing
- [ ] Performance optimization
- [ ] Error handling improvements
- [ ] Documentation updates
- [ ] User guide creation

**Week 8 (Days 50-56):**
- [ ] Beta user onboarding (5 users)
- [ ] Beta feedback collection
- [ ] Critical bug fixes
- [ ] Production deployment setup
- [ ] Monitoring and alerting setup
- [ ] Launch checklist completion

**Deliverables:**
- ✅ Production-ready system
- ✅ 5 beta users successfully onboarded
- ✅ Documentation complete
- ✅ Launch ready

---

## MVP Success Criteria

### Technical Success

**System Performance:**
- [ ] 99% uptime during beta period
- [ ] API response time < 500ms (p95)
- [ ] Zero data loss incidents
- [ ] All critical bugs resolved

**Integration Success:**
- [ ] 95% success rate on platform API calls
- [ ] LINE bot 99% message delivery
- [ ] Lead capture 100% accuracy

**Code Quality:**
- [ ] 70%+ test coverage
- [ ] All linting rules passing
- [ ] Security scan with no critical issues
- [ ] API documentation complete

### Business Success

**User Adoption:**
- [ ] 10 beta users signed up
- [ ] 8 beta users actively using (80% retention)
- [ ] Average 50+ listings posted
- [ ] Average 200+ LINE messages handled

**User Satisfaction:**
- [ ] Net Promoter Score (NPS) > 30
- [ ] 90% of users say they save 10+ hours/week
- [ ] 70% of users willing to pay announced price
- [ ] Zero critical usability complaints

**Business Metrics:**
- [ ] 5 confirmed paying customers by Week 10
- [ ] Average response time < 5 minutes (vs 4 hours before)
- [ ] 50+ properties listed on platform
- [ ] 3 deals closed through platform (tracked)

---

## Out of Scope (Post-MVP)

### Deferred to Phase 2 (Months 3-4)

**Advanced Communication Features:**
- Rich LINE messages (carousels, buttons)
- Voice message transcription
- Multi-turn complex conversations
- Chatbot personality customization

**Enhanced Listing Management:**
- Additional platforms (PropertyGuru, Prakard, etc.)
- Automated re-posting schedules
- Bulk import/export
- Video uploads
- Advanced analytics per platform

**Lead Management Pro:**
- AI-powered lead scoring
- Automated nurture email sequences
- Email/SMS integration
- Lead assignment automation
- CRM integration (Salesforce, etc.)

### Deferred to Phase 3 (Months 5-6)

**Analytics & Reporting:**
- Market trend analysis
- Competitor intelligence
- Pricing recommendations
- Performance dashboards per agent
- Custom report builder

**Virtual Tours:**
- 360° photo integration
- Virtual tour scheduling
- In-tour analytics
- AR visualization

**Document Management:**
- Contract generation from templates
- Digital signatures
- Document storage and versioning
- Multi-language documents

**Advanced Admin:**
- Multi-agency support
- White-label customization
- Team management and permissions
- API for third-party integrations

---

## Risk Mitigation

### Technical Risks

**RISK:** Platform API rate limits or changes
**Impact:** High - Could break core functionality
**Mitigation:**
- Implement retry logic with exponential backoff
- Cache platform data where possible
- Monitor API status daily
- Build fallback manual posting mode
**Contingency:** If API breaks, fall back to manual mode + support tickets

**RISK:** LINE API quota limits
**Impact:** Medium - Message delays during peak
**Mitigation:**
- Start with LINE Official Account (higher limits)
- Implement message queueing
- Monitor usage daily
**Contingency:** Upgrade LINE plan if approaching limits

**RISK:** Low test coverage causes production bugs
**Impact:** Medium - User frustration, churn
**Mitigation:**
- Prioritize integration tests for critical paths
- Manual QA with beta users before launch
- Quick hotfix deployment process
**Contingency:** Daily bug fix sprints during Week 1-2 of beta

### Business Risks

**RISK:** Beta users don't see value (low engagement)
**Impact:** High - Delays paying customer acquisition
**Mitigation:**
- Offer white-glove onboarding (1-on-1 calls)
- Weekly check-ins with beta users
- Quick iteration on feedback
**Contingency:** Extended beta period, pivot features based on feedback

**RISK:** Scope creep during development
**Impact:** High - Missed 8-week deadline
**Mitigation:**
- Strict scope adherence
- Weekly scope review meetings
- "Nice to have" backlog for post-MVP
**Contingency:** Cut lower-priority features (lead scoring → manual, Facebook → 2 platforms only)

**RISK:** Can't acquire 10 beta users
**Impact:** Medium - Slower validation cycle
**Mitigation:**
- Start beta recruitment in Week 4
- Offer 3 months free + lifetime discount
- Leverage personal network and Facebook groups
**Contingency:** Launch with 5 users, extend beta period

---

## MVP Feature Comparison

### What We're Building

| Feature | MVP (Week 8) | Post-MVP (Month 6) |
|---------|--------------|---------------------|
| **Listings** | 3 platforms, basic data | 7 platforms, advanced features |
| **LINE Bot** | Auto-response, lead capture | Multi-turn, rich messages, voice |
| **Lead Management** | Simple dashboard, manual scoring | AI scoring, automated nurture |
| **Analytics** | Basic stats | Predictive insights, reports |
| **Tours** | ❌ | Virtual tours, scheduling |
| **Documents** | ❌ | Auto-generation, e-signatures |
| **Users** | Single agent | Multi-agent teams |

### Why This Scope?

**We're NOT building:**
- A full property management system (too big)
- An AI chatbot showcase (not the value)
- A data analytics platform (premature)

**We ARE building:**
- A tool agents will pay for on Day 1
- Something that saves 15+ hours/week immediately
- A foundation to add more agents later

**Key Insight:** Agents need **time savings** more than **AI magic**. Automating 80% of their manual work (posting, responding) delivers immediate ROI.

---

## Post-MVP Roadmap

### Month 3-4: Power User Features

**Goal:** Convert beta users to power users, acquire 30 paying customers

**Features:**
- Additional listing platforms (PropertyGuru, Prakard)
- Automated re-posting schedules
- Advanced lead scoring (AI-powered)
- Email integration
- Bulk operations (import, update, delete)
- Mobile-responsive improvements

**Success Metrics:**
- 30 paying customers
- 100,000 THB MRR
- 90-day retention > 80%

### Month 5-6: Agency Features

**Goal:** Target agencies with 3-10 agents, reach 100 customers

**Features:**
- Multi-agent collaboration
- Team performance dashboard
- Role-based permissions
- Virtual tour scheduling
- Document generation (basic contracts)
- Custom branding options

**Success Metrics:**
- 100 paying customers (including 5 agencies)
- 350,000 THB MRR
- Agency plan (11,900 THB/month) adoption

### Month 7-12: Market Leader

**Goal:** Dominate Pattaya market, expand to Bangkok

**Features:**
- Predictive analytics and pricing
- Market intelligence reports
- Full document management suite
- White-label solutions
- Mobile apps (iOS, Android)
- Integrate with property management systems

**Success Metrics:**
- 300 paying customers
- 1,200,000 THB MRR
- Market leader in Pattaya
- Bangkok pilot with 20 customers

---

## Development Best Practices

### Code Standards

**Python:**
- Follow PEP 8 style guide
- Type hints for all functions
- Docstrings for public APIs
- Max function length: 50 lines

**Testing:**
- Unit tests for business logic
- Integration tests for APIs
- E2E tests for critical flows
- Target 70% coverage

**Documentation:**
- README for each package
- API documentation (OpenAPI)
- Architecture decision records (ADRs)
- User guides for each feature

### Git Workflow

**Branch Strategy:**
- `main` - Production-ready code
- `develop` - Integration branch
- `feature/[issue-number]-[short-name]` - Feature branches
- `hotfix/[issue-number]-[short-name]` - Urgent fixes

**Commit Messages:**
- Use conventional commits format
- Reference issue number
- Keep under 72 characters

**Pull Requests:**
- Link to issue/task
- Include testing evidence
- Request review from 1 person minimum
- Merge only after CI passes

### Deployment Process

**Environments:**
1. **Local** - Developer machine
2. **Development** - Shared dev server (optional)
3. **Staging** - Pre-production testing
4. **Production** - Live customer-facing

**Deployment Checklist:**
- [ ] All tests passing
- [ ] Database migrations tested
- [ ] Environment variables configured
- [ ] Health check endpoint verified
- [ ] Rollback plan documented
- [ ] Monitoring alerts configured

---

## MVP Budget Breakdown

### Development Costs (8 Weeks)

| Category | Budget (THB) | Allocation |
|----------|--------------|------------|
| **Core Platform** | 80,000 | FastAPI, PostgreSQL, Redis setup |
| **Listing Agent** | 60,000 | Multi-platform integration, APIs |
| **Communication Agent** | 50,000 | LINE bot, NLP, FlowBiz AI Core |
| **Lead Management** | 40,000 | Dashboard, frontend, scoring |
| **Testing & QA** | 30,000 | Manual testing, bug fixes |
| **Documentation** | 15,000 | User guides, API docs |
| **Infrastructure** | 25,000 | VPS, domains, services |
| **Total MVP** | **300,000** | |

### Operating Costs (Monthly)

| Category | Cost (THB/month) | Notes |
|----------|------------------|-------|
| VPS Hosting | 5,000 | FlowBiz VPS allocation |
| LINE API | 1,500 | Official Account + messaging |
| External APIs | 3,000 | Platform APIs, maps |
| S3 Storage | 800 | Image and document storage |
| Domain + SSL | 500 | Domain renewal, SSL cert |
| Monitoring | 1,200 | Uptime monitoring, logging |
| **Total Monthly** | **12,000** | |

**Break-even Calculation:**
- Monthly operating cost: 12,000 THB
- Average subscription: 4,500 THB
- Break-even customers: 3
- Target: 10 paying customers by Month 3

---

## Appendix A: User Stories (Detailed)

### Epic 1: Property Listing Management

**Story 1.1: Create Property Listing**
- **As a** real estate agent
- **I want to** create a property listing with all details
- **So that** I can market the property

**Acceptance Criteria:**
- Agent fills form with property details
- Form validates required fields
- Images upload successfully (max 10)
- Listing saves as Draft
- Agent receives confirmation message

**Story 1.2: Publish to Multiple Platforms**
- **As a** real estate agent
- **I want to** publish my listing to DDProperty, Hipflat, and Facebook with one click
- **So that** I save time and reach more buyers

**Acceptance Criteria:**
- Single "Publish" button posts to all platforms
- System shows real-time publishing status
- Agent sees platform-specific listing IDs
- Failed platforms shown with error message
- Agent can retry failed platforms

### Epic 2: LINE Communication

**Story 2.1: Auto-respond to Inquiries**
- **As a** real estate agent
- **I want** my LINE account to automatically respond to common questions
- **So that** I never miss a lead due to slow response

**Acceptance Criteria:**
- Bot responds within 5 seconds
- Responses are contextually relevant
- Bot answers: availability, price, location, viewing
- Bot captures lead information
- Agent notified of high-priority inquiries

**Story 2.2: Conversation Takeover**
- **As a** real estate agent
- **I want to** take over a conversation from the bot when needed
- **So that** I can handle complex negotiations personally

**Acceptance Criteria:**
- Agent sees "Take Over" button in dashboard
- After takeover, bot stops responding
- Agent can message directly through LINE
- Conversation history preserved
- Agent can release conversation back to bot

### Epic 3: Lead Management

**Story 3.1: View All Leads**
- **As a** real estate agent
- **I want to** see all my leads in one dashboard
- **So that** I know who to follow up with

**Acceptance Criteria:**
- Dashboard shows lead list
- Filters by status, source, date work
- Each lead shows: name, status, score, last contact
- Pagination for large lists
- Mobile-friendly layout

**Story 3.2: Lead Detail and History**
- **As a** real estate agent
- **I want to** see complete lead history and details
- **So that** I can personalize my communication

**Acceptance Criteria:**
- Lead detail page shows all information
- Interaction history in chronological order
- LINE conversation history visible
- Quick actions available (add note, change status)
- Associated properties shown

---

## Appendix B: Technical Debt and Trade-offs

### Known Technical Debt

**1. Simple Lead Scoring (Rule-Based)**
- **Decision:** Use simple rules instead of ML model
- **Rationale:** Faster to implement, good enough for MVP
- **Debt:** Will need retraining data for ML model later
- **Timeline to Address:** Month 3-4

**2. No Message Queue for LINE**
- **Decision:** Process LINE messages synchronously
- **Rationale:** Simpler architecture, works for < 1000 messages/day
- **Debt:** May hit rate limits at scale
- **Timeline to Address:** Month 5-6 if needed

**3. Basic Frontend (HTML Templates)**
- **Decision:** Server-rendered HTML instead of SPA
- **Rationale:** Faster development, good enough UX
- **Debt:** Less responsive, harder to add real-time features
- **Timeline to Address:** Month 4-5 (React/Vue migration)

**4. No Caching for Listing Views**
- **Decision:** Direct database queries for listing data
- **Rationale:** Premature optimization
- **Debt:** May slow down at high traffic
- **Timeline to Address:** Month 3 if performance issues

### Acceptable Trade-offs

**✅ Manual Lead Scoring** - Saves 5 days dev time, good enough for MVP  
**✅ Limited Platforms (3)** - Faster integration, covers 70% of market  
**✅ Basic LINE Bot** - Simple responses, no rich messages  
**✅ No Email Integration** - LINE covers 90% of customer communication in Thailand  
**✅ Simple Admin Panel** - Basic HTML, no fancy charts yet  

**❌ Skipping Tests** - NOT acceptable, maintain 70% coverage  
**❌ No Error Handling** - NOT acceptable, must be production-ready  
**❌ Security Shortcuts** - NOT acceptable, use proper auth and validation  

---

## Document Control

**Maintained by:** AMP Product Team  
**Review Cycle:** Weekly during MVP development, monthly post-launch  
**Next Review:** 2026-02-02 (Week 1 check-in)

**Related Documents:**
- [AMP_BUSINESS_LENS.md](AMP_BUSINESS_LENS.md) - Business model and KPIs
- [AMP_ARCHITECTURE_BLUEPRINT.md](AMP_ARCHITECTURE_BLUEPRINT.md) - Technical architecture
- [CONTRIBUTING.md](../CONTRIBUTING.md) - Development guidelines

**Changelog:**
- 2026-01-26: Initial document creation (v1.0)
