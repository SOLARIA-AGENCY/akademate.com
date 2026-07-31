import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { MAX_PUBLIC_FORM_BYTES, waitlistSchema } from '@/lib/public-lead-schema'
import { sendPublicNotification } from '@/lib/server/contact-notification'

const CMS_URL = process.env.PAYLOAD_CMS_URL ?? 'http://localhost:3003'

export async function POST(request: NextRequest) {
  const contentLength = Number(request.headers.get('content-length') ?? 0)
  if (contentLength > MAX_PUBLIC_FORM_BYTES) {
    return NextResponse.json({ error: 'Solicitud demasiado grande' }, { status: 413 })
  }

  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const parsed = waitlistSchema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Email o consentimiento inválido' }, { status: 400 })
  }
  if (parsed.data.website) return NextResponse.json({ success: true }, { status: 202 })

  try {
    await sendPublicNotification({ kind: 'waitlist', email: parsed.data.email })
  } catch {
    return NextResponse.json({ error: 'No se pudo enviar la solicitud' }, { status: 502 })
  }

  try {
    const response = await fetch(`${CMS_URL}/api/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: parsed.data.email,
        source: 'akademate_public_waitlist',
        status: 'new',
        gdpr_consent: true,
        privacy_policy_accepted: true,
      }),
    })
    if (response.status === 409) return NextResponse.json({ success: true })
    if (!response.ok) return NextResponse.json({ success: true })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: true })
  }
}
