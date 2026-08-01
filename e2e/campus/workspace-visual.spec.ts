import { expect, test } from '@playwright/test'
import path from 'node:path'

const dashboard = {
  success: true,
  enrollments: [
    {
      id: '101',
      courseTitle: 'Academy operations',
      courseRunTitle: 'September cohort',
      status: 'in_progress',
      progressPercent: 35,
      totalModules: 8,
      completedModules: 3,
      lastAccessedAt: '2026-08-01T08:00:00.000Z',
      estimatedMinutesRemaining: 140,
    },
    {
      id: '102',
      courseTitle: 'Learner experience design',
      courseRunTitle: 'Summer cohort',
      status: 'active',
      progressPercent: 85,
      totalModules: 6,
      completedModules: 5,
      lastAccessedAt: '2026-08-01T09:00:00.000Z',
      estimatedMinutesRemaining: 45,
    },
  ],
  stats: {
    totalCourses: 2,
    completedCourses: 0,
    currentStreak: 0,
    totalBadges: 0,
    totalPoints: 0,
  },
}

const viewports = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'mobile', width: 390, height: 844 },
] as const

const routes = [
  { path: '/progress', heading: 'Progreso', testId: 'progress-page' },
  { path: '/asistencia', heading: 'Asistencia', testId: 'attendance-page' },
  { path: '/certificates', heading: 'Certificados', testId: 'certificates-page' },
] as const

for (const viewport of viewports) {
  test.describe(`Campus shared workspace · ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } })

    test.beforeEach(async ({ page }) => {
      await page.route('**/api/campus/auth/session', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            student: {
              id: '9',
              email: 'learner@example.test',
              firstName: 'Alex',
              lastName: 'Rivera',
              tenantId: 7,
            },
          }),
        })
      })
      await page.route('**/api/campus/dashboard', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(dashboard),
        })
      })
    })

    for (const route of routes) {
      test(`${route.path} has stable layout and navigation`, async ({ page }) => {
        const consoleErrors: string[] = []
        const failedRequests: string[] = []
        page.on('console', (message) => {
          if (message.type() === 'error') consoleErrors.push(message.text())
        })
        page.on('requestfailed', (request) => failedRequests.push(request.url()))

        await page.goto(route.path, { waitUntil: 'networkidle' })

        await expect(page.getByTestId(route.testId)).toBeVisible()
        await expect(page.getByRole('heading', { name: route.heading, level: 1 })).toBeVisible()
        await expect(page.getByRole('navigation', { name: 'Campus' })).toBeVisible()
        await expect(page.getByRole('link', { name: route.heading }).first()).toHaveAttribute(
          'aria-current',
          'page'
        )
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= document.documentElement.clientWidth
          )
        ).toBe(true)
        expect(
          await page.getByRole('navigation', { name: 'Campus' }).evaluate((navigation) => {
            const viewportWidth = document.documentElement.clientWidth
            return [...navigation.querySelectorAll('a')].every((link) => {
              const bounds = link.getBoundingClientRect()
              return bounds.left >= 0 && bounds.right <= viewportWidth
            })
          })
        ).toBe(true)

        const screenshotPath = path.resolve(
          process.cwd(),
          `docs/design/evidence/2026-08-01-campus-workspace/${route.testId}-${viewport.name}.png`
        )
        await page.screenshot({ path: screenshotPath, fullPage: true })

        expect(consoleErrors).toEqual([])
        expect(failedRequests).toEqual([])
      })
    }
  })
}
