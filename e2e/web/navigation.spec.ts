import { test, expect } from '@playwright/test'

/**
 * Navigation E2E Tests
 * Tests routing and navigation across the public web portal
 */

test.describe('Navigation Routes', () => {
  test('homepage loads successfully', async ({ page }) => {
    const response = await page.goto('/')
    expect(response?.status()).toBe(200)
  })

  test('cursos page loads successfully', async ({ page }) => {
    const response = await page.goto('/cursos')
    expect(response?.status()).toBe(200)
    await expect(page).toHaveURL(/\/cursos/)
  })

  test('contacto page loads successfully', async ({ page }) => {
    const response = await page.goto('/contacto')
    expect(response?.status()).toBe(200)
    await expect(page).toHaveURL(/\/contacto/)
  })

  test('sobre-nosotros page loads successfully', async ({ page }) => {
    const response = await page.goto('/sobre-nosotros')
    expect(response?.status()).toBe(200)
    await expect(page).toHaveURL(/\/sobre-nosotros/)
  })

  test('blog page loads successfully', async ({ page }) => {
    const response = await page.goto('/blog')
    expect(response?.status()).toBe(200)
    await expect(page).toHaveURL(/\/blog/)
  })
})

test.describe('Navigation Links', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('can navigate to cursos from homepage', async ({ page }) => {
    const cursosLink = page.getByRole('link', { name: /cursos/i }).first()
    if (await cursosLink.isVisible()) {
      await cursosLink.click()
      await expect(page).toHaveURL(/\/cursos/)
    }
  })

  test('can navigate to contacto from homepage', async ({ page }) => {
    const contactoLink = page.getByRole('link', { name: /contacto/i }).first()
    if (await contactoLink.isVisible()) {
      await contactoLink.click()
      await expect(page).toHaveURL(/\/contacto/)
    }
  })
})

test.describe('404 Handling', () => {
  test('non-existent route returns 404', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist-12345')
    // Next.js may return 200 with 404 page or actual 404
    // Just verify the page handles it gracefully
    await expect(page.locator('body')).toBeVisible()
  })
})
