import { expect, test } from '@playwright/test'

test.describe('Akademate public claim-safe surface', () => {
  test('separates SaaS multitenant and isolated Enterprise', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('dos modelos de servicio')
    await expect(page.getByRole('heading', { name: 'Akademate SaaS multitenant' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Instancia aislada por cliente' })).toBeVisible()
    await expect(page.getByText('cepformacion.akademate.com')).toBeVisible()
    await expect(page.getByText(/no constituye certificación ni sello oficial/i).first()).toBeVisible()
  })

  test('mobile navigation is keyboard-operable', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    const toggle = page.getByRole('button', { name: 'Abrir menú' })
    await expect(toggle).toBeVisible()
    await toggle.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('navigation', { name: 'Navegación principal' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Contacto' }).first()).toBeVisible()
  })

  test('legal routes are real and include the draft boundary', async ({ page }) => {
    for (const path of ['/legal/privacidad', '/legal/terminos', '/legal/cookies', '/legal/subencargados', '/legal/ia']) {
      const response = await page.goto(path)
      expect(response?.status()).toBe(200)
      await expect(page.getByText(/borrador informativo pendiente de revisión profesional/i).first()).toBeVisible()
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

  test('contact requires consent and sends only after an explicit action', async ({ page }) => {
    let postCount = 0
    await page.route('**/api/leads', async (route) => {
      postCount += 1
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) })
    })
    await page.goto('/contacto?asunto=demo')
    await page.getByLabel('Nombre y apellidos *').fill('Ada Lovelace')
    await page.getByLabel('Email *').fill('ada@example.com')
    await page.getByLabel('Mensaje *').fill('Necesito evaluar una implantación para dos sedes.')
    await page.getByRole('button', { name: 'Enviar solicitud' }).click()
    expect(postCount).toBe(0)
    await page.getByRole('checkbox').check()
    await page.getByRole('button', { name: 'Enviar solicitud' }).click()
    await expect(page.getByRole('status')).toContainText('Solicitud recibida')
    expect(postCount).toBe(1)
  })
})
