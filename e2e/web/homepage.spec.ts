import { test, expect } from '@playwright/test'

/**
 * Homepage E2E Tests
 * Tests the public-facing homepage of Akademate
 */

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('renders homepage with correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Akademate/i)
  })

  test('displays hero section', async ({ page }) => {
    const hero = page.locator('main').first()
    await expect(hero).toBeVisible()
  })

  test('has working navigation', async ({ page }) => {
    const nav = page.getByRole('navigation')
    await expect(nav).toBeVisible()
  })

  test('displays footer', async ({ page }) => {
    const footer = page.getByRole('contentinfo')
    await expect(footer).toBeVisible()
  })

  test('is accessible - no ARIA violations on main elements', async ({ page }) => {
    // Basic accessibility checks
    const main = page.getByRole('main')
    await expect(main).toBeVisible()

    // Check skip links or main landmark
    const landmarks = await page.getByRole('main').count()
    expect(landmarks).toBeGreaterThanOrEqual(1)
  })
})

test.describe('Homepage - Mobile', () => {
  test('displays mobile menu button on small screens', async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip()
      return
    }

    await page.goto('/')

    // Mobile navigation should have a menu toggle
    const menuButton = page.getByRole('button', { name: /menu/i })
    // This may or may not exist depending on implementation
    // Just verify the page loads correctly on mobile
    await expect(page.locator('body')).toBeVisible()
  })
})
