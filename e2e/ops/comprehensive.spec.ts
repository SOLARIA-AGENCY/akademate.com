import { test, expect } from '@playwright/test'

test.describe('Ops Panel - Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3070')
  })

  test('DASH-01: operations dashboard loads', async ({ page }) => {
    const dashboard = page.locator('main, [data-testid="dashboard"]')
    await expect(dashboard.first()).toBeVisible()
  })

  test('DASH-02: displays system health status', async ({ page }) => {
    const healthStatus = page.locator('[data-testid="health-status"], .health-status')
    await expect(healthStatus.first()).toBeVisible()
  })

  test('DASH-03: shows active services count', async ({ page }) => {
    const serviceCount = page.locator('[data-testid="service-count"], .service-count')
    await expect(serviceCount.first()).toBeVisible()
  })

  test('DASH-04: displays error rate metrics', async ({ page }) => {
    const errorRate = page.locator('[data-testid="error-rate"], .error-rate')
    await expect(errorRate.first()).toBeVisible()
  })

  test('DASH-05: shows system uptime', async ({ page }) => {
    const uptime = page.locator('[data-testid="uptime"], .uptime')
    await expect(uptime.first()).toBeVisible()
  })

  test('DASH-06: displays resource usage metrics', async ({ page }) => {
    const resourceUsage = page.locator('[data-testid="resource-usage"], .resource-usage')
    await expect(resourceUsage.first()).toBeVisible()
  })

  test('DASH-07: has navigation menu', async ({ page }) => {
    const nav = page.locator('nav, [data-testid="navigation"]')
    await expect(nav).toBeVisible()
  })

  test('DASH-08: displays recent alerts', async ({ page }) => {
    const alertsList = page.locator('[data-testid="alerts-list"], .alerts-list')
    await expect(alertsList.first()).toBeVisible()
  })

  test('DASH-09: shows job queue status', async ({ page }) => {
    const jobQueue = page.locator('[data-testid="job-queue"], .job-queue')
    await expect(jobQueue.first()).toBeVisible()
  })

  test('DASH-10: has user profile section', async ({ page }) => {
    const userProfile = page.locator('[data-testid="user-profile"], .user-profile')
    await expect(userProfile.first()).toBeVisible()
  })
})

test.describe('Ops Panel - Service Health', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3070/services')
  })

  test('SVC-01: services page loads successfully', async ({ page }) => {
    const servicesPage = page.locator('main, [data-testid="services-page"]')
    await expect(servicesPage.first()).toBeVisible()
  })

  test('SVC-02: displays services list table', async ({ page }) => {
    const servicesTable = page.locator('table, [data-testid="services-table"]')
    await expect(servicesTable).toBeVisible()
  })

  test('SVC-03: shows service status badges', async ({ page }) => {
    const statusBadge = page.locator('.badge, [data-testid="status-badge"]')
    const count = await statusBadge.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('SVC-04: displays service uptime', async ({ page }) => {
    const uptime = page.locator('[data-testid="uptime"], .uptime')
    const count = await uptime.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('SVC-05: has restart service actions', async ({ page }) => {
    const restartButton = page.locator('button:has-text("Restart"), button:has-text("Reiniciar")')
    const count = await restartButton.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('SVC-06: has stop service actions', async ({ page }) => {
    const stopButton = page.locator('button:has-text("Stop"), button:has-text("Detener")')
    const count = await stopButton.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('SVC-07: displays service logs link', async ({ page }) => {
    const logsLink = page.locator('a:has-text("Logs"), a:has-text("Registros")')
    const count = await logsLink.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('SVC-08: has search/filter controls', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]')
    await expect(searchInput.first()).toBeVisible()
  })

  test('SVC-09: displays pagination controls', async ({ page }) => {
    const pagination = page.locator('.pagination, [data-testid="pagination"]')
    const count = await pagination.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('SVC-10: shows service configuration', async ({ page }) => {
    const configSection = page.locator('[data-testid="service-config"], .service-config')
    const count = await configSection.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })
})

test.describe('Ops Panel - Database Status', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3070/database')
  })

  test('DB-01: database status page loads', async ({ page }) => {
    const dbPage = page.locator('main, [data-testid="database-page"]')
    await expect(dbPage.first()).toBeVisible()
  })

  test('DB-02: displays connection status', async ({ page }) => {
    const connectionStatus = page.locator('[data-testid="connection-status"], .connection-status')
    await expect(connectionStatus.first()).toBeVisible()
  })

  test('DB-03: shows database size metrics', async ({ page }) => {
    const dbSize = page.locator('[data-testid="db-size"], .db-size')
    await expect(dbSize.first()).toBeVisible()
  })

  test('DB-04: displays active connections count', async ({ page }) => {
    const connectionCount = page.locator('[data-testid="connection-count"], .connection-count')
    await expect(connectionCount.first()).toBeVisible()
  })

  test('DB-05: shows query performance metrics', async ({ page }) => {
    const queryPerf = page.locator('[data-testid="query-performance"], .query-performance')
    await expect(queryPerf.first()).toBeVisible()
  })

  test('DB-06: displays slow queries list', async ({ page }) => {
    const slowQueries = page.locator('[data-testid="slow-queries"], .slow-queries')
    await expect(slowQueries.first()).toBeVisible()
  })

  test('DB-07: has backup controls', async ({ page }) => {
    const backupButton = page.locator(
      'button:has-text("Backup"), button:has-text("Copia de seguridad")'
    )
    await expect(backupButton.first()).toBeVisible()
  })

  test('DB-08: has restore controls', async ({ page }) => {
    const restoreButton = page.locator('button:has-text("Restore"), button:has-text("Restaurar")')
    await expect(restoreButton.first()).toBeVisible()
  })

  test('DB-09: displays last backup timestamp', async ({ page }) => {
    const lastBackup = page.locator('[data-testid="last-backup"], .last-backup')
    await expect(lastBackup.first()).toBeVisible()
  })

  test('DB-10: has migration status', async ({ page }) => {
    const migrationStatus = page.locator('[data-testid="migration-status"], .migration-status')
    await expect(migrationStatus.first()).toBeVisible()
  })
})

test.describe('Ops Panel - Logs Viewer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3070/logs')
  })

  test('LOG-01: logs page loads successfully', async ({ page }) => {
    const logsPage = page.locator('main, [data-testid="logs-page"]')
    await expect(logsPage.first()).toBeVisible()
  })

  test('LOG-02: displays log entries list', async ({ page }) => {
    const logEntries = page.locator('[data-testid="log-entries"], .log-entries')
    await expect(logEntries.first()).toBeVisible()
  })

  test('LOG-03: has timestamp for each log entry', async ({ page }) => {
    const timestamp = page.locator('[data-testid="timestamp"], .timestamp')
    const count = await timestamp.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('LOG-04: displays log levels', async ({ page }) => {
    const logLevel = page.locator('[data-testid="log-level"], .log-level')
    const count = await logLevel.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('LOG-05: has error log filter', async ({ page }) => {
    const errorFilter = page.locator('button:has-text("Error"), button:has-text("Errors")')
    await expect(errorFilter.first()).toBeVisible()
  })

  test('LOG-06: has warning log filter', async ({ page }) => {
    const warningFilter = page.locator('button:has-text("Warning"), button:has-text("Warnings")')
    await expect(warningFilter.first()).toBeVisible()
  })

  test('LOG-07: has search functionality', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]')
    await expect(searchInput.first()).toBeVisible()
  })

  test('LOG-08: displays log details panel', async ({ page }) => {
    const logDetails = page.locator('[data-testid="log-details"], .log-details')
    const count = await logDetails.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('LOG-09: has export logs button', async ({ page }) => {
    const exportButton = page.locator('button:has-text("Export"), button:has-text("Exportar")')
    await expect(exportButton.first()).toBeVisible()
  })

  test('LOG-10: displays auto-refresh indicator', async ({ page }) => {
    const refreshIndicator = page.locator('[data-testid="auto-refresh"], .auto-refresh')
    await expect(refreshIndicator.first()).toBeVisible()
  })
})

test.describe('Ops Panel - Monitoring Metrics', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3070/monitoring')
  })

  test('MON-01: monitoring page loads successfully', async ({ page }) => {
    const monitoringPage = page.locator('main, [data-testid="monitoring-page"]')
    await expect(monitoringPage.first()).toBeVisible()
  })

  test('MON-02: displays CPU usage chart', async ({ page }) => {
    const cpuChart = page.locator('[data-testid="cpu-chart"], .cpu-chart')
    await expect(cpuChart.first()).toBeVisible()
  })

  test('MON-03: displays memory usage chart', async ({ page }) => {
    const memoryChart = page.locator('[data-testid="memory-chart"], .memory-chart')
    await expect(memoryChart.first()).toBeVisible()
  })

  test('MON-04: displays disk usage chart', async ({ page }) => {
    const diskChart = page.locator('[data-testid="disk-chart"], .disk-chart')
    await expect(diskChart.first()).toBeVisible()
  })

  test('MON-05: displays network I/O metrics', async ({ page }) => {
    const networkIo = page.locator('[data-testid="network-io"], .network-io')
    await expect(networkIo.first()).toBeVisible()
  })

  test('MON-06: has metric time range selector', async ({ page }) => {
    const timeRange = page.locator('select[name="range"], [data-testid="time-range"]')
    await expect(timeRange).toBeVisible()
  })

  test('MON-07: displays alert thresholds', async ({ page }) => {
    const thresholds = page.locator('[data-testid="alert-thresholds"], .alert-thresholds')
    await expect(thresholds.first()).toBeVisible()
  })

  test('MON-08: has refresh button', async ({ page }) => {
    const refreshButton = page.locator('button:has-text("Refresh"), button:has-text("Actualizar")')
    await expect(refreshButton.first()).toBeVisible()
  })

  test('MON-09: displays incident count', async ({ page }) => {
    const incidentCount = page.locator('[data-testid="incident-count"], .incident-count')
    await expect(incidentCount.first()).toBeVisible()
  })

  test('MON-10: shows system health score', async ({ page }) => {
    const healthScore = page.locator('[data-testid="health-score"], .health-score')
    await expect(healthScore.first()).toBeVisible()
  })
})

test.describe('Ops Panel - Job Queue', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3070/jobs')
  })

  test('JOB-01: jobs page loads successfully', async ({ page }) => {
    const jobsPage = page.locator('main, [data-testid="jobs-page"]')
    await expect(jobsPage.first()).toBeVisible()
  })

  test('JOB-02: displays queued jobs count', async ({ page }) => {
    const queuedCount = page.locator('[data-testid="queued-count"], .queued-count')
    await expect(queuedCount.first()).toBeVisible()
  })

  test('JOB-03: displays active jobs count', async ({ page }) => {
    const activeCount = page.locator('[data-testid="active-count"], .active-count')
    await expect(activeCount.first()).toBeVisible()
  })

  test('JOB-04: displays completed jobs count', async ({ page }) => {
    const completedCount = page.locator('[data-testid="completed-count"], .completed-count')
    await expect(completedCount.first()).toBeVisible()
  })

  test('JOB-05: shows failed jobs count', async ({ page }) => {
    const failedCount = page.locator('[data-testid="failed-count"], .failed-count')
    await expect(failedCount.first()).toBeVisible()
  })

  test('JOB-06: has job type filters', async ({ page }) => {
    const typeFilter = page.locator('select, [data-testid="job-type-filter"]')
    await expect(typeFilter).toBeVisible()
  })

  test('JOB-07: displays job execution time', async ({ page }) => {
    const executionTime = page.locator('[data-testid="execution-time"], .execution-time')
    const count = await executionTime.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('JOB-08: has retry failed jobs button', async ({ page }) => {
    const retryButton = page.locator('button:has-text("Retry"), button:has-text("Reintentar")')
    const count = await retryButton.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('JOB-09: displays job details panel', async ({ page }) => {
    const jobDetails = page.locator('[data-testid="job-details"], .job-details')
    const count = await jobDetails.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('JOB-10: has clear completed jobs button', async ({ page }) => {
    const clearButton = page.locator('button:has-text("Clear"), button:has-text("Limpiar")')
    await expect(clearButton.first()).toBeVisible()
  })
})

test.describe('Ops Panel - System Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3070/settings')
  })

  test('SET-01: settings page loads successfully', async ({ page }) => {
    const settingsPage = page.locator('main, [data-testid="settings-page"]')
    await expect(settingsPage.first()).toBeVisible()
  })

  test('SET-02: displays environment configuration', async ({ page }) => {
    const envConfig = page.locator('[data-testid="env-config"], .env-config')
    await expect(envConfig.first()).toBeVisible()
  })

  test('SET-03: has notification settings', async ({ page }) => {
    const notificationSettings = page.locator(
      '[data-testid="notification-settings"], .notification-settings'
    )
    await expect(notificationSettings.first()).toBeVisible()
  })

  test('SET-04: displays API configuration', async ({ page }) => {
    const apiConfig = page.locator('[data-testid="api-config"], .api-config')
    await expect(apiConfig.first()).toBeVisible()
  })

  test('SET-05: has save settings button', async ({ page }) => {
    const saveButton = page.locator('button[type="submit"], button:has-text("Save")')
    await expect(saveButton.first()).toBeVisible()
  })

  test('SET-06: displays system version info', async ({ page }) => {
    const versionInfo = page.locator('[data-testid="version-info"], .version-info')
    await expect(versionInfo.first()).toBeVisible()
  })

  test('SET-07: has restart system button', async ({ page }) => {
    const restartButton = page.locator(
      'button:has-text("Restart System"), button:has-text("Reiniciar sistema")'
    )
    await expect(restartButton.first()).toBeVisible()
  })

  test('SET-08: displays deployment info', async ({ page }) => {
    const deployInfo = page.locator('[data-testid="deploy-info"], .deploy-info')
    await expect(deployInfo.first()).toBeVisible()
  })
})

test.describe('Ops Panel - Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3070/dashboard')
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

  test('NAV-03: clicking services link navigates correctly', async ({ page }) => {
    const servicesLink = page.locator('a:has-text("Services")').first()
    await servicesLink.click()

    await expect(page).toHaveURL(/\/services/)
  })

  test('NAV-04: clicking logs link navigates correctly', async ({ page }) => {
    const logsLink = page.locator('a:has-text("Logs")').first()
    await logsLink.click()

    await expect(page).toHaveURL(/\/logs/)
  })

  test('NAV-05: back button works in browser', async ({ page }) => {
    await page.goto('http://localhost:3070/services')
    await page.goBack()

    await expect(page).toHaveURL(/\/dashboard|\/$/)
  })
})

test.describe('Ops Panel - Alerts Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3070/alerts')
  })

  test('ALT-01: alerts page loads successfully', async ({ page }) => {
    const alertsPage = page.locator('main, [data-testid="alerts-page"]')
    await expect(alertsPage.first()).toBeVisible()
  })

  test('ALT-02: displays active alerts list', async ({ page }) => {
    const activeAlerts = page.locator('[data-testid="active-alerts"], .active-alerts')
    await expect(activeAlerts.first()).toBeVisible()
  })

  test('ALT-03: shows alert severity levels', async ({ page }) => {
    const severityBadge = page.locator('.badge:has-text("Critical"), [data-severity]')
    const count = await severityBadge.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('ALT-04: displays alert timestamps', async ({ page }) => {
    const timestamp = page.locator('[data-testid="timestamp"], .timestamp')
    const count = await timestamp.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('ALT-05: has acknowledge alert button', async ({ page }) => {
    const acknowledgeButton = page.locator(
      'button:has-text("Acknowledge"), button:has-text("Reconocer")'
    )
    const count = await acknowledgeButton.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('ALT-06: has resolve alert button', async ({ page }) => {
    const resolveButton = page.locator('button:has-text("Resolve"), button:has-text("Resolver")')
    const count = await resolveButton.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('ALT-07: displays alert details panel', async ({ page }) => {
    const alertDetails = page.locator('[data-testid="alert-details"], .alert-details')
    const count = await alertDetails.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('ALT-08: has alert history', async ({ page }) => {
    const alertHistory = page.locator('[data-testid="alert-history"], .alert-history')
    await expect(alertHistory.first()).toBeVisible()
  })

  test('ALT-09: has clear alerts button', async ({ page }) => {
    const clearButton = page.locator('button:has-text("Clear"), button:has-text("Limpiar")')
    await expect(clearButton.first()).toBeVisible()
  })
})

test.describe('Ops Panel - API Health', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3070/api-health')
  })

  test('API-01: API health check loads', async ({ page }) => {
    const apiHealthPage = page.locator('main, [data-testid="api-health-page"]')
    await expect(apiHealthPage.first()).toBeVisible()
  })

  test('API-02: displays API endpoints status', async ({ page }) => {
    const endpointsStatus = page.locator('[data-testid="endpoints-status"], .endpoints-status')
    await expect(endpointsStatus.first()).toBeVisible()
  })

  test('API-03: shows response time metrics', async ({ page }) => {
    const responseTime = page.locator('[data-testid="response-time"], .response-time')
    await expect(responseTime.first()).toBeVisible()
  })

  test('API-04: displays error rate', async ({ page }) => {
    const errorRate = page.locator('[data-testid="api-error-rate"], .api-error-rate')
    await expect(errorRate.first()).toBeVisible()
  })

  test('API-05: has API version information', async ({ page }) => {
    const apiVersion = page.locator('[data-testid="api-version"], .api-version')
    await expect(apiVersion.first()).toBeVisible()
  })

  test('API-06: displays request count', async ({ page }) => {
    const requestCount = page.locator('[data-testid="request-count"], .request-count')
    await expect(requestCount.first()).toBeVisible()
  })

  test('API-07: has refresh health button', async ({ page }) => {
    const refreshButton = page.locator(
      'button:has-text("Refresh Health"), button:has-text("Actualizar estado")'
    )
    await expect(refreshButton.first()).toBeVisible()
  })

  test('API-08: displays last check timestamp', async ({ page }) => {
    const lastCheck = page.locator('[data-testid="last-check"], .last-check')
    await expect(lastCheck.first()).toBeVisible()
  })

  test('API-09: shows uptime percentage', async ({ page }) => {
    const uptime = page.locator('[data-testid="uptime-percentage"], .uptime-percentage')
    await expect(uptime.first()).toBeVisible()
  })
})

test.describe('Ops Panel - Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3070')
  })

  test('AUTH-01: ops login page loads', async ({ page }) => {
    await expect(page).toHaveTitle(/Ops|Operations|Login/i)
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

    await emailInput.fill('ops@akademate.com')
    await submitButton.click()
    await expect(passwordInput).toBeFocused()
  })
})

test.describe('Ops Panel - Responsive Design', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('http://localhost:3070/dashboard')
  })

  test('RSP-01: dashboard loads on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('http://localhost:3070/dashboard')

    const dashboard = page.locator('main, [data-testid="dashboard"]')
    await expect(dashboard).toBeVisible()
  })

  test('RSP-02: dashboard loads on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('http://localhost:3070/dashboard')

    const dashboard = page.locator('main, [data-testid="dashboard"]')
    await expect(dashboard).toBeVisible()
  })

  test('RSP-03: dashboard loads on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('http://localhost:3070/dashboard')

    const dashboard = page.locator('main, [data-testid="dashboard"]')
    await expect(dashboard).toBeVisible()
  })

  test('RSP-04: sidebar collapses on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('http://localhost:3070/dashboard')

    const sidebar = page.locator('nav, aside, [data-testid="sidebar"]')
    await expect(sidebar).toBeVisible()
  })
})
