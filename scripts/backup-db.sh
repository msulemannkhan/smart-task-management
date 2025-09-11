#!/bin/bash

# Database backup script for Smart Task Management System
# This script creates timestamped backups of the PostgreSQL database

set -e

# Configuration
CONTAINER_NAME="stm-database"
DB_NAME="smart_task_management"
DB_USER="postgres"
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/backup_${DB_NAME}_${TIMESTAMP}.sql"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting database backup...${NC}"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Check if container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo -e "${RED}Error: Container ${CONTAINER_NAME} is not running${NC}"
    echo "Please start the container with: docker-compose up -d database"
    exit 1
fi

# Create backup
echo -e "${YELLOW}Creating backup: ${BACKUP_FILE}${NC}"
docker exec -t "$CONTAINER_NAME" pg_dump -U "$DB_USER" -d "$DB_NAME" --clean --if-exists > "$BACKUP_FILE"

# Check if backup was successful
if [ $? -eq 0 ] && [ -f "$BACKUP_FILE" ]; then
    SIZE=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')
    echo -e "${GREEN}Backup completed successfully!${NC}"
    echo -e "File: ${BACKUP_FILE}"
    echo -e "Size: ${SIZE}"
    
    # Also create a copy inside the Docker volume for extra safety
    echo -e "${YELLOW}Creating volume backup...${NC}"
    docker exec -t "$CONTAINER_NAME" pg_dump -U "$DB_USER" -d "$DB_NAME" --clean --if-exists > /tmp/temp_backup.sql
    docker cp /tmp/temp_backup.sql "${CONTAINER_NAME}:/backups/latest_backup.sql"
    rm /tmp/temp_backup.sql
    echo -e "${GREEN}Volume backup created at /backups/latest_backup.sql${NC}"
    
    # Keep only last 10 backups to save space
    echo -e "${YELLOW}Cleaning old backups...${NC}"
    cd "$BACKUP_DIR"
    ls -t backup_${DB_NAME}_*.sql 2>/dev/null | tail -n +11 | xargs -r rm
    cd - > /dev/null
    echo -e "${GREEN}Old backups cleaned${NC}"
else
    echo -e "${RED}Backup failed!${NC}"
    exit 1
fi

echo -e "${GREEN}Backup process completed!${NC}"