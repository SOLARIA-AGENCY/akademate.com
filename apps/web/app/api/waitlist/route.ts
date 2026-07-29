import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const CMS_URL = process.env.PAYLOAD_CMS_URL ?? 'http://localhost:3003'

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      email?: string
      privacyAccepted?: boolean
      website?: string
    }
    if (body.website) return NextResponse.json({ success: true })
    const email = body.email?.trim()

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
    }
    if (body.privacyAccepted !== true)
      return NextResponse.json({ error: 'Consentimiento de privacidad requerido' }, { status: 400 })

    // Guardar en Payload CMS como lead con source=waitlist
    const response = await fetch(`${CMS_URL}/api/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        source: 'waitlist',
        status: 'new',
        notes: 'Registro desde landing coming soon akademate.com',
        gdpr_consent: true,
        privacy_policy_accepted: true,
        marketing_consent: false,
      }),
    })

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { message?: string }
      // Si ya existe el email (409 conflict), devolver éxito igualmente
      if (response.status === 409) {
        return NextResponse.json({ success: true, message: 'Ya estás en la lista' })
      }
      return NextResponse.json(
        { error: data.message ?? 'Error al registrar el email' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Error de conexión' }, { status: 500 })
  }
}
