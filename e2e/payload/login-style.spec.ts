import { expect, test } from '@playwright/test'

const email = process.env.PAYLOAD_ADMIN_EMAIL
const password = process.env.PAYLOAD_ADMIN_PASSWORD

test.describe('Payload login UI style + auth', () => {
  test.skip(!email || !password, 'Set PAYLOAD_ADMIN_EMAIL and PAYLOAD_ADMIN_PASSWORD')

  test('login page renders styled card container', async ({ page }) => {
    await page.goto('/admin/login')

    const card = page.locator('[data-testid="payload-login-card"]')
    await expect(card).toBeVisible()

    const bg = await card.evaluate((el) => getComputedStyle(el).backgroundColor)
    const radius = await card.evaluate((el) => getComputedStyle(el).borderRadius)

    expect(bg).not.toBe('rgba(0, 0, 0, 0)')
    expect(parseFloat(radius)).toBeGreaterThan(0)
  })

  test('custom login authenticates and redirects to /admin', async ({ page, context }) => {
    await page.goto('/admin/login')

    await page.fill('#email', email!)
    await page.fill('#password', password!)
    await page.click('button[type="submit"]')

    await page.waitForURL(/\/admin(\/)?(\?.*)?$/)
    const cookies = await context.cookies()
    expect(cookies.some((cookie) => cookie.name === 'payload-token')).toBeTruthy()
  })
})
