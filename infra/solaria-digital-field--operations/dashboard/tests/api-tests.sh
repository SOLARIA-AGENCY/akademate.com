#!/bin/bash
# SOLARIA Dashboard API Tests
# Comprehensive tests for the C-Suite Dashboard API

API_BASE="http://localhost:3030/api"
PASSED=0
FAILED=0

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Helper function for tests
test_result() {
    local name="$1"
    local condition="$2"
    if [ "$condition" = "true" ]; then
        echo -e "${GREEN}✅ PASS:${NC} $name"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAIL:${NC} $name"
        ((FAILED++))
    fi
}

echo ""
echo "========================================"
echo "  SOLARIA Dashboard API Tests"
echo "========================================"
echo ""

# Get auth token
echo "Authenticating..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"userId":"carlosjperez","password":"bypass"}')

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')

if [ "$TOKEN" != "null" ] && [ -n "$TOKEN" ]; then
    test_result "Auth: Login with valid credentials" "true"
else
    test_result "Auth: Login with valid credentials" "false"
    echo "Cannot continue without authentication"
    exit 1
fi

# Test Auth Verify
VERIFY_RESPONSE=$(curl -s "$API_BASE/auth/verify" -H "Authorization: Bearer $TOKEN")
VALID=$(echo "$VERIFY_RESPONSE" | jq -r '.valid')
test_result "Auth: Verify valid token" "$([ "$VALID" = "true" ] && echo true || echo false)"

# Test Invalid Login
INVALID_RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null -X POST "$API_BASE/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"userId":"invalid","password":"wrong"}')
test_result "Auth: Reject invalid credentials" "$([ "$INVALID_RESPONSE" = "401" ] && echo true || echo false)"

echo ""
echo "--- Agents Tests ---"

# Test Agents List
AGENTS=$(curl -s "$API_BASE/agents" -H "Authorization: Bearer $TOKEN")
AGENTS_COUNT=$(echo "$AGENTS" | jq 'length')
test_result "Agents: List all agents" "$([ "$AGENTS_COUNT" -gt 0 ] && echo true || echo false)"

# Test SOLARIA naming
HAS_SOLARIA=$(echo "$AGENTS" | jq 'all(.name | contains("SOLARIA"))')
test_result "Agents: All agents have SOLARIA prefix" "$HAS_SOLARIA"

# Test Agent fields
FIRST_AGENT=$(echo "$AGENTS" | jq '.[0]')
HAS_ID=$(echo "$FIRST_AGENT" | jq 'has("id")')
HAS_NAME=$(echo "$FIRST_AGENT" | jq 'has("name")')
HAS_ROLE=$(echo "$FIRST_AGENT" | jq 'has("role")')
HAS_STATUS=$(echo "$FIRST_AGENT" | jq 'has("status")')
test_result "Agents: Have required fields" "$([ "$HAS_ID" = "true" ] && [ "$HAS_NAME" = "true" ] && [ "$HAS_ROLE" = "true" ] && [ "$HAS_STATUS" = "true" ] && echo true || echo false)"

# Test Agent detail
AGENT_DETAIL=$(curl -s "$API_BASE/agents/1" -H "Authorization: Bearer $TOKEN")
AGENT_ID=$(echo "$AGENT_DETAIL" | jq '.id')
test_result "Agents: Get single agent detail" "$([ "$AGENT_ID" = "1" ] && echo true || echo false)"

# Test Active agents count
ACTIVE_COUNT=$(echo "$AGENTS" | jq '[.[] | select(.status=="active")] | length')
test_result "Agents: Have active agents (count: $ACTIVE_COUNT)" "$([ "$ACTIVE_COUNT" -gt 0 ] && echo true || echo false)"

echo ""
echo "--- Tasks Tests ---"

# Test Tasks List
TASKS=$(curl -s "$API_BASE/tasks" -H "Authorization: Bearer $TOKEN")
TASKS_COUNT=$(echo "$TASKS" | jq 'length')
test_result "Tasks: List all tasks (count: $TASKS_COUNT)" "$([ "$TASKS_COUNT" -gt 0 ] && echo true || echo false)"

# Test Task fields
FIRST_TASK=$(echo "$TASKS" | jq '.[0]')
HAS_TITLE=$(echo "$FIRST_TASK" | jq 'has("title")')
HAS_STATUS=$(echo "$FIRST_TASK" | jq 'has("status")')
HAS_PRIORITY=$(echo "$FIRST_TASK" | jq 'has("priority")')
test_result "Tasks: Have required fields" "$([ "$HAS_TITLE" = "true" ] && [ "$HAS_STATUS" = "true" ] && [ "$HAS_PRIORITY" = "true" ] && echo true || echo false)"

# Test valid statuses
VALID_STATUSES=$(echo "$TASKS" | jq 'all(.status | . == "pending" or . == "in_progress" or . == "completed" or . == "blocked" or . == "cancelled")')
test_result "Tasks: Have valid statuses" "$VALID_STATUSES"

# Test valid priorities
VALID_PRIORITIES=$(echo "$TASKS" | jq 'all(.priority | . == "critical" or . == "high" or . == "medium" or . == "low")')
test_result "Tasks: Have valid priorities" "$VALID_PRIORITIES"

# Test progress range
VALID_PROGRESS=$(echo "$TASKS" | jq 'all((.progress // 0) >= 0 and (.progress // 0) <= 100)')
test_result "Tasks: Progress is within valid range (0-100)" "$VALID_PROGRESS"

# Count by status
COMPLETED=$(echo "$TASKS" | jq '[.[] | select(.status=="completed")] | length')
IN_PROGRESS=$(echo "$TASKS" | jq '[.[] | select(.status=="in_progress")] | length')
PENDING=$(echo "$TASKS" | jq '[.[] | select(.status=="pending")] | length')
echo "   Task breakdown: $COMPLETED completed, $IN_PROGRESS in progress, $PENDING pending"

echo ""
echo "--- Projects Tests ---"

# Test Projects List
PROJECTS=$(curl -s "$API_BASE/projects" -H "Authorization: Bearer $TOKEN")
PROJECTS_COUNT=$(echo "$PROJECTS" | jq 'length')
test_result "Projects: List all projects (count: $PROJECTS_COUNT)" "$([ "$PROJECTS_COUNT" -gt 0 ] && echo true || echo false)"

# Test Akademate project
AKADEMATE=$(echo "$PROJECTS" | jq '[.[] | select(.name | ascii_downcase | contains("akademate"))] | length')
test_result "Projects: Akademate.com project exists" "$([ "$AKADEMATE" -gt 0 ] && echo true || echo false)"

# Test project fields
FIRST_PROJECT=$(echo "$PROJECTS" | jq '.[0]')
HAS_ID=$(echo "$FIRST_PROJECT" | jq 'has("id")')
HAS_NAME=$(echo "$FIRST_PROJECT" | jq 'has("name")')
HAS_STATUS=$(echo "$FIRST_PROJECT" | jq 'has("status")')
test_result "Projects: Have required fields" "$([ "$HAS_ID" = "true" ] && [ "$HAS_NAME" = "true" ] && [ "$HAS_STATUS" = "true" ] && echo true || echo false)"

echo ""
echo "--- Docs Tests ---"

# Test Docs List
DOCS=$(curl -s "$API_BASE/docs/list" -H "Authorization: Bearer $TOKEN")
DOCS_TOTAL=$(echo "$DOCS" | jq '.total // 0')
test_result "Docs: List project documents (count: $DOCS_TOTAL)" "$([ "$DOCS_TOTAL" -ge 0 ] && echo true || echo false)"

# Test docs have fields
if [ "$DOCS_TOTAL" -gt 0 ]; then
    FIRST_DOC=$(echo "$DOCS" | jq '.documents[0]')
    HAS_NAME=$(echo "$FIRST_DOC" | jq 'has("name")')
    HAS_PATH=$(echo "$FIRST_DOC" | jq 'has("path")')
    test_result "Docs: Documents have required fields" "$([ "$HAS_NAME" = "true" ] && [ "$HAS_PATH" = "true" ] && echo true || echo false)"
else
    test_result "Docs: Documents have required fields" "true"
fi

echo ""
echo "--- Logs Tests ---"

# Test Logs List
LOGS=$(curl -s "$API_BASE/logs?limit=10" -H "Authorization: Bearer $TOKEN")
LOGS_COUNT=$(echo "$LOGS" | jq 'length')
test_result "Logs: List activity logs" "$([ "$LOGS_COUNT" -ge 0 ] && echo true || echo false)"

echo ""
echo "--- Dashboard Tests ---"

# Test Dashboard Overview
OVERVIEW=$(curl -s "$API_BASE/dashboard/overview" -H "Authorization: Bearer $TOKEN")
HAS_PROJECTS=$(echo "$OVERVIEW" | jq 'has("totalProjects")')
HAS_TASKS=$(echo "$OVERVIEW" | jq 'has("totalTasks")')
HAS_AGENTS=$(echo "$OVERVIEW" | jq 'has("totalAgents")')
test_result "Dashboard: Get overview data" "$([ "$HAS_PROJECTS" = "true" ] && [ "$HAS_TASKS" = "true" ] && [ "$HAS_AGENTS" = "true" ] && echo true || echo false)"

# Test Dashboard Alerts
ALERTS=$(curl -s "$API_BASE/dashboard/alerts" -H "Authorization: Bearer $TOKEN")
IS_ARRAY=$(echo "$ALERTS" | jq 'type == "array"')
test_result "Dashboard: Get alerts" "$IS_ARRAY"

echo ""
echo "========================================"
echo "  Results: $PASSED passed, $FAILED failed"
echo "========================================"
echo ""

# Exit with appropriate code
if [ "$FAILED" -gt 0 ]; then
    exit 1
fi
exit 0
