## Summary
<!-- Describe what this PR does and why. Be specific about the business value. -->

## Related Issue
Closes #<!-- issue number -->

## Type of Change
- [ ] Feature (new functionality)
- [ ] Bug fix (fixes an issue)
- [ ] Agent (AI agent development/update)
- [ ] Documentation (docs only)
- [ ] Refactor (code improvement, no feature/bug change)
- [ ] Performance (optimization)
- [ ] Security (security-related change)

## Changes Made
<!-- List the main changes in this PR -->
- 
- 
- 

## Agent Development (if applicable)
<!-- Complete if this PR involves AI agent development -->
- [ ] Agent follows base agent pattern
- [ ] Input/output schemas defined with Pydantic
- [ ] Error handling implemented
- [ ] Fallback responses provided
- [ ] Agent documented in architecture blueprint
- [ ] Performance meets SLA (< 2s for LLM operations)

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated (if applicable)
- [ ] Tested locally with `docker compose up`
- [ ] All tests pass (`pytest -q`)
- [ ] Linting passes (`ruff check .`)
- [ ] Type checking passes (`mypy apps packages`)
- [ ] Test coverage maintained (> 70%)

## Security
- [ ] No secrets in code or committed files
- [ ] All user inputs validated (Pydantic schemas)
- [ ] SQL queries use parameterized statements (no SQL injection)
- [ ] Authentication/authorization implemented on protected endpoints
- [ ] Rate limiting considered (for public endpoints)
- [ ] Dependencies checked for vulnerabilities
- [ ] No new security warnings introduced

## Documentation
- [ ] README updated (if applicable)
- [ ] API documentation updated (OpenAPI/Swagger)
- [ ] Architecture docs updated (if significant change)
- [ ] Code comments added for complex logic
- [ ] CHANGELOG updated (if applicable)

## Deployment Notes
<!-- Any special deployment considerations, migrations, or config changes -->


## Breaking Changes
<!-- List any breaking changes and migration steps -->
- [ ] No breaking changes
<!-- OR -->
- Breaking change 1: ...
- Breaking change 2: ...

## Screenshots (if UI changes)
<!-- Add screenshots here -->


## Checklist
- [ ] Changes are within documented scope
- [ ] Branch follows naming convention (`type/issue-description`)
- [ ] Commits follow conventional commits format
- [ ] No unrelated changes included
- [ ] Code follows AMP style guidelines (see CONTRIBUTING.md)
- [ ] Performance impact considered and acceptable
- [ ] Appropriate labels added to PR
- [ ] Reviewed deployment checklist (if deployment needed)

## Pre-flight Review
<!-- Reference docs/CODEX_PREFLIGHT.md for complete checklist -->
- [ ] API contracts maintained (backward compatible)
- [ ] Environment conventions followed (APP_HOST=127.0.0.1)
- [ ] No nginx configuration changes (see docs/ADR_SYSTEM_NGINX.md)
- [ ] Docker compose changes reviewed (if applicable)
- [ ] No scope creep beyond issue requirements

## Additional Context
<!-- Add any other context about the PR here -->

