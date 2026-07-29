import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { MAX_PUBLIC_FORM_BYTES, publicLeadSchema } from '@/lib/public-lead-schema'

const CMS_URL = process.env.PAYLOAD_CMS_URL ?? 'http://localhost:3003'

export async function POST(request: NextRequest) {
  const contentLength = Number(request.headers.get('content-length') ?? 0)
  if (contentLength > MAX_PUBLIC_FORM_BYTES) {
    return NextResponse.json({ success: false, error: 'Solicitud demasiado grande' }, { status: 413 })
  }

  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'JSON inválido' }, { status: 400 })
  }

  const parsed = publicLeadSchema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Revisa los campos y acepta la política de privacidad' },
      { status: 400 }
    )
  }

  if (parsed.data.website) {
    return NextResponse.json({ success: true }, { status: 202 })
  }

  const { website: _honeypot, subject, privacy_policy_accepted, ...lead } = parsed.data

  try {
    const response = await fetch(`${CMS_URL}/api/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...lead,
        source: 'akademate_public_contact',
        message: `[${subject}] ${lead.message}`,
        gdpr_consent: privacy_policy_accepted,
        privacy_policy_accepted,
      }),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: 'No se pudo registrar la solicitud' },
        { status: response.status >= 400 && response.status < 500 ? response.status : 502 }
      )
    }
    return NextResponse.json({ success: true, data })
  } catch {
    return NextResponse.json(
      { success: false, error: 'El servicio de contacto no está disponible' },
      { status: 502 }
    )
  }
}
