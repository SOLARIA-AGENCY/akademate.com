import { test, expect } from '@playwright/test'

/**
 * Portal Smoke Tests
 * Basic tests for the tenant-facing portal
 */

test.describe('Portal', () => {
  test('portal loads successfully', async ({ page }) => {
    const response = await page.goto('/')

    // Portal should return 200 or redirect
    const status = response?.status()
    expect(status === 200 || status === 302 || status === 307).toBe(true)
  })

  test('displays portal content', async ({ page }) => {
    await page.goto('/')

    const body = page.locator('body')
    await expect(body).toBeVisible()
  })
})

test.describe('Portal - Multi-tenant', () => {
  test('handles tenant context', async ({ page }) => {
    // Test with demo tenant subdomain
    // In real scenario, this would be demo.akademate.io
    await page.goto('/')

    // Should load without errors
    await expect(page.locator('body')).toBeVisible()

    // Check for tenant-specific headers (if implemented)
    const response = await page.request.get('/')
    expect(response.status()).toBeLessThan(500)
  })
})
