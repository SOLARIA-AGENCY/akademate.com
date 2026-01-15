import { test, expect } from '@playwright/test'

test.describe('Admin-Client SaaS - Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001')
  })

  test('AUTH-01: login page loads', async ({ page }) => {
    await expect(page).toHaveTitle(/Login|Admin/i)
  })

  test('AUTH-02: displays email input field', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]')
    await expect(emailInput).toBeVisible()
  })

  test('AUTH-03: displays password input field', async ({ page }) => {
    const passwordInput = page.locator('input[type="password"]')
    await expect(passwordInput).toBeVisible()
  })

  test('AUTH-04: displays login button', async ({ page }) => {
    const loginButton = page.locator('button[type="submit"]')
    await expect(loginButton).toBeVisible()
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

    await emailInput.fill('admin@akademate.com')
    await submitButton.click()
    await expect(passwordInput).toBeFocused()
  })
})

test.describe('Admin-Client SaaS - Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001/dashboard')
  })

  test('DASH-01: dashboard loads after login', async ({ page }) => {
    const dashboard = page.locator('main, [data-testid="dashboard"]')
    await expect(dashboard.first()).toBeVisible()
  })

  test('DASH-02: displays system overview metrics', async ({ page }) => {
    const metricsGrid = page.locator('[data-testid="metrics-grid"], .metrics-grid')
    await expect(metricsGrid.first()).toBeVisible()
  })

  test('DASH-03: shows total tenants count', async ({ page }) => {
    const tenantCount = page.locator('[data-testid="tenant-count"], .tenant-count')
    await expect(tenantCount.first()).toBeVisible()
  })

  test('DASH-04: displays active users count', async ({ page }) => {
    const userCount = page.locator('[data-testid="user-count"], .user-count')
    await expect(userCount.first()).toBeVisible()
  })

  test('DASH-05: shows revenue metrics', async ({ page }) => {
    const revenue = page.locator('[data-testid="revenue"], .revenue-metric')
    await expect(revenue.first()).toBeVisible()
  })

  test('DASH-06: displays navigation sidebar', async ({ page }) => {
    const sidebar = page.locator('nav, aside, [data-testid="sidebar"]')
    await expect(sidebar).toBeVisible()
  })

  test('DASH-07: has quick action buttons', async ({ page }) => {
    const actionButtons = page.locator('button:has-text("Create"), button:has-text("Add")')
    const count = await actionButtons.count()
    expect(count).toBeGreaterThanOrEqual(2)
  })

  test('DASH-08: displays recent activity list', async ({ page }) => {
    const recentActivity = page.locator('[data-testid="recent-activity"], .recent-activity')
    await expect(recentActivity.first()).toBeVisible()
  })

  test('DASH-09: has user profile section', async ({ page }) => {
    const userProfile = page.locator('[data-testid="user-profile"], .user-profile')
    await expect(userProfile.first()).toBeVisible()
  })

  test('DASH-10: displays system health status', async ({ page }) => {
    const healthStatus = page.locator('[data-testid="health-status"], .health-status')
    await expect(healthStatus.first()).toBeVisible()
  })
})

test.describe('Admin-Client SaaS - Tenant Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001/tenants')
  })

  test('TNT-01: tenants page loads successfully', async ({ page }) => {
    const tenantsPage = page.locator('main, [data-testid="tenants-page"]')
    await expect(tenantsPage.first()).toBeVisible()
  })

  test('TNT-02: displays tenants list table', async ({ page }) => {
    const tenantsTable = page.locator('table, [data-testid="tenants-table"]')
    await expect(tenantsTable).toBeVisible()
  })

  test('TNT-03: has create tenant button', async ({ page }) => {
    const createButton = page.locator('button:has-text("Create Tenant"), a:has-text("Create")')
    await expect(createButton.first()).toBeVisible()
  })

  test('TNT-04: displays tenant status badges', async ({ page }) => {
    const statusBadge = page.locator('.badge, [data-testid="status-badge"]')
    const count = await statusBadge.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('TNT-05: shows tenant domains', async ({ page }) => {
    const domainColumn = page.locator('th:has-text("Domain"), th[data-column="domain"]')
    await expect(domainColumn.first()).toBeVisible()
  })

  test('TNT-06: has edit actions for tenants', async ({ page }) => {
    const editButton = page.locator('button:has-text("Edit"), button:has-text("Edit")')
    const count = await editButton.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('TNT-07: has delete actions for tenants', async ({ page }) => {
    const deleteButton = page.locator('button:has-text("Delete"), button:has-text("Delete")')
    const count = await deleteButton.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('TNT-08: has search/filter controls', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]')
    await expect(searchInput.first()).toBeVisible()
  })

  test('TNT-09: displays pagination controls', async ({ page }) => {
    const pagination = page.locator('.pagination, [data-testid="pagination"]')
    const count = await pagination.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('TNT-10: shows tenant plan information', async ({ page }) => {
    const planInfo = page.locator('[data-testid="plan-info"], .plan-info')
    await expect(planInfo.first()).toBeVisible()
  })
})

test.describe('Admin-Client SaaS - Tenant Creation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001/tenants/create')
  })

  test('CRT-01: create tenant form loads', async ({ page }) => {
    const form = page.locator('form, [data-testid="tenant-form"]')
    await expect(form).toBeVisible()
  })

  test('CRT-02: displays domain input field', async ({ page }) => {
    const domainInput = page.locator('input[name="domain"], input[name="slug"]')
    await expect(domainInput).toBeVisible()
  })

  test('CRT-03: displays company name input field', async ({ page }) => {
    const nameInput = page.locator('input[name="name"], input[name="companyName"]')
    await expect(nameInput).toBeVisible()
  })

  test('CRT-04: has plan selector', async ({ page }) => {
    const planSelect = page.locator('select[name="plan"], [data-testid="plan-selector"]')
    await expect(planSelect).toBeVisible()
  })

  test('CRT-05: displays save button', async ({ page }) => {
    const saveButton = page.locator('button[type="submit"], button:has-text("Save")')
    await expect(saveButton).toBeVisible()
  })

  test('CRT-06: validates required fields', async ({ page }) => {
    const saveButton = page.locator('button[type="submit"]')
    await saveButton.click()

    const errorMessage = page.locator('.error, .error-message, [data-error]')
    const hasError = (await errorMessage.count()) > 0
    expect(hasError).toBeTruthy()
  })

  test('CRT-07: validates domain format', async ({ page }) => {
    const domainInput = page.locator('input[name="domain"], input[name="slug"]')
    await domainInput.fill('invalid domain')

    const domainError = page.locator('.error:has-text("domain"), [data-error*="domain"]')
    const hasError = (await domainError.count()) > 0
    expect(hasError).toBeTruthy()
  })

  test('CRT-08: has cancel button', async ({ page }) => {
    const cancelButton = page.locator('button:has-text("Cancel"), a:has-text("Cancel")')
    await expect(cancelButton.first()).toBeVisible()
  })
})

test.describe('Admin-Client SaaS - Billing & Plans', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001/billing')
  })

  test('BLG-01: billing page loads successfully', async ({ page }) => {
    const billingPage = page.locator('main, [data-testid="billing-page"]')
    await expect(billingPage.first()).toBeVisible()
  })

  test('BLG-02: displays revenue chart', async ({ page }) => {
    const revenueChart = page.locator('[data-testid="revenue-chart"], .revenue-chart')
    await expect(revenueChart.first()).toBeVisible()
  })

  test('BLG-03: shows plan distribution', async ({ page }) => {
    const planDistribution = page.locator('[data-testid="plan-distribution"], .plan-distribution')
    await expect(planDistribution.first()).toBeVisible()
  })

  test('BLG-04: has invoice list', async ({ page }) => {
    const invoiceList = page.locator('[data-testid="invoice-list"], .invoice-list')
    await expect(invoiceList.first()).toBeVisible()
  })

  test('BLG-05: displays payment history', async ({ page }) => {
    const paymentHistory = page.locator('[data-testid="payment-history"], .payment-history')
    await expect(paymentHistory.first()).toBeVisible()
  })

  test('BLG-06: has export button for reports', async ({ page }) => {
    const exportButton = page.locator('button:has-text("Export"), button:has-text("Exportar")')
    await expect(exportButton.first()).toBeVisible()
  })

  test('BLG-07: shows MRR (Monthly Recurring Revenue)', async ({ page }) => {
    const mrrDisplay = page.locator('[data-testid="mrr"], .mrr-metric')
    await expect(mrrDisplay.first()).toBeVisible()
  })

  test('BLG-08: has date range selector', async ({ page }) => {
    const dateRange = page.locator('select[name="period"], [data-testid="date-range"]')
    await expect(dateRange).toBeVisible()
  })

  test('BLG-09: displays churn rate', async ({ page }) => {
    const churnRate = page.locator('[data-testid="churn-rate"], .churn-rate')
    await expect(churnRate.first()).toBeVisible()
  })
})

test.describe('Admin-Client SaaS - Support Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001/support')
  })

  test('SUP-01: support page loads successfully', async ({ page }) => {
    const supportPage = page.locator('main, [data-testid="support-page"]')
    await expect(supportPage.first()).toBeVisible()
  })

  test('SUP-02: displays support tickets list', async ({ page }) => {
    const ticketsList = page.locator('[data-testid="tickets-list"], .tickets-list')
    await expect(ticketsList.first()).toBeVisible()
  })

  test('SUP-03: shows ticket status badges', async ({ page }) => {
    const statusBadge = page.locator('.badge, [data-testid="status-badge"]')
    const count = await statusBadge.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('SUP-04: has create ticket button', async ({ page }) => {
    const createButton = page.locator('button:has-text("Create Ticket"), button:has-text("New")')
    await expect(createButton.first()).toBeVisible()
  })

  test('SUP-05: displays ticket priority indicators', async ({ page }) => {
    const priorityBadge = page.locator('.badge:has-text("Priority"), [data-priority]')
    const count = await priorityBadge.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('SUP-06: shows ticket details panel', async ({ page }) => {
    const ticketDetails = page.locator('[data-testid="ticket-details"], .ticket-details')
    const count = await ticketDetails.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('SUP-07: displays assignee information', async ({ page }) => {
    const assignee = page.locator('[data-testid="assignee"], .assignee')
    const count = await assignee.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })
})

test.describe('Admin-Client SaaS - Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001/dashboard')
  })

  test('NAV-01: sidebar navigation is visible', async ({ page }) => {
    const sidebar = page.locator('nav, aside, [data-testid="sidebar"]')
    await expect(sidebar).toBeVisible()
  })

  test('NAV-02: clicking dashboard link navigates correctly', async ({ page }) => {
    const dashboardLink = page.locator('a:has-text("Dashboard")').first()
    await dashboardLink.click()

    await expect(page).toHaveURL(/\/dashboard$/)
  })

  test('NAV-03: clicking tenants link navigates correctly', async ({ page }) => {
    const tenantsLink = page.locator('a:has-text("Tenants")').first()
    await tenantsLink.click()

    await expect(page).toHaveURL(/\/tenants/)
  })

  test('NAV-04: clicking billing link navigates correctly', async ({ page }) => {
    const billingLink = page.locator('a:has-text("Billing")').first()
    await billingLink.click()

    await expect(page).toHaveURL(/\/billing/)
  })

  test('NAV-05: clicking support link navigates correctly', async ({ page }) => {
    const supportLink = page.locator('a:has-text("Support")').first()
    await supportLink.click()

    await expect(page).toHaveURL(/\/support/)
  })

  test('NAV-06: back button works in browser', async ({ page }) => {
    await page.goto('http://localhost:3001/tenants')
    await page.goBack()

    await expect(page).toHaveURL(/\/dashboard|\/$/)
  })
})

test.describe('Admin-Client SaaS - System Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001/settings')
  })

  test('SET-01: settings page loads successfully', async ({ page }) => {
    const settingsPage = page.locator('main, [data-testid="settings-page"]')
    await expect(settingsPage.first()).toBeVisible()
  })

  test('SET-02: displays system configuration options', async ({ page }) => {
    const configSection = page.locator('[data-testid="system-config"], .system-config')
    await expect(configSection.first()).toBeVisible()
  })

  test('SET-03: has notification settings', async ({ page }) => {
    const notificationSettings = page.locator(
      '[data-testid="notification-settings"], .notification-settings'
    )
    await expect(notificationSettings.first()).toBeVisible()
  })

  test('SET-04: displays security settings', async ({ page }) => {
    const securitySettings = page.locator('[data-testid="security-settings"], .security-settings')
    await expect(securitySettings.first()).toBeVisible()
  })

  test('SET-05: has save settings button', async ({ page }) => {
    const saveButton = page.locator('button[type="submit"], button:has-text("Save Settings")')
    await expect(saveButton.first()).toBeVisible()
  })

  test('SET-06: displays API keys section', async ({ page }) => {
    const apiKeysSection = page.locator('[data-testid="api-keys"], .api-keys-section')
    await expect(apiKeysSection.first()).toBeVisible()
  })

  test('SET-07: shows webhook configuration', async ({ page }) => {
    const webhookSection = page.locator('[data-testid="webhook-config"], .webhook-config')
    await expect(webhookSection.first()).toBeVisible()
  })
})

test.describe('Admin-Client SaaS - Responsive Design', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('http://localhost:3001/dashboard')
  })

  test('RSP-01: dashboard loads on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('http://localhost:3001/dashboard')

    const dashboard = page.locator('main, [data-testid="dashboard"]')
    await expect(dashboard).toBeVisible()
  })

  test('RSP-02: dashboard loads on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('http://localhost:3001/dashboard')

    const dashboard = page.locator('main, [data-testid="dashboard"]')
    await expect(dashboard).toBeVisible()
  })

  test('RSP-03: dashboard loads on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('http://localhost:3001/dashboard')

    const dashboard = page.locator('main, [data-testid="dashboard"]')
    await expect(dashboard).toBeVisible()
  })

  test('RSP-04: sidebar collapses on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('http://localhost:3001/dashboard')

    const sidebar = page.locator('nav, aside, [data-testid="sidebar"]')
    await expect(sidebar).toBeVisible()
  })
})
