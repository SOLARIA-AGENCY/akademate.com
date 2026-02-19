import { expect, test } from '@playwright/test'

const email = process.env.PAYLOAD_ADMIN_EMAIL
const password = process.env.PAYLOAD_ADMIN_PASSWORD

test.describe('Payload courses collection access', () => {
  test.skip(!email || !password, 'Set PAYLOAD_ADMIN_EMAIL and PAYLOAD_ADMIN_PASSWORD')

  test('authenticated user can load /admin/collections/courses', async ({ page }) => {
    await page.goto('/admin/login')
    await page.fill('#email', email!)
    await page.fill('#password', password!)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/admin(\/)?(\?.*)?$/)

    await page.goto('/admin/collections/courses')
    await expect(page).toHaveURL(/\/admin\/collections\/courses/)
    await expect(page.locator('h1, .collection-list__title').first()).toContainText(/Courses/i)
    await expect(page.locator('body')).toContainText('Courses')
  })
})
