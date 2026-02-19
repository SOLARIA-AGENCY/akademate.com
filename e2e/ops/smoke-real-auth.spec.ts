import { expect, test } from '@playwright/test'

const email = process.env.OPS_SUPERADMIN_EMAIL
const password = process.env.OPS_SUPERADMIN_PASSWORD

test.describe('Ops staging auth smoke', () => {
  test.skip(!email || !password, 'Set OPS_SUPERADMIN_EMAIL and OPS_SUPERADMIN_PASSWORD')

  test('API login returns 200 and session payload', async ({ request }) => {
    const response = await request.post('/api/auth/login', {
      data: { email, password },
    })

    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body?.message).toBe('Login successful')
    expect(body?.user?.role).toBe('superadmin')
  })

  test('UI login works in /login', async ({ page, context }) => {
    await page.goto('/login')
    await page.locator('input[type="email"]').fill(email!)
    await page.locator('input[type="password"]').fill(password!)
    await page.locator('button[type="submit"]').click()

    await page.waitForURL(/\/dashboard/)
    const cookies = await context.cookies()
    expect(cookies.some((cookie) => cookie.name === 'akademate_admin_session')).toBeTruthy()
  })
})
