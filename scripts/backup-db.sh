#!/bin/bash
# WhatsQuery PostgreSQL Backup Script

# Config
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/db_backup_$TIMESTAMP.sql"

# Ensure backup directory exists
mkdir -p $BACKUP_DIR

# Run pg_dump via Docker
# Assuming the db container is named 'erp-db-prod'
echo "🚀 Starting database backup..."
docker exec erp-db-prod pg_dump -U $DB_USER erp_prod > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE
echo "✅ Backup completed: ${BACKUP_FILE}.gz"

# Clean up old backups (older than 30 days)
find $BACKUP_DIR -type f -name "*.sql.gz" -mtime +30 -delete
echo "🧹 Old backups cleaned."
