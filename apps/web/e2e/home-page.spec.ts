import { test, expect, beforeAll, afterAll } from '@playwright/test'

// Import mocks
import { mockUsers, mockCourses, mockTenant } from './fixtures'

test.describe('Web App - Home Page', () => {
  beforeAll(async () => {
    // Navigate to home
    await page.goto('http://localhost:3006')
  })

  test('should load successfully', async ({ page }) => {
    await expect(page.locator('h1')).toHaveText('Akademate')
    await expect(page).toHaveTitle(/Plataforma Educativa/i)
  })

  test('should display courses', async ({ page }) => {
    const courses = page.locator('.course-cards')
    await expect(courses).toHaveCount(2)
    await expect(courses.first()).toContainText('Curso de Ejemplo')
  })

  test('should display features', async ({ page }) => {
    await expect(page.locator('.feature-grid')).toBeVisible()
    await expect(page.locator('.feature-card:first')).toContainText('Búsqueda Inteligente')
    await expect(page.locator('.feature-card:last')).toContainText('Progreso en Tiempo Real')
  })
})

test('should be responsive', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    
    await expect(page.locator('.nav-menu')).toBeVisible()
    await expect(page.locator('.mobile-menu')).not.toBeVisible()
  })
})

test('should load quickly', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('http://localhost:3006')
    const loadTime = Date.now() - startTime
    
    expect(loadTime).toBeLessThan(2000) // < 2s
  })
})

test.describe('Web App - Contact Form', () => {
  test('should validate email format', async ({ page }) => {
    await page.goto('http://localhost:3006/contacto')

    await page.fill('input[name="email"]', 'invalid-email')
    await page.fill('input[name="phone"]', '600123456')

    await page.click('button[type="submit"]')

    await expect(page.locator('.error-message')).toBeVisible()
    await expect(page.locator('.error-message')).toContainText('Email inválido')
  })

  test('should accept valid email', async ({ page }) => {
    await page.goto('http://localhost:3006/contacto')

    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="phone"]', '600123456')

    await page.click('button[type="submit"]')

    await expect(page.locator('.success-message')).toBeVisible()
    await expect(page.locator('.success-message')).toContainText('Mensaje enviado')
  })
})

test('should show loading state', async ({ page }) => {
    await page.goto('http://localhost:3006/contacto')

    await page.click('button[type="submit"]')

    await expect(page.locator('.loading-spinner')).toBeVisible()
    await expect(page.locator('loading-spinner')).toHaveAttribute('aria-busy', 'true')

    await page.waitForSelector('.success-message', { timeout: 5000 })
    await expect(page.locator('.loading-spinner')).toHaveAttribute('aria-busy', 'false')
  })
})

test.describe('Web App - About Page', () => {
  beforeAll(async () => {
    await page.goto('http://localhost:3006/sobre-nosotros')
  })

  test('should display company info', async ({ page }) => {
    await expect(page.locator('.company-name')).toContainText('Akademate')
    await expect(page.locator('.company-email')).toBeVisible()
    await expect(page.locator('.company-phone')).toContainText('+34 91 123 456')
  })

  test('should display team section', async ({ page }) => {
    await expect(page.locator('.team-section')).toBeVisible()
    await expect(page.locator('.team-count')).toContainText('50+ Academias')
    await expect(page.locator('.team-list')).toBeVisible()
  })

  test('should display social links', async ({ page }) => {
    await expect(page.locator('.social-link')).toBeVisible()
    expect(page.locator('.social-link')).toHaveAttribute('href', /twitter\.com\//)
    await expect(page.locator('.social-links')).toHaveCount(3)
  })
})
