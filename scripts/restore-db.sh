#!/bin/bash

# Database restore script for Smart Task Management System
# This script restores PostgreSQL database from a backup file

set -e

# Configuration
CONTAINER_NAME="stm-database"
DB_NAME="smart_task_management"
DB_USER="postgres"
BACKUP_DIR="./backups"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Database Restore Utility${NC}"
echo "========================="

# Check if container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo -e "${RED}Error: Container ${CONTAINER_NAME} is not running${NC}"
    echo "Please start the container with: docker-compose up -d database"
    exit 1
fi

# Function to list available backups
list_backups() {
    echo -e "${YELLOW}Available backups:${NC}"
    if [ -d "$BACKUP_DIR" ] && [ "$(ls -A $BACKUP_DIR/*.sql 2>/dev/null)" ]; then
        ls -lht "$BACKUP_DIR"/*.sql | head -20 | awk '{print NR". "$9" ("$5", "$6" "$7" "$8")"}'
    else
        echo -e "${RED}No backup files found in $BACKUP_DIR${NC}"
        exit 1
    fi
}

# Function to restore from file
restore_backup() {
    local backup_file=$1
    
    if [ ! -f "$backup_file" ]; then
        echo -e "${RED}Error: Backup file not found: $backup_file${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}WARNING: This will replace all current data in the database!${NC}"
    echo -e "Restoring from: ${backup_file}"
    read -p "Are you sure you want to continue? (yes/no): " confirmation
    
    if [ "$confirmation" != "yes" ]; then
        echo -e "${YELLOW}Restore cancelled${NC}"
        exit 0
    fi
    
    # Create a current backup before restoring
    echo -e "${YELLOW}Creating safety backup of current data...${NC}"
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    SAFETY_BACKUP="${BACKUP_DIR}/pre_restore_safety_${TIMESTAMP}.sql"
    docker exec -t "$CONTAINER_NAME" pg_dump -U "$DB_USER" -d "$DB_NAME" --clean --if-exists > "$SAFETY_BACKUP"
    echo -e "${GREEN}Safety backup created: $SAFETY_BACKUP${NC}"
    
    # Perform the restore
    echo -e "${YELLOW}Restoring database...${NC}"
    docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" < "$backup_file"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Database restored successfully!${NC}"
        
        # Verify restoration
        echo -e "${YELLOW}Verifying restoration...${NC}"
        TASK_COUNT=$(docker exec -t "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM tasks;" 2>/dev/null || echo "0")
        USER_COUNT=$(docker exec -t "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null || echo "0")
        
        echo -e "${GREEN}Restoration verified:${NC}"
        echo -e "  Tasks: ${TASK_COUNT// /}"
        echo -e "  Users: ${USER_COUNT// /}"
    else
        echo -e "${RED}Restore failed!${NC}"
        echo -e "${YELLOW}Attempting to restore safety backup...${NC}"
        docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" < "$SAFETY_BACKUP"
        exit 1
    fi
}

# Main logic
if [ $# -eq 0 ]; then
    # Interactive mode
    list_backups
    echo ""
    read -p "Enter the number of the backup to restore (or full path): " selection
    
    if [[ "$selection" =~ ^[0-9]+$ ]]; then
        # User selected a number
        backup_file=$(ls -t "$BACKUP_DIR"/*.sql 2>/dev/null | sed -n "${selection}p")
        if [ -z "$backup_file" ]; then
            echo -e "${RED}Invalid selection${NC}"
            exit 1
        fi
    else
        # User provided a path
        backup_file="$selection"
    fi
    
    restore_backup "$backup_file"
else
    # Command line mode
    if [ "$1" == "--latest" ]; then
        # Restore the latest backup
        backup_file=$(ls -t "$BACKUP_DIR"/*.sql 2>/dev/null | head -1)
        if [ -z "$backup_file" ]; then
            echo -e "${RED}No backup files found${NC}"
            exit 1
        fi
        echo -e "${YELLOW}Using latest backup: $backup_file${NC}"
        restore_backup "$backup_file"
    elif [ "$1" == "--volume" ]; then
        # Restore from volume backup
        echo -e "${YELLOW}Restoring from volume backup...${NC}"
        docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" < /backups/latest_backup.sql
        echo -e "${GREEN}Volume backup restored!${NC}"
    else
        # Restore specific file
        restore_backup "$1"
    fi
fi

echo -e "${GREEN}Restore process completed!${NC}"