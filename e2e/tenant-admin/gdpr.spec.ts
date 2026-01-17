import { test, expect } from '@playwright/test'

test.describe('Tenant-Admin - GDPR Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/configuracion/gdpr')
  })

  test('GDPR-01: settings page loads', async ({ page }) => {
    await expect(page.locator('text=GDPR & Consentimientos')).toBeVisible()
  })

  test('GDPR-02: shows user id input and actions', async ({ page }) => {
    const userIdInput = page.locator('input#userId')
    await expect(userIdInput).toBeVisible()
    await expect(page.locator('button:has-text("Cargar consentimiento")')).toBeVisible()
    await expect(page.locator('button:has-text("Guardar cambios")')).toBeVisible()
  })

  test('GDPR-03: shows consent switches', async ({ page }) => {
    const consentSwitches = page.locator('[data-state]')
    await expect(consentSwitches.first()).toBeVisible()
  })

  test('GDPR-04: shows export and delete actions', async ({ page }) => {
    await expect(page.locator('button:has-text("Exportar datos")')).toBeVisible()
    await expect(page.locator('button:has-text("Solicitar eliminación")')).toBeVisible()
  })
})
