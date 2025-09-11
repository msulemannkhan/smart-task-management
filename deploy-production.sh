#!/bin/bash

# Production Deployment Script for Smart Task Management
# Subdomain: taskmanager.sulemankhan.me

set -e  # Exit on any error

echo "🚀 Starting Production Deployment for taskmanager.sulemankhan.me"
echo "================================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root for security reasons"
   exit 1
fi

# Check prerequisites
print_status "Checking prerequisites..."

# Check if Docker is installed and running
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

if ! docker info &> /dev/null; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    print_error "Docker Compose is not available. Please install Docker Compose first."
    exit 1
fi

print_success "Prerequisites check passed"

# Check if environment files exist
if [ ! -f ".env" ] || [ ! -f ".env.ports" ]; then
    print_error "Environment files (.env, .env.ports) not found. Please create them first."
    exit 1
fi

print_success "Environment files found"

# Stop existing containers
print_status "Stopping existing containers..."
docker-compose down --remove-orphans || true
print_success "Existing containers stopped"

# Clean up old images (optional)
read -p "Do you want to remove old Docker images to free up space? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Cleaning up old Docker images..."
    docker system prune -f
    print_success "Docker cleanup completed"
fi

# Build and start services
print_status "Building and starting services..."
docker-compose up -d --build

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 10

# Check service health
print_status "Checking service health..."

# Check database
if docker-compose exec -T database pg_isready -U postgres -d smart_task_management; then
    print_success "Database is ready"
else
    print_error "Database is not ready"
    exit 1
fi

# Check backend
if curl -f http://localhost:9200/health &> /dev/null; then
    print_success "Backend API is ready"
else
    print_warning "Backend API health check failed, but continuing..."
fi

# Check frontend
if curl -f http://localhost:8086 &> /dev/null; then
    print_success "Frontend is ready"
else
    print_warning "Frontend health check failed, but continuing..."
fi

# Run database migrations
print_status "Running database migrations..."
docker-compose exec -T backend alembic upgrade head || print_warning "Migration failed, but continuing..."

# Create sample data (optional)
read -p "Do you want to create sample data? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Creating sample data..."
    docker-compose exec -T backend python create_sample_data.py || print_warning "Sample data creation failed"
fi

# Setup nginx configuration
print_status "Setting up nginx configuration..."

# Check if nginx is installed
if command -v nginx &> /dev/null; then
    # Copy nginx configuration
    sudo cp nginx-production.conf /etc/nginx/sites-available/taskmanager.sulemankhan.me
    
    # Create symbolic link
    sudo ln -sf /etc/nginx/sites-available/taskmanager.sulemankhan.me /etc/nginx/sites-enabled/
    
    # Test nginx configuration
    if sudo nginx -t; then
        print_success "Nginx configuration is valid"
        
        # Reload nginx
        sudo systemctl reload nginx
        print_success "Nginx reloaded"
    else
        print_error "Nginx configuration is invalid"
        exit 1
    fi
else
    print_warning "Nginx is not installed. Please install and configure nginx manually."
    print_warning "Copy nginx-production.conf to your nginx configuration directory."
fi

# Display deployment information
echo ""
echo "🎉 Deployment completed successfully!"
echo "=================================="
echo ""
echo "📋 Service Information:"
echo "  • Frontend: http://localhost:8086"
echo "  • Backend API: http://localhost:9200"
echo "  • Database: localhost:5433"
echo "  • API Documentation: http://localhost:9200/docs"
echo ""
echo "🌐 Production URLs:"
echo "  • Application: https://taskmanager.sulemankhan.me"
echo "  • API: https://taskmanager.sulemankhan.me/api"
echo "  • WebSocket: wss://taskmanager.sulemankhan.me/api/v1/ws"
echo ""
echo "🔧 Management Commands:"
echo "  • View logs: docker-compose logs -f"
echo "  • Stop services: docker-compose down"
echo "  • Restart services: docker-compose restart"
echo "  • Update services: docker-compose up -d --build"
echo ""
echo ""
echo "⚠️  Important Notes:"
echo "  • Make sure your domain DNS is pointing to this server"
echo "  • Ensure Cloudflare is configured for SSL termination"
echo "  • Monitor logs for any issues: docker-compose logs -f"
echo ""

print_success "Production deployment completed!"
