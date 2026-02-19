import { expect, test } from '@playwright/test'

const email = process.env.PAYLOAD_ADMIN_EMAIL
const password = process.env.PAYLOAD_ADMIN_PASSWORD

test.describe('Payload staging auth smoke', () => {
  test.skip(!email || !password, 'Set PAYLOAD_ADMIN_EMAIL and PAYLOAD_ADMIN_PASSWORD')

  test('API login returns 200 and token', async ({ request }) => {
    const response = await request.post('/api/users/login', {
      data: { email, password },
    })

    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body?.message).toBe('Authentication Passed')
    expect(body?.token).toBeTruthy()
  })

  test('UI login works in /admin/login', async ({ page, context }) => {
    await page.goto('/admin/login')
    await page.locator('input[type="email"]').fill(email!)
    await page.locator('input[type="password"]').fill(password!)
    await page.locator('button[type="submit"]').click()

    await page.waitForURL(/\/admin(\/)?(\?.*)?$/)
    const cookies = await context.cookies()
    expect(cookies.some((cookie) => cookie.name === 'payload-token')).toBeTruthy()
  })
})
