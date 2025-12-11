#!/usr/bin/env bash
# =============================================================================
# SOLARIA Digital Field Operations - Project Ingestion Script
# Usage: ./scripts/ingest-project.sh <project_name> <milestones_file>
# =============================================================================

set -euo pipefail

# Configuration
PROJECT_NAME="${1:-Akademate.com}"
MILESTONES_FILE="${2:-docs/PROJECT_MILESTONES.md}"
CONTAINER="${CONTAINER:-solaria-digital-field--operations-office-1}"
DB_NAME="solaria_construction"
DB_ROOT_PASS="SolariaRoot2024"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() { echo -e "${GREEN}[ingest]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[ingest]${NC} $1"; }
log_error() { echo -e "${RED}[ingest]${NC} $1"; }

# Check prerequisites
if ! docker ps | grep -q "${CONTAINER}"; then
  log_error "Container ${CONTAINER} is not running"
  log_info "Start with: docker compose -f docker-compose.single.yml up -d"
  exit 1
fi

if [ ! -f "$MILESTONES_FILE" ]; then
  log_error "Milestones file not found: $MILESTONES_FILE"
  exit 1
fi

log_info "Ingesting project: ${PROJECT_NAME}"
log_info "Milestones file: ${MILESTONES_FILE}"

# Create temporary SQL file
SQL_FILE=$(mktemp)
trap "rm -f ${SQL_FILE}" EXIT

# Generate SQL header
cat > "$SQL_FILE" <<EOSQL
-- =============================================================================
-- SOLARIA DFO - Auto-generated Project Ingestion
-- Project: ${PROJECT_NAME}
-- Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
-- =============================================================================

-- Upsert project
INSERT INTO projects (name, client, description, status, priority, budget, completion_percentage, created_by)
SELECT '${PROJECT_NAME}', 'SOLARIA AGENCY', 'Auto-imported from milestones', 'development', 'critical', 100000, 10, 1
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = '${PROJECT_NAME}');

-- Get project ID
SET @proj_id = (SELECT id FROM projects WHERE name = '${PROJECT_NAME}');

-- Delete existing tasks for clean reimport (optional - comment out to keep existing)
-- DELETE FROM tasks WHERE project_id = @proj_id;

EOSQL

# Parse milestones and generate task INSERTs
log_info "Parsing milestones..."
TASK_COUNT=0

while IFS= read -r line; do
  # Skip empty lines and non-milestone lines
  [[ -z "$line" ]] && continue
  [[ ! "$line" =~ ^-\ P[0-2] ]] && continue

  # Extract title and description
  TITLE=$(echo "$line" | sed 's/^- //' | cut -d'—' -f1 | sed "s/'/''/g" | xargs)
  DESC=$(echo "$line" | cut -d'—' -f2- | sed "s/'/''/g" | xargs)

  # Default description if empty
  [[ -z "$DESC" ]] && DESC="Imported from milestones"

  # Determine priority based on P0/P1/P2
  if [[ "$TITLE" =~ ^P0 ]]; then
    PRIORITY="critical"
    HOURS=40
  elif [[ "$TITLE" =~ ^P1 ]]; then
    PRIORITY="high"
    HOURS=60
  else
    PRIORITY="medium"
    HOURS=20
  fi

  # Generate INSERT statement
  cat >> "$SQL_FILE" <<EOSQL

-- Task: ${TITLE}
INSERT INTO tasks (project_id, title, description, status, priority, estimated_hours, progress)
SELECT @proj_id, '${TITLE}', '${DESC}', 'pending', '${PRIORITY}', ${HOURS}, 0
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE project_id = @proj_id AND title = '${TITLE}');
EOSQL

  ((TASK_COUNT++))
done < "$MILESTONES_FILE"

# Add metrics update
cat >> "$SQL_FILE" <<EOSQL

-- Update project metrics
INSERT INTO project_metrics (project_id, metric_date, completion_percentage, agent_efficiency, code_quality_score, test_coverage, total_hours_worked, tasks_completed, tasks_pending, budget_used)
SELECT @proj_id, CURDATE(), 10, 85, 75, 15, 0, 0, ${TASK_COUNT}, 0
WHERE NOT EXISTS (SELECT 1 FROM project_metrics WHERE project_id = @proj_id AND metric_date = CURDATE());

-- Summary
SELECT
  'Ingestion complete' as status,
  @proj_id as project_id,
  '${PROJECT_NAME}' as project_name,
  (SELECT COUNT(*) FROM tasks WHERE project_id = @proj_id) as total_tasks;
EOSQL

log_info "Generated SQL with ${TASK_COUNT} tasks"

# Copy and execute SQL in container
log_info "Executing SQL in container..."
docker cp "$SQL_FILE" "${CONTAINER}:/tmp/ingest.sql"
docker exec "${CONTAINER}" mariadb -uroot -p"${DB_ROOT_PASS}" "${DB_NAME}" < /tmp/ingest.sql

log_info "Ingestion complete!"

# Show summary
log_info "Summary:"
docker exec "${CONTAINER}" mariadb -uroot -p"${DB_ROOT_PASS}" "${DB_NAME}" -e \
  "SELECT p.name, p.status, p.priority, COUNT(t.id) as tasks FROM projects p LEFT JOIN tasks t ON t.project_id = p.id WHERE p.name = '${PROJECT_NAME}' GROUP BY p.id;"
