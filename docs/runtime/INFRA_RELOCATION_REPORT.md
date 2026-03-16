# Infra Relocation Report

วันที่: 2026-03-16
โหมด: Infrastructure Migration Mode

## สรุปผล

ย้าย infrastructure หลักจาก C: ไป D: สำเร็จในส่วนที่ปลอดภัยต่อ Docker, PostgreSQL, preview deployments และ repository workflows

ผลลัพธ์หลัก:

- Docker Desktop backing store ย้ายไปใช้ `D:\FlowBiz\data\docker`
- preview releases ใช้ `D:\FlowBiz\preview-releases`
- preview PostgreSQL data ใช้ `D:\FlowBiz\data\postgres\flowbiz-client-amp-preview`
- npm / pnpm / pip cache ถูกชี้ไป `D:\FlowBiz\shared-cache`
- preview deployment และ preview smoke ยังผ่านหลัง migration

## สิ่งที่เปลี่ยนจริง

### 1. Docker storage relocation

สภาพแวดล้อมนี้ใช้ Docker Desktop + WSL2 ดังนั้น internal daemon root ยังคงเป็น `/var/lib/docker`

แต่ Windows backing store ถูกย้ายออกจาก C: โดยวิธีนี้:

1. shutdown Docker Desktop
2. copy `C:\Users\natyw\AppData\Local\Docker` ไป `D:\FlowBiz\data\docker`
3. rename ต้นฉบับบน C: เป็น backup ชั่วคราว
4. สร้าง junction:
   - `C:\Users\natyw\AppData\Local\Docker` -> `D:\FlowBiz\data\docker`
5. restart Docker Desktop และ validate การทำงาน

หมายเหตุ:

- `C:\ProgramData\Docker\config\daemon.json` ไม่ได้มีอยู่บนเครื่องนี้ และไม่ใช่ control plane หลักของ Docker Desktop WSL2
- ดังนั้น effective Windows storage root จึงถูกย้ายด้วย junction แทนการใช้ Windows `data-root` แบบ classic

### 2. PostgreSQL relocation

ไม่พบ native Windows PostgreSQL service จึงไม่มี `C:\ProgramData\PostgreSQL` ให้ย้าย

สิ่งที่ทำแทน:

- สำรอง preview database ด้วย `pg_dumpall`
- ปรับ preview stack ให้ bind mount data ไปที่:
  - `D:\FlowBiz\data\postgres\flowbiz-client-amp-preview`
- ลบ named volume เก่าของ preview หลัง validate สำเร็จ

สถานะ PostgreSQL อื่น:

- `flowbiz-beauty-postgres` ใช้ bind mount ใต้ D: อยู่ก่อนแล้ว

### 3. Preview deployment relocation

preview deploy script ยังคงใช้ release path นี้และผ่าน validation หลัง migration:

- `D:\FlowBiz\preview-releases`

เพิ่มเติม:

- logs path อยู่ใต้ `D:\FlowBiz\flowbiz-client-amp-preview\ops\logs`
- preview PostgreSQL data path อยู่ใต้ `D:\FlowBiz\data\postgres\flowbiz-client-amp-preview`

### 4. Cache relocation

ตั้งค่าใหม่สำเร็จ:

- npm cache: `D:\FlowBiz\shared-cache\npm`
- pnpm store: `D:\FlowBiz\shared-cache\pnpm`
- pip cache: `D:\FlowBiz\shared-cache\pip`

และทำ junction สำหรับ legacy cache paths บน C:

- `C:\Users\natyw\AppData\Local\npm-cache` -> `D:\FlowBiz\shared-cache\npm`
- `C:\Users\natyw\AppData\Local\pip\Cache` -> `D:\FlowBiz\shared-cache\pip`

### 5. Buildx

สร้าง builder ชื่อ `flowbizbuilder` สำเร็จและ BuildKit container ทำงานแล้ว

สถานะล่าสุดจาก `docker buildx inspect flowbizbuilder`:

- driver: `docker-container`
- node: `flowbizbuilder0`
- status: `running`

path ที่เตรียมไว้สำหรับ local cache:

- `D:\FlowBiz\shared-cache\docker-buildx`

ตรวจยืนยันแล้วว่ามี cache metadata จริง:

- `D:\FlowBiz\shared-cache\docker-buildx\index.json`

หมายเหตุ:

- current repo deploy flows ยังใช้ `docker compose build` ตามเดิม
- ถ้าต้องการบังคับ `--cache-to type=local,dest=D:\FlowBiz\shared-cache\docker-buildx` ในทุก build จำเป็นต้อง refactor build invocation เพิ่มเติมแยกจากรอบย้าย infra นี้

## Validation results

### Docker

ผ่าน:

- `docker ps`
- Docker Desktop restart หลัง relocation
- preview containers กลับมาทำงานได้

### Preview deployment

ผ่านหลัง migration:

- `scripts\deploy_preview.ps1 -TargetSha 5864a900a29a57921100b08c8ab652dde6b0fb15`
- preview smoke suite exit code `0`

Representative preview endpoints:

- `/api/health`
- `/api/ping`
- `/api/platform/version`

### PostgreSQL integrity

ผ่าน:

- preview database ตอบ `select 1`
- preview data directory ถูกสร้างจริงใต้ `D:\FlowBiz\data\postgres\flowbiz-client-amp-preview`

### Backups

สร้างสำเร็จ:

- `D:\FlowBiz\backups\preview_postgres_backup.sql`

## Disk usage before / after

### ก่อน migration

- C: free = `1.27 GB`
- D: free = `232.12 GB`

### หลัง migration และ cleanup ใน scope นี้

- C: free = `11.26 GB`
- D: free = `225.10 GB`

## สิ่งที่ถูกลบหลัง validation

ลบแล้วเพื่อ reclaim space:

- Docker local backup เดิมบน C: หลัง validate junction + restart สำเร็จ
- npm cache backup เดิมบน C:
- pip cache backup เดิมบน C:
- preview named volume เก่า `flowbiz-client-amp-preview_postgres_data`

## Success condition assessment

### สำเร็จ

- Docker effective Windows storage root = `D:\FlowBiz\data\docker`
- preview releases = `D:\FlowBiz\preview-releases`
- preview PostgreSQL data = `D:\FlowBiz\data\postgres\flowbiz-client-amp-preview`
- development caches = `D:\FlowBiz\shared-cache`

### ยังไม่ถึงเป้าเต็ม

- C: free space ยังไม่เกิน `20 GB`

สถานะล่าสุด:

- C: free = `11.26 GB`

### เหตุผล

พื้นที่ใหญ่ที่ยังเหลือบน C: อยู่นอก infra scope ที่ย้ายอย่างปลอดภัยได้ใน session นี้ และบางส่วนเป็น active tooling state ของ editor/session ปัจจุบัน เช่น:

- `C:\Users\natyw\AppData\Roaming\Code` ประมาณ `7.09 GB`
- `C:\Users\natyw\.gemini` ประมาณ `3.20 GB`
- `C:\Users\natyw\.vscode` ประมาณ `1.60 GB`
- `C:\Users\natyw\.codex` ประมาณ `0.99 GB`

การย้าย directory เหล่านี้ระหว่างที่ VS Code/agent session ยังเปิดอยู่มีความเสี่ยงต่อ workflow ปัจจุบัน จึงไม่ได้ทำในรอบนี้

## ข้อเสนอสำหรับ maintenance window ถัดไป

หากต้องการให้ C: เกิน `20 GB` จริง จำเป็นต้องทำรอบแยกต่างหากโดยปิด VS Code/Desktop tooling ก่อน แล้วค่อยย้ายหรือ junction อย่างน้อย:

1. `C:\Users\natyw\AppData\Roaming\Code`
2. `C:\Users\natyw\.vscode`
3. `C:\Users\natyw\.gemini`
4. `C:\Users\natyw\.codex`

## Final status

Infrastructure relocation ใน scope ของ Docker / preview PostgreSQL / preview releases / npm-pnpm-pip caches เสร็จและใช้งานได้จริง

แต่ success condition เรื่อง `C: > 20 GB free` ยังไม่ผ่าน เพราะต้องย้าย active editor/tooling state เพิ่มใน maintenance window แยก