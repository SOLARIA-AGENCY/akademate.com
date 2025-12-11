#!/usr/bin/env node

// Ingesta no interactiva de specs/milestones de Akademate al dashboard MySQL
// Usa .env existente (DB_PASSWORD, DB_USER, DB_HOST, DB_NAME, PROJECT_NAME)

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const {
  DB_HOST = 'localhost',
  DB_PORT = '33060',
  DB_USER = 'solaria_user',
  DB_PASSWORD = 'solaria2024',
  DB_NAME = 'solaria_construction',
  PROJECT_NAME = 'Akademate',
  PROJECT_TYPE = 'software',
} = process.env;

const baseRepo = process.env.REPO_PATH || path.resolve(__dirname, '..');
const milestonesPath = path.resolve(baseRepo, 'docs', 'PROJECT_MILESTONES.md');
const specPath = path.resolve(baseRepo, 'docs', 'specs', 'ACADEIMATE_SPEC.md');

async function main() {
  const conn = await mysql.createConnection({
    host: DB_HOST,
    port: parseInt(DB_PORT, 10),
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
  });

  const projectId = await upsertProject(conn);
  const tasks = collectTasks();
  await upsertTasks(conn, projectId, tasks);
  await upsertMetrics(conn, projectId, tasks);

  console.log(`Ingesta completada. Proyecto=${PROJECT_NAME}, tareas=${tasks.length}`);
  await conn.end();
}

function collectTasks() {
  const content = fs.readFileSync(milestonesPath, 'utf-8');
  const lines = content.split(/\r?\n/);
  const taskLines = lines.filter(l => l.trim().startsWith('- '));
  const tasks = [];
  for (const line of taskLines) {
    // Example: "- P0 Multitenancy Core — 1 sprint." -> title before dash, rest description
    const clean = line.replace(/^\-\s*/, '');
    const [title, ...rest] = clean.split('—');
    const description = rest.join('—').trim() || 'Milestone autoimportado';
    const priority = title.toLowerCase().includes('p0') ? 'critical' : title.toLowerCase().includes('p1') ? 'high' : 'medium';
    tasks.push({ title: title.trim(), description, priority });
  }
  return tasks;
}

async function upsertProject(conn) {
  const specSnippet = fs.existsSync(specPath)
    ? fs.readFileSync(specPath, 'utf-8').slice(0, 2000)
    : '';
  const [rows] = await conn.execute('SELECT id FROM projects WHERE name = ?', [PROJECT_NAME]);
  if (rows.length) return rows[0].id;

  const [result] = await conn.execute(
    `INSERT INTO projects (name, client, description, status, priority, budget, completion_percentage, created_by)
     VALUES (?, ?, ?, 'planning', 'critical', 250000, 15, 1)`,
    [PROJECT_NAME, 'Akademate SaaS', `Autoimport spec snippet:\n${specSnippet}`]
  );
  return result.insertId;
}

async function upsertTasks(conn, projectId, tasks) {
  for (const t of tasks) {
    const [existing] = await conn.execute(
      'SELECT id FROM tasks WHERE project_id = ? AND title = ? LIMIT 1',
      [projectId, t.title]
    );
    if (existing.length) {
      await conn.execute(
        'UPDATE tasks SET description = ?, priority = ?, updated_at = NOW() WHERE id = ?',
        [t.description, t.priority, existing[0].id]
      );
    } else {
      await conn.execute(
        `INSERT INTO tasks (project_id, title, description, status, priority, estimated_hours, progress)
         VALUES (?, ?, ?, 'pending', ?, 40, 0)`,
        [projectId, t.title, t.description, t.priority]
      );
    }
  }
}

async function upsertMetrics(conn, projectId, tasks) {
  const completion = Math.round((tasks.filter(t => t.priority === 'critical').length / tasks.length) * 20 + 10);
  await conn.execute(
    `INSERT INTO project_metrics (project_id, metric_date, completion_percentage, agent_efficiency, code_quality_score, test_coverage, total_hours_worked, tasks_completed, tasks_pending, budget_used)
     VALUES (?, CURDATE(), ?, 85, 80, 10, 120, 0, ?, 0)
     ON DUPLICATE KEY UPDATE completion_percentage = VALUES(completion_percentage), tasks_pending = VALUES(tasks_pending)`,
    [projectId, completion, tasks.length]
  );
}

main().catch(err => {
  console.error('Ingesta falló:', err.message);
  process.exit(1);
});
