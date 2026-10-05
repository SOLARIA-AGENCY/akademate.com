import { expect, test } from '@playwright/test'
import path from 'node:path'

const viewports = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'mobile', width: 390, height: 844 },
] as const

for (const viewport of viewports) {
  test.describe(`Tenant admin shell · ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } })

    test.beforeEach(async ({ page }) => {
      // The middleware only needs the presence of the protected auth cookie to
      // render the dashboard shell. The session endpoint is mocked below, so
      // the token never reaches a real auth boundary or a production service.
      await page.context().addCookies([
        {
          name: 'payload-token',
          value: 'synthetic-shell-token',
          domain: 'localhost',
          path: '/',
        },
      ])
      await page.route('**/api/auth/session', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            authenticated: true,
            socketToken: 'synthetic-shell-token',
            user: {
              id: 42,
              email: 'owner@example.test',
              name: 'Academy Owner',
              role: 'admin',
              tenantId: 7,
            },
          }),
        })
      })
      await page.route('**/api/config**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              nombre: 'Northstar Academy',
              principal: '/logos/akademate-logo-official.png',
            },
          }),
        })
      })
      await page.route('**/api/dashboard/metrics*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              metrics: {
                total_courses: 12,
                active_students: 248,
                leads_this_month: 38,
                total_teachers: 16,
                total_campuses: 3,
                active_convocations: 7,
              },
              convocations: [],
              campaigns: [],
              recentActivities: [],
              weeklyMetrics: { leads: [], enrollments: [], courses_added: [] },
              alerts: [],
              campusDistribution: [],
            },
          }),
        })
      })
      await page.route('**/api/dashboard/stream*', async (route) => {
        await route.fulfill({ status: 200, contentType: 'text/event-stream', body: ': ready\n\n' })
      })
      await page.route('**/api/lms/enrollments*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: [] }),
        })
      })
      await page.route('**/api/cycles*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ totalDocs: 0 }),
        })
      })
      await page.route('**/api/course-runs*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ totalDocs: 0 }),
        })
      })
      await page.route('**/socket.io/**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'text/plain',
          body: '<html>not socket</html>',
        })
      })
    })

    test('keeps navigation, role surface and viewport stable', async ({ page }) => {
      const consoleErrors: string[] = []
      const failedRequests: string[] = []
      page.on('console', (message) => {
        if (message.type() === 'error') consoleErrors.push(message.text())
      })
      page.on('requestfailed', (request) => {
        // The shell deliberately probes the optional Socket.io endpoint and
        // must degrade safely when realtime is unavailable. That expected
        // probe can be aborted by the provider after the bounded timeout;
        // keep the assertion focused on unexpected page dependencies.
        if (!request.url().includes('/socket.io/')) failedRequests.push(request.url())
      })

      await page.goto('/dashboard', { waitUntil: 'networkidle' })

      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= document.documentElement.clientWidth
        )
      ).toBe(true)

      if (viewport.name === 'mobile') {
        const openButton = page.getByRole('button', { name: 'Abrir menú lateral' })
        await expect(openButton).toBeVisible()
        await openButton.click()
        const navigation = page.getByRole('navigation', { name: 'Navegación principal' })
        const drawer = page.locator('#tenant-dashboard-sidebar')
        await expect(page.getByText('Northstar Academy', { exact: true })).toBeVisible()
        await expect(navigation).toHaveCount(1)
        await expect(navigation).toBeVisible()
        await expect(navigation.getByRole('link', { name: 'Dashboard' })).toHaveAttribute(
          'href',
          '/dashboard'
        )
        await expect(navigation.getByRole('link', { name: 'Usuarios' })).toHaveAttribute(
          'href',
          '/administracion/usuarios'
        )
        await expect(drawer).toHaveAttribute('role', 'dialog')
        await expect(drawer).not.toHaveAttribute('aria-hidden', 'true')
        await page.keyboard.press('Escape')
        await expect(drawer).toHaveAttribute('aria-hidden', 'true')
        await expect(openButton).toBeFocused()
      } else {
        const navigation = page.getByRole('navigation', { name: 'Navegación principal' })
        await expect(page.getByText('Northstar Academy', { exact: true })).toBeVisible()
        await expect(navigation).toHaveCount(1)
        await expect(navigation).toBeVisible()
        await expect(navigation.getByRole('link', { name: 'Dashboard' })).toHaveAttribute(
          'href',
          '/dashboard'
        )
        await expect(navigation.getByRole('link', { name: 'Usuarios' })).toHaveAttribute(
          'href',
          '/administracion/usuarios'
        )
        await expect(page.getByRole('button', { name: 'Colapsar menú lateral' })).toBeVisible()
      }

      const screenshotPath = path.resolve(
        process.cwd(),
        `docs/design/evidence/2026-08-01-tenant-admin-shell/tenant-admin-shell-${viewport.name}.png`
      )
      await page.screenshot({ path: screenshotPath, fullPage: true })

      expect(consoleErrors).toEqual([])
      expect(failedRequests).toEqual([])
    })
  })
}
