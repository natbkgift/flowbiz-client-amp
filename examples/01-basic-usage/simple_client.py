"""
Simple Client Example / ตัวอย่างการใช้งาน Client อย่างง่าย

This example shows how to call the FlowBiz AMP API endpoints.
ตัวอย่างนี้แสดงวิธีเรียกใช้ API endpoints ของ FlowBiz AMP

Prerequisites / ข้อกำหนดเบื้องต้น:
1. Start the service first / เริ่ม service ก่อน:
   docker compose up --build
   หรือ python apps/api/main.py

2. Install httpx / ติดตั้ง httpx:
   pip install httpx
"""

import httpx


def check_health():
    """
    Check if the service is healthy / ตรวจสอบว่า service ทำงานปกติ
    """
    print("🔍 Checking service health...")
    print("   กำลังตรวจสอบสถานะ service...\n")
    
    try:
        response = httpx.get("http://127.0.0.1:8000/healthz")
        response.raise_for_status()
        
        data = response.json()
        print(f"✅ Service is healthy!")
        print(f"   Status: {data['status']}")
        print(f"   Service: {data['service']}")
        print(f"   Version: {data['version']}\n")
        return True
    except Exception as e:
        print(f"❌ Service is not available: {e}")
        print(f"   กรุณาเริ่ม service ก่อน: docker compose up --build\n")
        return False


def get_metadata():
    """
    Get service metadata / ดึงข้อมูล metadata ของ service
    """
    print("📋 Getting service metadata...")
    print("   กำลังดึงข้อมูล metadata...\n")
    
    try:
        response = httpx.get("http://127.0.0.1:8000/v1/meta")
        response.raise_for_status()
        
        data = response.json()
        print(f"✅ Metadata received!")
        print(f"   Service: {data['service']}")
        print(f"   Environment: {data['environment']}")
        print(f"   Version: {data['version']}")
        print(f"   Build SHA: {data['build_sha']}\n")
        return data
    except Exception as e:
        print(f"❌ Failed to get metadata: {e}\n")
        return None


def main():
    """
    Main function / ฟังก์ชันหลัก
    """
    print("=" * 60)
    print("FlowBiz AMP - Simple Client Example")
    print("ตัวอย่างการใช้งาน Client อย่างง่าย")
    print("=" * 60 + "\n")
    
    # Check if service is running / ตรวจสอบว่า service ทำงานหรือไม่
    if not check_health():
        print("💡 Tip: Start the service first with:")
        print("   docker compose up --build")
        print("   OR")
        print("   python apps/api/main.py")
        return
    
    # Get service metadata / ดึงข้อมูล metadata
    metadata = get_metadata()
    
    if metadata:
        print("=" * 60)
        print("✨ Success! You can now build on top of this API.")
        print("   สำเร็จ! คุณสามารถพัฒนาต่อจาก API นี้ได้แล้ว")
        print("=" * 60)
        print("\n📚 Next steps / ขั้นตอนต่อไป:")
        print("   1. Check other examples in examples/ folder")
        print("      ดูตัวอย่างอื่นๆ ใน folder examples/")
        print("   2. Read API docs at http://127.0.0.1:8000/docs")
        print("      อ่าน API docs ที่ http://127.0.0.1:8000/docs")
        print("   3. Start building your features!")
        print("      เริ่มพัฒนาฟีเจอร์ของคุณได้เลย!")


if __name__ == "__main__":
    main()
