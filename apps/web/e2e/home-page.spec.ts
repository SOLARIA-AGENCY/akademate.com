import { test, expect, beforeAll } from '@playwright/test'
import { mockUsers, mockCourses, mockTenant } from './fixtures'

test.describe('Web App - Home Page', () => {
  test('should load successfully', async ({ page }) => {
    await page.goto('http://localhost:3006')
    
    const h1 = page.locator('h1')
    await expect(h1).toContainText('Akademate')
    await expect(h1).toBeVisible()
  })

  test('should display course cards', async ({ page }) => {
    await page.goto('http://localhost:3006')
    
    const courseCards = page.locator('.course-card')
    await expect(courseCards).toHaveCount(mockCourses.length)
    
    // Verify each course title is displayed
    for (const course of mockCourses) {
      const card = page.locator(`.course-card:has-text("${course.title}")`)
      await expect(card).toBeVisible()
      await expect(card.locator('h3:has-text("Ver curso")').toBeVisible()
    }
  })

  test('should display features section', async ({ page }) => {
    await page.goto('http://localhost:3006')
    
    await expect(page.locator('.feature-section')).toBeVisible()
    await expect(page.locator('.feature-grid')).toBeVisible()
  })

  test('should be mobile responsive', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    
    const mobileMenu = page.locator('.mobile-menu')
    await expect(mobileMenu).not.toBeVisible()
    
    await page.setViewportSize({ width: 1920, height: 1080 })
    
    await expect(mobileMenu).toBeVisible()
  })

  test('should display footer', async ({ page }) => {
    await page.goto('http://localhost:3006')
    
    const footer = page.locator('footer')
    await expect(footer).toBeVisible()
    await expect(footer.locator('.footer-company-name')).toContainText('Akademate')
    await expect(footer.locator('.footer-email')).toBeVisible()
    await expect(footer.locator('.footer-phone')).toContainText('+34 91 123 456')
  })
})

test.describe('Web App - About Page', () => {
  test('should display company information', async ({ page }) => {
    await page.goto('http://localhost:3006/sobre-nosotros')
    
    await expect(page.locator('.company-name')).toContainText('Akademate')
    await expect(page.locator('.company-description')).toBeVisible()
    await expect(page.locator('.company-email')).toBeVisible()
  })

  test('should display team section', async ({ page }) => {
    await page.goto('http://localhost:3006/sobre-nosotros')
    
    const teamCards = page.locator('.team-card')
    await expect(teamCards).toHaveCount(50)
    
    await expect(page.locator('.team-count')).toContainText('50+ Academias')
  })

  test('should display social links', async ({ page }) => {
    await page.goto('http://localhost:3006/sobre-nosotros')
    
    await expect(page.locator('.social-links')).toBeVisible()
    await expect(page.locator('.social-twitter')).toHaveAttribute('href', /twitter\.com/i)
    await expect(page.locator('.social-linkedin')).toHaveAttribute('href', /linkedin\.com\/in\//)
    await expect(page.locator('.social-instagram')).toHaveAttribute('href', /instagram\.com\//)
  })
})

test.describe('Web App - Contact Page', () => {
  test('should validate email format', async ({ page }) => {
    await page.goto('http://localhost:3006/contacto')
    
    const emailInput = page.locator('input[name="email"]')
    await emailInput.fill('test@example.com')
    
    const phoneInput = page.locator('input[name="phone"]')
    await phoneInput.fill('600123456')
    
    const submitButton = page.locator('button[type="submit"]')
    await submitButton.click()
    
    await expect(page.locator('.error-message')).toContainText('Email válido')
  })

  test('should validate phone format', async ({ page }) => {
    await page.goto('http://localhost:3006/contacto')
    
    const phoneInput = page.locator('input[name="phone"]')
    await phoneInput.fill('invalid-phone') // Missing code
    
    const submitButton = page.locator('button[type="submit"]')
    await submitButton.click()
    
    await expect(page.locator('.error-message')).toContainText('Formato de teléfono inválido')
  })

  test('should show loading state', async ({ page }) => {
    await page.goto('http://localhost:3006/contacto')
    
    const submitButton = page.locator('button[type="submit"]')
    await submitButton.click()
    
    await expect(page.locator('.loading-spinner')).toBeVisible()
    await expect(page.locator('.success-message')).not.toBeVisible()
    
    await page.waitForTimeout(500)
    
    await expect(page.locator('.loading-spinner')).not.toBeVisible()
    await expect(page.locator('.success-message')).toBeVisible()
  })

  test('should display success message', async ({ page }) => {
    await page.goto('http://localhost:3006/contacto')
    
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="phone"]', '600123456')
    
    await page.click('button[type="submit"]')
    
    await expect(page.locator('.success-message')).toContainText('Mensaje enviado')
  })
})
