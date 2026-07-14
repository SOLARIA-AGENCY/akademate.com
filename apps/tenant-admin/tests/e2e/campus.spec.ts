import { test, expect } from '@playwright/test'

const baseURL = process.env.CAMPUS_E2E_BASE_URL || process.env.TEST_URL || 'http://localhost:3009'
const e2eEnabled = process.env.CAMPUS_E2E_ENABLED === 'true'
const studentEmail = process.env.CAMPUS_E2E_EMAIL || ''
const studentPassword = process.env.CAMPUS_E2E_PASSWORD || ''

function assertNonProductionUrl(): void {
  const url = new URL(baseURL)
  const isLocal = url.hostname === 'localhost' || url.hostname === '127.0.0.1'
  const isExplicitStaging = url.hostname.includes('staging') || process.env.CAMPUS_E2E_STAGING_CONFIRMED === 'true'
  if (!isLocal && !isExplicitStaging) {
    throw new Error('Campus E2E bloqueado: la URL no esta identificada como local o staging.')
  }
}

test.describe('Campus Virtual - contrato E2E aislado', () => {
  test.skip(!e2eEnabled, 'E2E de Campus requiere CAMPUS_E2E_ENABLED=true y credenciales ficticias de staging.')

  test.beforeEach(async ({ page }) => {
    assertNonProductionUrl()
    if (!studentEmail || !studentPassword) {
      throw new Error('Faltan CAMPUS_E2E_EMAIL y CAMPUS_E2E_PASSWORD para el seed ficticio de staging.')
    }
    await page.context().clearCookies()
  })

  test('inicia sesion y usa una cookie httpOnly de Campus', async ({ page }) => {
    await page.goto('/campus/login')
    await page.waitForLoadState('networkidle')
    await page.getByLabel(/correo electronico/i).fill(studentEmail)
    await page.getByLabel(/contrasena/i).fill(studentPassword)
    const loginButton = page.getByRole('button', { name: /iniciar sesion/i })
    await expect(loginButton).toBeEnabled()
    await loginButton.click()

    await expect(page).toHaveURL(/\/campus(?:\?|$)/)
    const cookies = await page.context().cookies()
    const sessionCookie = cookies.find((cookie) => cookie.name === 'campus_session')
    expect(sessionCookie).toBeDefined()
    expect(sessionCookie?.httpOnly).toBe(true)
  })

  test('mantiene sesion en una ruta protegida y la cierra con logout', async ({ page }) => {
    await page.goto('/campus/login')
    await page.waitForLoadState('networkidle')
    await page.getByLabel(/correo electronico/i).fill(studentEmail)
    await page.getByLabel(/contrasena/i).fill(studentPassword)
    const loginButton = page.getByRole('button', { name: /iniciar sesion/i })
    await expect(loginButton).toBeEnabled()
    await loginButton.click()
    await expect(page).toHaveURL(/\/campus(?:\?|$)/)

    const sessionResponse = await page.request.get('/api/campus/auth/session')
    expect(sessionResponse.status()).toBe(200)
    expect((await sessionResponse.json()).success).toBe(true)

    await page.getByRole('button', { name: /abrir menu de usuario/i }).click()
    await page.getByRole('menuitem', { name: /cerrar sesion|salir/i }).click()
    await expect(page).toHaveURL(/\/campus\/login/)

    const afterLogout = await page.request.get('/api/campus/auth/session')
    expect(afterLogout.status()).toBe(401)
  })

  test('rechaza una consulta LMS sin cookie de Campus', async ({ page }) => {
    const response = await page.request.get('/api/lms/enrollments')
    expect(response.status()).toBe(401)
  })
})
