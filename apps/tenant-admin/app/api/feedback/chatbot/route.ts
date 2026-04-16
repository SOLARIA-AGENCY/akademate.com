import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { sendMail } from '../../../../src/lib/email'

export const dynamic = 'force-dynamic'

const PRIMARY_FEEDBACK_INBOX = 'agency.solaria@gmail.com'
const FEEDBACK_INBOX = [
  PRIMARY_FEEDBACK_INBOX,
  ...(process.env.CEP_FEEDBACK_INBOX
    ? process.env.CEP_FEEDBACK_INBOX
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    : []),
]
  .filter((value, index, self) => self.indexOf(value) === index)
  .join(', ')
const SESSION_COOKIE_NAMES = ['akademate_session', 'cep_session'] as const

const FeedbackPayloadSchema = z.object({
  prompt: z.string().trim().min(8).max(4000),
  location: z.string().trim().max(512).optional(),
  context: z
    .object({
      currentUrl: z.string().trim().max(2048).optional(),
      pageTitle: z.string().trim().max(256).optional(),
      happenedAt: z.string().trim().max(64).optional(),
      viewport: z
        .object({
          width: z.number().int().min(0).max(10000).optional(),
          height: z.number().int().min(0).max(10000).optional(),
        })
        .optional(),
    })
    .optional(),
})

type SessionUser = {
  id?: string | number
  name?: string
  email?: string
  role?: string
  tenantId?: string | number
  tenant?: string | number | { id?: string | number }
}

function escapeHtml(value: unknown): string {
  const input = typeof value === 'string' ? value : String(value ?? '')
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function parseSessionUser(request: NextRequest): SessionUser | null {
  for (const cookieName of SESSION_COOKIE_NAMES) {
    const raw = request.cookies.get(cookieName)?.value
    if (!raw) continue

    const candidates: string[] = [raw]
    try {
      const decoded = decodeURIComponent(raw)
      if (decoded !== raw) candidates.push(decoded)
    } catch {
      // Ignore decoding errors and keep trying raw value.
    }

    for (const candidate of candidates) {
      try {
        const parsed = JSON.parse(candidate) as { user?: SessionUser }
        if (parsed?.user && typeof parsed.user === 'object') {
          return parsed.user
        }
      } catch {
        // Ignore parse errors and continue.
      }
    }
  }
  return null
}

function parsePayloadTokenUser(request: NextRequest): SessionUser | null {
  const token = request.cookies.get('payload-token')?.value
  if (!token) return null
  const payloadSegment = token.split('.')[1]
  if (!payloadSegment) return null

  try {
    const normalized = payloadSegment.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=')
    const decoded = Buffer.from(padded, 'base64').toString('utf8')
    const payload = JSON.parse(decoded) as Record<string, unknown>

    return {
      id: (payload.id as string | number | undefined) ?? (payload.sub as string | number | undefined),
      name: payload.name as string | undefined,
      email: payload.email as string | undefined,
      role: payload.role as string | undefined,
      tenantId: payload.tenantId as string | number | undefined,
      tenant: payload.tenant as string | number | { id?: string | number } | undefined,
    }
  } catch {
    return null
  }
}

function resolveTenantLabel(user: SessionUser | null): string {
  if (!user) return 'desconocido'
  if (typeof user.tenantId === 'number' || typeof user.tenantId === 'string') {
    return String(user.tenantId)
  }
  if (typeof user.tenant === 'number' || typeof user.tenant === 'string') {
    return String(user.tenant)
  }
  if (typeof user.tenant === 'object' && user.tenant && 'id' in user.tenant) {
    return String((user.tenant as { id?: string | number }).id ?? 'desconocido')
  }
  return 'desconocido'
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = FeedbackPayloadSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Payload de feedback inválido', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const payload = parsed.data
    const sessionUser = parseSessionUser(request) ?? parsePayloadTokenUser(request)
    const userAgent = request.headers.get('user-agent') || 'desconocido'
    const referer = request.headers.get('referer') || 'desconocido'
    const host = request.headers.get('host') || request.nextUrl.host || 'desconocido'
    const forwardedFor = request.headers.get('x-forwarded-for') || 'desconocido'
    const feedbackId = `fbk-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const createdAt = new Date().toISOString()
    const location = payload.location || request.nextUrl.pathname

    const html = `
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 0;">
      <tr>
        <td align="center">
          <table width="680" cellpadding="0" cellspacing="0" style="max-width:680px;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="background:#e3003a;color:#ffffff;padding:20px 24px;">
                <p style="margin:0;font-size:13px;letter-spacing:0.2px;text-transform:uppercase;">feedback CEPFORMACION.AKADEMATE</p>
                <h1 style="margin:8px 0 0;font-size:22px;">Nuevo feedback de usuario</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:24px;">
                <p style="margin:0 0 14px;font-size:14px;color:#111827;"><strong>ID:</strong> ${escapeHtml(feedbackId)}</p>
                <p style="margin:0 0 18px;font-size:14px;color:#111827;"><strong>Fecha:</strong> ${escapeHtml(createdAt)}</p>
                <h2 style="margin:0 0 8px;font-size:16px;color:#111827;">Prompt del usuario</h2>
                <div style="border:1px solid #e5e7eb;border-radius:8px;padding:14px;background:#fafafa;color:#111827;font-size:14px;line-height:1.5;white-space:pre-wrap;">${escapeHtml(payload.prompt)}</div>

                <h2 style="margin:22px 0 8px;font-size:16px;color:#111827;">Ubicación del problema</h2>
                <ul style="margin:0;padding-left:18px;color:#111827;font-size:14px;line-height:1.6;">
                  <li><strong>Ruta reportada:</strong> ${escapeHtml(location)}</li>
                  <li><strong>URL actual:</strong> ${escapeHtml(payload.context?.currentUrl ?? 'no informada')}</li>
                  <li><strong>Título de página:</strong> ${escapeHtml(payload.context?.pageTitle ?? 'no informado')}</li>
                </ul>

                <h2 style="margin:22px 0 8px;font-size:16px;color:#111827;">Usuario identificado</h2>
                <ul style="margin:0;padding-left:18px;color:#111827;font-size:14px;line-height:1.6;">
                  <li><strong>ID:</strong> ${escapeHtml(sessionUser?.id ?? 'anónimo')}</li>
                  <li><strong>Nombre:</strong> ${escapeHtml(sessionUser?.name ?? 'no disponible')}</li>
                  <li><strong>Email:</strong> ${escapeHtml(sessionUser?.email ?? 'no disponible')}</li>
                  <li><strong>Rol:</strong> ${escapeHtml(sessionUser?.role ?? 'no disponible')}</li>
                  <li><strong>Tenant:</strong> ${escapeHtml(resolveTenantLabel(sessionUser))}</li>
                </ul>

                <h2 style="margin:22px 0 8px;font-size:16px;color:#111827;">Contexto técnico</h2>
                <ul style="margin:0;padding-left:18px;color:#111827;font-size:14px;line-height:1.6;">
                  <li><strong>Host:</strong> ${escapeHtml(host)}</li>
                  <li><strong>IP (X-Forwarded-For):</strong> ${escapeHtml(forwardedFor)}</li>
                  <li><strong>User-Agent:</strong> ${escapeHtml(userAgent)}</li>
                  <li><strong>Referer:</strong> ${escapeHtml(referer)}</li>
                  <li><strong>Viewport:</strong> ${escapeHtml(
                    payload.context?.viewport?.width && payload.context?.viewport?.height
                      ? `${payload.context.viewport.width}x${payload.context.viewport.height}`
                      : 'no informado',
                  )}</li>
                  <li><strong>Evento cliente:</strong> ${escapeHtml(payload.context?.happenedAt ?? 'no informado')}</li>
                </ul>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`

    const subject = `feedback CEPFORMACION.AKADEMATE | ${feedbackId}`
    const mailResult = await sendMail({
      to: FEEDBACK_INBOX,
      subject,
      html,
      replyTo:
        typeof sessionUser?.email === 'string' && sessionUser.email.trim().length > 0
          ? sessionUser.email
          : undefined,
    })

    if (!mailResult.success) {
      return NextResponse.json(
        { error: 'No se pudo enviar el feedback por email', details: mailResult.error },
        { status: 502 },
      )
    }

    return NextResponse.json({
      success: true,
      feedbackId,
      destination: FEEDBACK_INBOX,
      messageId: mailResult.messageId,
    })
  } catch (error) {
    console.error('[/api/feedback/chatbot] POST error:', error)
    return NextResponse.json(
      { error: 'Error interno al enviar feedback' },
      { status: 500 },
    )
  }
}
