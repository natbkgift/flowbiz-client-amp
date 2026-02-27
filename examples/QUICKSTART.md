# Quick Start Guide / คู่มือเริ่มต้นอย่างรวดเร็ว

## เริ่มต้นใช้งานใน 5 นาที / Get Started in 5 Minutes

### Step 1: Clone and Install / โคลนและติดตั้ง

```bash
# Clone repository
git clone https://github.com/natbkgift/flowbiz-client-amp.git
cd flowbiz-client-amp

# Install dependencies
pip install -e ".[dev]"
```

### Step 2: Start the Service / เริ่มต้น Service

Choose one method / เลือกวิธีใดวิธีหนึ่ง:

**Option A: With Python**
```bash
python apps/api/main.py
```

**Option B: With Docker**
```bash
docker compose up --build
```

### Step 3: Verify / ตรวจสอบ

```bash
# Check health
curl http://127.0.0.1:8000/healthz

# Expected output:
# {"status":"ok","service":"flowbiz-template-service","version":"0.1.0"}
```

### Step 4: Try Examples / ทดลองตัวอย่าง

```bash
cd examples

# Test simple client
python 01-basic-usage/simple_client.py

# Test AI agents
python 03-ai-agents/lead_router_agent.py
python 03-ai-agents/property_listing.py
```

### Step 5: Explore API Docs / สำรวจ API Docs

Open in browser / เปิดในเบราว์เซอร์:
- **Swagger UI**: http://127.0.0.1:8000/docs
- **ReDoc**: http://127.0.0.1:8000/redoc

---

## What's Next? / ขั้นตอนต่อไป?

### 1. Learn the Basics / เรียนรู้พื้นฐาน
- 📖 Read [examples/README.md](README.md) for overview
- 🎯 Try examples in [01-basic-usage/](01-basic-usage/)
- 🔍 Understand environment configuration

### 2. Build Your First Feature / สร้างฟีเจอร์แรก
- 🔧 Follow [02-api-development/new_endpoint.py](02-api-development/new_endpoint.py)
- ✅ Learn validation with [02-api-development/with_validation.py](02-api-development/with_validation.py)
- 🧪 Run tests: `pytest -q`

### 3. Explore AI Agents / สำรวจ AI Agents
- 🤖 Study [03-ai-agents/lead_router_agent.py](03-ai-agents/lead_router_agent.py)
- 🏠 Check [03-ai-agents/property_listing.py](03-ai-agents/property_listing.py)
- 💡 Understand the scoring and routing logic

### 4. Deploy / Deploy
- 🐳 Use Docker examples in [04-docker/](04-docker/)
- 📚 Read deployment docs in [../docs/DEPLOYMENT.md](../docs/DEPLOYMENT.md)
- ⚠️ Follow [../docs/AGENT_BEHAVIOR_LOCK.md](../docs/AGENT_BEHAVIOR_LOCK.md)

---

## Common Tasks / งานที่ใช้บ่อย

### Add a New Endpoint / เพิ่ม Endpoint ใหม่

1. Create new file in `apps/api/routes/`
2. Copy structure from `examples/02-api-development/new_endpoint.py`
3. Update `apps/api/main.py` to include router
4. Test with `curl` or browser at `/docs`

### Create an AI Agent / สร้าง AI Agent

1. Study examples in `examples/03-ai-agents/`
2. Create new file in `apps/agents/`
3. Implement agent logic (scoring, routing, processing)
4. Write tests
5. Integrate with API endpoints

### Run Tests / รันเทสต์

```bash
# All tests
pytest -q

# With coverage
pytest --cov=apps --cov=packages

# Specific test file
pytest tests/test_health.py -v
```

### Lint Code / ตรวจสอบโค้ด

```bash
# Check for issues
ruff check .

# Auto-fix
ruff check . --fix
```

---

## Troubleshooting / แก้ปัญหา

### Service won't start / Service เริ่มไม่ได้

**Check if port is already in use:**
```bash
lsof -i :8000
# Or change port in .env
APP_PORT=8080
```

**Check dependencies:**
```bash
pip install -e ".[dev]"
```

### Examples fail / ตัวอย่างทำงานไม่ได้

**Make sure service is running:**
```bash
curl http://127.0.0.1:8000/healthz
```

**Install httpx (required by examples):**
```bash
pip install httpx
```

### Docker build fails / Docker build ล้มเหลว

**Try rebuilding without cache:**
```bash
docker compose build --no-cache
docker compose up
```

---

## Getting Help / ขอความช่วยเหลือ

- 📖 Read [../README.md](../README.md) for overview
- 📚 Check [../docs/](../docs/) for detailed docs
- 🐛 Report issues on GitHub
- 💬 Ask questions in discussions

---

## Example Project Structure / โครงสร้างโปรเจคตัวอย่าง

```
flowbiz-client-amp/
├── apps/
│   ├── api/              # Your API code here
│   │   ├── main.py       # Entry point
│   │   └── routes/       # Add your endpoints here
│   └── agents/           # AI agents (future)
├── packages/
│   └── core/             # Shared code
├── examples/             # 👈 You are here!
│   ├── 01-basic-usage/
│   ├── 02-api-development/
│   ├── 03-ai-agents/
│   └── 04-docker/
├── tests/                # Your tests here
└── docs/                 # Documentation
```

---

## Tips / เคล็ดลับ

✅ **DO:**
- Start with simple examples
- Read inline comments in example files
- Test your changes frequently
- Follow the project structure

❌ **DON'T:**
- Copy examples directly to production without understanding
- Skip reading docs
- Ignore linting errors
- Commit without testing

---

Happy coding! / เขียนโค้ดอย่างสนุก! 🚀
