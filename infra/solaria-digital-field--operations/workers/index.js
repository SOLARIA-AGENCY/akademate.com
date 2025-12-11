/**
 * SOLARIA Digital Field Operations - Worker Service
 * BullMQ workers for async task processing
 */

const { Worker, Queue, QueueEvents } = require('bullmq');
const Redis = require('ioredis');
const mysql = require('mysql2/promise');

// Configuration
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'solaria_user',
  password: process.env.DB_PASSWORD || 'solaria2024',
  database: process.env.DB_NAME || 'solaria_construction',
};

// Redis connection
const connection = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

// Database pool
let dbPool = null;

async function getDb() {
  if (!dbPool) {
    dbPool = await mysql.createPool({
      ...DB_CONFIG,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }
  return dbPool;
}

// Queue definitions
const QUEUES = {
  AGENT_TASKS: 'agent-tasks',
  CODE_ANALYSIS: 'code-analysis',
  PROJECT_SYNC: 'project-sync',
  NOTIFICATIONS: 'notifications',
};

// Create queues
const queues = {};
for (const [name, queueName] of Object.entries(QUEUES)) {
  queues[name] = new Queue(queueName, { connection });
}

// ============================================================================
// Worker: Agent Tasks
// Handles task assignment and execution for AI agents
// ============================================================================
const agentWorker = new Worker(
  QUEUES.AGENT_TASKS,
  async (job) => {
    const { agentId, taskId, action, payload } = job.data;
    console.log(`[Agent ${agentId}] Processing: ${action} (Task: ${taskId})`);

    const db = await getDb();

    try {
      // Update task status to in_progress
      if (taskId) {
        await db.execute(
          'UPDATE tasks SET status = ?, updated_at = NOW() WHERE id = ?',
          ['in_progress', taskId]
        );
      }

      let result;
      switch (action) {
        case 'analyze_code':
          result = await analyzeCode(payload);
          break;
        case 'generate_docs':
          result = await generateDocs(payload);
          break;
        case 'run_tests':
          result = await runTests(payload);
          break;
        case 'review_pr':
          result = await reviewPR(payload);
          break;
        case 'update_progress':
          result = await updateProgress(db, taskId, payload);
          break;
        default:
          throw new Error(`Unknown action: ${action}`);
      }

      // Log activity
      await db.execute(
        `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
         VALUES (?, ?, ?, ?, ?)`,
        [1, `agent_${action}`, 'task', taskId, JSON.stringify({ agentId, result })]
      );

      return result;
    } catch (error) {
      console.error(`[Agent ${agentId}] Error:`, error.message);
      throw error;
    }
  },
  {
    connection,
    concurrency: 5,
    limiter: { max: 10, duration: 1000 },
  }
);

// ============================================================================
// Worker: Code Analysis
// Analyzes code quality, complexity, and patterns
// ============================================================================
const analysisWorker = new Worker(
  QUEUES.CODE_ANALYSIS,
  async (job) => {
    const { projectId, files, type } = job.data;
    console.log(`[Analysis] Project ${projectId}: ${type} (${files?.length || 0} files)`);

    const db = await getDb();

    // Simulate analysis
    const results = {
      complexity: Math.floor(Math.random() * 30) + 10,
      coverage: Math.floor(Math.random() * 40) + 60,
      issues: Math.floor(Math.random() * 10),
      suggestions: [],
    };

    // Update project metrics
    await db.execute(
      `INSERT INTO project_metrics (project_id, metric_date, code_quality_score, test_coverage)
       VALUES (?, CURDATE(), ?, ?)
       ON DUPLICATE KEY UPDATE code_quality_score = VALUES(code_quality_score), test_coverage = VALUES(test_coverage)`,
      [projectId, 100 - results.complexity, results.coverage]
    );

    return results;
  },
  { connection, concurrency: 3 }
);

// ============================================================================
// Worker: Project Sync
// Syncs project data from external sources (GitHub, etc.)
// ============================================================================
const syncWorker = new Worker(
  QUEUES.PROJECT_SYNC,
  async (job) => {
    const { projectId, source, action } = job.data;
    console.log(`[Sync] Project ${projectId}: ${action} from ${source}`);

    const db = await getDb();

    switch (action) {
      case 'import_issues':
        // Placeholder for GitHub issues import
        console.log(`[Sync] Would import issues from ${source}`);
        break;
      case 'sync_commits':
        // Placeholder for commit history sync
        console.log(`[Sync] Would sync commits from ${source}`);
        break;
      case 'update_metrics':
        await db.execute(
          'UPDATE projects SET updated_at = NOW() WHERE id = ?',
          [projectId]
        );
        break;
    }

    return { synced: true, timestamp: new Date().toISOString() };
  },
  { connection, concurrency: 2 }
);

// ============================================================================
// Worker: Notifications
// Handles alerts and notifications
// ============================================================================
const notificationWorker = new Worker(
  QUEUES.NOTIFICATIONS,
  async (job) => {
    const { type, recipients, message, data } = job.data;
    console.log(`[Notification] ${type} to ${recipients?.length || 0} recipients`);

    const db = await getDb();

    // Create alert in database
    if (type === 'alert') {
      await db.execute(
        `INSERT INTO alerts (project_id, type, severity, title, description, is_active)
         VALUES (?, ?, ?, ?, ?, TRUE)`,
        [data.projectId, data.alertType || 'info', data.severity || 'low', message, JSON.stringify(data)]
      );
    }

    return { sent: true, type, timestamp: new Date().toISOString() };
  },
  { connection, concurrency: 10 }
);

// ============================================================================
// Task Handlers
// ============================================================================

async function analyzeCode(payload) {
  // Placeholder - would integrate with actual code analysis tools
  return {
    analyzed: true,
    files: payload.files?.length || 0,
    issues: [],
    metrics: { complexity: 'low', maintainability: 'high' },
  };
}

async function generateDocs(payload) {
  // Placeholder - would integrate with documentation generators
  return {
    generated: true,
    format: payload.format || 'markdown',
    sections: ['overview', 'api', 'examples'],
  };
}

async function runTests(payload) {
  // Placeholder - would integrate with test runners
  return {
    passed: Math.floor(Math.random() * 50) + 50,
    failed: Math.floor(Math.random() * 5),
    skipped: Math.floor(Math.random() * 3),
    coverage: Math.floor(Math.random() * 30) + 70,
  };
}

async function reviewPR(payload) {
  // Placeholder - would integrate with code review tools
  return {
    reviewed: true,
    comments: [],
    approval: 'pending',
    suggestions: [],
  };
}

async function updateProgress(db, taskId, payload) {
  const { progress, status, notes } = payload;

  const updates = [];
  const values = [];

  if (progress !== undefined) {
    updates.push('progress = ?');
    values.push(progress);
  }
  if (status) {
    updates.push('status = ?');
    values.push(status);
  }
  if (notes) {
    updates.push('notes = ?');
    values.push(notes);
  }

  if (updates.length > 0) {
    updates.push('updated_at = NOW()');
    values.push(taskId);

    await db.execute(
      `UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
  }

  return { updated: true, taskId };
}

// ============================================================================
// Event Handlers
// ============================================================================

agentWorker.on('completed', (job) => {
  console.log(`[Agent] Job ${job.id} completed successfully`);
});

agentWorker.on('failed', (job, err) => {
  console.error(`[Agent] Job ${job?.id} failed:`, err.message);
});

analysisWorker.on('completed', (job) => {
  console.log(`[Analysis] Job ${job.id} completed`);
});

syncWorker.on('completed', (job) => {
  console.log(`[Sync] Job ${job.id} completed`);
});

notificationWorker.on('completed', (job) => {
  console.log(`[Notification] Job ${job.id} sent`);
});

// ============================================================================
// Graceful Shutdown
// ============================================================================

async function shutdown() {
  console.log('[Workers] Shutting down...');

  await agentWorker.close();
  await analysisWorker.close();
  await syncWorker.close();
  await notificationWorker.close();

  if (dbPool) {
    await dbPool.end();
  }

  await connection.quit();

  console.log('[Workers] Shutdown complete');
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// ============================================================================
// Startup
// ============================================================================

console.log('='.repeat(50));
console.log('[Workers] SOLARIA Digital Field Operations');
console.log('[Workers] BullMQ Worker Service v1.0.0');
console.log(`[Workers] Redis: ${REDIS_URL}`);
console.log(`[Workers] Database: ${DB_CONFIG.host}:${DB_CONFIG.port}/${DB_CONFIG.database}`);
console.log('[Workers] Queues:', Object.values(QUEUES).join(', '));
console.log('[Workers] All workers started and listening');
console.log('='.repeat(50));

// Export for testing
module.exports = { queues, QUEUES };
