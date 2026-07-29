import { expect, test } from '@playwright/test'

test('homepage is claim-safe and all visible internal links resolve', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('base operativa')
  await expect(page.getByRole('note', { name: /no es una certificación/i }).first()).toBeVisible()
  await expect(page.locator('body')).not.toContainText(/50\+ academias|4\.9\/5|MCP nativo/i)

  const hrefs = await page.locator('a[href]').evaluateAll((links) => links.map((link) => link.getAttribute('href')).filter(Boolean) as string[])
  for (const href of [...new Set(hrefs)].filter((href) => href.startsWith('/') && !href.includes('#'))) {
    const response = await page.request.get(href)
    expect(response.status(), href).toBeLessThan(400)
  }
  expect(errors).toEqual([])
})

test('legal center exposes five coherent routes and no tracker banner without trackers', async ({ page }) => {
  for (const route of ['/legal/privacidad', '/legal/terminos', '/legal/cookies', '/legal/subencargados', '/legal/transparencia-ia']) {
    const response = await page.goto(route)
    expect(response?.status(), route).toBe(200)
    await expect(page.getByRole('note', { name: /no es una certificación/i }).first()).toBeVisible()
  }
  await page.goto('/legal/cookies')
  await expect(page.getByText(/No hay rastreadores opcionales/i)).toBeVisible()
  await expect(page.getByRole('dialog', { name: /cookies|consentimiento/i })).toHaveCount(0)
})

test('contact consent blocks the request and accepted consent stays non-marketing', async ({ page }) => {
  let requests = 0
  let submittedBody: Record<string, unknown> | null = null
  await page.route('**/api/leads', async (route) => {
    requests += 1
    submittedBody = route.request().postDataJSON() as Record<string, unknown>
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) })
  })
  await page.goto('/contacto')
  await page.getByLabel('Nombre y apellidos *').fill('Persona Prueba')
  await page.getByLabel('Email *').fill('persona@example.com')
  await page.getByLabel('Asunto *').selectOption('demo')
  await page.getByLabel('Mensaje *').fill('Quiero validar el alcance.')
  await page.getByRole('button', { name: 'Enviar mensaje' }).click()
  await expect(page.getByRole('alert')).toContainText('política de privacidad')
  expect(requests).toBe(0)
  await page.getByLabel(/Acepto la política de privacidad/i).check()
  await page.getByRole('button', { name: 'Enviar mensaje' }).click()
  await expect(page.getByRole('status')).toContainText('Mensaje enviado')
  expect(requests).toBe(1)
  expect(submittedBody?.marketing_consent).toBe(false)
})

test('mobile navigation is operable without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  const menu = page.locator('button[aria-controls="mobile-navigation"]')
  await menu.click()
  await expect(menu).toHaveAttribute('aria-expanded', 'true')
  await expect(page.getByRole('link', { name: 'Contacto' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
})
