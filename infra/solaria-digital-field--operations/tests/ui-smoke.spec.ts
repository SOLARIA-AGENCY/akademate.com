import { test, expect, request as playwrightRequest } from '@playwright/test';

const apiBase = process.env.DASHBOARD_API_URL || 'http://localhost:3030/api';
const baseURL = process.env.DFO_BASE_URL || 'http://localhost:3030';
const user = process.env.DASHBOARD_USER || 'carlosjperez';
const pass = process.env.DASHBOARD_PASS || 'SolariaAdmin2024!';

// UI + API smoke to ensure office is ready for agents

test('health endpoint works', async ({ request }) => {
  const res = await request.get(`${apiBase}/health`);
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.database).toBe('connected');
});

test('login via API and render dashboard', async ({ page }) => {
  const api = await playwrightRequest.newContext();
  const loginRes = await api.post(`${apiBase}/auth/login`, {
    data: { userId: user, password: pass },
  });
  expect(loginRes.status()).toBe(200);
  const { token } = await loginRes.json();
  expect(token).toBeTruthy();

  // Inject token and open dashboard
  await page.addInitScript((t) => localStorage.setItem('token', t), token);
  await page.goto(baseURL + '/');
  await expect(page).toHaveTitle(/SOLARIA|Dashboard/i);
  await expect(page.getByText(/dashboard|proyecto|proyectos/i).first()).toBeVisible();
});
