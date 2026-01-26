> ⚠️ **CRITICAL: MANDATORY PRE-DEPLOYMENT READING**  
> Before deploying this project to a shared FlowBiz VPS, you MUST read:  
> - [docs/ADR_SYSTEM_NGINX.md](docs/ADR_SYSTEM_NGINX.md) - System architecture (WHY nginx is external)
> - [docs/AGENT_NEW_PROJECT_CHECKLIST.md](docs/AGENT_NEW_PROJECT_CHECKLIST.md) - Complete deployment checklist
> - [docs/AGENT_BEHAVIOR_LOCK.md](docs/AGENT_BEHAVIOR_LOCK.md) - Strict deployment rules
>   
> **IF ANY CHECKLIST ITEM IS "NO" → DEPLOYMENT IS FORBIDDEN**  
> Deploying without reading these documents violates project rules.

**Related:** See [natbkgift/flowbiz-ai-core](https://github.com/natbkgift/flowbiz-ai-core) for VPS infrastructure documentation.

# FlowBiz Client AMP - Asset Management Property

[![CI](https://github.com/natbkgift/flowbiz-client-amp/actions/workflows/ci.yml/badge.svg)](https://github.com/natbkgift/flowbiz-client-amp/actions/workflows/ci.yml)

> 🏠 **AI Agent Automation สำหรับธุรกิจ Agency Real Estate Pattaya**

Production-ready AI-powered property management service for Asset Management Property (AMP), 
specializing in Pattaya real estate market.

## 🏠 About AMP

**Asset Management Property (AMP)** คือระบบ AI Agent Automation สำหรับธุรกิจอสังหาริมทรัพย์ในพัทยา

### Vision
นำเทคโนโลยี AI มาเพิ่มประสิทธิภาพการทำงานของทีมขาย ลดเวลาตอบ Lead จาก 5 นาที เหลือต่ำกว่า 30 วินาที

### Target Market
- นักลงทุนอสังหาฯ (ไทย/ต่างชาติ)
- ผู้เช่า Expats ใน Pattaya
- พื้นที่: Pattaya, Jomtien, Na Jomtien, Bang Saray

## 🤖 AI Agents

| Agent | Purpose | Status |
|-------|---------|--------|
| **Lead Router Agent** | Score และ route leads ไปยัง sales ที่เหมาะสม | 🔲 Planned |
| **AI Sale Chat Agent** | Chatbot ตอบคำถาม Thai/English 24/7 | 🔲 Planned |
| **Listing/Project Agent** | จัดการข้อมูล property และ auto-tagging | 🔲 Planned |
| **Ads/Promotion Agent** | สร้าง ad copy และวิเคราะห์แคมเปญ | 🔲 Planned |
| **Content/Branding Agent** | สร้าง content และรักษา brand consistency | 🔲 Planned |
| **Analytics Agent** | Dashboard, reports, และ predictions | 🔲 Planned |
| **Ops/Document Agent** | สร้างเอกสารและ checklist อัตโนมัติ | 🔲 Planned |

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Python 3.11+ (for local development)

### Development

```bash
# Clone repository
git clone https://github.com/natbkgift/flowbiz-client-amp.git
cd flowbiz-client-amp

# Start services
docker compose up --build

# Verify
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

### AMP-Specific
- **[AMP Business Lens](docs/AMP_BUSINESS_LENS.md)** - Business model และ KPIs
- **[AMP Architecture Blueprint](docs/AMP_ARCHITECTURE_BLUEPRINT.md)** - System architecture
- **[AMP MVP Scope](docs/AMP_MVP_SCOPE.md)** - MVP definition และ timeline

### Infrastructure (MANDATORY)
- **[ADR: System Nginx](docs/ADR_SYSTEM_NGINX.md)** - ⚠️ MANDATORY
- **[New Project Checklist](docs/AGENT_NEW_PROJECT_CHECKLIST.md)** - ⚠️ MANDATORY
- **[Agent Behavior Lock](docs/AGENT_BEHAVIOR_LOCK.md)** - ⚠️ MANDATORY

### Development
- [Contributing Guide](CONTRIBUTING.md)
- [Project Contract](docs/PROJECT_CONTRACT.md)
- [Deployment Guide](docs/DEPLOYMENT.md)

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
├── .github/              # CI/CD workflows
├── apps/
│   ├── api/              # FastAPI application
│   │   ├── main.py
│   │   └── routes/
│   └── agents/           # AI Agents (Phase 2)
│       ├── lead_router/
│       ├── sale_chat/
│       ├── listing/
│       ├── ads/
│       ├── content/
│       ├── analytics/
│       └── ops/
├── packages/
│   └── core/             # Shared modules
│       ├── config.py
│       ├── logging.py
│       └── schemas/      # Pydantic models
├── docs/                 # Documentation
├── tests/                # Test suite
├── Dockerfile
├── docker-compose.yml
└── pyproject.toml
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

- [FlowBiz AI Core](https://github.com/natbkgift/flowbiz-ai-core)
- [Documentation](docs/)
- [Issues](https://github.com/natbkgift/flowbiz-client-amp/issues)