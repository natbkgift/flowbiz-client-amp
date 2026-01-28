"""
Environment Configuration Example / ตัวอย่างการตั้งค่า Environment Variables

This example shows how to configure the FlowBiz AMP service using environment variables.
ตัวอย่างนี้แสดงวิธีตั้งค่า service ด้วย environment variables

Learn how to:
- Set different environment modes (dev, prod)
- Configure service metadata
- Change host and port settings
"""

import os
from pathlib import Path


def show_current_config():
    """
    Display current environment configuration / แสดงค่า config ปัจจุบัน
    """
    print("\n📋 Current Environment Configuration:")
    print("   ค่า Configuration ปัจจุบัน:\n")

    env_vars = {
        "APP_ENV": os.getenv("APP_ENV", "dev"),
        "APP_HOST": os.getenv("APP_HOST", "0.0.0.0"),
        "APP_PORT": os.getenv("APP_PORT", "8000"),
        "APP_LOG_LEVEL": os.getenv("APP_LOG_LEVEL", "info"),
        "FLOWBIZ_SERVICE_NAME": os.getenv("FLOWBIZ_SERVICE_NAME", "flowbiz-template-service"),
        "FLOWBIZ_VERSION": os.getenv("FLOWBIZ_VERSION", "0.1.0"),
        "FLOWBIZ_BUILD_SHA": os.getenv("FLOWBIZ_BUILD_SHA", "local"),
    }

    for key, value in env_vars.items():
        print(f"   {key}: {value}")

    print()


def create_example_env_file():
    """
    Create an example .env file / สร้างไฟล์ .env ตัวอย่าง
    """
    print("\n📝 Creating example .env file...")
    print("   กำลังสร้างไฟล์ .env ตัวอย่าง...\n")

    env_content = """# FlowBiz AMP Environment Configuration
# ตั้งค่า Environment สำหรับ FlowBiz AMP

# ========================================
# Runtime Configuration (APP_*)
# ========================================

# Environment: dev, staging, prod
APP_ENV=dev

# Host to bind to (use 127.0.0.1 for VPS deployment)
# โฮสต์ที่จะ bind (ใช้ 127.0.0.1 สำหรับ VPS)
APP_HOST=0.0.0.0

# Port to listen on
# พอร์ตที่จะฟัง
APP_PORT=8000

# Log level: debug, info, warning, error
# ระดับของ log
APP_LOG_LEVEL=info

# ========================================
# Service Metadata (FLOWBIZ_*)
# ========================================

# Service name
FLOWBIZ_SERVICE_NAME=amp-service

# Semantic version
FLOWBIZ_VERSION=0.1.0

# Git commit SHA (automatically set in CI/CD)
FLOWBIZ_BUILD_SHA=local

# ========================================
# Example: Production Configuration
# ========================================
# For production deployment, use:
# สำหรับ production ใช้ค่าเหล่านี้:
#
# APP_ENV=prod
# APP_HOST=127.0.0.1  # ⚠️ IMPORTANT: localhost only for VPS
# APP_PORT=8000
# APP_LOG_LEVEL=warning
# FLOWBIZ_BUILD_SHA=<git-commit-sha>

# ========================================
# Example: Custom Port
# ========================================
# To run on a different port:
# เพื่อรันบนพอร์ตอื่น:
#
# APP_PORT=8080
"""

    example_file = Path("example.env")
    example_file.write_text(env_content)

    print(f"✅ Created: {example_file.absolute()}")
    print("\n💡 To use this file / การใช้ไฟล์นี้:")
    print("   1. Copy to .env: cp example.env .env")
    print("   2. Edit values as needed / แก้ไขค่าตามต้องการ")
    print("   3. Restart the service / รีสตาร์ท service\n")


def show_environment_examples():
    """
    Show different environment configuration examples
    แสดงตัวอย่างการตั้งค่าสำหรับสภาพแวดล้อมต่างๆ
    """
    print("\n" + "=" * 60)
    print("Environment Configuration Examples")
    print("ตัวอย่างการตั้งค่าสำหรับสภาพแวดล้อมต่างๆ")
    print("=" * 60)

    configs = {
        "Development (Local)": {
            "APP_ENV": "dev",
            "APP_HOST": "0.0.0.0",
            "APP_PORT": "8000",
            "APP_LOG_LEVEL": "debug",
        },
        "Production (VPS)": {
            "APP_ENV": "prod",
            "APP_HOST": "127.0.0.1",  # ⚠️ localhost only
            "APP_PORT": "8000",
            "APP_LOG_LEVEL": "warning",
        },
        "Custom Development": {
            "APP_ENV": "dev",
            "APP_HOST": "0.0.0.0",
            "APP_PORT": "8080",  # Different port
            "APP_LOG_LEVEL": "info",
        },
    }

    for env_name, config in configs.items():
        print(f"\n📌 {env_name}:")
        for key, value in config.items():
            print(f"   {key}={value}")


def main():
    """
    Main function / ฟังก์ชันหลัก
    """
    print("=" * 60)
    print("FlowBiz AMP - Environment Configuration Example")
    print("ตัวอย่างการตั้งค่า Environment Variables")
    print("=" * 60)

    # Show current configuration
    show_current_config()

    # Show examples for different environments
    show_environment_examples()

    # Create example .env file
    create_example_env_file()

    print("=" * 60)
    print("✅ Done! Check the example.env file created.")
    print("   เสร็จแล้ว! ตรวจสอบไฟล์ example.env ที่สร้างขึ้น")
    print("=" * 60)


if __name__ == "__main__":
    main()
