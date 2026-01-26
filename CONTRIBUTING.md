# Contributing to AMP
## Development Guidelines & Governance

**Welcome!** This document outlines how to contribute to AMP (Asset Management Property), the AI-powered real estate management platform for Pattaya.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Workflow](#development-workflow)
3. [Branch Strategy](#branch-strategy)
4. [Naming Conventions](#naming-conventions)
5. [AI Agent Development Rules](#ai-agent-development-rules)
6. [Code Standards](#code-standards)
7. [Testing Requirements](#testing-requirements)
8. [Security Guidelines](#security-guidelines)
9. [Pull Request Process](#pull-request-process)
10. [Issue Management](#issue-management)

---

## Getting Started

### Prerequisites

**Required:**
- Python 3.11+
- Docker & Docker Compose
- Git
- Code editor (VS Code recommended)

**Recommended:**
- PostgreSQL client (psql, DBeaver)
- Redis client (redis-cli)
- Postman or similar for API testing

### First-Time Setup

```bash
# 1. Clone repository
git clone https://github.com/natbkgift/flowbiz-client-amp.git
cd flowbiz-client-amp

# 2. Create virtual environment
python3.11 -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows

# 3. Install dependencies (development mode)
pip install -e ".[dev]"

# 4. Copy environment template
cp .env.example .env
# Edit .env with your configuration

# 5. (Optional) Start supporting services defined in docker-compose.yml
docker compose up -d

# 6. Run application
python apps/api/main.py

# 7. Verify setup
curl http://127.0.0.1:8000/healthz
```

### Development Tools

**Linting:**
```bash
# Run ruff linter
ruff check .

# Auto-fix issues
ruff check . --fix
```

**Testing:**
```bash
# Run all tests
pytest -v

# Run with coverage
pytest --cov=apps --cov=packages --cov-report=html

# Run specific test file
pytest tests/test_agents.py -v
```

**Type Checking:**
```bash
# Run mypy type checker
mypy apps packages
```

---

## Development Workflow

### Typical Feature Development Flow

1. **Create Issue** - Document what you're building
2. **Create Branch** - Follow naming conventions
3. **Develop Feature** - Write code with tests
4. **Test Locally** - Run full test suite
5. **Commit Changes** - Use conventional commits
6. **Create Pull Request** - Use PR template
7. **Code Review** - Address feedback
8. **Merge** - Squash and merge after approval

### Daily Development Checklist

Before committing:
- [ ] Code follows style guidelines (ruff passes)
- [ ] All tests pass locally
- [ ] New code has test coverage
- [ ] Documentation updated (if applicable)
- [ ] No secrets in code or env files
- [ ] Commit message follows conventions

---

## Branch Strategy

### Branch Types

```
main (protected - production)
│
└── develop (integration branch)
    │
    ├── feature/pr-001-master-foundation
    ├── feature/pr-002-ops-os-pack
    ├── feature/pr-008-lead-router-agent
    ├── feature/pr-009-ai-sale-chat-agent
    └── ...
```

*Note: PR numbers may be non-sequential as they're assigned based on project milestones and roadmap planning.*

### Branch Naming Convention

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feature/pr-XXX-<description>` | `feature/pr-008-lead-router-agent` |
| Bugfix | `bugfix/issue-XXX-<description>` | `bugfix/issue-42-chat-timeout` |
| Hotfix | `hotfix/<description>` | `hotfix/critical-line-webhook` |

**Additional Types:**
- `agent/pr-XXX-<description>` - AI agent development
- `docs/pr-XXX-<description>` - Documentation changes
- `refactor/pr-XXX-<description>` - Code refactoring
- `test/pr-XXX-<description>` - Test improvements
- `chore/pr-XXX-<description>` - Maintenance tasks

**Examples:**
```bash
feature/pr-001-master-foundation
feature/pr-008-lead-router-agent
agent/pr-009-ai-sale-chat-agent
bugfix/issue-42-chat-timeout
hotfix/critical-line-webhook
docs/pr-015-architecture-update
refactor/pr-020-database-queries
test/pr-025-integration-listing-sync
chore/pr-030-update-dependencies
```

**Rules:**
- Use lowercase and hyphens
- **Features/planned work** use PR numbers (`pr-XXX`) - assigned from project roadmap
- **Bugs/unplanned work** use issue numbers (`issue-XXX`) - created from GitHub issues
- Keep description short (< 40 chars)
- Be descriptive and specific

**When to use PR numbers vs Issue numbers:**
- **PR numbers** (`pr-XXX`): For planned features in the project roadmap or milestone plan
- **Issue numbers** (`issue-XXX`): For bug fixes, reported issues, or unplanned work tracked in GitHub Issues

### Branch Protection

**`main` branch:**
- ✅ Require pull request reviews
- ✅ Require status checks to pass
- ✅ Require branches to be up to date
- ❌ No direct commits
- ❌ No force pushes

**`develop` branch:**
- ✅ Require pull request reviews
- ✅ Require status checks to pass
- ⚠️  Can be force-pushed by maintainers (use carefully)

---

## 📝 PR Naming Convention

Pull requests should follow a clear, consistent naming pattern that indicates the type of change and references the relevant issue or PR number.

### Format

```
PR-XXX: <brief description>
```

or

```
[Type] <brief description> (closes #issue-number)
```

### Examples

**Using PR Numbers:**
```
PR-001: Master foundation setup
PR-008: Lead router agent implementation
PR-009: AI sale chat agent with LINE integration
PR-015: Update architecture documentation
PR-042: Fix chat timeout issue
```

**Using Type Tags:**
```
[Feature] Add multi-platform listing sync (closes #123)
[Bug Fix] Correct lead scoring algorithm (closes #456)
[Agent] Communication agent with LINE integration (closes #789)
[Docs] Update contributing guidelines (closes #101)
[Security] Implement rate limiting on login endpoint (closes #202)
```

### Guidelines

- Keep PR titles concise but descriptive
- Reference the issue number if applicable (using `closes #XXX`)
- **Use PR numbers (PR-XXX)** for planned features tracked in the project roadmap/milestone
- **Use issue numbers** for bug fixes and unplanned work tracked in GitHub Issues
- Start with a capital letter
- Don't end with a period

**How to know which to use:**
- Check if your work corresponds to a planned PR number in the project's milestone or roadmap
- If working on a reported bug or unplanned feature, use the GitHub issue number
- When in doubt, use the issue number format `[Type] description (closes #XXX)`

---

## Naming Conventions

### Issues

**Format:** `[Type] Brief description`

**Types:**
- `[Feature]` - New functionality
- `[Bug]` - Something broken
- `[Agent]` - AI agent development
- `[Docs]` - Documentation
- `[Security]` - Security-related
- `[Performance]` - Optimization
- `[Refactor]` - Code improvement
- `[Test]` - Testing improvement

**Examples:**
```
[Feature] Add DDProperty listing sync
[Bug] Lead score calculation incorrect for 0 budget
[Agent] Communication agent LINE webhook integration
[Docs] Update architecture blueprint with caching strategy
[Security] Implement rate limiting on login endpoint
[Performance] Optimize listing query with database indexes
```

### Pull Requests

**Format:** 

- `PR-XXX: <brief description>` - For planned features
- `[Type] <brief description> (closes #issue-number)` - For issues

**Examples:**
```
PR-001: Master foundation setup
PR-008: Lead router agent implementation
[Feature] Add multi-platform listing sync (closes #123)
[Bug Fix] Correct lead scoring algorithm (closes #456)
[Agent] Communication agent with LINE integration (closes #789)
[Docs] Update contributing guidelines (closes #101)
```

### Commit Messages

**Format:** Conventional Commits

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Formatting, no code change
- `refactor` - Code change, no feature/bug
- `test` - Add/modify tests
- `chore` - Maintenance tasks

**Examples:**
```bash
feat(listing): add DDProperty API integration

Implemented DDProperty adapter with listing create/update/delete operations.
Includes retry logic and rate limiting.

Closes #123

---

fix(lead): correct lead scoring for zero budget

Lead scoring was failing when budget was 0 or not provided.
Now defaults to "Cold" score for missing budget.

Closes #456

---

agent(comms): implement LINE webhook handler

Added LINE webhook endpoint with signature verification.
Includes message parsing and intent classification.

Closes #789
```

---

## AI Agent Development Rules

### Agent Development Principles

**1. Agent Autonomy**
- Each agent should operate independently
- Share context through well-defined interfaces
- Avoid tight coupling between agents

**2. Stateless Design**
- Agents should not maintain internal state
- Store all state in database or cache
- Enable horizontal scaling

**3. Testability**
- All agent logic must be unit testable
- Mock external dependencies (LLM, APIs)
- Provide example inputs/outputs

**4. Error Handling**
- Agents must handle failures gracefully
- Always provide fallback responses
- Log errors with context for debugging

### Agent Structure Template

Every agent must follow this structure:

```python
# File: packages/core/agents/{agent_name}_agent.py

from typing import Dict, Any, Optional
from pydantic import BaseModel
from packages.core.agents.base import BaseAgent, AgentContext, AgentResponse

class {AgentName}Input(BaseModel):
    """Input schema for {Agent Name}"""
    # Define input fields with validation
    pass

class {AgentName}Output(BaseModel):
    """Output schema for {Agent Name}"""
    # Define output fields
    pass

class {AgentName}Agent(BaseAgent):
    """
    {Agent Name} - Brief description
    
    Responsibilities:
    - List key responsibilities
    
    Capabilities:
    - List key capabilities
    """
    
    name = "{agent_name}"
    description = "Brief description"
    version = "1.0.0"
    
    async def process(
        self,
        context: AgentContext,
        input_data: {AgentName}Input
    ) -> AgentResponse[{AgentName}Output]:
        """
        Process agent task
        
        Args:
            context: Agent execution context
            input_data: Validated input data
            
        Returns:
            AgentResponse with output data
        """
        try:
            # Validate input
            await self.validate_input(input_data)
            
            # Execute task
            result = await self.execute_task(context, input_data)
            
            # Return response
            return AgentResponse(
                success=True,
                data=result,
                metadata={"agent": self.name, "version": self.version}
            )
            
        except Exception as e:
            return self.handle_error(e, context)
    
    async def validate_input(self, input_data: {AgentName}Input) -> None:
        """Validate agent input"""
        # Add custom validation logic
        pass
    
    async def execute_task(
        self,
        context: AgentContext,
        input_data: {AgentName}Input
    ) -> {AgentName}Output:
        """Execute main agent logic"""
        # Implement agent logic here
        pass
```

### Agent Testing Requirements

**1. Unit Tests (Required)**

```python
# File: tests/agents/test_{agent_name}_agent.py

import pytest
from packages.core.agents.{agent_name}_agent import {AgentName}Agent

@pytest.fixture
def agent():
    return {AgentName}Agent(config=test_config)

@pytest.mark.asyncio
async def test_agent_process_success(agent):
    """Test successful agent execution"""
    # Arrange
    input_data = {AgentName}Input(...)
    context = AgentContext(...)
    
    # Act
    response = await agent.process(context, input_data)
    
    # Assert
    assert response.success is True
    assert response.data is not None

@pytest.mark.asyncio
async def test_agent_process_error(agent):
    """Test agent error handling"""
    # Test error scenarios
    pass

@pytest.mark.asyncio
async def test_agent_validation(agent):
    """Test input validation"""
    # Test validation logic
    pass
```

**2. Integration Tests (Required)**

Test agent with real dependencies (database, cache, external APIs with mocks).

**3. End-to-End Tests (Optional)**

Test complete user flows involving multiple agents.

### Agent Documentation Requirements

Each agent must have:

1. **README.md** in agent directory
2. **API documentation** in OpenAPI schema
3. **Example requests/responses** in docs
4. **Architecture decision records** (if applicable)

### Agent Performance Standards

**Response Time:**
- Simple operations: < 200ms
- LLM operations: < 2 seconds
- External API operations: < 5 seconds

**Reliability:**
- 99% success rate for valid inputs
- Graceful degradation on external failures
- Automatic retry with exponential backoff

**Scalability:**
- Handle 100 concurrent requests per instance
- Stateless design for horizontal scaling

---

## Code Standards

### Python Style Guide

**Follow PEP 8** with these specifics:

**Imports:**
```python
# Standard library
import os
import sys

# Third-party
import fastapi
from pydantic import BaseModel

# Local
from packages.core.config import settings
from packages.core.agents.base import BaseAgent
```

**Type Hints:**
```python
# Use type hints for all functions
def calculate_score(lead: Lead, properties: List[Property]) -> float:
    pass

# Use Optional for nullable values
def get_user(user_id: int) -> Optional[User]:
    pass

# Use TypedDict or Pydantic for complex types
from typing import TypedDict

class UserData(TypedDict):
    name: str
    email: str
    age: int
```

**Docstrings:**
```python
def complex_function(param1: str, param2: int) -> Dict[str, Any]:
    """
    Brief one-line description.
    
    Longer description if needed. Explain what the function does,
    not how it does it (that's for comments in the code).
    
    Args:
        param1: Description of param1
        param2: Description of param2
        
    Returns:
        Description of return value
        
    Raises:
        ValueError: When param2 is negative
    """
    pass
```

**Naming:**
- Classes: `PascalCase` (e.g., `ListingAgent`, `LeadManager`)
- Functions/Variables: `snake_case` (e.g., `calculate_score`, `user_name`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `MAX_RETRIES`, `API_TIMEOUT`)
- Private methods: `_leading_underscore` (e.g., `_internal_method`)

### File Organization

```
packages/core/
├── __init__.py
├── config.py           # Configuration management
├── logging.py          # Logging setup
├── constants.py        # Application constants
├── exceptions.py       # Custom exceptions
├── utils.py           # Utility functions
├── agents/
│   ├── __init__.py
│   ├── base.py        # Base agent class
│   ├── listing_agent.py
│   ├── comms_agent.py
│   └── ...
├── models/
│   ├── __init__.py
│   ├── listing.py
│   ├── lead.py
│   └── ...
└── services/
    ├── __init__.py
    ├── database.py
    ├── cache.py
    └── ...
```

### Error Handling

**Custom Exceptions:**
```python
# packages/core/exceptions.py

class AMPException(Exception):
    """Base exception for AMP"""
    pass

class AgentExecutionError(AMPException):
    """Raised when agent execution fails"""
    pass

class ValidationError(AMPException):
    """Raised when input validation fails"""
    pass

class ExternalAPIError(AMPException):
    """Raised when external API call fails"""
    pass
```

**Error Handling Pattern:**
```python
from packages.core.exceptions import AgentExecutionError

async def process_listing(listing_id: str) -> ListingResponse:
    try:
        listing = await db.get_listing(listing_id)
        if not listing:
            raise ValidationError(f"Listing {listing_id} not found")
            
        result = await agent.process(listing)
        return result
        
    except ValidationError as e:
        logger.warning(f"Validation error: {e}")
        raise
        
    except ExternalAPIError as e:
        logger.error(f"API error: {e}", exc_info=True)
        # Return fallback response
        return ListingResponse(success=False, error=str(e))
        
    except Exception as e:
        logger.error(f"Unexpected error: {e}", exc_info=True)
        raise AgentExecutionError(f"Failed to process listing: {e}")
```

---

## Testing Requirements

### Test Coverage Standards

**Minimum Coverage:** 70% overall
- Business logic: 90%+
- API endpoints: 80%+
- Agents: 90%+
- Utilities: 70%+

### Testing Pyramid

```
       ┌─────────┐
       │   E2E   │  10% - Critical user flows
       ├─────────┤
       │Integration│ 30% - API + DB + Cache
       ├─────────┤
       │   Unit   │  60% - Business logic, agents
       └─────────┘
```

### Test Organization

```
tests/
├── unit/
│   ├── test_agents/
│   │   ├── test_listing_agent.py
│   │   ├── test_comms_agent.py
│   │   └── ...
│   ├── test_models/
│   └── test_utils/
├── integration/
│   ├── test_api/
│   ├── test_database/
│   └── test_agents_integration/
├── e2e/
│   ├── test_listing_flow.py
│   ├── test_lead_flow.py
│   └── ...
├── conftest.py         # Shared fixtures
└── helpers.py          # Test utilities
```

### Test Fixtures

```python
# tests/conftest.py

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

@pytest.fixture
async def db_session():
    """Database session for testing"""
    # Create test database
    engine = create_engine("sqlite:///:memory:")
    Session = sessionmaker(bind=engine)
    session = Session()
    
    yield session
    
    # Cleanup
    session.close()

@pytest.fixture
def sample_listing():
    """Sample listing for testing"""
    return Listing(
        title="Test Condo",
        price=2000000,
        bedrooms=2,
        bathrooms=1,
        location="Pattaya"
    )
```

### Mocking External Dependencies

```python
from unittest.mock import AsyncMock, patch

@pytest.mark.asyncio
async def test_listing_sync_with_mock():
    """Test listing sync with mocked external API"""
    
    # Mock external API
    with patch('packages.core.clients.ddproperty.DDPropertyClient.create_listing') as mock_create:
        mock_create.return_value = AsyncMock(return_value="external_id_123")
        
        # Test your code
        result = await sync_listing_to_ddproperty(listing)
        
        assert result.success is True
        assert result.external_id == "external_id_123"
        mock_create.assert_called_once()
```

---

## Security Guidelines

### Security Principles

**1. Defense in Depth**
- Multiple layers of security
- Never trust user input
- Validate everything

**2. Least Privilege**
- Grant minimum necessary permissions
- Use separate credentials for each service
- Rotate credentials regularly

**3. Security by Default**
- Secure configurations out of the box
- HTTPS everywhere
- Encrypted storage for sensitive data

### Common Security Pitfalls to Avoid

**❌ DON'T:**
```python
# SQL Injection vulnerability
query = f"SELECT * FROM users WHERE id = {user_id}"

# Secrets in code
API_KEY = "sk_live_abc123xyz"

# Weak password hashing
password_hash = hashlib.md5(password.encode()).hexdigest()

# Unvalidated redirects
return redirect(request.args.get('next'))
```

**✅ DO:**
```python
# Use parameterized queries
query = "SELECT * FROM users WHERE id = :user_id"
result = db.execute(query, {"user_id": user_id})

# Secrets from environment
API_KEY = os.getenv("API_KEY")

# Strong password hashing
from passlib.hash import bcrypt
password_hash = bcrypt.hash(password)

# Validate redirects
next_url = request.args.get('next')
if is_safe_url(next_url):
    return redirect(next_url)
```

### Input Validation

**Always validate with Pydantic:**
```python
from pydantic import BaseModel, validator, Field
from typing import Optional

class ListingCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=200)
    price: int = Field(..., gt=0, le=100_000_000)
    description: Optional[str] = Field(None, max_length=5000)
    
    @validator('title')
    def title_must_be_clean(cls, v):
        # Remove HTML tags, XSS prevention
        return sanitize_html(v)
```

### Authentication & Authorization

**JWT Token Pattern:**
```python
from datetime import datetime, timedelta
from jose import jwt

def create_access_token(user_id: int) -> str:
    """Create JWT access token"""
    expiration = datetime.utcnow() + timedelta(days=7)
    payload = {
        "user_id": user_id,
        "exp": expiration,
        "type": "access"
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")

def require_auth(required_role: str = "user"):
    """Decorator for protected endpoints"""
    async def decorator(func):
        async def wrapper(*args, **kwargs):
            token = get_token_from_header()
            user = verify_token(token)
            if not user.has_role(required_role):
                raise HTTPException(status_code=403, detail="Insufficient permissions")
            return await func(*args, user=user, **kwargs)
        return wrapper
    return decorator
```

### Rate Limiting

**Implement rate limiting:**
```python
from fastapi import Request
from packages.core.middleware.rate_limit import rate_limit

@app.post("/api/v1/listings")
@rate_limit(max_requests=100, window=3600)  # 100 requests per hour
async def create_listing(request: Request, listing: ListingCreate):
    pass
```

### Security Checklist

Before merging:
- [ ] All user inputs validated with Pydantic
- [ ] No secrets in code (use environment variables)
- [ ] SQL queries use parameterized statements
- [ ] Authentication on all protected endpoints
- [ ] Authorization checks for sensitive operations
- [ ] Rate limiting on public endpoints
- [ ] CORS properly configured
- [ ] CSRF protection enabled
- [ ] Security headers set (by system nginx)
- [ ] Dependencies scanned for vulnerabilities

---

## Pull Request Process

### Before Creating PR

1. **Update from develop:**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout your-branch
   git rebase develop
   ```

2. **Run full test suite:**
   ```bash
   pytest -v
   ruff check .
   mypy apps packages
   ```

3. **Update documentation** (if applicable)

4. **Write meaningful commit messages**

### PR Template

Use the provided template in `.github/pull_request_template.md`:

```markdown
## Summary
<!-- Brief description of what this PR does -->

## Related Issue
Closes #[issue-number]

## Changes Made
- Change 1
- Change 2
- Change 3

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Tested locally with docker compose
- [ ] All tests pass (`pytest -q`)
- [ ] Linting passes (`ruff check .`)

## Screenshots (if UI changes)
<!-- Add screenshots here -->

## Deployment Notes
<!-- Any special deployment considerations -->

## Checklist
- [ ] Changes are within scope
- [ ] Documentation updated (if applicable)
- [ ] No security vulnerabilities introduced
- [ ] Appropriate labels added
- [ ] Breaking changes documented (if any)
```

### PR Review Process

**Reviewers will check:**
- Code quality and style
- Test coverage
- Security considerations
- Performance implications
- Documentation completeness

**Expected turnaround:** 24-48 hours

**Approval required:** 1 maintainer

### Merge Strategy

**Squash and Merge** (default):
- Combines all commits into one
- Keeps `main` history clean
- PR title becomes commit message

**When to use Rebase and Merge:**
- Large features with meaningful commits
- Want to preserve commit history
- Commits are already well-organized

---

## Issue Management

### Issue Labels

**Type:**
- `type:feature` - New functionality
- `type:bug` - Something broken
- `type:agent` - AI agent development
- `type:docs` - Documentation
- `type:security` - Security-related
- `type:performance` - Optimization

**Priority:**
- `priority:critical` - Blocking, must fix immediately
- `priority:high` - Important, fix soon
- `priority:medium` - Normal priority
- `priority:low` - Nice to have

**Status:**
- `status:blocked` - Waiting on dependency
- `status:in-progress` - Actively being worked on
- `status:review` - In code review
- `status:ready` - Ready to implement

**Persona:**
- `persona:core` - Core platform work
- `persona:agent` - AI agent work
- `persona:infra` - Infrastructure
- `persona:docs` - Documentation

### Issue Templates

**Feature Request:**
```markdown
## Feature Description
Clear description of the feature

## Business Value
Why is this needed?

## Proposed Solution
How should this work?

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2

## Related Issues
Links to related issues
```

**Bug Report:**
```markdown
## Bug Description
What's broken?

## Steps to Reproduce
1. Step 1
2. Step 2
3. Step 3

## Expected Behavior
What should happen?

## Actual Behavior
What actually happens?

## Environment
- OS:
- Python version:
- Browser (if applicable):

## Screenshots/Logs
Add relevant info
```

---

## Questions?

**Need help?**
- Check existing documentation
- Search closed issues
- Ask in team channel
- Contact maintainers

**Found a security issue?**
- DO NOT open a public issue
- Contact repository maintainers privately
- Include detailed report with steps to reproduce

---

## License & Code of Conduct

This project is maintained by FlowBiz AI Core team for AMP.

**Code of Conduct:** Be respectful, collaborative, and constructive.

---

**Document Version:** 1.0  
**Last Updated:** 2026-01-26  
**Maintainer:** AMP Development Team
