import { expect, test } from '@playwright/test'

const email = process.env.PAYLOAD_ADMIN_EMAIL
const password = process.env.PAYLOAD_ADMIN_PASSWORD

test.describe('Payload dashboard style + auth guard', () => {
  test.skip(!email || !password, 'Set PAYLOAD_ADMIN_EMAIL and PAYLOAD_ADMIN_PASSWORD')

  test('unauthenticated user is redirected to /admin/login', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForURL(/\/admin\/login/)
    await expect(page.locator('[data-testid="payload-login-card"]')).toBeVisible()
  })

  test('authenticated user sees styled dashboard cards', async ({ page }) => {
    await page.goto('/admin/login')
    await page.fill('#email', email!)
    await page.fill('#password', password!)
    await page.click('button[type="submit"]')

    await page.waitForURL(/\/admin(\/)?(\?.*)?$/)
    const grid = page.locator('[data-testid="payload-dashboard-grid"]')
    await expect(grid).toBeVisible()

    const card = page.locator('.ak-admin-card').first()
    await expect(card).toBeVisible()
    const radius = await card.evaluate((el) => getComputedStyle(el).borderRadius)
    expect(parseFloat(radius)).toBeGreaterThan(0)
  })
})
