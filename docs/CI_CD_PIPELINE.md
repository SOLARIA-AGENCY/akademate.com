# CI/CD Pipeline Documentation

**Task:** P2-002 - CI/CD Complete [CI-001]
**Status:** ⚠️ DOCUMENTED - Implementation Required
**Date:** 15 Enero 2026

---

## Overview

Complete CI/CD pipeline with all quality gates for production readiness.

---

## Current State

✅ **WORKFLOWS EXIST** in `.github/workflows/`

- Pull request checks
- Basic lint/typecheck
- Deployment workflows

⚠️ **INCOMPLETE:**

- No comprehensive test step
- No E2E test automation
- No security scanning
- No coverage enforcement
- No smoke test automation

---

## Required Pipeline Steps

### 1. Lint Step (1h)

**Workflow:** `.github/workflows/ci.yml`

```yaml
lint:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - name: Setup Node
      uses: actions/setup-node@v4
      with:
        node-version: '22'
        cache: 'pnpm'

    - name: Install dependencies
      run: pnpm install --frozen-lockfile

    - name: Run ESLint
      run: pnpm -r lint
      continue-on-error: false
```

**Configuration Required:**

- ESLint config: `.eslintrc.js` or `eslint.config.mjs`
- Lint rules per package
- Ignore patterns for generated files

---

### 2. Typecheck Step (1h)

```yaml
typecheck:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - name: Setup Node
      uses: actions/setup-node@v4
      with:
        node-version: '22'
        cache: 'pnpm'

    - name: Install dependencies
      run: pnpm install --frozen-lockfile

    - name: Typecheck
      run: pnpm -r exec tsc --noEmit
      continue-on-error: false
```

**Note:** `tsconfig.base.json` now has strict mode enabled.

---

### 3. Unit Tests Step (2h)

```yaml
test:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - name: Setup Node
      uses: actions/setup-node@v4
      with:
        node-version: '22'
        cache: 'pnpm'

    - name: Install dependencies
      run: pnpm install --frozen-lockfile

    - name: Run tests
      run: pnpm test -- --coverage
      continue-on-error: false

    - name: Upload coverage
      uses: codecov/codecov-action@v4
      with:
        files: ./coverage/coverage-final.json
        flags: unittests
```

**Coverage Requirements:**

- Minimum 75% coverage threshold
- Fail build if coverage drops
- Upload to Codecov (or similar)

---

### 4. E2E Tests Step (2h)

```yaml
e2e:
  runs-on: ubuntu-latest
  needs: [test]
  steps:
    - uses: actions/checkout@v4
    - name: Setup Node
      uses: actions/setup-node@v4
      with:
        node-version: '22'
        cache: 'pnpm'

    - name: Install dependencies
      run: pnpm install --frozen-lockfile

    - name: Install Playwright
      run: pnpm exec playwright install --with-deps

    - name: Run E2E tests
      run: pnpm test:e2e
      env:
        CI: true
      continue-on-error: false
```

**Test Scenarios Required:**

- User registration → login → dashboard navigation
- Course enrollment → payment → confirmation
- Admin user management → role assignment
- Data export → deletion (GDPR)
- Multi-tenant isolation (RLS verification)

---

### 5. Build Step (1h)

```yaml
build:
  runs-on: ubuntu-latest
  needs: [lint, typecheck, test]
  steps:
    - uses: actions/checkout@v4
    - name: Setup Node
      uses: actions/setup-node@v4
      with:
        node-version: '22'
        cache: 'pnpm'

    - name: Install dependencies
      run: pnpm install --frozen-lockfile

    - name: Build all packages
      run: pnpm -r build
      continue-on-error: false

    - name: Upload build artifacts
      uses: actions/upload-artifact@v4
      with:
        name: build-artifacts
        path: |
          packages/*/dist
          apps/*/.next
```

---

### 6. Security Scan Step (1h)

```yaml
security:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4

    - name: Run TruffleHog
      uses: trufflesecurity/trufflehog-action@master
      with:
        path: ./
        base: ${{ github.ref_name }}
        head: ${{ github.sha }}

    - name: NPM Audit
      run: pnpm audit --audit-level=moderate

    - name: Snyk Scan
      uses: snyk/actions/node@master
      with:
        command: monitor
      env:
        SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
```

---

### 7. Deploy Step (1h)

```yaml
deploy:
  runs-on: ubuntu-latest
  needs: [build]
  if: github.ref == 'refs/heads/main'
  environment: production
  steps:
    - uses: actions/checkout@v4

    - name: Deploy to production
      run: |
        # SSH into production server
        # Pull latest changes
        # Restart services with PM2
        # Run migrations
        # Clear Next.js cache
        # Health check

    - name: Notify deployment
      uses: 8398a7/action-slack@v3
      with:
        status: ${{ job.status }}
        text: 'Production deployment: ${{ job.status }}'
      env:
        SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

---

## Configuration Files to Create

### .eslintrc.js

```javascript
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/explicit-module-boundary-types': 'warn',
  },
  ignore: ['node_modules/**', '.next/**', 'dist/**', '**/*.d.ts'],
}
```

---

### vitest.workspace.config.ts

```typescript
import { defineWorkspaceConfig } from 'vitest/config'

export default defineWorkspaceConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['**/*.test.ts', '**/*.config.ts', '**/node_modules/**'],
      thresholds: {
        lines: 75,
        functions: 75,
        branches: 75,
        statements: 75,
      },
    },
  },
})
```

---

### playwright.config.ts

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html'], ['junit', { outputFile: 'test-results/junit.xml' }]],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3009',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
```

---

## Workflow Triggers

### On Pull Request

```yaml
on:
  pull_request:
    branches: ['main', 'develop']
    types: [opened, synchronize, reopened]

jobs:
  lint:
    # ...
  typecheck:
    # ...
  test:
    # ...
  e2e:
    # ...
```

### On Push to Main

```yaml
on:
  push:
    branches: ['main']

jobs:
  lint:
    # ...
  typecheck:
    # ...
  test:
    # ...
  e2e:
    # ...
  build:
    # ...
  security:
    # ...
  deploy:
    # ...
```

---

## Environment Variables Required

### GitHub Secrets

```
- SNYK_TOKEN (for Snyk security scanning)
- SLACK_WEBHOOK_URL (for deployment notifications)
- DEPLOY_HOST (production server)
- DEPLOY_USER (SSH user)
- DEPLOY_KEY (SSH private key)
- DATABASE_URL (production database - for migrations)
- REDIS_URL (production Redis - for job queues)
```

---

## Estimated Effort

| Component       | Est. Time | Priority |
| --------------- | --------- | -------- |
| Lint Step       | 1h        | P1       |
| Typecheck Step  | 1h        | P1       |
| Unit Tests Step | 2h        | P1       |
| E2E Tests Step  | 2h        | P1       |
| Build Step      | 1h        | P1       |
| Security Scan   | 1h        | P1       |
| Deploy Step     | 1h        | P1       |
| Config Files    | 2h        | P1       |
| **Total**       | **12h**   | -        |

**Original estimate:** 8h (underestimated by 4h)

---

## Success Criteria

- [ ] All workflows pass on PR
- [ ] Typecheck has 0 errors
- [ ] Unit tests pass with 75%+ coverage
- [ ] E2E tests pass for critical flows
- [ ] Build produces artifacts
- [ ] Security scan has 0 critical issues
- [ ] Deploy to staging/production on main push

---

## Dependencies

- ✅ Tests exist (packages/api, packages/db)
- ✅ Vitest configured
- ❌ E2E tests missing (need Playwright setup)
- ❌ ESLint config missing
- ❌ Coverage thresholds not enforced
- ❌ Security scanners not configured

---

## Next Steps

1. **Create ESLint config** (30 min)
2. **Create CI workflow** with all steps (1h)
3. **Setup Playwright** for E2E (30 min)
4. **Create sample E2E tests** (1h)
5. **Configure Snyk/TruffleHog** (30 min)
6. **Test workflow** (run manually) (30 min)

---

**Documented by:** Ralph-Wiggum (Eco-Sigma)
**Status:** Ready for implementation
**Est. Remaining:** 12 hours
