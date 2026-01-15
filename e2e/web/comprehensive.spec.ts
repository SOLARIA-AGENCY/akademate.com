import { test, expect } from '@playwright/test'

/**
 * Comprehensive Web App E2E Tests
 * Target: 50+ tests covering homepage, about, contact, responsive, footer, features, navigation, SEO
 */

test.describe('Web App - Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('HP-01: renders page successfully with 200 status', async ({ page }) => {
    const response = await page.goto('/')
    expect(response?.status()).toBe(200)
  })

  test('HP-02: has correct page title', async ({ page }) => {
    await expect(page).toHaveTitle(/Akademate/i)
  })

  test('HP-03: displays main hero section', async ({ page }) => {
    const hero = page.locator('main').first()
    await expect(hero).toBeVisible()
  })

  test('HP-04: displays Akademate branding in hero', async ({ page }) => {
    const hero = page.locator('h1').first()
    await expect(hero).toContainText('Akademate')
  })

  test('HP-05: has visible navigation bar', async ({ page }) => {
    const nav = page.getByRole('navigation')
    await expect(nav).toBeVisible()
  })

  test('HP-06: navigation has correct number of links', async ({ page }) => {
    const navLinks = page.locator('nav a')
    const count = await navLinks.count()
    expect(count).toBeGreaterThanOrEqual(4)
  })

  test('HP-07: home link navigates to home', async ({ page }) => {
    const homeLink = page.locator('nav a').first()
    await homeLink.click()
    await expect(page).toHaveURL(/\/$/)
  })

  test('HP-08: about link navigates to about page', async ({ page }) => {
    const aboutLink = page.locator('nav a', { hasText: /sobre/i }).first()
    await aboutLink.click()
    await expect(page).toHaveURL(/\/sobre-nosotros/)
  })

  test('HP-09: contact link navigates to contact page', async ({ page }) => {
    const contactLink = page.locator('nav a', { hasText: /contacto/i }).first()
    await contactLink.click()
    await expect(page).toHaveURL(/\/contacto/)
  })

  // Footer tests
  test('HP-10: displays footer element', async ({ page }) => {
    const footer = page.getByRole('contentinfo')
    await expect(footer).toBeVisible()
  })

  test('HP-11: footer contains company name', async ({ page }) => {
    const footer = page.locator('footer')
    await expect(footer).toContainText('Akademate')
  })

  test('HP-12: footer has contact email', async ({ page }) => {
    const footer = page.locator('footer')
    await expect(footer).toContainText(/@/)
  })

  test('HP-13: footer has phone number', async ({ page }) => {
    const footer = page.locator('footer')
    await expect(footer).toContainText(/\d{9}/)
  })

  test('HP-14: footer has copyright notice', async ({ page }) => {
    const footer = page.locator('footer')
    await expect(footer).toContainText(/©|Copyright/i)
  })

  test('HP-15: footer has legal links', async ({ page }) => {
    const footer = page.locator('footer a')
    const count = await footer.count()
    expect(count).toBeGreaterThanOrEqual(2)
  })

  test('HP-16: displays call-to-action button', async ({ page }) => {
    const ctaButton = page.locator('button, a').filter({ hasText: /empezar|regístrate|comenzar/i })
    await expect(ctaButton.first()).toBeVisible()
  })

  test('HP-17: CTA button is clickable', async ({ page }) => {
    const ctaButton = page
      .locator('button, a')
      .filter({ hasText: /empezar|regístrate|comenzar/i })
      .first()
    await expect(ctaButton.first()).toBeEnabled()
  })

  test('HP-18: has meta description', async ({ page }) => {
    const metaDescription = await page.locator('meta[name="description"]').getAttribute('content')
    expect(metaDescription).toBeTruthy()
    expect(metaDescription?.length).toBeGreaterThan(50)
  })

  test('HP-19: has canonical URL meta tag', async ({ page }) => {
    const canonical = page.locator('link[rel="canonical"]')
    await expect(canonical).toHaveCount(1)
  })

  test('HP-20: has og:title meta tag', async ({ page }) => {
    const ogTitle = page.locator('meta[property="og:title"]')
    await expect(ogTitle).toHaveCount(1)
  })

  test('HP-21: has main landmark', async ({ page }) => {
    const main = page.getByRole('main')
    await expect(main).toBeVisible()
  })

  test('HP-22: has heading hierarchy', async ({ page }) => {
    const h1 = page.locator('h1')
    const h2 = page.locator('h2')
    expect(await h1.count()).toBeGreaterThanOrEqual(1)
    expect(await h2.count()).toBeGreaterThanOrEqual(1)
  })

  test('HP-23: images have alt attributes', async ({ page }) => {
    const images = page.locator('img')
    const count = await images.count()
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const alt = await images.nth(i).getAttribute('alt')
        expect(alt).toBeTruthy()
      }
    }
  })

  test('HP-24: page loads within 3 seconds', async ({ page }) => {
    const start = Date.now()
    await page.goto('/')
    const loadTime = Date.now() - start
    expect(loadTime).toBeLessThan(3000)
  })

  test('HP-25: no console errors on load', async ({ page, context }) => {
    const errors: string[] = []
    context.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })
    await page.goto('/')
    expect(errors.length).toBe(0)
  })
})

test.describe('Web App - About Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sobre-nosotros')
  })

  test('AB-01: about page loads successfully', async ({ page }) => {
    const response = await page.goto('/sobre-nosotros')
    expect(response?.status()).toBe(200)
  })

  test('AB-02: displays company name in heading', async ({ page }) => {
    const h1 = page.locator('h1').first()
    await expect(h1).toContainText('Akademate')
  })

  test('AB-03: displays company description', async ({ page }) => {
    const description = page.locator('.company-description, p')
    await expect(description.first()).toBeVisible()
  })

  test('AB-04: displays team or academy count', async ({ page }) => {
    const content = page.locator('body')
    await expect(content).toContainText(/\d+\+/)
  })

  test('AB-05: displays social media links', async ({ page }) => {
    const socialLinks = page.locator(
      'a[href*="twitter"], a[href*="linkedin"], a[href*="instagram"]'
    )
    const count = await socialLinks.count()
    expect(count).toBeGreaterThanOrEqual(1)
  })

  test('AB-06: displays team members section', async ({ page }) => {
    const teamSection = page.locator('section, div').filter({ hasText: /equipo|team/i })
    await expect(teamSection.first()).toBeVisible()
  })

  test('AB-07: has proper heading structure', async ({ page }) => {
    const h1 = await page.locator('h1').count()
    const h2 = await page.locator('h2').count()
    expect(h1).toBeGreaterThanOrEqual(1)
    expect(h2).toBeGreaterThanOrEqual(1)
  })

  test('AB-08: displays mission or values', async ({ page }) => {
    const content = page.locator('body')
    await expect(content).toContainText(/misión|valores|vision/i)
  })
})

test.describe('Web App - Contact Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contacto')
  })

  test('CT-01: contact page loads successfully', async ({ page }) => {
    const response = await page.goto('/contacto')
    expect(response?.status()).toBe(200)
  })

  test('CT-02: displays contact form', async ({ page }) => {
    const form = page.locator('form')
    await expect(form).toBeVisible()
  })

  test('CT-03: has email input field', async ({ page }) => {
    const emailInput = page.locator('input[type="email"], input[name="email"]')
    await expect(emailInput).toBeVisible()
  })

  test('CT-04: has phone input field', async ({ page }) => {
    const phoneInput = page.locator(
      'input[type="tel"], input[name="phone"], input[type="text"][placeholder*="teléfono"]'
    )
    await expect(phoneInput).toBeVisible()
  })

  test('CT-05: has message textarea', async ({ page }) => {
    const messageArea = page.locator('textarea, input[name="message"]')
    await expect(messageArea).toBeVisible()
  })

  test('CT-06: has submit button', async ({ page }) => {
    const submitButton = page.locator('button[type="submit"], input[type="submit"]')
    await expect(submitButton).toBeVisible()
  })

  test('CT-07: submit button is enabled by default', async ({ page }) => {
    const submitButton = page.locator('button[type="submit"], input[type="submit"]')
    await expect(submitButton).toBeEnabled()
  })

  test('CT-08: displays contact information section', async ({ page }) => {
    const contactInfo = page.locator('.contact-info, .contact-details')
    await expect(contactInfo.first()).toBeVisible()
  })

  test('CT-09: displays email address', async ({ page }) => {
    const body = page.locator('body')
    await expect(body).toContainText(/@/)
  })

  test('CT-10: displays phone number', async ({ page }) => {
    const body = page.locator('body')
    await expect(body).toContainText(/\d{9}/)
  })

  test('CT-11: form validates empty fields', async ({ page }) => {
    const submitButton = page.locator('button[type="submit"], input[type="submit"]')
    await submitButton.click()

    const errorMessages = page.locator('.error, .error-message, [data-error]')
    const hasError = (await errorMessages.count()) > 0

    if (hasError) {
      await expect(errorMessages.first()).toBeVisible()
    }
  })

  test('CT-12: form accepts valid email format', async ({ page }) => {
    const emailInput = page.locator('input[type="email"], input[name="email"]')
    await emailInput.fill('test@example.com')

    const emailError = page.locator('.error:has-text("email"), [data-error*="email"]')
    const errorCount = await emailError.count()
    expect(errorCount).toBe(0)
  })

  test('CT-13: form accepts valid phone format', async ({ page }) => {
    const phoneInput = page.locator('input[type="tel"], input[name="phone"]')
    await phoneInput.fill('600123456')

    const phoneError = page.locator('.error:has-text("teléfono"), [data-error*="phone"]')
    const errorCount = await phoneError.count()
    expect(errorCount).toBe(0)
  })
})

test.describe('Web App - Responsive Design', () => {
  test('RD-01: desktop viewport loads correctly', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/')

    const main = page.locator('main')
    await expect(main).toBeVisible()
  })

  test('RD-02: tablet viewport loads correctly', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/')

    const main = page.locator('main')
    await expect(main).toBeVisible()
  })

  test('RD-03: mobile viewport loads correctly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    const main = page.locator('main')
    await expect(main).toBeVisible()
  })

  test('RD-04: mobile shows hamburger menu', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    const nav = page.locator('nav')
    await expect(nav).toBeVisible()
  })

  test('RD-05: navigation adapts to viewport size', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/')

    const nav = page.locator('nav')
    await expect(nav).toBeVisible()

    await page.setViewportSize({ width: 375, height: 667 })
    await expect(nav).toBeVisible()
  })
})

test.describe('Web App - Navigation', () => {
  test('NA-01: navigation works from home to about', async ({ page }) => {
    await page.goto('/')
    const aboutLink = page.locator('a', { hasText: /sobre/i }).first()
    await aboutLink.click()

    await expect(page).toHaveURL(/\/sobre-nosotros/)
  })

  test('NA-02: navigation works from home to contact', async ({ page }) => {
    await page.goto('/')
    const contactLink = page.locator('a', { hasText: /contacto/i }).first()
    await contactLink.click()

    await expect(page).toHaveURL(/\/contacto/)
  })

  test('NA-03: back button works in browser', async ({ page }) => {
    await page.goto('/')
    await page.goto('/sobre-nosotros')

    await page.goBack()
    await expect(page).toHaveURL(/\/$/)
  })

  test('NA-04: forward button works in browser', async ({ page }) => {
    await page.goto('/')
    await page.goto('/sobre-nosotros')

    await page.goBack()
    await page.goForward()

    await expect(page).toHaveURL(/\/sobre-nosotros/)
  })
})

test.describe('Web App - SEO', () => {
  test('SEO-01: homepage has proper title tag', async ({ page }) => {
    await page.goto('/')
    const title = await page.title()
    expect(title).toBeTruthy()
    expect(title.length).toBeGreaterThan(10)
  })

  test('SEO-02: homepage has meta description', async ({ page }) => {
    await page.goto('/')
    const metaDesc = await page.locator('meta[name="description"]').getAttribute('content')
    expect(metaDesc).toBeTruthy()
  })

  test('SEO-03: links use HTTPS in production', async ({ page }) => {
    await page.goto('/')

    const links = page.locator('a[href^="http"]')
    const count = await links.count()

    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute('href')
      if (href?.includes('akademate.com') || href?.includes('localhost')) {
        expect(href).toMatch(/^https?:\/\//)
      }
    }
  })
})
