import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const CMS_URL = process.env.PAYLOAD_CMS_URL ?? 'http://localhost:3003'

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>
    if (body.gdpr_consent !== true || body.privacy_policy_accepted !== true) {
      return NextResponse.json(
        { success: false, error: 'Consentimiento de privacidad requerido' },
        { status: 400 }
      )
    }
    if (body.privacy_policy_version !== '2026-07-29') {
      return NextResponse.json(
        { success: false, error: 'Versión de privacidad requerida' },
        { status: 400 }
      )
    }
    if (body.website) return NextResponse.json({ success: true })
    const email = typeof body.email === 'string' ? body.email.trim() : ''
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, error: 'Email inválido' }, { status: 400 })
    }
    const allowed = [
      'first_name',
      'last_name',
      'email',
      'phone',
      'message',
      'gdpr_consent',
      'privacy_policy_accepted',
      'privacy_policy_version',
      'marketing_consent',
      'utm',
    ]
    const payload = Object.fromEntries(
      allowed.filter((key) => key in body).map((key) => [key, body[key]])
    )

    const response = await fetch(`${CMS_URL}/api/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data?.message || 'Error al crear lead' },
        { status: response.status }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Error al procesar la solicitud' },
      { status: 500 }
    )
  }
}
