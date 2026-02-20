#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';

const BASE = process.env.AKADEMATE_BASE_URL || 'http://100.99.60.106';
const URLS = {
  tenant: process.env.TENANT_URL || `${BASE}:3009`,
  portal: process.env.PORTAL_URL || `${BASE}:3008`,
  web: process.env.WEB_URL || `${BASE}:3006`,
  admin: process.env.ADMIN_URL || `${BASE}:3004`,
  campus: process.env.CAMPUS_URL || `${BASE}:3005`,
  payload: process.env.PAYLOAD_URL || `${BASE}:3003`,
  ops: process.env.OPS_URL || `${BASE}:3070`,
};
const INCLUDE_OPS_CHECK = process.env.INCLUDE_OPS_CHECK === 'true';

const TIMEOUT_MS = Number(process.env.AUDIT_TIMEOUT_MS || 30000);
const LOGIN_TIMEOUT_MS = Number(process.env.AUDIT_LOGIN_TIMEOUT_MS || 65000);
const PAGE_TIMEOUT_MS = Number(process.env.AUDIT_PAGE_TIMEOUT_MS || 45000);
const ROOT = process.cwd();
const APP_ROOT = path.join(ROOT, 'apps/tenant-admin/app');

const PUBLIC_API_ENDPOINTS = new Set([
  '/api/health',
  '/api/auth/dev-login',
  '/api/auth/session',
  '/api/auth/logout',
  '/api/dev/auto-login',
]);

const CRITICAL_AUTH_ENDPOINTS = [
  '/api/dashboard',
  '/api/cursos?limit=5',
  '/api/convocatorias?limit=5',
  '/api/campuses?limit=5',
  '/api/students?limit=5',
  '/api/staff?limit=5',
  '/api/cycles?limit=5',
  '/api/lms/enrollments?limit=5',
  '/api/lms/progress?enrollmentId=3',
  '/api/feature-flags?tenantId=1',
];

const DASHBOARD_CRITICAL_PAGES = [
  '/dashboard',
  '/programacion',
  '/cursos',
  '/ciclos',
  '/sedes',
  '/profesores',
  '/alumnos',
  '/leads',
  '/campanas',
  '/analiticas',
  '/estado',
  '/configuracion',
  '/configuracion/dominios',
  '/configuracion/general',
  '/configuracion/personalizacion',
  '/configuracion/flags',
  '/configuracion/gdpr',
  '/matriculas',
  '/administracion/usuarios',
  '/administracion/roles',
  '/administracion/actividad',
  '/campus-virtual',
  '/campus-virtual/inscripciones',
  '/campus-virtual/progreso',
  '/campus-virtual/contenido',
  '/campus-virtual/certificados',
];

function nowIso() {
  return new Date().toISOString();
}

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[idx];
}

function parseSetCookie(setCookieHeader) {
  if (!setCookieHeader) return [];
  if (typeof setCookieHeader.getSetCookie === 'function') {
    return setCookieHeader.getSetCookie().map((cookie) => cookie.split(';')[0]);
  }
  const raw = setCookieHeader.get('set-cookie');
  if (!raw) return [];
  return raw
    .split(/,(?=[^;]+=[^;]+)/g)
    .map((entry) => entry.trim().split(';')[0])
    .filter(Boolean);
}

async function httpRequest(url, options = {}) {
  const { timeoutMs: timeoutOverride, ...fetchOptions } = options;
  const controller = new AbortController();
  const started = Date.now();
  const timeoutMs = Number(timeoutOverride || TIMEOUT_MS);
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'manual',
      ...fetchOptions,
      signal: controller.signal,
    });
    const ms = Date.now() - started;
    const body = await response.text();
    return {
      ok: response.ok,
      status: response.status,
      ms,
      url,
      body,
      bodySample: body.slice(0, 200).replace(/\n/g, ' '),
      headers: response.headers,
      error: null,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      ms: Date.now() - started,
      url,
      body: '',
      bodySample: '',
      headers: null,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timer);
  }
}

async function waitForTenantReady() {
  const maxAttempts = Number(process.env.AUDIT_HEALTH_RETRIES || 18);
  const retryDelayMs = Number(process.env.AUDIT_HEALTH_RETRY_DELAY_MS || 5000);

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const health = await httpRequest(`${URLS.tenant}/api/health`, {
      timeoutMs: 10000,
      redirect: 'follow',
    });

    if (health.status === 200) {
      return { ready: true, attempts: attempt };
    }

    if (attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
    }
  }

  return { ready: false, attempts: maxAttempts };
}

async function collectFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(full)));
      continue;
    }
    files.push(full);
  }
  return files;
}

async function discoverDashboardPages() {
  const dashboardDir = path.join(APP_ROOT, '(dashboard)');
  const files = (await collectFiles(dashboardDir)).filter((f) => f.endsWith('/page.tsx'));

  const routes = [];
  for (const file of files) {
    const rel = path.relative(dashboardDir, file).replace(/\\/g, '/');
    const dir = path.posix.dirname(rel);
    if (dir.includes('[')) continue;
    if (dir === '.') {
      routes.push('/dashboard');
    } else {
      routes.push(`/${dir}`);
    }
  }

  return [...new Set(routes)].sort();
}

async function discoverApiRoutes() {
  const apiDir = path.join(APP_ROOT, 'api');
  const files = (await collectFiles(apiDir)).filter((f) => f.endsWith('/route.ts'));

  return files.map((file) => {
    const rel = path.relative(apiDir, file).replace(/\\/g, '/');
    const dir = path.posix.dirname(rel);
    const endpoint = dir === '.' ? '/api' : `/api/${dir}`;
    return { file, endpoint, dynamic: endpoint.includes('[') };
  });
}

function analyzeTenantAwareness(content) {
  const patterns = [
    /tenant_id/,
    /tenantId/,
    /tenant\b/,
    /resolveTenant/i,
    /tenantField/i,
    /where\s*:\s*\{[^}]*tenant/i,
  ];
  return patterns.some((pattern) => pattern.test(content));
}

async function run() {
  const startedAt = nowIso();
  const report = {
    startedAt,
    base: BASE,
    timeoutMs: TIMEOUT_MS,
    urls: URLS,
    sections: {},
  };

  const tenantReadiness = await waitForTenantReady();
  report.sections.tenantReadiness = tenantReadiness;

  // Section A: discovery
  const [dashboardPages, apiRoutes] = await Promise.all([
    discoverDashboardPages(),
    discoverApiRoutes(),
  ]);

  report.sections.discovery = {
    dashboardPagesCount: dashboardPages.length,
    dashboardPages,
    apiRoutesCount: apiRoutes.length,
    apiStaticCount: apiRoutes.filter((r) => !r.dynamic).length,
  };

  // Section B: static tenant awareness audit
  const tenantAwareness = [];
  for (const route of apiRoutes) {
    const content = await fs.readFile(route.file, 'utf8');
    const tenantAware = analyzeTenantAwareness(content);
    const exempt =
      route.endpoint.includes('/auth/') ||
      route.endpoint.includes('/health') ||
      route.endpoint.includes('/webhooks/') ||
      route.endpoint.includes('/dev/');
    tenantAwareness.push({
      endpoint: route.endpoint,
      file: path.relative(ROOT, route.file),
      dynamic: route.dynamic,
      tenantAware,
      exempt,
    });
  }

  const tenantGaps = tenantAwareness.filter((item) => !item.tenantAware && !item.exempt);
  report.sections.staticTenantAwareness = {
    total: tenantAwareness.length,
    tenantAware: tenantAwareness.filter((item) => item.tenantAware).length,
    potentialGaps: tenantGaps.length,
    gaps: tenantGaps,
  };

  // Section C: auth flow + endpoint runtime audit
  const authFlow = { steps: [], success: false, cookieHeader: '' };
  const loginAttempts = [
    {
      step: 'dev-login-post',
      url: `${URLS.tenant}/api/auth/dev-login`,
      method: 'POST',
    },
    {
      step: 'dev-login-get',
      url: `${URLS.tenant}/api/auth/dev-login?redirect=/dashboard`,
      method: 'GET',
    },
    {
      step: 'dev-auto-login-fallback',
      url: `${URLS.tenant}/api/dev/auto-login?redirect=/dashboard`,
      method: 'GET',
    },
  ];

  for (const attempt of loginAttempts) {
    const loginResp = await httpRequest(attempt.url, {
      method: attempt.method,
      timeoutMs: LOGIN_TIMEOUT_MS,
    });
    authFlow.steps.push({
      step: attempt.step,
      status: loginResp.status,
      ms: loginResp.ms,
      error: loginResp.error,
    });

    const cookiePairs = parseSetCookie(loginResp.headers || { get: () => null });
    const cookieHeader = cookiePairs.join('; ');
    const hasPayloadToken = cookieHeader.includes('payload-token=');
    if (hasPayloadToken && [200, 302, 303, 307, 308].includes(loginResp.status)) {
      authFlow.cookieHeader = cookieHeader;
      authFlow.success = true;
      break;
    }
  }

  const unauthChecks = [];
  for (const endpoint of CRITICAL_AUTH_ENDPOINTS) {
    const res = await httpRequest(`${URLS.tenant}${endpoint}`);
    const pass = [401, 403].includes(res.status);
    unauthChecks.push({ endpoint, status: res.status, ms: res.ms, pass, sample: res.bodySample });
  }

  const authChecks = [];
  for (const endpoint of CRITICAL_AUTH_ENDPOINTS) {
    const res = await httpRequest(`${URLS.tenant}${endpoint}`, {
      headers: { Cookie: authFlow.cookieHeader },
      redirect: 'follow',
    });
    const isFeatureFlags = endpoint.startsWith('/api/feature-flags');
    const pass = isFeatureFlags
      ? [200, 400, 404].includes(res.status)
      : res.status >= 200 && res.status < 400;
    authChecks.push({ endpoint, status: res.status, ms: res.ms, pass, sample: res.bodySample });
  }

  const publicChecks = [];
  for (const endpoint of ['/api/health']) {
    const res = await httpRequest(`${URLS.tenant}${endpoint}`, { redirect: 'follow' });
    publicChecks.push({ endpoint, status: res.status, ms: res.ms, pass: res.status === 200 });
  }

  report.sections.apiRuntime = {
    authFlow,
    unauthChecks,
    authChecks,
    publicChecks,
    authPassRate:
      authChecks.length > 0
        ? Math.round((authChecks.filter((x) => x.pass).length / authChecks.length) * 100)
        : 0,
  };

  // Section D: dashboard page runtime
  const pageChecks = [];
  for (const route of DASHBOARD_CRITICAL_PAGES) {
    let res = await httpRequest(`${URLS.tenant}${route}`, {
      headers: { Cookie: authFlow.cookieHeader },
      redirect: 'follow',
      timeoutMs: PAGE_TIMEOUT_MS,
    });
    if (res.status === 0) {
      res = await httpRequest(`${URLS.tenant}${route}`, {
        headers: { Cookie: authFlow.cookieHeader },
        redirect: 'follow',
        timeoutMs: PAGE_TIMEOUT_MS,
      });
    }
    pageChecks.push({
      route,
      status: res.status,
      ms: res.ms,
      pass: res.status === 200,
      sample: res.bodySample,
    });
  }

  const pageTimings = pageChecks.map((p) => p.ms);
  report.sections.dashboardRuntime = {
    checked: pageChecks.length,
    pass: pageChecks.filter((x) => x.pass).length,
    fail: pageChecks.filter((x) => !x.pass).length,
    p50Ms: percentile(pageTimings, 50),
    p95Ms: percentile(pageTimings, 95),
    maxMs: pageTimings.length ? Math.max(...pageTimings) : 0,
    checks: pageChecks,
  };

  // Section E: multi-app integration reachability
  const appTargets = [
    { id: 'portal', url: URLS.portal },
    { id: 'web', url: URLS.web },
    { id: 'admin', url: URLS.admin },
    { id: 'campus', url: URLS.campus },
    { id: 'payload-admin-login', url: `${URLS.payload}/admin/login` },
    { id: 'payload-admin-courses', url: `${URLS.payload}/admin/collections/courses` },
  ];
  if (INCLUDE_OPS_CHECK) {
    appTargets.push({ id: 'ops', url: URLS.ops });
  }

  const appChecks = [];
  for (const target of appTargets) {
    const res = await httpRequest(target.url, { redirect: 'follow' });
    const pass = res.status >= 200 && res.status < 400;
    appChecks.push({ id: target.id, url: target.url, status: res.status, ms: res.ms, pass });
  }

  report.sections.platformReachability = {
    checked: appChecks.length,
    pass: appChecks.filter((x) => x.pass).length,
    fail: appChecks.filter((x) => !x.pass).length,
    checks: appChecks,
  };

  const endedAt = nowIso();
  const failedCount =
    report.sections.apiRuntime.unauthChecks.filter((x) => !x.pass).length +
    report.sections.apiRuntime.authChecks.filter((x) => !x.pass).length +
    report.sections.dashboardRuntime.fail +
    report.sections.platformReachability.fail;

  report.summary = {
    startedAt,
    endedAt,
    status: failedCount === 0 ? 'PASS' : 'FAIL',
    failedChecks: failedCount,
  };

  const ts = startedAt.replace(/[:.]/g, '-');
  const outJson = path.join(ROOT, 'docs/audits', `platform-audit-${ts}.json`);
  const outMd = path.join(ROOT, 'docs/audits', `platform-audit-${ts}.md`);

  await fs.writeFile(outJson, JSON.stringify(report, null, 2));

  const md = [
    '# Platform Multitenant Audit',
    '',
    `- Started: ${startedAt}`,
    `- Ended: ${endedAt}`,
    `- Status: **${report.summary.status}**`,
    `- Failed checks: **${report.summary.failedChecks}**`,
    '',
    '## Runtime Coverage',
    `- Critical tenant APIs checked: ${report.sections.apiRuntime.authChecks.length}`,
    `- Dashboard critical pages checked: ${report.sections.dashboardRuntime.checked}`,
    `- Platform app targets checked: ${report.sections.platformReachability.checked}`,
    '',
    '## Dashboard Performance Snapshot',
    `- p50: ${report.sections.dashboardRuntime.p50Ms}ms`,
    `- p95: ${report.sections.dashboardRuntime.p95Ms}ms`,
    `- max: ${report.sections.dashboardRuntime.maxMs}ms`,
    '',
    '## Static Tenant Awareness Gaps',
    `- Potential gaps: ${report.sections.staticTenantAwareness.potentialGaps}`,
    ...report.sections.staticTenantAwareness.gaps.slice(0, 40).map((gap) =>
      `- ${gap.endpoint} (${gap.file})`
    ),
    '',
    '## Failed Checks',
    ...report.sections.apiRuntime.unauthChecks.filter((x) => !x.pass).map((x) =>
      `- Unauth API: ${x.endpoint} -> ${x.status}`
    ),
    ...report.sections.apiRuntime.authChecks.filter((x) => !x.pass).map((x) =>
      `- Auth API: ${x.endpoint} -> ${x.status}`
    ),
    ...report.sections.dashboardRuntime.checks.filter((x) => !x.pass).map((x) =>
      `- Page: ${x.route} -> ${x.status}`
    ),
    ...report.sections.platformReachability.checks.filter((x) => !x.pass).map((x) =>
      `- App: ${x.id} (${x.url}) -> ${x.status}`
    ),
    '',
    `JSON evidence: ${path.relative(ROOT, outJson)}`,
  ].join('\n');

  await fs.writeFile(outMd, md);

  process.stdout.write(JSON.stringify({
    status: report.summary.status,
    failedChecks: report.summary.failedChecks,
    reportJson: path.relative(ROOT, outJson),
    reportMd: path.relative(ROOT, outMd),
  }, null, 2) + '\n');

  process.exit(report.summary.status === 'PASS' ? 0 : 1);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
