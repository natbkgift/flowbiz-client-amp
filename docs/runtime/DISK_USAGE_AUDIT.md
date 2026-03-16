# Disk Usage Audit

วันที่: 2026-03-16
โหมด: Infrastructure Migration Mode

## Drive baseline ก่อน migration

ผลจาก `Get-PSDrive` ก่อนเริ่มย้าย:

| Drive | Used (GB) | Free (GB) |
| --- | ---: | ---: |
| C: | 109.92 | 1.27 |
| D: | 699.40 | 232.12 |

## Directory baseline บน C:

| Path | Size (GB) | หมายเหตุ |
| --- | ---: | --- |
| `C:\Users` | 51.28 | ตัวใช้พื้นที่หลักบน C: |
| `C:\Users\natyw\AppData\Local\Docker` | 6.46 | Docker Desktop WSL backing store |
| `C:\Users\natyw\.docker` | 0.09 | Docker CLI config |
| `C:\ProgramData\Docker` | ไม่พบ | ไม่มี data root แบบ Windows service |
| `C:\ProgramData\PostgreSQL` | ไม่พบ | ไม่มี native PostgreSQL service/data |

## Largest subdirectories ที่เกี่ยวข้อง

| Parent | Directory | Size (GB) |
| --- | --- | ---: |
| `C:\Users` | `natyw` | 51.22 |
| `C:\Users\natyw\AppData\Local\Docker` | `wsl` | 6.43 |
| `C:\Users\natyw\AppData\Local` | `npm-cache` | 2.74 |

## Docker storage details ก่อนย้าย

Docker daemon ใช้ Docker Desktop + WSL2 ไม่ใช่ Windows `data-root` แบบ classic:

- Docker internal root: `/var/lib/docker`
- Windows backing store file: `C:\Users\natyw\AppData\Local\Docker\wsl\disk\docker_data.vhdx`
- `docker_data.vhdx` ขนาดประมาณ `6.32 GB`
- `ext4.vhdx` ขนาดประมาณ `0.10 GB`

## PostgreSQL baseline ก่อนย้าย

- ไม่พบ Windows service จาก `Get-Service *postgres*`
- preview PostgreSQL อยู่ใน Docker named volume `flowbiz-client-amp-preview_postgres_data`
- `flowbiz-beauty-postgres` ใช้ bind mount ที่ `D:/FlowBiz/data/flowbiz-client-beauty/postgres` อยู่ก่อนแล้ว

## User-profile hotspots ที่ยังเหลือบน C:

ค่าต่อไปนี้สำคัญต่อการอธิบายว่าทำไมหลังย้าย infra แล้วพื้นที่ C: ยังไม่เกิน `20 GB`:

| Path | Size (GB) |
| --- | ---: |
| `C:\Users\natyw\AppData` | 40.53 |
| `C:\Users\natyw\AppData\Roaming\Code` | 7.09 |
| `C:\Users\natyw\.gemini` | 3.20 |
| `C:\Users\natyw\.vscode` | 1.60 |
| `C:\Users\natyw\OneDrive` | 1.11 |
| `C:\Users\natyw\Saved Games` | 1.03 |
| `C:\Users\natyw\.codex` | 0.99 |
| `C:\Users\natyw\.cache` | 0.47 |

## Audit conclusion

พื้นที่วิกฤตที่ย้ายได้โดยตรงใน scope นี้คือ:

1. Docker Desktop local backing store ใต้ `AppData\Local\Docker`
2. preview PostgreSQL data ที่เดิมอยู่ใน Docker named volume
3. npm / pnpm / pip caches

แต่ต่อให้ย้ายทั้งหมดใน scope นี้ พื้นที่ C: ยังมีโอกาสไม่ถึง `20 GB` เพราะ directory ใหญ่ที่เหลืออยู่ส่วนมากเป็น editor/tooling state และ user data ที่อยู่นอก infra scope โดยตรง