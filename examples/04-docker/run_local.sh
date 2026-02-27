#!/bin/bash
# Run FlowBiz AMP service locally using Docker
# รัน service ใน Docker แบบ local

echo "======================================================================"
echo "FlowBiz AMP - Docker Local Run"
echo "รัน service ใน Docker"
echo "======================================================================"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker is not installed"
    echo "   กรุณาติดตั้ง Docker ก่อน"
    echo ""
    echo "   Install from: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker compose &> /dev/null; then
    echo "❌ Error: Docker Compose is not available"
    echo "   กรุณาติดตั้ง Docker Compose"
    exit 1
fi

echo "✅ Docker is installed"
echo ""

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker compose down

echo ""
echo "🏗️  Building and starting service..."
echo "   กำลัง build และเริ่มต้น service..."
echo ""

# Build and start
docker compose up --build -d

# Wait for service to be ready
echo ""
echo "⏳ Waiting for service to be ready..."
sleep 5

# Check health
echo ""
echo "🔍 Checking service health..."
for i in {1..10}; do
    if curl -sf http://127.0.0.1:8000/healthz > /dev/null 2>&1; then
        echo "✅ Service is healthy!"
        echo ""
        
        # Show service info
        echo "======================================================================"
        echo "Service Information / ข้อมูล Service"
        echo "======================================================================"
        curl -s http://127.0.0.1:8000/v1/meta | python3 -m json.tool
        echo ""
        
        echo "======================================================================"
        echo "✨ Service is running!"
        echo "   Service กำลังทำงาน!"
        echo "======================================================================"
        echo ""
        echo "📍 Endpoints:"
        echo "   Health Check:    http://127.0.0.1:8000/healthz"
        echo "   Metadata:        http://127.0.0.1:8000/v1/meta"
        echo "   API Docs:        http://127.0.0.1:8000/docs"
        echo "   Alternative Docs: http://127.0.0.1:8000/redoc"
        echo ""
        echo "📋 Useful commands:"
        echo "   View logs:       docker compose logs -f"
        echo "   Stop service:    docker compose down"
        echo "   Restart:         docker compose restart"
        echo ""
        exit 0
    fi
    echo "   Attempt $i/10..."
    sleep 2
done

echo ""
echo "❌ Service failed to start or is unhealthy"
echo "   Service ไม่สามารถเริ่มต้นได้"
echo ""
echo "📋 Check logs with:"
echo "   docker compose logs"
exit 1
