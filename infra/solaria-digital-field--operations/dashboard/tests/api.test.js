/**
 * SOLARIA Dashboard API Tests
 * Comprehensive tests for the C-Suite Dashboard API
 * Tests authentication, agents, tasks, projects, and docs endpoints
 */

const API_BASE = 'http://localhost:3030/api';
const TEST_USER = { userId: 'carlosjperez', password: 'bypass' };

let authToken = null;

// Test helper functions
async function fetchJson(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
            ...options.headers
        }
    });
    return { status: response.status, data: await response.json() };
}

// Test results tracker
const results = { passed: 0, failed: 0, tests: [] };

function test(name, fn) {
    return async () => {
        try {
            await fn();
            results.passed++;
            results.tests.push({ name, status: 'PASS' });
            console.log(`✅ PASS: ${name}`);
        } catch (error) {
            results.failed++;
            results.tests.push({ name, status: 'FAIL', error: error.message });
            console.error(`❌ FAIL: ${name}`);
            console.error(`   Error: ${error.message}`);
        }
    };
}

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

function assertEqual(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(`${message}: expected ${expected}, got ${actual}`);
    }
}

function assertGreater(actual, expected, message) {
    if (actual <= expected) {
        throw new Error(`${message}: expected > ${expected}, got ${actual}`);
    }
}

// ==================== AUTH TESTS ====================

const testAuthLogin = test('Auth: Login with valid credentials', async () => {
    const { status, data } = await fetchJson(`${API_BASE}/auth/login`, {
        method: 'POST',
        body: JSON.stringify(TEST_USER)
    });
    assertEqual(status, 200, 'Status should be 200');
    assert(data.token, 'Response should contain token');
    assert(data.user, 'Response should contain user');
    assertEqual(data.user.username, 'carlosjperez', 'Username should match');
    authToken = data.token;
});

const testAuthVerify = test('Auth: Verify valid token', async () => {
    const { status, data } = await fetchJson(`${API_BASE}/auth/verify`);
    assertEqual(status, 200, 'Status should be 200');
    assert(data.valid, 'Token should be valid');
    assert(data.user, 'Response should contain user');
});

const testAuthInvalidLogin = test('Auth: Reject invalid credentials', async () => {
    const { status } = await fetchJson(`${API_BASE}/auth/login`, {
        method: 'POST',
        body: JSON.stringify({ userId: 'invalid', password: 'wrong' })
    });
    assertEqual(status, 401, 'Status should be 401 for invalid credentials');
});

// ==================== AGENTS TESTS ====================

const testAgentsList = test('Agents: List all agents', async () => {
    const { status, data } = await fetchJson(`${API_BASE}/agents`);
    assertEqual(status, 200, 'Status should be 200');
    assert(Array.isArray(data), 'Response should be an array');
    assertGreater(data.length, 0, 'Should have at least one agent');

    // Verify SOLARIA naming
    const hasSOLARIA = data.every(a => a.name.includes('SOLARIA'));
    assert(hasSOLARIA, 'All agents should have SOLARIA prefix');
});

const testAgentsHaveRequiredFields = test('Agents: Have required fields', async () => {
    const { data } = await fetchJson(`${API_BASE}/agents`);
    const agent = data[0];

    assert(agent.id, 'Agent should have id');
    assert(agent.name, 'Agent should have name');
    assert(agent.role, 'Agent should have role');
    assert(agent.status, 'Agent should have status');
});

const testAgentsRoles = test('Agents: Have valid roles', async () => {
    const validRoles = ['project_manager', 'architect', 'developer', 'tester', 'analyst', 'designer', 'devops', 'technical_writer', 'security_auditor'];
    const { data } = await fetchJson(`${API_BASE}/agents`);

    for (const agent of data) {
        assert(validRoles.includes(agent.role), `Agent ${agent.name} has invalid role: ${agent.role}`);
    }
});

const testAgentsStatuses = test('Agents: Have valid statuses', async () => {
    const validStatuses = ['active', 'busy', 'inactive', 'error', 'maintenance'];
    const { data } = await fetchJson(`${API_BASE}/agents`);

    for (const agent of data) {
        assert(validStatuses.includes(agent.status), `Agent ${agent.name} has invalid status: ${agent.status}`);
    }
});

const testAgentDetail = test('Agents: Get single agent detail', async () => {
    const { status, data } = await fetchJson(`${API_BASE}/agents/1`);
    assertEqual(status, 200, 'Status should be 200');
    assertEqual(data.id, 1, 'Agent ID should match');
    assert(data.name.includes('SOLARIA'), 'Agent name should include SOLARIA');
});

// ==================== TASKS TESTS ====================

const testTasksList = test('Tasks: List all tasks', async () => {
    const { status, data } = await fetchJson(`${API_BASE}/tasks`);
    assertEqual(status, 200, 'Status should be 200');
    assert(Array.isArray(data), 'Response should be an array');
    assertGreater(data.length, 0, 'Should have at least one task');
});

const testTasksHaveRequiredFields = test('Tasks: Have required fields', async () => {
    const { data } = await fetchJson(`${API_BASE}/tasks`);
    const task = data[0];

    assert(task.id, 'Task should have id');
    assert(task.title, 'Task should have title');
    assert(task.status, 'Task should have status');
    assert(task.priority !== undefined, 'Task should have priority');
});

const testTasksValidStatuses = test('Tasks: Have valid statuses', async () => {
    const validStatuses = ['pending', 'in_progress', 'completed', 'blocked', 'cancelled'];
    const { data } = await fetchJson(`${API_BASE}/tasks`);

    for (const task of data) {
        assert(validStatuses.includes(task.status), `Task "${task.title}" has invalid status: ${task.status}`);
    }
});

const testTasksValidPriorities = test('Tasks: Have valid priorities', async () => {
    const validPriorities = ['critical', 'high', 'medium', 'low'];
    const { data } = await fetchJson(`${API_BASE}/tasks`);

    for (const task of data) {
        assert(validPriorities.includes(task.priority), `Task "${task.title}" has invalid priority: ${task.priority}`);
    }
});

const testTasksProgress = test('Tasks: Progress is within valid range', async () => {
    const { data } = await fetchJson(`${API_BASE}/tasks`);

    for (const task of data) {
        const progress = task.progress || 0;
        assert(progress >= 0 && progress <= 100, `Task "${task.title}" has invalid progress: ${progress}`);
    }
});

const testTasksCompletedHaveProgress100 = test('Tasks: Completed tasks should have 100% progress', async () => {
    const { data } = await fetchJson(`${API_BASE}/tasks`);
    const completedTasks = data.filter(t => t.status === 'completed');

    for (const task of completedTasks) {
        assertEqual(task.progress, 100, `Completed task "${task.title}" should have 100% progress`);
    }
});

const testTaskUpdate = test('Tasks: Update task priority', async () => {
    const { data: tasks } = await fetchJson(`${API_BASE}/tasks`);
    const taskToUpdate = tasks.find(t => t.status !== 'completed');

    if (taskToUpdate) {
        const newPriority = taskToUpdate.priority === 'high' ? 'medium' : 'high';
        const { status } = await fetchJson(`${API_BASE}/tasks/${taskToUpdate.id}`, {
            method: 'PUT',
            body: JSON.stringify({ priority: newPriority })
        });
        assertEqual(status, 200, 'Update should succeed');

        // Verify update
        const { data: updated } = await fetchJson(`${API_BASE}/tasks/${taskToUpdate.id}`);
        assertEqual(updated.priority, newPriority, 'Priority should be updated');

        // Restore original
        await fetchJson(`${API_BASE}/tasks/${taskToUpdate.id}`, {
            method: 'PUT',
            body: JSON.stringify({ priority: taskToUpdate.priority })
        });
    }
});

// ==================== PROJECTS TESTS ====================

const testProjectsList = test('Projects: List all projects', async () => {
    const { status, data } = await fetchJson(`${API_BASE}/projects`);
    assertEqual(status, 200, 'Status should be 200');
    assert(Array.isArray(data), 'Response should be an array');
    assertGreater(data.length, 0, 'Should have at least one project');
});

const testProjectAkademate = test('Projects: Akademate.com project exists', async () => {
    const { data } = await fetchJson(`${API_BASE}/projects`);
    const akademate = data.find(p => p.name.toLowerCase().includes('akademate'));

    assert(akademate, 'Akademate.com project should exist');
    assertEqual(akademate.status, 'development', 'Project should be in development');
});

const testProjectHasRequiredFields = test('Projects: Have required fields', async () => {
    const { data } = await fetchJson(`${API_BASE}/projects`);
    const project = data[0];

    assert(project.id, 'Project should have id');
    assert(project.name, 'Project should have name');
    assert(project.status, 'Project should have status');
});

// ==================== DOCS TESTS ====================

const testDocsList = test('Docs: List project documents', async () => {
    const { status, data } = await fetchJson(`${API_BASE}/docs/list`);
    assertEqual(status, 200, 'Status should be 200');
    assert(data.documents !== undefined, 'Response should have documents');
    assert(data.total !== undefined, 'Response should have total count');
});

const testDocsHaveRequiredFields = test('Docs: Documents have required fields', async () => {
    const { data } = await fetchJson(`${API_BASE}/docs/list`);

    if (data.documents && data.documents.length > 0) {
        const doc = data.documents[0];
        assert(doc.name, 'Document should have name');
        assert(doc.path, 'Document should have path');
        assert(doc.type, 'Document should have type');
    }
});

// ==================== LOGS TESTS ====================

const testLogsList = test('Logs: List activity logs', async () => {
    const { status, data } = await fetchJson(`${API_BASE}/logs?limit=10`);
    assertEqual(status, 200, 'Status should be 200');
    assert(Array.isArray(data), 'Response should be an array');
});

const testLogsHaveRequiredFields = test('Logs: Logs have required fields', async () => {
    const { data } = await fetchJson(`${API_BASE}/logs?limit=10`);

    if (data.length > 0) {
        const log = data[0];
        assert(log.level, 'Log should have level');
        assert(log.action, 'Log should have action');
    }
});

// ==================== DASHBOARD TESTS ====================

const testDashboardOverview = test('Dashboard: Get overview', async () => {
    const { status, data } = await fetchJson(`${API_BASE}/dashboard/overview`);
    assertEqual(status, 200, 'Status should be 200');
    assert(data.totalProjects !== undefined, 'Should have totalProjects');
    assert(data.totalTasks !== undefined, 'Should have totalTasks');
    assert(data.totalAgents !== undefined, 'Should have totalAgents');
});

const testDashboardAlerts = test('Dashboard: Get alerts', async () => {
    const { status, data } = await fetchJson(`${API_BASE}/dashboard/alerts`);
    assertEqual(status, 200, 'Status should be 200');
    assert(Array.isArray(data), 'Response should be an array');
});

// ==================== NEW v3.2 TESTS ====================

// Quick Access (non-production only)
const testQuickAccess = test('Auth: Quick access endpoint works', async () => {
    const { status, data } = await fetchJson(`${API_BASE}/auth/quick-access`, {
        method: 'POST'
    });
    // Should work in dev/test environment
    if (status === 200) {
        assert(data.token, 'Response should contain token');
        assert(data.user, 'Response should contain user');
    } else if (status === 403) {
        // Production mode - expected
        assert(data.error, 'Should have error message for production');
    }
});

// Project Creation
const testProjectCreate = test('Projects: Create new project', async () => {
    const newProject = {
        name: 'Test Project ' + Date.now(),
        client: 'Test Client',
        description: 'Test project created by API tests',
        priority: 'medium',
        budget: 10000
    };
    const { status, data } = await fetchJson(`${API_BASE}/projects`, {
        method: 'POST',
        body: JSON.stringify(newProject)
    });
    assertEqual(status, 201, 'Status should be 201 for created');
    assert(data.id, 'Response should contain project ID');
});

// Alert Creation
const testAlertCreate = test('Alerts: Create new alert', async () => {
    const newAlert = {
        title: 'Test Alert ' + Date.now(),
        message: 'This is a test alert from API tests',
        severity: 'info'
    };
    const { status, data } = await fetchJson(`${API_BASE}/alerts`, {
        method: 'POST',
        body: JSON.stringify(newAlert)
    });
    assertEqual(status, 201, 'Status should be 201 for created');
    assert(data.id, 'Response should contain alert ID');
});

// C-Suite Dashboards
const testCEODashboard = test('C-Suite: CEO dashboard returns data', async () => {
    const { status, data } = await fetchJson(`${API_BASE}/csuite/ceo`);
    assertEqual(status, 200, 'Status should be 200');
    assert(data.overview, 'Should have overview');
    assert(data.metrics, 'Should have metrics');
});

const testCTODashboard = test('C-Suite: CTO dashboard with dynamic architecture decisions', async () => {
    const { status, data } = await fetchJson(`${API_BASE}/csuite/cto`);
    assertEqual(status, 200, 'Status should be 200');
    assert(data.techStack, 'Should have techStack');
    assert(data.architectureDecisions !== undefined, 'Should have architectureDecisions');
});

const testCOODashboard = test('C-Suite: COO dashboard with dynamic alerts', async () => {
    const { status, data } = await fetchJson(`${API_BASE}/csuite/coo`);
    assertEqual(status, 200, 'Status should be 200');
    assert(data.operations, 'Should have operations');
    assert(data.operationalAlerts !== undefined, 'Should have operationalAlerts');
});

const testCFODashboard = test('C-Suite: CFO dashboard with dynamic KPIs', async () => {
    const { status, data } = await fetchJson(`${API_BASE}/csuite/cfo`);
    assertEqual(status, 200, 'Status should be 200');
    assert(data.financials, 'Should have financials');
    assert(data.kpis !== undefined, 'Should have kpis');
});

// Task Creation
const testTaskCreate = test('Tasks: Create new task', async () => {
    // First get a project ID
    const { data: projects } = await fetchJson(`${API_BASE}/projects`);
    const projectId = projects[0]?.id || 1;

    const newTask = {
        title: 'Test Task ' + Date.now(),
        description: 'Test task created by API tests',
        project_id: projectId,
        priority: 'medium'
    };
    const { status, data } = await fetchJson(`${API_BASE}/tasks`, {
        method: 'POST',
        body: JSON.stringify(newTask)
    });
    assertEqual(status, 201, 'Status should be 201 for created');
    assert(data.id, 'Response should contain task ID');
});

// ==================== RUN ALL TESTS ====================

async function runTests() {
    console.log('\n========================================');
    console.log('  SOLARIA Dashboard API Tests');
    console.log('========================================\n');

    const tests = [
        // Auth
        testAuthLogin,
        testAuthVerify,
        testAuthInvalidLogin,
        // Agents
        testAgentsList,
        testAgentsHaveRequiredFields,
        testAgentsRoles,
        testAgentsStatuses,
        testAgentDetail,
        // Tasks
        testTasksList,
        testTasksHaveRequiredFields,
        testTasksValidStatuses,
        testTasksValidPriorities,
        testTasksProgress,
        testTasksCompletedHaveProgress100,
        testTaskUpdate,
        // Projects
        testProjectsList,
        testProjectAkademate,
        testProjectHasRequiredFields,
        // Docs
        testDocsList,
        testDocsHaveRequiredFields,
        // Logs
        testLogsList,
        testLogsHaveRequiredFields,
        // Dashboard
        testDashboardOverview,
        testDashboardAlerts,
        // v3.2 New Features
        testQuickAccess,
        testProjectCreate,
        testAlertCreate,
        testTaskCreate,
        testCEODashboard,
        testCTODashboard,
        testCOODashboard,
        testCFODashboard
    ];

    for (const runTest of tests) {
        await runTest();
    }

    console.log('\n========================================');
    console.log(`  Results: ${results.passed} passed, ${results.failed} failed`);
    console.log('========================================\n');

    if (results.failed > 0) {
        console.log('Failed tests:');
        results.tests.filter(t => t.status === 'FAIL').forEach(t => {
            console.log(`  - ${t.name}: ${t.error}`);
        });
    }

    return results.failed === 0;
}

// Run if executed directly
runTests().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
});
