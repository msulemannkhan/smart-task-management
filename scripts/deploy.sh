#!/bin/bash

# Smart Task Management System - Unix/Linux/Mac Deployment Script
# This script runs the Python deployment script

set -e  # Exit on error

echo "=========================================="
echo "Smart Task Management System Deployment"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}ERROR: Python 3 is not installed${NC}"
    echo "Please install Python 3.8+ from https://www.python.org/downloads/"
    exit 1
fi

# Check if Docker is installed and running
if ! command -v docker &> /dev/null; then
    echo -e "${RED}ERROR: Docker is not installed${NC}"
    echo "Please install Docker from https://www.docker.com/get-started"
    exit 1
fi

if ! docker version &> /dev/null; then
    echo -e "${RED}ERROR: Docker is not running${NC}"
    echo "Please start Docker Desktop"
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}WARNING: docker-compose not found, trying docker compose${NC}"
    # Create alias for docker compose
    docker-compose() {
        docker compose "$@"
    }
fi

# Navigate to script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Run the deployment script
echo "Starting deployment..."
python3 deploy.py "$@"

# Check if deployment was successful
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}=========================================="
    echo "Deployment completed successfully!"
    echo "==========================================${NC}"
    echo ""
    echo "You can access the application at:"
    echo "  • Frontend: http://localhost:8086"
    echo "  • Backend:  http://localhost:9200"
    echo "  • API Docs: http://localhost:9200/docs"
    echo ""
    echo "Default login credentials:"
    echo "  • Email:    demo@example.com"
    echo "  • Password: demo123"
    echo ""
else
    echo ""
    echo -e "${RED}=========================================="
    echo "Deployment failed! Check the error messages above."
    echo "==========================================${NC}"
    exit 1
fi