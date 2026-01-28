"""
Health Check Example / ตัวอย่างการตรวจสอบสถานะ

This example shows different ways to monitor service health.
ตัวอย่างนี้แสดงวิธีต่างๆ ในการตรวจสอบสถานะของ service

Use cases:
- Monitoring scripts / สคริปต์ตรวจสอบ
- Health check in CI/CD
- Load balancer health checks
"""

import sys
import time
import httpx


def simple_health_check():
    """
    Simple health check that returns True/False
    การตรวจสอบสถานะแบบง่าย คืนค่า True/False
    """
    try:
        response = httpx.get("http://127.0.0.1:8000/healthz", timeout=5.0)
        return response.status_code == 200
    except Exception:
        return False


def detailed_health_check():
    """
    Detailed health check with error information
    การตรวจสอบสถานะแบบละเอียด พร้อมข้อมูล error
    """
    try:
        response = httpx.get("http://127.0.0.1:8000/healthz", timeout=5.0)
        response.raise_for_status()
        
        data = response.json()
        return {
            "healthy": True,
            "status": data.get("status"),
            "service": data.get("service"),
            "version": data.get("version"),
            "response_time": response.elapsed.total_seconds(),
        }
    except httpx.TimeoutException:
        return {
            "healthy": False,
            "error": "Service timeout - took longer than 5 seconds",
        }
    except httpx.ConnectError:
        return {
            "healthy": False,
            "error": "Cannot connect to service - is it running?",
        }
    except Exception as e:
        return {
            "healthy": False,
            "error": str(e),
        }


def wait_for_service(max_attempts=30, delay=1):
    """
    Wait for service to become healthy
    รอจนกว่า service จะพร้อมใช้งาน
    
    Args:
        max_attempts: Maximum number of attempts / จำนวนครั้งที่พยายามสูงสุด
        delay: Delay between attempts in seconds / หน่วงเวลาระหว่างการพยายามแต่ละครั้ง
    
    Returns:
        True if service is healthy, False otherwise
    """
    print(f"⏳ Waiting for service to be ready (max {max_attempts} attempts)...")
    print(f"   รอให้ service พร้อมใช้งาน (สูงสุด {max_attempts} ครั้ง)...\n")
    
    for attempt in range(1, max_attempts + 1):
        print(f"   Attempt {attempt}/{max_attempts}...", end=" ")
        
        if simple_health_check():
            print("✅")
            print(f"\n✨ Service is ready after {attempt} attempt(s)!")
            print(f"   Service พร้อมใช้งานแล้วหลังจาก {attempt} ครั้ง!")
            return True
        
        print("❌")
        
        if attempt < max_attempts:
            time.sleep(delay)
    
    print(f"\n❌ Service did not become healthy after {max_attempts} attempts")
    print(f"   Service ยังไม่พร้อมหลังจากพยายาม {max_attempts} ครั้ง")
    return False


def continuous_monitoring(interval=5, duration=30):
    """
    Monitor service health continuously
    ตรวจสอบสถานะ service อย่างต่อเนื่อง
    
    Args:
        interval: Check interval in seconds / ช่วงเวลาระหว่างการตรวจสอบ
        duration: Total monitoring duration in seconds / ระยะเวลาทั้งหมดที่จะตรวจสอบ
    """
    print(f"\n📊 Starting continuous monitoring for {duration} seconds...")
    print(f"   เริ่มตรวจสอบอย่างต่อเนื่องเป็นเวลา {duration} วินาที...\n")
    
    start_time = time.time()
    checks = []
    
    while time.time() - start_time < duration:
        result = detailed_health_check()
        checks.append(result)
        
        timestamp = time.strftime("%H:%M:%S")
        if result["healthy"]:
            response_time = result.get("response_time", 0)
            print(f"   [{timestamp}] ✅ Healthy (response: {response_time:.3f}s)")
        else:
            print(f"   [{timestamp}] ❌ Unhealthy - {result.get('error', 'Unknown error')}")
        
        time.sleep(interval)
    
    # Summary
    healthy_count = sum(1 for c in checks if c["healthy"])
    total_checks = len(checks)
    uptime_percentage = (healthy_count / total_checks * 100) if total_checks > 0 else 0
    
    print(f"\n📈 Monitoring Summary / สรุปผลการตรวจสอบ:")
    print(f"   Total checks: {total_checks}")
    print(f"   Healthy: {healthy_count}")
    print(f"   Unhealthy: {total_checks - healthy_count}")
    print(f"   Uptime: {uptime_percentage:.1f}%")


def main():
    """
    Main function with different health check modes
    """
    print("=" * 60)
    print("FlowBiz AMP - Health Check Example")
    print("ตัวอย่างการตรวจสอบสถานะ")
    print("=" * 60 + "\n")
    
    # Ask user what to do
    print("Select mode / เลือกโหมด:")
    print("  1. Simple check / ตรวจสอบแบบง่าย")
    print("  2. Detailed check / ตรวจสอบแบบละเอียด")
    print("  3. Wait for service / รอให้ service พร้อม")
    print("  4. Continuous monitoring / ตรวจสอบต่อเนื่อง (30 seconds)")
    print()
    
    try:
        choice = input("Enter choice (1-4) / ใส่ตัวเลือก (1-4): ").strip()
    except (KeyboardInterrupt, EOFError):
        print("\n\n👋 Cancelled")
        return
    
    print()
    
    if choice == "1":
        result = simple_health_check()
        if result:
            print("✅ Service is healthy! / Service ทำงานปกติ!")
            sys.exit(0)
        else:
            print("❌ Service is unhealthy! / Service ไม่พร้อมใช้งาน!")
            sys.exit(1)
    
    elif choice == "2":
        result = detailed_health_check()
        print("Health Check Result / ผลการตรวจสอบ:")
        for key, value in result.items():
            print(f"  {key}: {value}")
        sys.exit(0 if result["healthy"] else 1)
    
    elif choice == "3":
        success = wait_for_service(max_attempts=30, delay=1)
        sys.exit(0 if success else 1)
    
    elif choice == "4":
        continuous_monitoring(interval=5, duration=30)
        sys.exit(0)
    
    else:
        print("❌ Invalid choice / ตัวเลือกไม่ถูกต้อง")
        sys.exit(1)


if __name__ == "__main__":
    main()
