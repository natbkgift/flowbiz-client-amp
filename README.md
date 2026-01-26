# AMP - Asset Management Property
# ระบบจัดการทรัพย์สินอสังหาริมทรัพย์อัจฉริยะ

> ⚠️ **CRITICAL: MANDATORY PRE-DEPLOYMENT READING**  
> Before deploying this project to a shared FlowBiz VPS, you MUST read:  
> - [docs/ADR_SYSTEM_NGINX.md](docs/ADR_SYSTEM_NGINX.md) - System architecture (WHY nginx is external)
> - [docs/AGENT_NEW_PROJECT_CHECKLIST.md](docs/AGENT_NEW_PROJECT_CHECKLIST.md) - Complete deployment checklist
> - [docs/AGENT_BEHAVIOR_LOCK.md](docs/AGENT_BEHAVIOR_LOCK.md) - Strict deployment rules
>   
> **IF ANY CHECKLIST ITEM IS "NO" → DEPLOYMENT IS FORBIDDEN**  
> Deploying without reading these documents violates project rules.

**Related:** See [natbkgift/flowbiz-ai-core](https://github.com/natbkgift/flowbiz-ai-core) for VPS infrastructure documentation.

[![CI](https://github.com/natbkgift/flowbiz-client-amp/actions/workflows/ci.yml/badge.svg)](https://github.com/natbkgift/flowbiz-client-amp/actions/workflows/ci.yml)

**AI-powered real estate management system for Pattaya, Thailand** - Revolutionizing property management through intelligent automation and data-driven insights.

## 🎯 Vision / วิสัยทัศน์

**English:** AMP (Asset Management Property) is an AI-powered real estate management platform designed specifically for the Pattaya market. We transform traditional property management through intelligent automation, predictive analytics, and seamless multi-platform integration.

**ไทย:** AMP คือระบบบริหารจัดการอสังหาริมทรัพย์ที่ขับเคลื่อนด้วย AI ออกแบบมาเพื่อตลาดพัทยาโดยเฉพาะ เราปฏิวัติการบริหารทรัพย์สินแบบดั้งเดิมผ่านระบบอัตโนมัติอัจฉริยะ การวิเคราะห์เชิงคาดการณ์ และการเชื่อมต่อหลายแพลตฟอร์มอย่างราบรื่น

### Core Capabilities
- **Multi-platform Property Listings** - Automated synchronization across Thai and international platforms
- **Intelligent Lead Management** - AI-driven lead scoring and nurturing
- **Smart Communication** - LINE integration with automated responses
- **Predictive Analytics** - Market insights and pricing optimization
- **Virtual Property Tours** - 360° virtual showings and AR visualization
- **Document Automation** - AI-powered contract generation and management
- **Performance Tracking** - Real-time KPIs and business intelligence

## 🤖 AI Agents

AMP is powered by 7 specialized AI agents working in harmony:

1. **Listing Agent (ลิสต์โฆษณา)** - Multi-platform property posting and synchronization
2. **Communication Agent (สื่อสาร)** - LINE bot integration and automated responses
3. **Lead Agent (ลูกค้า)** - Lead scoring, nurturing, and conversion optimization
4. **Analytics Agent (วิเคราะห์)** - Market analysis and predictive insights
5. **Tour Agent (ชมบ้าน)** - Virtual tour scheduling and 360° visualization
6. **Document Agent (เอกสาร)** - Contract generation and document management
7. **Reporting Agent (รายงาน)** - Performance tracking and KPI dashboards

Each agent operates autonomously while sharing context through the FlowBiz AI Core platform.

**Learn more:** See [docs/AMP_ARCHITECTURE_BLUEPRINT.md](docs/AMP_ARCHITECTURE_BLUEPRINT.md) for detailed agent architecture.

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Python 3.11+ (for local development)
- LINE Developer Account (for Communication Agent)
- Thai property platform API credentials (optional for full functionality)

### Development

```bash
# Clone repository
git clone https://github.com/natbkgift/flowbiz-client-amp.git
cd flowbiz-client-amp

# Start services (binds to localhost:8000)
docker compose up --build

# Verify (note: localhost, not 0.0.0.0)
curl http://127.0.0.1:8000/healthz
curl http://127.0.0.1:8000/v1/meta
```

### Local Python Development

```bash
# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows

# Install dependencies
pip install -e ".[dev]"

# Run application
python apps/api/main.py

# Run tests
pytest -q

# Run linting
ruff check .
```

## 📋 API Endpoints

### `GET /healthz`
Health check endpoint for monitoring.

**Response:**
```json
{
  "status": "ok",
  "service": "amp-service",
  "version": "0.1.0"
}
```

### `GET /v1/meta`
Service metadata endpoint.

**Response:**
```json
{
  "service": "amp-service",
  "environment": "dev",
  "version": "0.1.0",
  "build_sha": "abc123"
}
```

## 🔧 Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

**Runtime (APP_*)**
- `APP_ENV`: Environment (`dev`|`prod`)
- `APP_HOST`: Bind host (default: `127.0.0.1`) ⚠️ MUST be localhost for VPS
- `APP_PORT`: Bind port (default: `8000`)
- `APP_LOG_LEVEL`: Log level (default: `info`)

**Metadata (FLOWBIZ_*)**
- `FLOWBIZ_SERVICE_NAME`: Service identifier
- `FLOWBIZ_VERSION`: Semantic version
- `FLOWBIZ_BUILD_SHA`: Git commit SHA

## 🐳 Docker

### Development
```bash
docker compose up --build
```

### Production
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Verify local access (service binds to localhost only)
curl http://127.0.0.1:8000/healthz
```

**⚠️ Important:** 
- Service binds to `127.0.0.1` (localhost) only
- NO nginx included in docker-compose (managed by system-level nginx)
- See [docs/ADR_SYSTEM_NGINX.md](docs/ADR_SYSTEM_NGINX.md) for architecture
- Public HTTPS access configured by infrastructure team

## 🧪 Testing

All tests are deterministic with no external dependencies.

```bash
# Run tests
pytest -q

# Run with coverage
pytest --cov=apps --cov=packages

# Run specific test
pytest tests/test_health.py -v
```

## 🔒 Security

### VPS Architecture
- Services bind to **localhost (127.0.0.1) only**
- System-level nginx handles public routing and SSL
- No nginx in docker-compose (see [ADR_SYSTEM_NGINX.md](docs/ADR_SYSTEM_NGINX.md))

### Security Headers (Managed by System Nginx)
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: geolocation=(), microphone=(), camera=()`
- `Strict-Transport-Security` (production with SSL)

### Best Practices
- No secrets in code or environment files
- Non-root container user
- Minimal base images
- Regular dependency updates

## 📚 Documentation

### Project Foundation
- **[Business Lens](docs/AMP_BUSINESS_LENS.md)** - Business model, market analysis, and KPIs
- **[Architecture Blueprint](docs/AMP_ARCHITECTURE_BLUEPRINT.md)** - System design and agent architecture
- **[MVP Scope](docs/AMP_MVP_SCOPE.md)** - 8-week MVP timeline and features
- **[Contributing Guide](CONTRIBUTING.md)** - Development workflow and conventions

### Deployment & Operations
- **[ADR: System Nginx](docs/ADR_SYSTEM_NGINX.md)** - ⚠️ MANDATORY - VPS architecture overview
- **[New Project Checklist](docs/AGENT_NEW_PROJECT_CHECKLIST.md)** - ⚠️ MANDATORY - Pre-deployment verification
- **[Agent Behavior Lock](docs/AGENT_BEHAVIOR_LOCK.md)** - ⚠️ MANDATORY - Deployment rules and constraints
- [Project Contract](docs/PROJECT_CONTRACT.md) - API contracts and conventions
- [Deployment Guide](docs/DEPLOYMENT.md) - Production deployment steps
- [Guardrails](docs/GUARDRAILS.md) - CI/CD philosophy and rules
- [Pre-flight Checklist](docs/CODEX_PREFLIGHT.md) - Pre-merge verification

## 🛡️ Guardrails

This project uses **non-blocking** CI guardrails:
- Linting with `ruff`
- Testing with `pytest`
- Scope validation
- PR template requirements

Violations surface as warnings, not failures. Human judgment is final.

## 📦 Project Structure

```
flowbiz-client-amp/
├── .github/              # CI/CD workflows and templates
├── apps/
│   └── api/              # FastAPI application
│       ├── main.py
│       └── routes/       # API endpoints
│           ├── agents/   # AI Agent endpoints
│           ├── listings/ # Property listing management
│           ├── leads/    # Lead management
│           └── analytics/# Analytics and reporting
├── packages/
│   └── core/             # Shared core modules
│       ├── config.py     # Environment configuration
│       ├── logging.py    # Logging setup
│       ├── schemas/      # Pydantic models
│       └── agents/       # AI Agent implementations
├── nginx/                # Nginx reference templates (NOT used in docker-compose)
│   ├── templates/        # Config templates for infrastructure team
│   └── snippets/         # Reusable config snippets
├── docs/                 # Documentation
│   ├── AMP_BUSINESS_LENS.md
│   ├── AMP_ARCHITECTURE_BLUEPRINT.md
│   ├── AMP_MVP_SCOPE.md
│   └── ...
├── tests/                # Test suite
├── Dockerfile            # Container definition
├── docker-compose.yml    # Development compose
├── docker-compose.prod.yml # Production overrides
└── pyproject.toml        # Python project config
```

## 🚫 Scope Boundaries

### ✅ In Scope
- AI agent implementations
- Property listing management
- Lead management and scoring
- LINE bot integration
- Analytics and reporting
- Standard health/meta endpoints
- Docker containerization (service only)
- Localhost binding (127.0.0.1)
- Environment configuration
- CI/CD infrastructure

### ❌ Out of Scope
- Nginx configuration (managed by system-level nginx)
- SSL/TLS certificates (managed by infrastructure)
- Public port exposure (services bind to localhost only)
- Payment gateway integration (post-MVP)
- Full property management suite (post-MVP)
- Mobile app development
- FlowBiz Core runtime

**See [AGENT_BEHAVIOR_LOCK.md](docs/AGENT_BEHAVIOR_LOCK.md) for complete rules.**

## 🤝 Contributing

We welcome contributions! Please follow our development workflow:

1. Review [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines
2. Create a feature branch following naming conventions
3. Make changes following agent development patterns
4. Run tests and linting
5. Submit PR with completed template
6. Apply appropriate persona labels

See [CONTRIBUTING.md](CONTRIBUTING.md) for complete development guide and [CODEX_PREFLIGHT.md](docs/CODEX_PREFLIGHT.md) for pre-merge checklist.

## 📝 License

This project is maintained by the FlowBiz AI Core team for AMP (Asset Management Property).

## 🔗 Links

- [FlowBiz AI Core](https://github.com/natbkgift)
- [Documentation](docs/)
- [Issues](https://github.com/natbkgift/flowbiz-client-amp/issues)
- [Business Lens](docs/AMP_BUSINESS_LENS.md)
- [Architecture](docs/AMP_ARCHITECTURE_BLUEPRINT.md)