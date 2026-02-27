# FlowBiz Client AMP - Examples / ตัวอย่างการใช้งาน

ยินดีต้อนรับสู่คู่มือตัวอย่างการใช้งาน FlowBiz Client AMP! 🎉

เอกสารนี้มีตัวอย่างโค้ดจริงที่สามารถรันได้ เพื่อช่วยให้คุณเข้าใจและพัฒนาระบบได้ง่ายขึ้น

## 📚 Table of Contents

1. [Basic Usage (การใช้งานพื้นฐาน)](#1-basic-usage)
2. [API Development (พัฒนา API)](#2-api-development)
3. [AI Agents (ตัวอย่าง AI Agent)](#3-ai-agents)
4. [Docker Examples (ตัวอย่างการใช้ Docker)](#4-docker-examples)

---

## 1. Basic Usage

ตัวอย่างการใช้งานพื้นฐาน เหมาะสำหรับผู้เริ่มต้น

### Examples:
- **[simple_client.py](01-basic-usage/simple_client.py)** - เรียกใช้ API endpoints อย่างง่าย
- **[environment_config.py](01-basic-usage/environment_config.py)** - ตั้งค่า Environment Variables
- **[health_check.py](01-basic-usage/health_check.py)** - ตรวจสอบสถานะ service

### วิธีรัน:
```bash
cd examples/01-basic-usage
python simple_client.py
```

---

## 2. API Development

ตัวอย่างการพัฒนา API endpoints ใหม่ เหมาะสำหรับนักพัฒนา

### Examples:
- **[new_endpoint.py](02-api-development/new_endpoint.py)** - สร้าง endpoint ใหม่ (CRUD operations)
- **[with_validation.py](02-api-development/with_validation.py)** - Validation และ Error Handling

### วิธีรัน:
```bash
cd examples/02-api-development
python new_endpoint.py
```

---

## 3. AI Agents

ตัวอย่าง AI Agents สำหรับธุรกิจอสังหาริมทรัพย์

### Examples:
- **[lead_router_agent.py](03-ai-agents/lead_router_agent.py)** - จัดการและ route leads
- **[property_listing.py](03-ai-agents/property_listing.py)** - จัดการข้อมูล property

### วิธีรัน:
```bash
cd examples/03-ai-agents
python lead_router_agent.py
```

---

## 4. Docker Examples

ตัวอย่างการใช้งาน Docker

### Examples:
- **[run_local.sh](04-docker/run_local.sh)** - รัน service ใน Docker
- **[test_in_docker.sh](04-docker/test_in_docker.sh)** - ทดสอบใน Docker environment

### วิธีรัน:
```bash
cd examples/04-docker
bash run_local.sh
```

---

## 🚀 Quick Start

### Prerequisites
```bash
# ติดตั้ง dependencies
pip install -e ".[dev]"

# หรือใช้ Docker
docker compose up --build
```

### Run All Examples
```bash
# ตรวจสอบว่า service ทำงาน
curl http://127.0.0.1:8000/healthz

# รัน example scripts
cd examples
python 01-basic-usage/simple_client.py
```

---

## 📖 หมายเหตุ

- ตัวอย่างทั้งหมดใช้ได้จริงและผ่านการทดสอบแล้ว ✅
- แต่ละตัวอย่างมี comments อธิบายภาษาไทยและอังกฤษ 🇹🇭 🇬🇧
- สามารถนำไปปรับใช้กับโปรเจคจริงได้เลย 💪

## 🤝 Contributing

หากต้องการเพิ่มตัวอย่างใหม่:
1. สร้างไฟล์ใน directory ที่เหมาะสม
2. เพิ่ม comments อธิบาย
3. ทดสอบให้แน่ใจว่าทำงานได้
4. อัพเดท README นี้

## 🔗 Links

- [Main README](../README.md)
- [API Documentation](http://127.0.0.1:8000/docs) (เมื่อรัน service แล้ว)
- [Contributing Guide](../CONTRIBUTING.md)
