#!/usr/bin/env node

const base = process.env.AKADEMATE_BASE_URL || 'http://100.99.60.106';

const urls = {
  web: process.env.WEB_URL || `${base}:3006`,
  ops: process.env.OPS_URL || `${base}:3004`,
  tenant: process.env.TENANT_URL || `${base}:3009`,
  campus: process.env.CAMPUS_URL || `${base}:3005`,
  payload: process.env.PAYLOAD_URL || `${base}:3003`,
  portal: process.env.PORTAL_URL || `${base}:3008`,
};

const timeoutMs = Number(process.env.AUDIT_TIMEOUT_MS || 45000);
const retries = Number(process.env.AUDIT_RETRIES || 3);

function withTimeout(ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { controller, timer };
}

async function request(url, options = {}) {
  const { controller, timer } = withTimeout(timeoutMs);
  const start = Date.now();
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      redirect: options.redirect || 'manual',
    });
    const ms = Date.now() - start;
    const text = await response.text();
    return {
      ok: response.ok,
      status: response.status,
      ms,
      url,
      headers: response.headers,
      bodyText: text,
      bodySample: text.slice(0, 240).replace(/\n/g, ' '),
    };
  } catch (error) {
    const ms = Date.now() - start;
    return {
      ok: false,
      status: 0,
      ms,
      url,
      error: error instanceof Error ? error.message : String(error),
      bodySample: '',
    };
  } finally {
    clearTimeout(timer);
  }
}

async function requestWithRetries(url, options = {}, attempts = retries) {
  let last = null;
  for (let i = 1; i <= attempts; i += 1) {
    const response = await request(url, options);
    last = response;
    if (response.status !== 0 && response.status < 500) {
      return response;
    }
    if (i < attempts) {
      await new Promise((resolve) => setTimeout(resolve, 700 * i));
    }
  }
  return last;
}

function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function assertCondition(result, condition, message) {
  if (!condition) {
    result.failures.push(message);
  }
}

async function run() {
  const summary = {
    timestamp: new Date().toISOString(),
    base,
    timeoutMs,
    totals: { checks: 0, passed: 0, failed: 0 },
    checks: [],
  };

  function addCheck(name, outcome) {
    summary.totals.checks += 1;
    const passed = outcome.failures.length === 0;
    if (passed) summary.totals.passed += 1;
    else summary.totals.failed += 1;
    summary.checks.push({ name, passed, ...outcome });
  }

  const tenantCookie = [];

  const devLogin = {
    failures: [],
    details: {},
  };

  const devLoginResp = await requestWithRetries(`${urls.tenant}/api/auth/dev-login`, {
    method: 'POST',
  });

  devLogin.details.status = devLoginResp.status;
  devLogin.details.ms = devLoginResp.ms;
  assertCondition(devLogin, devLoginResp.status === 302, `Expected 302, got ${devLoginResp.status}`);

  const setCookies = devLoginResp.headers?.getSetCookie?.() || [];
  for (const c of setCookies) {
    const pair = c.split(';')[0];
    if (pair) tenantCookie.push(pair);
  }
  const cookieHeader = tenantCookie.join('; ');
  assertCondition(devLogin, cookieHeader.includes('payload-token='), 'Missing payload-token cookie');
  addCheck('tenant.devLogin', devLogin);

  const tenantApiChecks = [
    { path: '/api/health', expectJson: true },
    { path: '/api/dashboard', expectJson: true },
    { path: '/api/cursos?limit=5', expectJson: true },
    { path: '/api/convocatorias?limit=5', expectJson: true },
    { path: '/api/campuses?limit=5', expectJson: true },
    { path: '/api/students?limit=5', expectJson: true },
    { path: '/api/staff?limit=5', expectJson: true },
    { path: '/api/cycles?limit=5', expectJson: true },
    { path: '/api/lms/enrollments?limit=5', expectJson: true },
  ];

  let firstEnrollmentId = null;

  for (const c of tenantApiChecks) {
    const out = { failures: [], details: {} };
    const resp = await request(`${urls.tenant}${c.path}`, {
      headers: { Cookie: cookieHeader },
      redirect: 'follow',
    });
    out.details.status = resp.status;
    out.details.ms = resp.ms;
    out.details.sample = resp.bodySample;

    assertCondition(out, resp.status >= 200 && resp.status < 400, `Unexpected status ${resp.status}`);

    if (c.expectJson) {
      const json = parseJson(resp.bodyText);
      assertCondition(out, json !== null, 'Response is not valid JSON');
      if (json) {
        if (c.path.includes('/api/lms/enrollments') && Array.isArray(json.data) && json.data.length > 0) {
          firstEnrollmentId = json.data[0]?.id ?? null;
        }
      }
    }

    addCheck(`tenant${c.path}`, out);
  }

  if (firstEnrollmentId !== null) {
    const out = { failures: [], details: {} };
    const resp = await request(`${urls.tenant}/api/lms/progress?enrollmentId=${firstEnrollmentId}`, {
      headers: { Cookie: cookieHeader },
      redirect: 'follow',
    });
    out.details.status = resp.status;
    out.details.ms = resp.ms;
    out.details.sample = resp.bodySample;
    assertCondition(out, resp.status >= 200 && resp.status < 500, `Unexpected status ${resp.status}`);
    addCheck('tenant/api/lms/progress', out);
  }

  const tenantPages = [
    '/dashboard',
    '/cursos',
    '/sedes',
    '/alumnos',
    '/profesores',
    '/campus-virtual',
    '/campus-virtual/inscripciones',
    '/campus-virtual/progreso',
    '/campus-virtual/contenido',
    '/campus-virtual/certificados',
  ];

  for (const path of tenantPages) {
    const out = { failures: [], details: {} };
    const resp = await request(`${urls.tenant}${path}`, {
      headers: { Cookie: cookieHeader },
      redirect: 'follow',
    });
    out.details.status = resp.status;
    out.details.ms = resp.ms;
    assertCondition(out, resp.status === 200, `Expected 200, got ${resp.status}`);
    addCheck(`tenant.page${path}`, out);
  }

  const appUrls = [
    { name: 'portal.home', url: `${urls.portal}` },
    { name: 'web.home', url: `${urls.web}` },
    { name: 'ops.home', url: `${urls.ops}` },
    { name: 'campus.home', url: `${urls.campus}` },
    { name: 'payload.admin.login', url: `${urls.payload}/admin/login` },
    { name: 'payload.admin.courses', url: `${urls.payload}/admin/collections/courses` },
  ];

  for (const target of appUrls) {
    const out = { failures: [], details: {} };
    const resp = await request(target.url, { redirect: 'follow' });
    out.details.status = resp.status;
    out.details.ms = resp.ms;
    out.details.sample = resp.bodySample;
    assertCondition(out, resp.status >= 200 && resp.status < 400, `Unexpected status ${resp.status}`);
    addCheck(target.name, out);
  }

  const serviceHealth = [
    { name: 'tenant.health', url: `${urls.tenant}/api/health`, expect: 200 },
    { name: 'payload.health', url: `${urls.payload}/api/health`, expect: 200 },
    { name: 'web.health', url: `${urls.web}`, expect: 200 },
  ];

  for (const h of serviceHealth) {
    const out = { failures: [], details: {} };
    const resp = await request(h.url, { redirect: 'follow' });
    out.details.status = resp.status;
    out.details.ms = resp.ms;
    assertCondition(out, resp.status === h.expect, `Expected ${h.expect}, got ${resp.status}`);
    addCheck(h.name, out);
  }

  const hasFailures = summary.totals.failed > 0;
  const resultJson = JSON.stringify(summary, null, 2);
  process.stdout.write(resultJson + '\n');
  process.exit(hasFailures ? 1 : 0);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
