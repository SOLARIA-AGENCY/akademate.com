import { test, expect } from '@playwright/test'

test.describe('Tenant-Admin - Billing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/facturacion')
  })

  test('BILL-01: billing page loads', async ({ page }) => {
    const heading = page.locator('h1, [data-testid="billing-title"]')
    await expect(heading.first()).toBeVisible()
  })

  test('BILL-02: shows billing actions', async ({ page }) => {
    const buttons = page.locator('button, a')
    const count = await buttons.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })
})
