#!/bin/bash

# Payload CMS Structure Verification Script
# Verifies that all required files and directories are in place

echo "🔍 Verifying Payload CMS Package Structure..."
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
TOTAL=0
PASSED=0
FAILED=0

# Function to check file/directory existence
check_exists() {
    TOTAL=$((TOTAL + 1))
    if [ -e "$1" ]; then
        echo -e "${GREEN}✓${NC} $2"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}✗${NC} $2 - MISSING: $1"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

echo "Configuration Files:"
check_exists "package.json" "package.json"
check_exists "tsconfig.json" "tsconfig.json"
check_exists "vitest.config.ts" "vitest.config.ts"
check_exists ".env.example" ".env.example"
check_exists ".env.test" ".env.test"
check_exists ".gitignore" ".gitignore"
echo ""

echo "Documentation:"
check_exists "README.md" "README.md"
check_exists "IMPLEMENTATION_SUMMARY.md" "IMPLEMENTATION_SUMMARY.md"
echo ""

echo "Source Directories:"
check_exists "src" "src/"
check_exists "src/access" "src/access/"
check_exists "src/hooks" "src/hooks/"
check_exists "src/utils" "src/utils/"
check_exists "src/collections" "src/collections/"
echo ""

echo "Access Control Files:"
check_exists "src/access/index.ts" "src/access/index.ts"
check_exists "src/access/roles.ts" "src/access/roles.ts"
echo ""

echo "Hook Files:"
check_exists "src/hooks/index.ts" "src/hooks/index.ts"
check_exists "src/hooks/auditLog.ts" "src/hooks/auditLog.ts"
echo ""

echo "Utility Files:"
check_exists "src/utils/slugify.ts" "src/utils/slugify.ts"
check_exists "src/utils/testHelpers.ts" "src/utils/testHelpers.ts"
echo ""

echo "Collection Structure:"
check_exists "src/collections/index.ts" "src/collections/index.ts"
check_exists "src/collections/Cycles" "src/collections/Cycles/"
check_exists "src/collections/Cycles/access" "src/collections/Cycles/access/"
check_exists "src/collections/Campuses" "src/collections/Campuses/"
check_exists "src/collections/Users" "src/collections/Users/"
check_exists "src/collections/Users/access" "src/collections/Users/access/"
check_exists "src/collections/Courses" "src/collections/Courses/"
check_exists "src/collections/Courses/access" "src/collections/Courses/access/"
check_exists "src/collections/Courses/hooks" "src/collections/Courses/hooks/"
check_exists "src/collections/Leads" "src/collections/Leads/"
check_exists "src/collections/Leads/access" "src/collections/Leads/access/"
check_exists "src/collections/Leads/hooks" "src/collections/Leads/hooks/"
echo ""

echo "Collection Access Control:"
check_exists "src/collections/Cycles/access/canManageCycles.ts" "Cycles access control"
check_exists "src/collections/Users/access/isAdmin.ts" "Users isAdmin"
check_exists "src/collections/Users/access/isAdminOrGestor.ts" "Users isAdminOrGestor"
check_exists "src/collections/Users/access/isSelfOrAdmin.ts" "Users isSelfOrAdmin"
check_exists "src/collections/Courses/access/canManageCourses.ts" "Courses access control"
check_exists "src/collections/Campaigns/access/canManageCampaigns.ts" "Campaigns access control"
check_exists "src/collections/Leads/access/canManageLeads.ts" "Leads access control"
echo ""

echo "Collection Hooks:"
check_exists "src/collections/Courses/hooks/generateSlug.ts" "Courses generateSlug"
check_exists "src/collections/BlogPosts/hooks/generateSlug.ts" "BlogPosts generateSlug"
check_exists "src/collections/Leads/hooks/triggerLeadCreated.ts" "Leads triggerLeadCreated"
check_exists "src/collections/Leads/hooks/auditLeadAccess.ts" "Leads auditLeadAccess"
echo ""

echo "Test Files:"
check_exists "tests" "tests/"
check_exists "tests/setup.ts" "tests/setup.ts"
check_exists "tests/teardown.ts" "tests/teardown.ts"
echo ""

# Summary
echo "================================================"
echo -e "${YELLOW}Summary:${NC}"
echo -e "Total checks: ${TOTAL}"
echo -e "${GREEN}Passed: ${PASSED}${NC}"
echo -e "${RED}Failed: ${FAILED}${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All structure verification checks passed!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Implement src/server.ts"
    echo "2. Implement src/payload.config.ts"
    echo "3. Start TDD implementation of Cycles collection"
    exit 0
else
    echo -e "${RED}✗ Some files/directories are missing${NC}"
    exit 1
fi
