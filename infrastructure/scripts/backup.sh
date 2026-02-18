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
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILE}"

# Colors
RED='\033[0;31m'
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

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

cleanup_on_error() {
    log_error "Backup failed! Cleaning up partial files..."
    rm -f "${BACKUP_PATH}" "${BACKUP_PATH}.sha256"
    exit 1
}

trap cleanup_on_error ERR

# =============================================================================
# Main
# =============================================================================

# Create backup directory
mkdir -p "$BACKUP_DIR"

log_info "Starting database backup..."

# Load environment
if [ -f "${DOCKER_DIR}/.env" ]; then
    set -a
    source "${DOCKER_DIR}/.env"
    set +a
fi

# Run backup
cd "$DOCKER_DIR"
docker compose exec -T postgres pg_dump \
    -U "${POSTGRES_USER:-akademate}" \
    -d "${POSTGRES_DB:-akademate}" \
    --format=plain \
    --no-owner \
    --no-privileges \
    | gzip > "${BACKUP_PATH}"

log_success "Backup created: ${BACKUP_PATH}"

# Generate SHA-256 checksum
log_info "Generating SHA-256 checksum..."
sha256sum "${BACKUP_PATH}" > "${BACKUP_PATH}.sha256"
log_success "Checksum saved: ${BACKUP_PATH}.sha256"

# =============================================================================
# Verification
# =============================================================================

log_info "Verifying backup integrity..."

VERIFICATION_PASSED=true

# Check that backup file size is greater than 0
BACKUP_SIZE=$(stat -f%z "${BACKUP_PATH}" 2>/dev/null || stat -c%s "${BACKUP_PATH}" 2>/dev/null)
if [ "${BACKUP_SIZE}" -gt 0 ]; then
    log_success "Backup file size OK: ${BACKUP_SIZE} bytes"
else
    log_error "Backup file is empty!"
    VERIFICATION_PASSED=false
fi

# Verify SHA-256 checksum matches
if sha256sum --check "${BACKUP_PATH}.sha256" > /dev/null 2>&1; then
    log_success "SHA-256 checksum verification passed"
else
    log_error "SHA-256 checksum verification failed!"
    VERIFICATION_PASSED=false
fi

if [ "${VERIFICATION_PASSED}" = false ]; then
    log_error "Backup verification FAILED"
    exit 1
fi

# Clean old backups (keep last 7 days)
log_info "Cleaning old backups..."
find "$BACKUP_DIR" -name "akademate_backup_*.sql.gz" -mtime +7 -delete
find "$BACKUP_DIR" -name "akademate_backup_*.sql.gz.sha256" -mtime +7 -delete

log_success "Backup completed and verified!"

# Show backup summary
echo ""
echo "======================================"
echo "  Backup Summary"
echo "======================================"
ls -lh "${BACKUP_PATH}"
echo "Checksum: $(cat "${BACKUP_PATH}.sha256")"
echo "======================================"
