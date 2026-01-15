# E2E Tests Documentation

**Task:** P2-003 - Additional E2E Tests [TEST-002]
**Status:** ⚠️ DOCUMENTED - Implementation Required
**Date:** 15 Enero 2026

---

## Overview

Comprehensive end-to-end testing for critical user and admin flows to ensure production readiness.

---

## Current State

✅ **VITEST EXISTS** for unit tests (packages/api, packages/db)
✅ **PLAYWRIGHT DEPENDENCY** in package.json
⚠️ **NO E2E TESTS** exist for critical flows
⚠️ **NO E2E TEST SETUP** (no playwright.config.ts)

---

## Required E2E Test Scenarios

### User Authentication Flow (2h)

**Test File:** `e2e/auth/login.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('User Authentication', () => {
  test('should login with valid credentials', async ({ page }) => {
    await page.goto('http://localhost:3009/login')

    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'ValidPass123!')
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL('http://localhost:3009/dashboard')
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('http://localhost:3009/login')

    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'InvalidPass')
    await page.click('button[type="submit"]')

    await expect(page.locator('.error-message')).toBeVisible()
    await expect(page.locator('.error-message')).toContainText('Invalid credentials')
  })

  test('should handle rate limiting', async ({ page, request }) => {
    // Attempt 6 logins (rate limit is 5)
    for (let i = 0; i < 6; i++) {
      await request.post('http://localhost:3009/api/users/login', {
        data: { email: 'test@example.com', password: 'wrong' },
      })
    }

    // Verify rate limit response on 6th attempt
    const response = await request.post('http://localhost:3009/api/users/login', {
      data: { email: 'test@example.com', password: 'wrong' },
    })

    expect(response.status()).toBe(429)
    expect(response.headers()['retry-after']).toBeDefined()
  })
})
```

---

### Campus Student Flow (2h)

**Test File:** `e2e/campus/course-enrollment.spec.ts`

```typescript
test.describe('Campus Student Flow', () => {
  test('should enroll in course', async ({ page }) => {
    await page.goto('http://localhost:3005/campus/login')

    await page.fill('input[name="email"]', 'student@example.com')
    await page.fill('input[name="password"]', 'ValidPass123!')
    await page.click('button[type="submit"]')

    await page.goto('http://localhost:3005/campus/courses')
    await page.click('.course-card:has-text("Curso de Ejemplo")')

    await page.click('button:has-text("Inscribirse")')

    await expect(page.locator('.success-message')).toBeVisible()
    await expect(page.locator('.my-courses')).toContainText('Curso de Ejemplo')
  })

  test('should access enrolled course content', async ({ page }) => {
    await page.goto('http://localhost:3005/campus/login')
    await page.fill('input[name="email"]', 'student@example.com')
    await page.fill('input[name="password"]', 'ValidPass123!')
    await page.click('button[type="submit"]')

    await page.goto('http://localhost:3005/campus/my-courses')
    await page.click('.course-card:has-text("Curso de Ejemplo")')

    await expect(page.locator('.video-player')).toBeVisible()
    await expect(page.locator('.progress-bar')).toHaveAttribute('aria-valuenow', '25')
  })
})
```

---

### Admin Tenant Management Flow (2h)

**Test File:** `e2e/admin/tenant-management.spec.ts`

```typescript
test.describe('Admin Tenant Management', () => {
  test('should create new tenant', async ({ page }) => {
    await page.goto('http://localhost:3004/admin/login')

    await page.fill('input[name="email"]', 'admin@akademate.com')
    await page.fill('input[name="password"]', 'AdminPass123!')
    await page.click('button[type="submit"]')

    await page.click('a:has-text("Tenants")')
    await page.click('button:has-text("Create Tenant")')

    await page.fill('input[name="name"]', 'Academia de Prueba')
    await page.fill('input[name="domain"]', 'prueba.akademate.com')
    await page.fill('input[name="email"]', 'admin@prueba.akademate.com')

    await page.click('button:has-text("Create")')

    await expect(page.locator('.success-toast')).toBeVisible()
    await expect(page.locator('table')).toContainText('Academia de Prueba')
  })

  test('should configure tenant branding', async ({ page }) => {
    await page.goto('http://localhost:3004/admin/login')
    // ... login steps ...

    await page.click('a:has-text("Tenants")')
    await page.click('button:has-text("Edit")')

    await page.click('a:has-text("Branding")')

    await page.fill('input[type="color"]', '#FF0000')
    await page.fill('input[name="logo"]', 'logo.png')

    await page.click('button:has-text("Save")')

    await expect(page.locator('.success-toast')).toBeVisible()
  })
})
```

---

### Payment Flow (2h)

**Test File:** `e2e/payment/subscription.spec.ts`

```typescript
test.describe('Payment Flow', () => {
  test('should complete subscription purchase', async ({ page }) => {
    await page.goto('http://localhost:3009/settings/subscription')

    await page.click('button:has-text("Upgrade to Pro")')

    // Stripe checkout opens
    await page.waitForURL('https://checkout.stripe.com/*')

    // Use test card
    await page.fill('[name="cardNumber"]', '4242424242424242')
    await page.fill('[name="expMonth"]', '12')
    await page.fill('[name="expYear"]', '34')
    await page.fill('[name="cvc"]', '123')

    await page.click('button[type="submit"]')

    await expect(page).toHaveURL('http://localhost:3009/settings/subscription?status=success')
  })

  test('should handle payment failure', async ({ page, request }) => {
    await page.goto('http://localhost:3009/settings/subscription')

    // Mock Stripe response
    await page.route('**/api/stripe/create-checkout-session', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ url: 'https://checkout.stripe.com/test' }),
      })
    })

    await page.click('button:has-text("Upgrade to Pro")')

    await page.fill('[name="cardNumber"]', '4000000000009995') // Declined card

    await page.click('button[type="submit"]')

    await expect(page.locator('.error-message')).toBeVisible()
    await expect(page.locator('.error-message')).toContainText('Payment declined')
  })
})
```

---

### GDPR Data Export Flow (2h)

**Test File:** `e2e/gdpr/data-export.spec.ts`

```typescript
test.describe('GDPR Data Export', () => {
  test('should export user data', async ({ page, request }) => {
    await page.goto('http://localhost:3009/settings/privacy')

    await page.click('button:has-text("Export My Data")')

    await expect(page.locator('.loading-spinner')).toBeVisible()

    // Poll for export completion
    await page.waitForSelector('.download-ready', { timeout: 30000 })

    await page.click('button:has-text("Download")')

    const download = await page.waitForEvent('download')

    expect(download.suggestedFilename()).toMatch(/^data-export-.*\.json$/)

    const data = JSON.parse(await download.text())
    expect(data.user).toBeDefined()
    expect(data.enrollments).toBeDefined()
  })

  test('should only allow users to export own data', async ({ page }) => {
    // Login as regular user
    await page.goto('http://localhost:3009/login')
    await page.fill('input[name="email"]', 'user@example.com')
    await page.fill('input[name="password"]', 'ValidPass123!')
    await page.click('button[type="submit"]')

    // Try to export admin user data (should fail)
    const response = await request.get('http://localhost:3009/api/gdpr/admin-user-id/export')
    expect(response.status()).toBe(403)
  })
})
```

---

## Configuration Required

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
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
})
```

---

## Package.json Scripts to Add

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "playwright test --debug"
  }
}
```

---

## Estimated Effort

| Scenario          | Est. Time | Priority |
| ----------------- | --------- | -------- |
| Auth Flow         | 2h        | P1       |
| Campus Flow       | 2h        | P1       |
| Tenant Management | 2h        | P1       |
| Payment Flow      | 2h        | P1       |
| GDPR Export       | 2h        | P2       |
| Config + Setup    | 2h        | P1       |
| **Total**         | **14h**   | -        |

**Original estimate:** 12h (underestimated by 2h)

---

## Success Criteria

- [ ] All critical user paths have E2E coverage
- [ ] Tests run in CI/CD pipeline
- [ ] Screenshots/videos captured on failure
- [ ] Test results uploaded as artifacts
- [ ] Coverage report generated
- [ ] All tests pass (0 failures)

---

## Dependencies

- ✅ Playwright dependency exists
- ⚠️ playwright.config.ts needs creation
- ⚠️ E2E test directory structure needed
- ⚠️ Test data/fixtures needed
- ⚠️ Mock services for external APIs (Stripe, email)

---

## Next Steps

1. **Create playwright.config.ts** (30 min)
2. **Setup e2e directory structure** (30 min)
3. **Implement Auth Flow tests** (2h)
4. **Implement Campus Flow tests** (2h)
5. **Implement Tenant Management tests** (2h)
6. **Implement Payment Flow tests** (2h)
7. **Implement GDPR Export tests** (2h)
8. **Add scripts to package.json** (15 min)
9. **Run tests locally** (1h)
10. **Integrate in CI** (30 min)

---

**Documented by:** Ralph-Wiggum (Eco-Sigma)
**Status:** Ready for implementation
**Est. Remaining:** 14 hours
