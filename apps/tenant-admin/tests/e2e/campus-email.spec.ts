import { expect, test, type APIRequestContext } from '@playwright/test'

const baseURL = process.env.CAMPUS_E2E_BASE_URL || process.env.TEST_URL || 'http://localhost:3009'
const mailpitURL = process.env.CAMPUS_MAILPIT_URL || 'http://localhost:18025'
const enabled = process.env.CAMPUS_EMAIL_E2E_ENABLED === 'true'
const adminEmail = process.env.CAMPUS_E2E_ADMIN_EMAIL || ''
const adminPassword = process.env.CAMPUS_E2E_ADMIN_PASSWORD || ''
const studentEmail = process.env.CAMPUS_E2E_EMAIL || ''
const studentId = process.env.CAMPUS_E2E_STUDENT_ID || '1'

function assertSafeTarget() {
  const url = new URL(baseURL)
  const hostname = url.hostname.toLowerCase()
  const isLocal = ['localhost', '127.0.0.1'].includes(hostname)
  const isStaging = hostname.includes('staging') || process.env.CAMPUS_E2E_STAGING_CONFIRMED === 'true'
  if (!isLocal && !isStaging) {
    throw new Error(`El E2E de correo solo admite localhost/staging, recibido: ${baseURL}`)
  }
}

async function clearMailpit(request: APIRequestContext) {
  const response = await request.delete(`${mailpitURL}/api/v1/messages`)
  expect(response.ok()).toBeTruthy()
}

async function waitForMessage(request: APIRequestContext, subjectPart: string) {
  const deadline = Date.now() + 10_000
  while (Date.now() < deadline) {
    const response = await request.get(`${mailpitURL}/api/v1/messages?limit=20`)
    expect(response.ok()).toBeTruthy()
    const listing = await response.json() as { messages?: Array<Record<string, unknown>> }
    const message = (listing.messages ?? []).find((item) => {
      const subject = String(item.Subject ?? item.subject ?? '')
      return subject.includes(subjectPart)
    })
    if (message) {
      const id = String(message.ID ?? message.id ?? '')
      expect(id).not.toBe('')
      const detailResponse = await request.get(`${mailpitURL}/api/v1/message/${encodeURIComponent(id)}`)
      expect(detailResponse.ok()).toBeTruthy()
      return detailResponse.json() as Promise<Record<string, unknown>>
    }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw new Error(`No se recibió en Mailpit un correo cuyo asunto contenga: ${subjectPart}`)
}

function extractToken(message: Record<string, unknown>, path: 'activar' | 'restablecer') {
  const serialized = JSON.stringify(message)
  const match = serialized.match(new RegExp(`/campus/${path}\\?token=([a-f0-9]{64})`, 'i'))
  if (!match) throw new Error(`No se encontró token de ${path} en el correo capturado.`)
  return match[1]
}

test.describe('Campus Virtual - correo E2E aislado', () => {
  test.skip(!enabled, 'E2E de correo requiere CAMPUS_EMAIL_E2E_ENABLED=true.')

  test('invita, activa, recupera y consume tokens de un solo uso', async ({ request }) => {
    assertSafeTarget()
    expect(adminEmail).not.toBe('')
    expect(adminPassword).not.toBe('')
    expect(studentEmail).not.toBe('')

    const adminLogin = await request.post(`${baseURL}/api/users/login`, {
      data: { email: adminEmail, password: adminPassword },
    })
    expect(adminLogin.status()).toBe(200)

    await clearMailpit(request)
    const invite = await request.post(`${baseURL}/api/campus/auth/invite`, {
      data: { studentId },
    })
    expect(invite.status()).toBe(200)
    expect((await invite.json()).emailSent).toBe(true)

    const invitation = await waitForMessage(request, 'Activa tu acceso al Campus Virtual')
    const setupToken = extractToken(invitation, 'activar')
    const activatedPassword = 'Campus-Mail-2026!'
    const activation = await request.post(`${baseURL}/api/campus/auth/activate`, {
      data: { token: setupToken, password: activatedPassword },
    })
    expect(activation.status()).toBe(200)

    const reusedActivation = await request.post(`${baseURL}/api/campus/auth/activate`, {
      data: { token: setupToken, password: activatedPassword },
    })
    expect(reusedActivation.status()).toBe(410)

    const studentLogin = await request.post(`${baseURL}/api/campus/auth/login`, {
      data: { email: studentEmail, password: activatedPassword },
    })
    expect(studentLogin.status()).toBe(200)
    await request.post(`${baseURL}/api/campus/auth/logout`)

    await clearMailpit(request)
    const recovery = await request.post(`${baseURL}/api/campus/auth/recover`, {
      data: { email: studentEmail },
    })
    expect(recovery.status()).toBe(200)

    const recoveryMessage = await waitForMessage(request, 'Recupera tu acceso al Campus Virtual')
    const recoveryToken = extractToken(recoveryMessage, 'restablecer')
    const resetPassword = 'Campus-Reset-2026!'
    const reset = await request.post(`${baseURL}/api/campus/auth/reset`, {
      data: { token: recoveryToken, password: resetPassword },
    })
    expect(reset.status()).toBe(200)

    const reusedReset = await request.post(`${baseURL}/api/campus/auth/reset`, {
      data: { token: recoveryToken, password: resetPassword },
    })
    expect(reusedReset.status()).toBe(410)

    const resetLogin = await request.post(`${baseURL}/api/campus/auth/login`, {
      data: { email: studentEmail, password: resetPassword },
    })
    expect(resetLogin.status()).toBe(200)
  })
})
