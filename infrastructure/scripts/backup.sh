#!/bin/bash
# Akademate.com - Database Backup Script
# Usage: ./backup.sh [output_dir]

set -e

# =============================================================================
# Configuration
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
DOCKER_DIR="${PROJECT_ROOT}/infrastructure/docker"

BACKUP_DIR="${1:-${PROJECT_ROOT}/backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="akademate_backup_${TIMESTAMP}.sql.gz"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# =============================================================================
# Functions
# =============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# =============================================================================
# Main
# =============================================================================

# Create backup directory
mkdir -p "$BACKUP_DIR"

log_info "Starting database backup..."

# Load environment
if [ -f "${DOCKER_DIR}/.env" ]; then
    export $(grep -v '^#' "${DOCKER_DIR}/.env" | xargs)
fi

# Run backup
cd "$DOCKER_DIR"
docker compose exec -T postgres pg_dump \
    -U "${POSTGRES_USER:-akademate}" \
    -d "${POSTGRES_DB:-akademate}" \
    --format=plain \
    --no-owner \
    --no-privileges \
    | gzip > "${BACKUP_DIR}/${BACKUP_FILE}"

log_success "Backup created: ${BACKUP_DIR}/${BACKUP_FILE}"

# Clean old backups (keep last 7 days)
log_info "Cleaning old backups..."
find "$BACKUP_DIR" -name "akademate_backup_*.sql.gz" -mtime +7 -delete

log_success "Backup completed!"

# Show backup size
ls -lh "${BACKUP_DIR}/${BACKUP_FILE}"
