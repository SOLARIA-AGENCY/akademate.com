import { expect, test } from '@playwright/test'

test.describe('Akademate public commercial surface', () => {
  test('communicates one operating system, real proof and clear conversion', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('one intelligent operating system')
    await expect(page.getByRole('link', { name: 'Book a demo' }).first()).toBeVisible()
    await expect(page.getByRole('heading', { name: 'CEP Formación' })).toBeVisible()
    await expect(page.getByText('Built for modern academy models')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Business' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Enterprise' })).toBeVisible()
    await expect(page.getByText('On-premise or private cloud').first()).toBeVisible()
  })

  test('publishes a complete feature catalogue and two substantive articles', async ({ page }) => {
    const featuresResponse = await page.goto('/features')
    expect(featuresResponse?.status()).toBe(200)
    await expect(page.locator('article[id] > div h2')).toHaveCount(13)
    await expect(page.getByRole('heading', { name: 'Admissions and CRM' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Integrations and deployment' })).toBeVisible()

    for (const path of ['/blog/ai-assisted-academy-operations', '/blog/one-operation-in-person-online-academies']) {
      const response = await page.goto(path)
      expect(response?.status()).toBe(200)
      await expect(page.locator('article h2')).toHaveCount(5)
    }
    const missing = await page.goto('/blog/not-a-real-article')
    expect(missing?.status()).toBe(404)
  })

  test('mobile navigation is keyboard-operable without horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    const toggle = page.getByRole('button', { name: 'Open menu' })
    await toggle.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('navigation', { name: 'Primary navigation' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Pricing' }).first()).toBeVisible()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow).toBeLessThanOrEqual(1)
  })

  test('legal routes are real and frameworks never imply certification', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Reference frameworks for operational alignment. No certification or official endorsement is implied.')).toBeVisible()
    for (const path of ['/legal/privacidad', '/legal/terminos', '/legal/cookies', '/legal/subencargados', '/legal/ia']) {
      const response = await page.goto(path)
      expect(response?.status()).toBe(200)
      await expect(page.getByText(/Informational draft pending professional review/i).first()).toBeVisible()
    }
  })

  test('does not request third-party analytics or marketing', async ({ page }) => {
    const trackerRequests: string[] = []
    page.on('request', (request) => {
      if (/google-analytics|googletagmanager|facebook\.net|hotjar|clarity\.ms|segment\.com/i.test(request.url())) trackerRequests.push(request.url())
    })
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    expect(trackerRequests).toEqual([])
  })

  test('key commercial routes load without failed assets or console errors', async ({ page }) => {
    const failures: string[] = []
    page.on('requestfailed', (request) => {
      if (!request.url().includes('_rsc=')) failures.push(`request:${request.url()}`)
    })
    page.on('response', (response) => {
      if (response.status() >= 400) failures.push(`response:${response.status()}:${response.url()}`)
    })
    page.on('console', (message) => {
      if (message.type() === 'error') failures.push(`console:${message.text()}`)
    })
    for (const path of ['/', '/features', '/pricing', '/blog', '/blog/ai-assisted-academy-operations', '/blog/one-operation-in-person-online-academies', '/sobre-nosotros', '/contacto']) {
      const response = await page.goto(path)
      expect(response?.status()).toBe(200)
      await page.waitForLoadState('networkidle')
    }
    expect(failures).toEqual([])
  })

  test('contact stays fail-closed until explicit privacy consent', async ({ page }) => {
    let postCount = 0
    await page.route('**/api/leads', async (route) => {
      postCount += 1
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) })
    })
    await page.goto('/contacto?asunto=demo')
    await page.getByLabel(/Full name/).fill('Ada Lovelace')
    await page.getByLabel(/Email/).fill('ada@example.com')
    await page.getByLabel(/Tell us about your academy/).fill('We need to connect in-person and online delivery across two locations.')
    await page.getByRole('button', { name: 'Send request' }).click()
    expect(postCount).toBe(0)
    await expect(page.getByText('Please accept the privacy policy before sending your request.')).toBeVisible()
    await page.getByRole('checkbox').check()
    await page.getByRole('button', { name: 'Send request' }).click()
    await expect(page.getByRole('status')).toContainText('request has been received')
    expect(postCount).toBe(1)
  })
})
