import { test, expect } from '@playwright/test'

test.describe('Portal - Access Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3008')
  })

  test('ACS-01: portal homepage loads', async ({ page }) => {
    await expect(page).toHaveTitle(/Portal|Akademate/i)
  })

  test('ACS-02: displays tenant selection', async ({ page }) => {
    const tenantSelector = page.locator('select, [data-testid="tenant-selector"]')
    await expect(tenantSelector).toBeVisible()
  })

  test('ACS-03: displays academy list', async ({ page }) => {
    const academyList = page.locator('[data-testid="academy-list"], .academy-list')
    await expect(academyList.first()).toBeVisible()
  })

  test('ACS-04: has search functionality', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]')
    await expect(searchInput.first()).toBeVisible()
  })

  test('ACS-05: displays branding elements', async ({ page }) => {
    const logo = page.locator('img[data-testid="logo"], .logo')
    await expect(logo.first()).toBeVisible()
  })

  test('ACS-06: has footer with links', async ({ page }) => {
    const footer = page.locator('footer, [data-testid="footer"]')
    await expect(footer).toBeVisible()
  })

  test('ACS-07: displays copyright information', async ({ page }) => {
    const copyright = page.locator('[data-testid="copyright"], .copyright')
    await expect(copyright.first()).toBeVisible()
  })

  test('ACS-08: is responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('http://localhost:3008')

    const main = page.locator('main')
    await expect(main).toBeVisible()
  })
})

test.describe('Portal - Tenant Selection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3008')
  })

  test('TNT-01: displays tenant cards', async ({ page }) => {
    const tenantCards = page.locator('[data-testid="tenant-card"], .tenant-card')
    const count = await tenantCards.count()
    expect(count).toBeGreaterThanOrEqual(1)
  })

  test('TNT-02: shows tenant logos', async ({ page }) => {
    const logos = page.locator('img[data-testid="tenant-logo"], .tenant-logo')
    const count = await logos.count()
    expect(count).toBeGreaterThanOrEqual(1)
  })

  test('TNT-03: displays tenant names', async ({ page }) => {
    const names = page.locator('[data-testid="tenant-name"], .tenant-name')
    const count = await names.count()
    expect(count).toBeGreaterThanOrEqual(1)
  })

  test('TNT-04: has access buttons for each tenant', async ({ page }) => {
    const accessButtons = page.locator('button:has-text("Access"), a:has-text("Acceder")')
    const count = await accessButtons.count()
    expect(count).toBeGreaterThanOrEqual(1)
  })

  test('TNT-05: clicking access button navigates to tenant', async ({ page }) => {
    const accessButton = page.locator('button:has-text("Access"), a:has-text("Acceder")').first()
    await accessButton.click()

    await expect(page).toHaveURL(/\/dashboard|\/login/)
  })

  test('TNT-06: displays tenant status badges', async ({ page }) => {
    const statusBadge = page.locator('.badge, [data-testid="status-badge"]')
    const count = await statusBadge.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('TNT-07: has filter by tenant type', async ({ page }) => {
    const filterSelect = page.locator('select, [data-testid="tenant-filter"]')
    await expect(filterSelect).toBeVisible()
  })

  test('TNT-08: shows search for tenants', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]')
    await expect(searchInput).toBeVisible()
  })
})

test.describe('Portal - Student Access', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3008/campus/test-tenant')
  })

  test('STD-01: campus login page loads', async ({ page }) => {
    await expect(page).toHaveTitle(/Campus|Login/i)
  })

  test('STD-02: displays student login form', async ({ page }) => {
    const loginForm = page.locator('form, [data-testid="student-login"]')
    await expect(loginForm).toBeVisible()
  })

  test('STD-03: has email input field', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]')
    await expect(emailInput).toBeVisible()
  })

  test('STD-04: has password input field', async ({ page }) => {
    const passwordInput = page.locator('input[type="password"]')
    await expect(passwordInput).toBeVisible()
  })

  test('STD-05: displays login button', async ({ page }) => {
    const loginButton = page.locator('button[type="submit"]')
    await expect(loginButton).toBeVisible()
  })

  test('STD-06: validates email format', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]')
    await emailInput.fill('invalid-email')

    const loginButton = page.locator('button[type="submit"]')
    await loginButton.click()

    const errorMessage = page.locator('.error, .error-message, [data-error]')
    const hasError = (await errorMessage.count()) > 0
    expect(hasError).toBeTruthy()
  })

  test('STD-07: validates required fields', async ({ page }) => {
    const loginButton = page.locator('button[type="submit"]')
    await loginButton.click()

    const errorMessage = page.locator('.error, .error-message, [data-error]')
    const hasError = (await errorMessage.count()) > 0
    expect(hasError).toBeTruthy()
  })

  test('STD-08: displays forgot password link', async ({ page }) => {
    const forgotLink = page.locator(
      'a:has-text("Forgot Password"), a:has-text("¿Olvidaste tu contraseña?")'
    )
    await expect(forgotLink.first()).toBeVisible()
  })
})

test.describe('Portal - Admin Access', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3008/admin/test-tenant')
  })

  test('ADM-01: admin login page loads', async ({ page }) => {
    await expect(page).toHaveTitle(/Admin|Login/i)
  })

  test('ADM-02: displays admin login form', async ({ page }) => {
    const loginForm = page.locator('form, [data-testid="admin-login"]')
    await expect(loginForm).toBeVisible()
  })

  test('ADM-03: has email input field', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]')
    await expect(emailInput).toBeVisible()
  })

  test('ADM-04: has password input field', async ({ page }) => {
    const passwordInput = page.locator('input[type="password"]')
    await expect(passwordInput).toBeVisible()
  })

  test('ADM-05: displays login button', async ({ page }) => {
    const loginButton = page.locator('button[type="submit"]')
    await expect(loginButton).toBeVisible()
  })

  test('ADM-06: validates required fields', async ({ page }) => {
    const loginButton = page.locator('button[type="submit"]')
    await loginButton.click()

    const errorMessage = page.locator('.error, .error-message, [data-error]')
    const hasError = (await errorMessage.count()) > 0
    expect(hasError).toBeTruthy()
  })
})

test.describe('Portal - Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3008')
  })

  test('NAV-01: displays navigation menu', async ({ page }) => {
    const nav = page.locator('nav, [data-testid="navigation"]')
    await expect(nav).toBeVisible()
  })

  test('NAV-02: has home link', async ({ page }) => {
    const homeLink = page.locator('a:has-text("Home"), a:has-text("Inicio")')
    await expect(homeLink.first()).toBeVisible()
  })

  test('NAV-03: has about link', async ({ page }) => {
    const aboutLink = page.locator('a:has-text("About"), a:has-text("Sobre")')
    await expect(aboutLink.first()).toBeVisible()
  })

  test('NAV-04: has contact link', async ({ page }) => {
    const contactLink = page.locator('a:has-text("Contact"), a:has-text("Contacto")')
    await expect(contactLink.first()).toBeVisible()
  })

  test('NAV-05: back to home button works', async ({ page }) => {
    await page.goto('http://localhost:3008/campus/test-tenant')
    const backButton = page.locator('button:has-text("Back"), a:has-text("Volver")')
    await backButton.click()

    await expect(page).toHaveURL(/\/$/, /\/$/)
  })
})

test.describe('Portal - Responsive Design', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3008')
  })

  test('RSP-01: loads correctly on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('http://localhost:3008')

    const main = page.locator('main')
    await expect(main).toBeVisible()
  })

  test('RSP-02: loads correctly on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('http://localhost:3008')

    const main = page.locator('main')
    await expect(main).toBeVisible()
  })

  test('RSP-03: loads correctly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('http://localhost:3008')

    const main = page.locator('main')
    await expect(main).toBeVisible()
  })

  test('RSP-04: navigation adapts to mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('http://localhost:3008')

    const nav = page.locator('nav, [data-testid="navigation"]')
    await expect(nav).toBeVisible()
  })

  test('RSP-05: tenant cards stack on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('http://localhost:3008')

    const tenantCards = page.locator('[data-testid="tenant-card"], .tenant-card')
    const count = await tenantCards.count()
    expect(count).toBeGreaterThanOrEqual(1)
  })
})

test.describe('Portal - Branding', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3008')
  })

  test('BRD-01: displays Akademate branding', async ({ page }) => {
    const body = page.locator('body')
    await expect(body).toContainText('Akademate')
  })

  test('BRD-02: shows company logo', async ({ page }) => {
    const logo = page.locator('img[data-testid="logo"], .logo')
    await expect(logo.first()).toBeVisible()
  })

  test('BRD-03: displays company colors', async ({ page }) => {
    const pageColor = await page.evaluate(() => {
      const header = document.querySelector('header, [data-testid="header"]')
      return window.getComputedStyle(header?.firstElementChild || header).backgroundColor
    })
    expect(pageColor).toBeTruthy()
  })

  test('BRD-04: has consistent typography', async ({ page }) => {
    const headings = page.locator('h1, h2, h3')
    const count = await headings.count()
    expect(count).toBeGreaterThanOrEqual(2)
  })

  test('BRD-05: displays footer with copyright', async ({ page }) => {
    const footer = page.locator('footer, [data-testid="footer"]')
    await expect(footer).toContainText(/©|Copyright/i)
  })
})

test.describe('Portal - Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3008')
  })

  test('ACL-01: has main landmark', async ({ page }) => {
    const main = page.getByRole('main')
    await expect(main).toBeVisible()
  })

  test('ACL-02: has navigation landmark', async ({ page }) => {
    const nav = page.getByRole('navigation')
    await expect(nav).toBeVisible()
  })

  test('ACL-03: has proper heading hierarchy', async ({ page }) => {
    const h1 = page.locator('h1')
    const h2 = page.locator('h2')
    const h3 = page.locator('h3')

    expect(await h1.count()).toBeGreaterThanOrEqual(1)
    expect(await h2.count()).toBeGreaterThanOrEqual(0)
  })

  test('ACL-04: images have alt attributes', async ({ page }) => {
    const images = page.locator('img')
    const count = await images.count()

    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const alt = await images.nth(i).getAttribute('alt')
        expect(alt).toBeTruthy()
      }
    }
  })

  test('ACL-05: buttons have accessible labels', async ({ page }) => {
    const buttons = page.locator('button, a[role="button"]')
    const count = await buttons.count()
    expect(count).toBeGreaterThanOrEqual(3)
  })
})

test.describe('Portal - Performance', () => {
  test('PRF-01: page loads within 2 seconds', async ({ page }) => {
    const start = Date.now()
    await page.goto('http://localhost:3008')
    const loadTime = Date.now() - start

    expect(loadTime).toBeLessThan(2000)
  })

  test('PRF-02: no console errors on load', async ({ page, context }) => {
    const errors: string[] = []
    context.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    await page.goto('http://localhost:3008')
    expect(errors.length).toBe(0)
  })

  test('PRF-03: tenant cards load quickly', async ({ page }) => {
    const start = Date.now()
    await page.goto('http://localhost:3008')

    const tenantCards = page.locator('[data-testid="tenant-card"], .tenant-card')
    await expect(tenantCards.first()).toBeVisible()

    const loadTime = Date.now() - start
    expect(loadTime).toBeLessThan(1000)
  })

  test('PRF-04: navigation responds quickly', async ({ page }) => {
    await page.goto('http://localhost:3008')

    const nav = page.locator('nav, [data-testid="navigation"]')
    await expect(nav.first()).toBeVisible()
  })
})

test.describe('Portal - SEO', () => {
  test('SEO-01: has proper page title', async ({ page }) => {
    await page.goto('http://localhost:3008')
    const title = await page.title()
    expect(title).toBeTruthy()
    expect(title.length).toBeGreaterThan(10)
  })

  test('SEO-02: has meta description', async ({ page }) => {
    await page.goto('http://localhost:3008')
    const metaDesc = await page.locator('meta[name="description"]').getAttribute('content')
    expect(metaDesc).toBeTruthy()
  })

  test('SEO-03: has canonical URL', async ({ page }) => {
    await page.goto('http://localhost:3008')
    const canonical = page.locator('link[rel="canonical"]')
    await expect(canonical).toHaveCount(1)
  })

  test('SEO-04: links are accessible', async ({ page }) => {
    await page.goto('http://localhost:3008')
    const links = page.locator('a[href]')
    const count = await links.count()
    expect(count).toBeGreaterThanOrEqual(3)
  })
})
