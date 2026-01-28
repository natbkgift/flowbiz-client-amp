#!/bin/bash
# Test FlowBiz AMP service in Docker environment
# ทดสอบ service ใน Docker

echo "======================================================================"
echo "FlowBiz AMP - Docker Testing"
echo "ทดสอบ service ใน Docker"
echo "======================================================================"
echo ""

# Check if service is running
echo "🔍 Checking if service is running..."
if ! docker compose ps | grep -q "Up"; then
    echo "❌ Service is not running"
    echo "   Service ไม่ได้ทำงาน"
    echo ""
    echo "💡 Start the service first:"
    echo "   bash run_local.sh"
    exit 1
fi

echo "✅ Service is running"
echo ""

# Test counter
passed=0
failed=0

# Test function
test_endpoint() {
    local name=$1
    local url=$2
    local expected_code=$3
    
    echo "Testing: $name"
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$response" -eq "$expected_code" ]; then
        echo "   ✅ PASS (HTTP $response)"
        ((passed++))
    else
        echo "   ❌ FAIL (Expected: $expected_code, Got: $response)"
        ((failed++))
    fi
}

# Run tests
echo "======================================================================"
echo "Running API Tests / ทดสอบ API"
echo "======================================================================"
echo ""

test_endpoint "Health Check" "http://127.0.0.1:8000/healthz" 200
test_endpoint "Metadata" "http://127.0.0.1:8000/v1/meta" 200
test_endpoint "API Docs" "http://127.0.0.1:8000/docs" 200
test_endpoint "404 Error" "http://127.0.0.1:8000/nonexistent" 404

echo ""
echo "======================================================================"
echo "Testing Response Content / ทดสอบเนื้อหาตอบกลับ"
echo "======================================================================"
echo ""

# Test health response structure
echo "Testing: Health Response Structure"
health_response=$(curl -s http://127.0.0.1:8000/healthz)
if echo "$health_response" | python3 -c "
import sys, json
data = json.load(sys.stdin)
required = ['status', 'service', 'version']
missing = [k for k in required if k not in data]
if missing:
    print(f'Missing keys: {missing}')
    sys.exit(1)
if data['status'] != 'ok':
    print(f\"Status is not 'ok': {data['status']}\")
    sys.exit(1)
" 2>&1; then
    echo "   ✅ PASS"
    ((passed++))
else
    echo "   ❌ FAIL"
    ((failed++))
fi

# Test meta response structure
echo "Testing: Meta Response Structure"
meta_response=$(curl -s http://127.0.0.1:8000/v1/meta)
if echo "$meta_response" | python3 -c "
import sys, json
data = json.load(sys.stdin)
required = ['service', 'environment', 'version', 'build_sha']
missing = [k for k in required if k not in data]
if missing:
    print(f'Missing keys: {missing}')
    sys.exit(1)
" 2>&1; then
    echo "   ✅ PASS"
    ((passed++))
else
    echo "   ❌ FAIL"
    ((failed++))
fi

echo ""
echo "======================================================================"
echo "Testing Container Status / ทดสอบสถานะ Container"
echo "======================================================================"
echo ""

# Check if container is healthy
echo "Testing: Container Health"
container_status=$(docker compose ps --format json | python3 -c "
import sys, json
containers = [json.loads(line) for line in sys.stdin]
if not containers:
    print('No containers found')
    sys.exit(1)
service = containers[0]
if service['State'] == 'running':
    print('Container is running')
    sys.exit(0)
else:
    print(f\"Container state: {service['State']}\")
    sys.exit(1)
" 2>&1)

if [ $? -eq 0 ]; then
    echo "   ✅ PASS: $container_status"
    ((passed++))
else
    echo "   ❌ FAIL: $container_status"
    ((failed++))
fi

# Test container logs for errors
echo "Testing: No Critical Errors in Logs"
if docker compose logs | grep -qi "error.*critical\|fatal\|panic"; then
    echo "   ⚠️  WARNING: Found critical errors in logs"
    echo "   Run 'docker compose logs' to see details"
    ((failed++))
else
    echo "   ✅ PASS: No critical errors found"
    ((passed++))
fi

echo ""
echo "======================================================================"
echo "Test Summary / สรุปผลการทดสอบ"
echo "======================================================================"
echo ""
echo "   Total tests: $((passed + failed))"
echo "   Passed: $passed ✅"
echo "   Failed: $failed ❌"
echo ""

if [ $failed -eq 0 ]; then
    echo "✨ All tests passed! / ทดสอบผ่านทั้งหมด!"
    echo ""
    echo "💡 Your service is working correctly in Docker"
    echo "   Service ทำงานถูกต้องใน Docker แล้ว"
    exit 0
else
    echo "⚠️  Some tests failed / มีการทดสอบบางอย่างล้มเหลว"
    echo ""
    echo "📋 Check logs for details:"
    echo "   docker compose logs"
    exit 1
fi
