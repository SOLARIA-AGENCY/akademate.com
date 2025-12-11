#!/usr/bin/env node
const assert = require('node:assert').strict;
const fetch = global.fetch;

const API = process.env.DASHBOARD_API_URL || 'http://localhost:3030/api';
const USER = process.env.DASHBOARD_USER || 'carlosjperez';
const PASS = process.env.DASHBOARD_PASS || 'SolariaAdmin2024!';

async function main() {
  // health
  const health = await fetch(`${API}/health`);
  assert.equal(health.status, 200, 'health status code');
  const healthJson = await health.json();
  assert.equal(healthJson.database, 'connected', 'database connected');

  // login
  const login = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: USER, password: PASS })
  });
  assert.equal(login.status, 200, 'login status');
  const loginJson = await login.json();
  assert.ok(loginJson.token, 'login token');
  const token = loginJson.token;
  const authHeader = { Authorization: `Bearer ${token}` };

  // projects
  const projects = await fetch(`${API}/projects`, { headers: authHeader });
  assert.equal(projects.status, 200, 'projects status');
  const projectsJson = await projects.json();
  assert.ok(Array.isArray(projectsJson.projects), 'projects array');

  // tasks
  const tasks = await fetch(`${API}/tasks`, { headers: authHeader });
  assert.equal(tasks.status, 200, 'tasks status');
  const tasksJson = await tasks.json();
  assert.ok(Array.isArray(tasksJson.tasks || tasksJson), 'tasks array');

  // overview
  const overview = await fetch(`${API}/dashboard/overview`, { headers: authHeader });
  assert.equal(overview.status, 200, 'overview status');

  console.log('All smoke tests passed');
}

main().catch(err => {
  console.error('Test failed:', err.message);
  process.exit(1);
});
