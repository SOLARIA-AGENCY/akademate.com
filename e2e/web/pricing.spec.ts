import { test, expect } from '@playwright/test'

const criticalExtensions = [
  'QR attendance and mobile check-in',
  'NFC and RFID identities',
  'Physical access readers and sensors',
  'Digital Signage',
]

test.describe('Public pricing scope', () => {
  test.beforeEach(async ({ page }) => {
    const consoleErrors: string[] = []
    const failedRequests: string[] = []

    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text())
    })
    page.on('requestfailed', (request) => {
      failedRequests.push(`${request.method()} ${request.url()} — ${request.failure()?.errorText ?? 'failed'}`)
    })

    await page.goto('/precios', { waitUntil: 'networkidle' })
    await expect(page).toHaveTitle(/Pricing.*Akademate/i)
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
    const comparison = page.getByTestId('pricing-comparison')
    await expect(comparison).toBeVisible()
    for (const capability of criticalExtensions) {
      const candidates = comparison.getByText(capability, { exact: true })
      const visibleCount = await candidates.evaluateAll((elements) =>
        elements.filter((element) => {
          const style = window.getComputedStyle(element)
          return style.display !== 'none' && style.visibility !== 'hidden'
        }).length,
      )
      expect(visibleCount, `${capability} should be visible in the active responsive view`).toBeGreaterThan(0)
    }

    await expect(page.getByTestId('pricing-paid-extensions')).toContainText('Paid extension')
    await expect(page.getByTestId('pricing-separate-costs')).toContainText(/hardware/i)
    await expect(page.getByTestId('pricing-separate-costs')).toContainText(/screens/i)

    const viewport = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }))
    expect(viewport.scrollWidth - viewport.clientWidth).toBeLessThanOrEqual(1)

    await page.screenshot({ path: test.info().outputPath('pricing.png'), fullPage: true })
    expect(consoleErrors, `Console errors: ${consoleErrors.join('\n')}`).toEqual([])
    expect(failedRequests, `Failed requests: ${failedRequests.join('\n')}`).toEqual([])
  })

  test('exposes pricing from the shared navigation and contact CTA', async ({ page }) => {
    const pricingLinks = page.getByRole('link', { name: 'Precios', exact: true })
    await expect(pricingLinks.first()).toHaveAttribute('href', '/precios')
    await expect(page.getByRole('link', { name: /Request pricing/i })).toHaveAttribute(
      'href',
      '/contacto?asunto=precios',
    )
  })

  test('keeps the comparison legible on mobile', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'The mobile project owns the compact comparison assertion')

    await expect(page.locator('details').first()).toBeVisible()
    await expect(page.locator('table')).toHaveCount(0)
    await expect(
      page.locator('details').first().getByText('QR attendance and mobile check-in', { exact: true }),
    ).toBeVisible()
  })
})
