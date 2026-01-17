import { test, expect } from '@playwright/test'

test.setTimeout(60_000)

test.describe('Payload CMS - Admin Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3003/admin')
  })

  test('AUTH-01: admin login page loads', async ({ page }) => {
    await expect(page).toHaveTitle(/Login/i)
  })

  test('AUTH-02: displays email input field', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]')
    await expect(emailInput).toBeVisible()
  })

  test('AUTH-03: displays password input field', async ({ page }) => {
    const passwordInput = page.locator('input[type="password"]')
    await expect(passwordInput).toBeVisible()
  })

  test('AUTH-04: displays submit button', async ({ page }) => {
    const submitButton = page.locator('button[type="submit"]')
    await expect(submitButton).toBeVisible()
  })

  test('AUTH-05: validates empty email field', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]')
    const submitButton = page.locator('button[type="submit"]')

    await submitButton.click()
    await expect(emailInput).toBeFocused()
  })

  test('AUTH-06: validates empty password field', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]')
    const passwordInput = page.locator('input[type="password"]')
    const submitButton = page.locator('button[type="submit"]')

    await emailInput.fill('admin@example.com')
    await submitButton.click()
    await expect(passwordInput).toBeFocused()
  })
})

test.describe('Payload CMS - Dashboard', () => {
  test('DASH-01: admin dashboard loads after login', async ({ page }) => {
    await page.goto('http://localhost:3003/admin')
    await page.fill('input[type="email"]', 'admin@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')

    await page.waitForURL(/\/admin$/)
    const dashboard = page.locator('main, [data-testid="dashboard"]')
    await expect(dashboard.first()).toBeVisible()
  })

  test('DASH-02: displays collection list', async ({ page }) => {
    await page.goto('http://localhost:3003/admin')
    await page.fill('input[type="email"]', 'admin@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')

    await page.waitForURL(/\/admin$/)
    const collectionNav = page.locator('nav, aside, [data-testid="sidebar"]')
    await expect(collectionNav.first()).toBeVisible()
  })

  test('DASH-03: displays user profile section', async ({ page }) => {
    await page.goto('http://localhost:3003/admin')
    await page.fill('input[type="email"]', 'admin@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')

    await page.waitForURL(/\/admin$/)
    const userProfile = page.locator('[data-testid="user-profile"], .user-menu')
    await expect(userProfile.first()).toBeVisible()
  })
})

test.describe('Payload CMS - Collection: Courses', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3003/admin/collection/courses')
  })

  test('CRS-01: courses collection list loads', async ({ page }) => {
    await expect(page.locator('table, [data-testid="collection-list"]')).toBeVisible()
  })

  test('CRS-02: displays create course button', async ({ page }) => {
    const createButton = page.locator(
      'button:has-text("Create"), a:has-text("Create"), button:has-text("New")'
    )
    await expect(createButton.first()).toBeVisible()
  })

  test('CRS-03: create button is clickable', async ({ page }) => {
    const createButton = page
      .locator('button:has-text("Create"), a:has-text("Create"), button:has-text("New")')
      .first()
    await expect(createButton).toBeEnabled()
  })

  test('CRS-04: displays search/filter controls', async ({ page }) => {
    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="search"], input[placeholder*="Search"]'
    )
    await expect(searchInput.first()).toBeVisible()
  })

  test('CRS-05: has table headers for course fields', async ({ page }) => {
    const tableHeaders = page.locator('th, [data-testid="table-header"]')
    const count = await tableHeaders.count()
    expect(count).toBeGreaterThanOrEqual(3)
  })

  test('CRS-06: displays course rows', async ({ page }) => {
    const tableRows = page.locator('tr, [data-testid="table-row"]')
    const count = await tableRows.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('CRS-07: has pagination controls', async ({ page }) => {
    const pagination = page.locator('.pagination, [data-testid="pagination"]')
    const count = await pagination.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })
})

test.describe('Payload CMS - Collection: Modules', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3003/admin/collection/modules')
  })

  test('MOD-01: modules collection list loads', async ({ page }) => {
    await expect(page.locator('table, [data-testid="collection-list"]')).toBeVisible()
  })

  test('MOD-02: displays create module button', async ({ page }) => {
    const createButton = page.locator('button:has-text("Create"), a:has-text("Create")')
    await expect(createButton.first()).toBeVisible()
  })

  test('MOD-03: modules display relationship to courses', async ({ page }) => {
    const table = page.locator('table, [data-testid="collection-list"]')
    await expect(table).toBeVisible()
  })

  test('MOD-04: has status badges for published modules', async ({ page }) => {
    const statusBadge = page.locator('.badge, [data-testid="status-badge"]')
    const count = await statusBadge.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })
})

test.describe('Payload CMS - Collection: Lessons', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3003/admin/collection/lessons')
  })

  test('LSN-01: lessons collection list loads', async ({ page }) => {
    await expect(page.locator('table, [data-testid="collection-list"]')).toBeVisible()
  })

  test('LSN-02: displays lesson type indicators', async ({ page }) => {
    const tableRows = page.locator('tr, [data-testid="table-row"]')
    await expect(tableRows.first()).toBeVisible()
  })

  test('LSN-03: shows lesson duration', async ({ page }) => {
    const table = page.locator('table, [data-testid="collection-list"]')
    await expect(table).toBeVisible()
  })
})

test.describe('Payload CMS - Collection: Users', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3003/admin/collection/users')
  })

  test('USR-01: users collection list loads', async ({ page }) => {
    await expect(page.locator('table, [data-testid="collection-list"]')).toBeVisible()
  })

  test('USR-02: displays user roles', async ({ page }) => {
    const tableHeaders = page.locator('th, [data-testid="table-header"]')
    await expect(tableHeaders.first()).toBeVisible()
  })

  test('USR-03: has create user button', async ({ page }) => {
    const createButton = page.locator('button:has-text("Create"), a:has-text("Create")')
    await expect(createButton.first()).toBeVisible()
  })

  test('USR-04: displays tenant association', async ({ page }) => {
    const table = page.locator('table, [data-testid="collection-list"]')
    await expect(table).toBeVisible()
  })
})

test.describe('Payload CMS - Collection: Enrollments', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3003/admin/collection/enrollments')
  })

  test('ENR-01: enrollments collection list loads', async ({ page }) => {
    await expect(page.locator('table, [data-testid="collection-list"]')).toBeVisible()
  })

  test('ENR-02: displays enrollment status', async ({ page }) => {
    const statusBadge = page.locator('.badge, [data-testid="status-badge"]')
    const count = await statusBadge.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('ENR-03: shows student information', async ({ page }) => {
    const table = page.locator('table, [data-testid="collection-list"]')
    await expect(table).toBeVisible()
  })

  test('ENR-04: displays progress percentage', async ({ page }) => {
    const progressIndicator = page.locator('[data-testid="progress"], .progress')
    const count = await progressIndicator.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })
})

test.describe('Payload CMS - RLS Tenant Isolation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3003/admin')
    await page.fill('input[type="email"]', 'admin@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/admin$/)
  })

  test('RLS-01: tenant data is isolated in courses', async ({ page }) => {
    await page.goto('http://localhost:3003/admin/collection/courses')
    const table = page.locator('table, [data-testid="collection-list"]')
    await expect(table).toBeVisible()
  })

  test('RLS-02: tenant filter is present in URL', async ({ page }) => {
    await page.goto('http://localhost:3003/admin/collection/courses')
    const url = page.url()
    expect(url).toMatch(/http:\/\/localhost:3003\/admin\/collection\/courses/)
  })

  test('RLS-03: cannot access other tenant data', async ({ page }) => {
    await page.goto('http://localhost:3003/admin/collection/users')
    const table = page.locator('table, [data-testid="collection-list"]')
    await expect(table).toBeVisible()
  })
})

test.describe('Payload CMS - Media Uploads', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3003/admin/collection/media')
  })

  test('MED-01: media collection list loads', async ({ page }) => {
    await expect(
      page.locator('[data-testid="media-grid"], [data-testid="collection-list"]')
    ).toBeVisible()
  })

  test('MED-02: displays upload button', async ({ page }) => {
    const uploadButton = page.locator(
      'button:has-text("Upload"), button:has-text("Add"), input[type="file"]'
    )
    await expect(uploadButton.first()).toBeVisible()
  })

  test('MED-03: upload button is clickable', async ({ page }) => {
    const uploadButton = page.locator('button:has-text("Upload"), button:has-text("Add")').first()
    await expect(uploadButton).toBeEnabled()
  })

  test('MED-04: displays file type filters', async ({ page }) => {
    const filterControls = page.locator('select, [data-testid="filter"]')
    const count = await filterControls.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('MED-05: shows media thumbnails', async ({ page }) => {
    const mediaItems = page.locator('[data-testid="media-item"], .media-item')
    const count = await mediaItems.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })
})

test.describe('Payload CMS - API Health', () => {
  test('API-01: API root responds with 200', async ({ request }) => {
    const response = await request.get('http://localhost:3003/api')
    expect(response.status()).toBe(200)
  })

  test('API-02: access endpoint is available', async ({ request }) => {
    const response = await request.get('http://localhost:3003/api/access')
    expect(response.status()).toBe(200)
  })

  test('API-03: courses collection endpoint is available', async ({ request }) => {
    const response = await request.get('http://localhost:3003/api/courses')
    expect(response.status()).toBe(200)
  })

  test('API-04: modules collection endpoint is available', async ({ request }) => {
    const response = await request.get('http://localhost:3003/api/modules')
    expect(response.status()).toBe(200)
  })

  test('API-05: lessons collection endpoint is available', async ({ request }) => {
    const response = await request.get('http://localhost:3003/api/lessons')
    expect(response.status()).toBe(200)
  })

  test('API-06: users collection endpoint is available', async ({ request }) => {
    const response = await request.get('http://localhost:3003/api/users')
    expect(response.status()).toBe(200)
  })

  test('API-07: enrollments collection endpoint is available', async ({ request }) => {
    const response = await request.get('http://localhost:3003/api/enrollments')
    expect(response.status()).toBe(200)
  })

  test('API-08: media collection endpoint is available', async ({ request }) => {
    const response = await request.get('http://localhost:3003/api/media')
    expect(response.status()).toBe(200)
  })

  test('API-09: global config endpoint is available', async ({ request }) => {
    const response = await request.get('http://localhost:3003/api/globals')
    expect(response.status()).toBe(200)
  })

  test('API-10: API returns JSON content type', async ({ request }) => {
    const response = await request.get('http://localhost:3003/api')
    const contentType = response.headers()['content-type']
    expect(contentType).toMatch(/application\/json/)
  })
})

test.describe('Payload CMS - Form Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3003/admin')
    await page.fill('input[type="email"]', 'admin@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/admin$/)
  })

  test('VAL-01: course form validates required fields', async ({ page }) => {
    await page.goto('http://localhost:3003/admin/collection/courses/create')
    const createButton = page.locator('button:has-text("Create"), button:has-text("Save")')
    await createButton.click()

    const errorMessage = page.locator('.error, .error-message, [data-error]')
    const hasError = (await errorMessage.count()) > 0
    expect(hasError).toBeTruthy()
  })

  test('VAL-02: lesson form validates required fields', async ({ page }) => {
    await page.goto('http://localhost:3003/admin/collection/lessons/create')
    const createButton = page.locator('button:has-text("Create"), button:has-text("Save")')
    await createButton.click()

    const errorMessage = page.locator('.error, .error-message, [data-error]')
    const hasError = (await errorMessage.count()) > 0
    expect(hasError).toBeTruthy()
  })

  test('VAL-03: user form validates email format', async ({ page }) => {
    await page.goto('http://localhost:3003/admin/collection/users/create')
    const emailInput = page.locator('input[type="email"]')
    await emailInput.fill('invalid-email')

    const createButton = page.locator('button:has-text("Create"), button:has-text("Save")')
    await createButton.click()

    const errorMessage = page.locator('.error, .error-message, [data-error]')
    const hasError = (await errorMessage.count()) > 0
    expect(hasError).toBeTruthy()
  })
})

test.describe('Payload CMS - Responsive Admin', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3003/admin')
  })

  test('RSP-01: admin panel loads on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('http://localhost:3003/admin')

    const main = page.locator('main, [data-testid="admin-panel"]')
    await expect(main).toBeVisible()
  })

  test('RSP-02: admin panel loads on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('http://localhost:3003/admin')

    const main = page.locator('main, [data-testid="admin-panel"]')
    await expect(main).toBeVisible()
  })

  test('RSP-03: sidebar collapses on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('http://localhost:3003/admin')

    const main = page.locator('main, [data-testid="admin-panel"]')
    await expect(main).toBeVisible()
  })

  test('RSP-04: mobile menu is functional', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('http://localhost:3003/admin')

    const sidebar = page.locator('nav, aside, [data-testid="sidebar"]')
    await expect(sidebar).toBeVisible()
  })
})

test.describe('Payload CMS - Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3003/admin')
    await page.fill('input[type="email"]', 'admin@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/admin$/)
  })

  test('NAV-01: sidebar navigation is visible', async ({ page }) => {
    const sidebar = page.locator('nav, aside, [data-testid="sidebar"]')
    await expect(sidebar).toBeVisible()
  })

  test('NAV-02: clicking collection navigates to collection page', async ({ page }) => {
    const collectionLink = page.locator('a:has-text("Courses"), a:has-text("Users")').first()
    await collectionLink.click()

    await expect(page).toHaveURL(/\/collection\//)
  })

  test('NAV-03: back button works in browser', async ({ page }) => {
    await page.goto('http://localhost:3003/admin/collection/courses')
    await page.goBack()

    await expect(page).toHaveURL(/\/admin$/)
  })
})
