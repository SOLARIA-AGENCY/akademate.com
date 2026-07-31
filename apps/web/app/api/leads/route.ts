import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { MAX_PUBLIC_FORM_BYTES, publicLeadSchema } from '@/lib/public-lead-schema'
import { sendPublicNotification } from '@/lib/server/contact-notification'

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
    await sendPublicNotification({
      kind: 'contact',
      firstName: lead.first_name,
      lastName: lead.last_name,
      email: lead.email,
      phone: lead.phone,
      subject,
      message: lead.message,
      utm: lead.utm,
    })
  } catch {
    return NextResponse.json(
      { success: false, error: 'No se pudo enviar la solicitud' },
      { status: 502 }
    )
  }

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
    if (!response.ok) return NextResponse.json({ success: true })
    return NextResponse.json({ success: true, data })
  } catch {
    return NextResponse.json({ success: true })
  }
}
