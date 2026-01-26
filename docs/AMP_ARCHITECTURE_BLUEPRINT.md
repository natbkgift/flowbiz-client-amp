# AMP Architecture Blueprint
## ระบบสถาปัตยกรรม: Asset Management Property Platform

**Document Version:** 1.0  
**Last Updated:** 2026-01-26  
**Status:** Foundation Document

---

## Executive Overview

AMP is built on a microservices-inspired architecture using FastAPI as the core framework, integrated with FlowBiz AI Core for agent orchestration. The system is designed for scalability, maintainability, and rapid feature deployment while maintaining strict security boundaries.

**Architecture Philosophy:**
- **Agent-Centric Design** - 7 specialized AI agents as first-class citizens
- **Event-Driven** - Asynchronous communication between components
- **API-First** - RESTful APIs with OpenAPI documentation
- **Localhost-Bound** - Security through system-level nginx proxy
- **Stateless Services** - Horizontal scaling capability

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         INTERNET                                     │
└────────────────────────────┬────────────────────────────────────────┘
                             │ HTTPS (443)
                             │
                ┌────────────▼────────────┐
                │   System Nginx          │ ← Managed by infrastructure
                │   (VPS-level)           │   SSL/TLS termination
                │   SSL + Reverse Proxy   │   Public → Localhost routing
                └────────────┬────────────┘
                             │ HTTP (127.0.0.1:8000)
                             │
┌────────────────────────────┴────────────────────────────────────────┐
│                     AMP SERVICE BOUNDARY                             │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                  FastAPI Application                          │  │
│  │                                                                │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │  │
│  │  │   Health    │  │   Metadata  │  │   Admin     │          │  │
│  │  │  /healthz   │  │  /v1/meta   │  │  /v1/admin  │          │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘          │  │
│  │                                                                │  │
│  │  ┌──────────────────── API Routes ─────────────────────────┐ │  │
│  │  │                                                           │ │  │
│  │  │  /v1/listings  /v1/leads  /v1/agents  /v1/analytics     │ │  │
│  │  │  /v1/tours     /v1/docs   /v1/reports                   │ │  │
│  │  │                                                           │ │  │
│  │  └───────────────────────┬───────────────────────────────────┘ │  │
│  │                          │                                     │  │
│  │  ┌───────────────────────▼───────────────────────────────────┐ │  │
│  │  │              Agent Orchestration Layer                    │ │  │
│  │  │         (FlowBiz AI Core Integration)                     │ │  │
│  │  └───────────────────────┬───────────────────────────────────┘ │  │
│  │                          │                                     │  │
│  └──────────────────────────┼─────────────────────────────────────┘  │
│                             │                                        │
│  ┌──────────────────────────▼─────────────────────────────────────┐ │
│  │                    AI AGENTS (7)                                │ │
│  │                                                                  │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │ │
│  │  │ Listing  │ │  Comms   │ │   Lead   │ │Analytics │          │ │
│  │  │  Agent   │ │  Agent   │ │  Agent   │ │  Agent   │          │ │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘          │ │
│  │       │            │            │            │                 │ │
│  │  ┌────▼─────┐ ┌───▼──────┐ ┌───▼──────┐                       │ │
│  │  │   Tour   │ │ Document │ │ Reporting│                       │ │
│  │  │  Agent   │ │  Agent   │ │  Agent   │                       │ │
│  │  └──────────┘ └──────────┘ └──────────┘                       │ │
│  │                                                                  │ │
│  └────────────────────────┬─────────────────────────────────────────┘ │
│                           │                                           │
│  ┌────────────────────────▼─────────────────────────────────────┐   │
│  │                  Data Layer                                   │   │
│  │                                                                │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │   │
│  │  │PostgreSQL│  │  Redis   │  │   S3     │  │  Vector  │     │   │
│  │  │   DB     │  │  Cache   │  │ Storage  │  │   DB     │     │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘     │   │
│  │                                                                │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
                             │
                   ┌─────────▼─────────┐
                   │  External APIs    │
                   │                   │
                   │ • LINE API        │
                   │ • DDProperty      │
                   │ • Hipflat         │
                   │ • PropertyGuru    │
                   │ • Email/SMS       │
                   └───────────────────┘
```

---

## Technology Stack

### Core Framework

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Backend** | FastAPI | 0.104+ | Web framework, async support |
| **Language** | Python | 3.11+ | Primary development language |
| **ASGI Server** | Uvicorn | 0.24+ | Production ASGI server |
| **Validation** | Pydantic | 2.5+ | Data validation, settings |

### AI & ML

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **LLM Integration** | FlowBiz AI Core | Latest | Agent orchestration |
| **Vector DB** | Qdrant | 1.7+ | Semantic search, embeddings |
| **ML Framework** | Scikit-learn | 1.3+ | Lead scoring, analytics |
| **NLP** | spaCy | 3.7+ | Thai language processing |

### Data & Storage

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Database** | PostgreSQL | 15+ | Primary data store |
| **Cache** | Redis | 7.2+ | Session, rate limiting |
| **Object Storage** | S3-compatible | - | Images, documents |
| **ORM** | SQLAlchemy | 2.0+ | Database abstraction |
| **Migrations** | Alembic | 1.12+ | Schema versioning |

### External Integrations

| Service | Provider | Purpose |
|---------|----------|---------|
| **Messaging** | LINE Messaging API | Customer communication |
| **Property Platforms** | DDProperty, Hipflat, etc. | Listing syndication |
| **Maps** | Google Maps API | Location services |
| **Email** | SendGrid / Mailgun | Transactional emails |
| **SMS** | Twilio (optional) | SMS notifications |

### Infrastructure

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Containerization** | Docker | Application packaging |
| **Orchestration** | Docker Compose | Local development |
| **Reverse Proxy** | Nginx (system-level) | SSL, routing |
| **Monitoring** | Prometheus + Grafana | Metrics, alerting |
| **Logging** | Structured JSON | Centralized logging |

### Development Tools

| Tool | Purpose |
|------|---------|
| **Linting** | Ruff | Fast Python linter |
| **Testing** | pytest | Unit and integration tests |
| **Type Checking** | mypy | Static type analysis |
| **API Docs** | OpenAPI/Swagger | Auto-generated docs |
| **CI/CD** | GitHub Actions | Automated testing/deployment |

---

## AI Agent Architecture

### Agent Design Pattern

Each AI agent follows a consistent pattern:

```python
# Conceptual Agent Structure (NOT implementation code)

class BaseAgent:
    """Base class for all AMP agents"""
    
    def __init__(self, config: AgentConfig):
        self.name: str
        self.description: str
        self.capabilities: List[str]
        self.llm_client: FlowBizClient
        
    async def process(self, context: AgentContext) -> AgentResponse:
        """Main processing entry point"""
        
    async def validate_input(self, input_data: Dict) -> bool:
        """Validate agent input"""
        
    async def execute_task(self, task: AgentTask) -> TaskResult:
        """Execute specific task"""
        
    def get_prompt_template(self, task_type: str) -> str:
        """Get LLM prompt for task"""
```

### Agent Registry

#### 1. Listing Agent (ลิสต์โฆษณา)

**Responsibilities:**
- Manage property listings across multiple platforms
- Synchronize listing data (DDProperty, Hipflat, etc.)
- Handle listing lifecycle (create, update, publish, unpublish)
- Monitor listing performance and engagement

**Key Capabilities:**
- Multi-platform posting with platform-specific formatting
- Image optimization and watermarking
- Pricing recommendations based on market data
- Listing quality scoring
- Automated re-posting and refresh scheduling

**Endpoints:**
- `POST /v1/agents/listing/create`
- `PUT /v1/agents/listing/{id}/update`
- `POST /v1/agents/listing/{id}/sync`
- `GET /v1/agents/listing/{id}/performance`

#### 2. Communication Agent (สื่อสาร)

**Responsibilities:**
- LINE bot message handling
- Automated response generation
- Conversation context management
- Escalation to human agents

**Key Capabilities:**
- Natural language understanding (Thai + English)
- Intent classification (inquiry, viewing request, negotiation)
- Contextual responses based on property data
- Sentiment analysis for prioritization
- Multi-turn conversation tracking

**Endpoints:**
- `POST /v1/agents/comms/webhook` (LINE webhook)
- `GET /v1/agents/comms/conversations`
- `POST /v1/agents/comms/respond`
- `PUT /v1/agents/comms/escalate`

#### 3. Lead Agent (ลูกค้า)

**Responsibilities:**
- Lead capture from multiple sources
- Lead scoring and prioritization
- Nurturing sequence automation
- Conversion tracking

**Key Capabilities:**
- Multi-source lead aggregation
- AI-driven scoring algorithm (budget, intent, timeline)
- Automated follow-up sequences
- Lead assignment to agents
- CRM integration

**Endpoints:**
- `POST /v1/agents/lead/capture`
- `GET /v1/agents/lead/{id}/score`
- `PUT /v1/agents/lead/{id}/nurture`
- `GET /v1/agents/lead/hot` (high-priority leads)

#### 4. Analytics Agent (วิเคราะห์)

**Responsibilities:**
- Market trend analysis
- Pricing insights and recommendations
- Competitor intelligence
- Performance reporting

**Key Capabilities:**
- Market data aggregation and analysis
- Pricing prediction models
- Competitor listing monitoring
- Neighborhood trends analysis
- Custom report generation

**Endpoints:**
- `GET /v1/agents/analytics/market`
- `GET /v1/agents/analytics/pricing/{property_id}`
- `GET /v1/agents/analytics/competitors`
- `POST /v1/agents/analytics/report/generate`

#### 5. Tour Agent (ชมบ้าน)

**Responsibilities:**
- Virtual tour scheduling and management
- 360° viewing session coordination
- In-person tour scheduling
- No-show prediction and reminders

**Key Capabilities:**
- Calendar integration
- Automated scheduling with conflict detection
- Virtual tour session management
- Reminder notifications (LINE, Email, SMS)
- Feedback collection post-tour

**Endpoints:**
- `POST /v1/agents/tour/schedule`
- `GET /v1/agents/tour/calendar`
- `PUT /v1/agents/tour/{id}/reschedule`
- `POST /v1/agents/tour/{id}/feedback`

#### 6. Document Agent (เอกสาร)

**Responsibilities:**
- Contract generation from templates
- Document verification
- Digital signature workflow
- Document storage and retrieval

**Key Capabilities:**
- Template-based contract generation
- Multi-language documents (Thai, English)
- OCR for document scanning
- Version control and audit trail
- E-signature integration

**Endpoints:**
- `POST /v1/agents/document/generate`
- `GET /v1/agents/document/{id}`
- `POST /v1/agents/document/{id}/sign`
- `GET /v1/agents/document/templates`

#### 7. Reporting Agent (รายงาน)

**Responsibilities:**
- KPI dashboard generation
- Performance metrics calculation
- Automated report delivery
- Custom analytics views

**Key Capabilities:**
- Real-time KPI calculation
- Historical trend analysis
- Agent performance metrics
- Financial reporting
- Export to PDF/Excel

**Endpoints:**
- `GET /v1/agents/reporting/dashboard`
- `GET /v1/agents/reporting/kpis`
- `POST /v1/agents/reporting/custom`
- `GET /v1/agents/reporting/export`

---

## Data Flow Architecture

### Request Flow

```
User Request
    │
    ▼
System Nginx (SSL termination)
    │
    ▼
FastAPI Application (localhost:8000)
    │
    ├─→ Authentication Middleware
    │   │
    │   ▼
    ├─→ Rate Limiting (Redis)
    │   │
    │   ▼
    ├─→ Route Handler
    │   │
    │   ▼
    ├─→ Agent Orchestrator
    │   │
    │   ├─→ Select Appropriate Agent
    │   │
    │   ├─→ Prepare Agent Context
    │   │
    │   ├─→ Execute Agent Task
    │   │   │
    │   │   ├─→ FlowBiz AI Core (LLM)
    │   │   │
    │   │   ├─→ External APIs (LINE, platforms)
    │   │   │
    │   │   ├─→ Database Operations
    │   │   │
    │   │   └─→ Cache Operations
    │   │
    │   └─→ Return Agent Response
    │
    ▼
Response to User
```

### Event Flow (Asynchronous)

```
Event Source (LINE webhook, scheduled job, user action)
    │
    ▼
Event Queue (Redis Stream or background task)
    │
    ▼
Event Handler
    │
    ├─→ Event Validation
    │
    ├─→ Route to Agent
    │   │
    │   ▼
    ├─→ Agent Processing
    │   │
    │   ├─→ State Update (PostgreSQL)
    │   │
    │   ├─→ Cache Invalidation (Redis)
    │   │
    │   └─→ Trigger Dependent Events
    │
    └─→ Notification (if required)
```

### Data Persistence Flow

```
API Request
    │
    ▼
Business Logic Layer
    │
    ├─→ Data Validation (Pydantic)
    │
    ├─→ Authorization Check
    │
    ▼
Data Access Layer (SQLAlchemy)
    │
    ├─→ Write to PostgreSQL (transactional)
    │
    ├─→ Update Cache (Redis)
    │   │
    │   └─→ Set TTL based on data type
    │
    ├─→ Store Files (S3)
    │   │
    │   └─→ Generate presigned URLs
    │
    └─→ Index in Vector DB (Qdrant)
        │
        └─→ For semantic search
```

---

## Security Architecture

### Network Security

```
┌─────────────────────────────────────────┐
│         Security Boundaries             │
├─────────────────────────────────────────┤
│                                         │
│  Internet (Public)                      │
│    │                                    │
│    ▼                                    │
│  System Nginx (VPS-level)               │
│    • SSL/TLS Termination                │
│    • DDoS Protection                    │
│    • Rate Limiting                      │
│    • Security Headers                   │
│    │                                    │
│    ▼                                    │
│  Localhost (127.0.0.1)                  │
│    │                                    │
│    ▼                                    │
│  AMP Application                        │
│    • JWT Authentication                 │
│    • Role-Based Access Control          │
│    • Input Validation                   │
│    • SQL Injection Prevention           │
│    │                                    │
│    ▼                                    │
│  Database (localhost)                   │
│    • Encrypted at Rest                  │
│    • Separate User Credentials          │
│    • Backup Encryption                  │
│                                         │
└─────────────────────────────────────────┘
```

### Authentication & Authorization

**Authentication Methods:**
- JWT tokens for API access
- LINE OAuth for user login
- API keys for platform integrations
- Session-based for admin panel

**Authorization Levels:**
1. **Public** - Health check, metadata
2. **User** - Basic property viewing
3. **Agent** - Listing management, lead access
4. **Agency** - Multi-agent management, reports
5. **Admin** - System configuration, user management

### Data Protection

**Sensitive Data Handling:**
- PII (Personally Identifiable Information) encryption
- Secure key management (environment variables, secrets)
- Data retention policies
- GDPR-ready data export/deletion

**API Security:**
- HTTPS only (enforced by system nginx)
- CORS configuration
- CSRF protection
- Rate limiting per endpoint
- API key rotation

---

## Scalability & Performance

### Horizontal Scaling

```
┌────────────────────────────────────────┐
│         Load Balancer (nginx)          │
│                                        │
└────────┬────────┬────────┬─────────────┘
         │        │        │
    ┌────▼────┐ ┌▼────────┐ ┌▼──────────┐
    │ AMP     │ │ AMP     │ │ AMP       │
    │ Instance│ │ Instance│ │ Instance  │
    │ 1       │ │ 2       │ │ 3         │
    └────┬────┘ └┬────────┘ └┬──────────┘
         │       │           │
         └───────┴───────────┘
                 │
         ┌───────▼──────────┐
         │  Shared Services │
         │  • PostgreSQL    │
         │  • Redis         │
         │  • S3 Storage    │
         └──────────────────┘
```

### Caching Strategy

**Cache Layers:**

1. **Application Cache (Redis)**
   - User sessions: 24 hours
   - API responses: 5-60 minutes (based on endpoint)
   - Rate limit counters: Sliding window

2. **Database Query Cache**
   - Frequently accessed listings: 15 minutes
   - Market analytics: 1 hour
   - User profiles: 30 minutes

3. **CDN Cache (future)**
   - Property images: 7 days
   - Static assets: 30 days

### Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| API Response Time | < 200ms | p95, excluding external APIs |
| Database Query Time | < 50ms | p95, simple queries |
| Cache Hit Rate | > 80% | For frequently accessed data |
| Concurrent Users | 500+ | Per instance |
| Uptime | 99.5% | Monthly target |

---

## Monitoring & Observability

### Key Metrics

**System Health:**
- CPU utilization (target: < 70%)
- Memory usage (target: < 80%)
- Disk I/O (target: < 1000 IOPS)
- Network throughput

**Application Metrics:**
- Request rate (requests/second)
- Error rate (target: < 1%)
- Response time distribution
- Active users

**Business Metrics:**
- Listings posted per hour
- LINE messages processed
- Leads captured per day
- Agent task completion rate

### Logging Strategy

**Log Levels:**
- ERROR: System errors, exceptions
- WARNING: Deprecated usage, soft limits
- INFO: Business events, user actions
- DEBUG: Detailed trace (dev only)

**Log Format:**
```json
{
  "timestamp": "2026-01-26T08:13:30.351Z",
  "level": "INFO",
  "service": "amp-service",
  "agent": "listing-agent",
  "user_id": "user_123",
  "request_id": "req_abc123",
  "message": "Property listing created",
  "metadata": {
    "property_id": "prop_456",
    "platform": "ddproperty"
  }
}
```

### Alerting Rules

**Critical Alerts (immediate):**
- Service down (health check failing)
- Error rate > 5%
- Database connection loss
- External API complete failure

**Warning Alerts (15 minutes):**
- High response time (> 1 second p95)
- Cache hit rate < 50%
- Memory usage > 85%
- Background job queue backlog

---

## Development Workflow

### Local Development

```bash
# Clone repository
git clone https://github.com/natbkgift/flowbiz-client-amp.git
cd flowbiz-client-amp

# Setup environment
python3.11 -m venv venv
source venv/bin/activate
pip install -e ".[dev]"

# Start dependencies (PostgreSQL, Redis)
docker compose up -d postgres redis

# Run application
python apps/api/main.py

# Run tests
pytest -v

# Run linting
ruff check .
```

### Testing Strategy

**Test Pyramid:**
```
       ┌─────────┐
       │   E2E   │  ← 10% (Critical user flows)
       ├─────────┤
       │Integration│ ← 30% (API + DB + Cache)
       ├─────────┤
       │   Unit   │  ← 60% (Business logic, agents)
       └─────────┘
```

**Test Coverage Target:** > 80%

### CI/CD Pipeline

```
GitHub Push
    │
    ▼
Trigger CI Workflow
    │
    ├─→ Linting (ruff)
    │
    ├─→ Type Checking (mypy)
    │
    ├─→ Unit Tests (pytest)
    │
    ├─→ Integration Tests
    │
    └─→ Security Scan
        │
        ▼
    All Pass?
        │
        ├─→ YES: Ready to Merge
        │
        └─→ NO: Block merge (non-blocking for warnings)
```

---

## API Design Principles

### RESTful Conventions

**Resource Naming:**
- Use plural nouns: `/v1/listings`, `/v1/leads`
- Nested resources for relationships: `/v1/listings/{id}/tours`
- Actions as verbs in path: `/v1/listings/{id}/publish`

**HTTP Methods:**
- GET: Retrieve resource(s)
- POST: Create new resource
- PUT: Update entire resource
- PATCH: Partial update
- DELETE: Remove resource

### Response Format

**Success Response:**
```json
{
  "success": true,
  "data": {
    "id": "listing_123",
    "title": "Luxury Condo in Pattaya",
    "price": 4500000
  },
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2026-01-26T08:13:30.351Z"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid property price",
    "details": {
      "field": "price",
      "constraint": "must be positive number"
    }
  },
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2026-01-26T08:13:30.351Z"
  }
}
```

### Versioning Strategy

- **URL Versioning:** `/v1/`, `/v2/` (current approach)
- **Backward Compatibility:** Maintain v1 for 6 months after v2 launch
- **Deprecation Notice:** 3-month warning via response headers

---

## Integration Architecture

### LINE Messaging Integration

```
LINE Platform
    │
    ▼
Webhook → AMP Communication Agent
    │
    ├─→ Parse Message
    ├─→ Identify User
    ├─→ Extract Intent
    ├─→ Generate Response (FlowBiz AI Core)
    ├─→ Enrich with Property Data
    │
    ▼
Send Response → LINE API
```

### Property Platform Integration

**Sync Strategy:**
- **Pull:** Fetch competitor data hourly
- **Push:** Post new listings immediately
- **Update:** Sync changes every 15 minutes
- **Retry:** Exponential backoff on failures

**Platform Adapters:**
Each platform has a dedicated adapter implementing:
```python
class PlatformAdapter:
    async def create_listing(data: ListingData) -> str
    async def update_listing(id: str, data: ListingData) -> bool
    async def delete_listing(id: str) -> bool
    async def get_listing(id: str) -> ListingData
    async def search_listings(query: SearchQuery) -> List[ListingData]
```

---

## Deployment Architecture

### Container Structure

```dockerfile
# Simplified Dockerfile structure
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "apps.api.main:app", "--host", "127.0.0.1", "--port", "8000"]
```

### Environment Configuration

**Configuration Layers:**
1. **Defaults** - Hard-coded sensible defaults
2. **Environment Variables** - Override defaults
3. **Config Files** - Advanced configuration (optional)
4. **Runtime** - Dynamic configuration via admin API

**Environment Variables:**
```bash
# Application
APP_ENV=production
APP_HOST=127.0.0.1
APP_PORT=8000
APP_LOG_LEVEL=info

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/amp

# Redis
REDIS_URL=redis://localhost:6379/0

# FlowBiz AI Core
FLOWBIZ_API_KEY=secret_key_here
FLOWBIZ_ENDPOINT=https://ai-core.flowbiz.example

# LINE
LINE_CHANNEL_SECRET=line_secret_here
LINE_CHANNEL_ACCESS_TOKEN=line_token_here

# External APIs
DDPROPERTY_API_KEY=ddprop_key_here
HIPFLAT_API_KEY=hipflat_key_here
```

### VPS Deployment

**Architecture Review:**
- Service binds to **127.0.0.1 ONLY**
- System-level nginx handles SSL and public routing
- No nginx in docker-compose
- See [ADR_SYSTEM_NGINX.md](ADR_SYSTEM_NGINX.md) for rationale

**Deployment Checklist:**
- [ ] Review [AGENT_NEW_PROJECT_CHECKLIST.md](AGENT_NEW_PROJECT_CHECKLIST.md)
- [ ] Verify localhost binding (APP_HOST=127.0.0.1)
- [ ] Configure system nginx with SSL
- [ ] Set up database backup
- [ ] Configure monitoring and alerts
- [ ] Test health check endpoints
- [ ] Verify external API credentials

---

## Future Architecture Considerations

### Phase 2 Enhancements (Post-MVP)

**WebSocket Support:**
- Real-time dashboard updates
- Live chat with Communication Agent
- Collaborative listing editing

**Message Queue:**
- RabbitMQ or Kafka for event streaming
- Improved decoupling of agents
- Better scalability for async tasks

**Microservices Split:**
- Separate services for heavy agents (Analytics, Document)
- Independent scaling of components
- Service mesh (Istio) for orchestration

### Phase 3 Enhancements (6+ months)

**Multi-Region:**
- Deploy to Bangkok, Chiang Mai regions
- Regional data residency
- CDN for static assets

**Advanced ML:**
- Custom ML models for pricing prediction
- Image recognition for property classification
- NLP fine-tuning for Thai real estate domain

**Mobile-First:**
- Native mobile apps (iOS, Android)
- Offline mode for agents in the field
- Push notifications

---

## Appendix A: API Endpoint Reference

### Core Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/healthz` | Health check | None |
| GET | `/v1/meta` | Service metadata | None |
| GET | `/v1/docs` | OpenAPI documentation | None |

### Agent Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/v1/agents/listing/create` | Create property listing | Agent+ |
| POST | `/v1/agents/comms/webhook` | LINE webhook handler | LINE |
| POST | `/v1/agents/lead/capture` | Capture new lead | Agent+ |
| GET | `/v1/agents/analytics/market` | Market analytics | Agent+ |
| POST | `/v1/agents/tour/schedule` | Schedule property tour | Agent+ |
| POST | `/v1/agents/document/generate` | Generate contract | Agent+ |
| GET | `/v1/agents/reporting/dashboard` | KPI dashboard | Agent+ |

### Management Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/v1/listings` | List properties | User+ |
| GET | `/v1/listings/{id}` | Get property details | User+ |
| PUT | `/v1/listings/{id}` | Update property | Agent+ |
| DELETE | `/v1/listings/{id}` | Delete property | Agent+ |
| GET | `/v1/leads` | List leads | Agent+ |
| PUT | `/v1/leads/{id}/score` | Update lead score | Agent+ |

---

## Appendix B: Database Schema Overview

### Core Tables

```sql
-- Simplified schema (actual schema may vary)

-- Users and authentication
users (id, email, name, role, created_at, updated_at)
sessions (id, user_id, token, expires_at)

-- Properties
properties (id, user_id, title, description, price, location, status, created_at)
property_images (id, property_id, url, order, created_at)
property_platforms (id, property_id, platform, external_id, synced_at)

-- Leads
leads (id, name, email, phone, source, score, status, created_at)
lead_interactions (id, lead_id, type, content, agent_id, created_at)

-- Tours
tours (id, property_id, lead_id, scheduled_at, type, status, created_at)
tour_feedback (id, tour_id, rating, comments, created_at)

-- Documents
documents (id, property_id, type, url, status, created_at)
document_signatures (id, document_id, signer_id, signed_at)

-- Analytics
page_views (id, property_id, source, ip_hash, created_at)
conversions (id, property_id, lead_id, amount, created_at)

-- Agent context
agent_tasks (id, agent_name, task_type, status, result, created_at)
agent_context (id, agent_name, context_data, expires_at)
```

---

## Document Control

**Maintained by:** AMP Architecture Team  
**Review Cycle:** Quarterly or on major architecture changes  
**Next Review:** 2026-04-26

**Related Documents:**
- [AMP_BUSINESS_LENS.md](AMP_BUSINESS_LENS.md) - Business model and market analysis
- [AMP_MVP_SCOPE.md](AMP_MVP_SCOPE.md) - MVP features and timeline
- [ADR_SYSTEM_NGINX.md](ADR_SYSTEM_NGINX.md) - VPS nginx architecture
- [PROJECT_CONTRACT.md](PROJECT_CONTRACT.md) - API contracts

**Changelog:**
- 2026-01-26: Initial document creation (v1.0)
