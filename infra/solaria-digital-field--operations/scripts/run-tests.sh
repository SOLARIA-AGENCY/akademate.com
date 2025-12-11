#!/bin/bash
#
# SOLARIA Digital Field Operations - Test Runner
# Ejecuta todos los tests del proyecto
#
# Usage: bash scripts/run-tests.sh
#

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
SKIPPED_TESTS=0

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║     SOLARIA Digital Field Operations - Test Suite             ║"
echo "║     Comprehensive Project Testing                             ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Helper functions
log_test() {
    local name="$1"
    local status="$2"
    local message="$3"

    ((TOTAL_TESTS++))

    if [ "$status" = "PASS" ]; then
        echo -e "${GREEN}✅ PASS:${NC} $name"
        ((PASSED_TESTS++))
    elif [ "$status" = "FAIL" ]; then
        echo -e "${RED}❌ FAIL:${NC} $name"
        [ -n "$message" ] && echo -e "   ${RED}Error: $message${NC}"
        ((FAILED_TESTS++))
    elif [ "$status" = "SKIP" ]; then
        echo -e "${YELLOW}⏭️  SKIP:${NC} $name"
        [ -n "$message" ] && echo -e "   ${YELLOW}Reason: $message${NC}"
        ((SKIPPED_TESTS++))
    fi
}

# ==================== PROJECT STRUCTURE TESTS ====================
echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  PROJECT STRUCTURE TESTS${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# Required directories
for dir in "dashboard" "dashboard/public" "mcp-server" "scripts" "infrastructure" "infrastructure/database"; do
    if [ -d "$PROJECT_ROOT/$dir" ]; then
        log_test "Directory '$dir' exists" "PASS"
    else
        log_test "Directory '$dir' exists" "FAIL"
    fi
done

# Required files
for file in "CLAUDE.md" "docker-compose.yml" ".env.example" \
            "dashboard/server.js" "dashboard/Dockerfile" "dashboard/package.json" \
            "dashboard/public/index.html" "dashboard/public/dashboard.js" \
            "mcp-server/server.js" "mcp-server/package.json" "mcp-server/Dockerfile" \
            "scripts/install-mcp.sh" "infrastructure/database/seed-akademate.sql"; do
    if [ -f "$PROJECT_ROOT/$file" ]; then
        log_test "File '$file' exists" "PASS"
    else
        log_test "File '$file' exists" "FAIL"
    fi
done

# ==================== MCP SERVER TESTS ====================
echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  MCP SERVER TESTS${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

cd "$PROJECT_ROOT/mcp-server"

# package.json valid
if node -e "JSON.parse(require('fs').readFileSync('package.json'))" 2>/dev/null; then
    log_test "MCP package.json is valid JSON" "PASS"
else
    log_test "MCP package.json is valid JSON" "FAIL"
fi

# Check dependencies
if grep -q "@modelcontextprotocol/sdk" package.json; then
    log_test "MCP SDK dependency declared" "PASS"
else
    log_test "MCP SDK dependency declared" "FAIL"
fi

# Check server.js handlers
if grep -q "ListToolsRequestSchema" server.js; then
    log_test "MCP server has tool listing handler" "PASS"
else
    log_test "MCP server has tool listing handler" "FAIL"
fi

if grep -q "CallToolRequestSchema" server.js; then
    log_test "MCP server has tool call handler" "PASS"
else
    log_test "MCP server has tool call handler" "FAIL"
fi

# Check for required tools
for tool in "get_dashboard_overview" "list_tasks" "create_task" "list_agents" "complete_task"; do
    if grep -q "\"$tool\"" server.js; then
        log_test "MCP tool '$tool' is defined" "PASS"
    else
        log_test "MCP tool '$tool' is defined" "FAIL"
    fi
done

# Install script executable
if [ -x "$PROJECT_ROOT/scripts/install-mcp.sh" ]; then
    log_test "install-mcp.sh is executable" "PASS"
else
    log_test "install-mcp.sh is executable" "FAIL"
fi

cd "$PROJECT_ROOT"

# ==================== DASHBOARD TESTS ====================
echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  DASHBOARD TESTS${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

cd "$PROJECT_ROOT/dashboard"

# package.json valid
if node -e "JSON.parse(require('fs').readFileSync('package.json'))" 2>/dev/null; then
    log_test "Dashboard package.json is valid JSON" "PASS"
else
    log_test "Dashboard package.json is valid JSON" "FAIL"
fi

# Check for required API endpoints
for endpoint in "/api/auth/login" "/api/tasks" "/api/agents" "/api/projects" "/api/dashboard/overview"; do
    if grep -q "$endpoint" server.js; then
        log_test "Endpoint '$endpoint' is defined" "PASS"
    else
        log_test "Endpoint '$endpoint' is defined" "FAIL"
    fi
done

# Check frontend
if grep -q "data-card" public/index.html; then
    log_test "Interactive cards have data-card attributes" "PASS"
else
    log_test "Interactive cards have data-card attributes" "FAIL"
fi

if grep -q "SOLARIA" public/dashboard.js; then
    log_test "Dashboard uses SOLARIA branding" "PASS"
else
    log_test "Dashboard uses SOLARIA branding" "FAIL"
fi

for feature in "getSortedTasks" "goToAgentDetail" "reassignTask"; do
    if grep -q "$feature" public/dashboard.js; then
        log_test "Feature '$feature' implemented" "PASS"
    else
        log_test "Feature '$feature' implemented" "FAIL"
    fi
done

cd "$PROJECT_ROOT"

# ==================== DATABASE TESTS ====================
echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  DATABASE TESTS${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

seed_file="$PROJECT_ROOT/infrastructure/database/seed-akademate.sql"

if grep -q "SOLARIA-PM" "$seed_file"; then
    log_test "Seed contains SOLARIA agents" "PASS"
else
    log_test "Seed contains SOLARIA agents" "FAIL"
fi

if grep -q "Akademate.com" "$seed_file"; then
    log_test "Seed contains Akademate project" "PASS"
else
    log_test "Seed contains Akademate project" "FAIL"
fi

if grep -q "INSERT INTO tasks" "$seed_file"; then
    log_test "Seed contains task data" "PASS"
else
    log_test "Seed contains task data" "FAIL"
fi

init_file="$PROJECT_ROOT/infrastructure/database/mysql-init.sql"

if [ -f "$init_file" ]; then
    log_test "MySQL init file exists" "PASS"

    for table in "projects" "tasks" "ai_agents" "users" "activity_logs"; do
        if grep -qi "CREATE TABLE.*$table" "$init_file"; then
            log_test "Table '$table' is defined" "PASS"
        else
            log_test "Table '$table' is defined" "FAIL"
        fi
    done
else
    log_test "MySQL init file exists" "FAIL"
fi

# ==================== SECURITY TESTS ====================
echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  SECURITY TESTS${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

if [ -f "$PROJECT_ROOT/.env.example" ]; then
    log_test ".env.example exists" "PASS"
else
    log_test ".env.example exists" "FAIL"
fi

if [ -f "$PROJECT_ROOT/.gitignore" ] && grep -qE "\.env$|\.env\b" "$PROJECT_ROOT/.gitignore"; then
    log_test ".env is in .gitignore" "PASS"
else
    log_test ".env is in .gitignore" "FAIL"
fi

if grep -q "jwt" "$PROJECT_ROOT/dashboard/server.js" 2>/dev/null; then
    log_test "JWT authentication implemented" "PASS"
else
    log_test "JWT authentication implemented" "FAIL"
fi

# ==================== DOCKER TESTS (without running docker) ====================
echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  DOCKER CONFIGURATION TESTS${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

compose_file="$PROJECT_ROOT/docker-compose.yml"

if [ -f "$compose_file" ]; then
    log_test "docker-compose.yml exists" "PASS"

    for svc in "dashboard-backend" "mysql" "redis" "mcp-server"; do
        if grep -q "$svc:" "$compose_file"; then
            log_test "Service '$svc' is defined" "PASS"
        else
            log_test "Service '$svc' is defined" "FAIL"
        fi
    done
else
    log_test "docker-compose.yml exists" "FAIL"
fi

# ==================== PRINT SUMMARY ====================
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  TEST SUMMARY${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

success_rate=0
if [ $TOTAL_TESTS -gt 0 ]; then
    success_rate=$(( (PASSED_TESTS * 100) / TOTAL_TESTS ))
fi

echo -e "  Total Tests:   ${CYAN}$TOTAL_TESTS${NC}"
echo -e "  Passed:        ${GREEN}$PASSED_TESTS${NC}"
echo -e "  Failed:        ${RED}$FAILED_TESTS${NC}"
echo -e "  Skipped:       ${YELLOW}$SKIPPED_TESTS${NC}"
echo ""
echo -e "  Success Rate:  ${CYAN}$success_rate%${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                    ALL TESTS PASSED!                          ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
    exit 0
else
    echo -e "${RED}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║                 SOME TESTS FAILED                             ║${NC}"
    echo -e "${RED}╚═══════════════════════════════════════════════════════════════╝${NC}"
    exit 1
fi
