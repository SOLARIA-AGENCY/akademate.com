import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { sendMail, platformAccessEmail } from '../../../../src/lib/email'

/**
 * POST /api/email/send-access
 * Sends platform access / open doors email with hero image and credentials.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password, role } = body

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'name, email, password required' }, { status: 400 })
    }

    const loginUrl = `${process.env.NEXT_PUBLIC_TENANT_URL || 'https://cepformacion.akademate.com'}/auth/login`
    const heroImageUrl = `${process.env.NEXT_PUBLIC_TENANT_URL || 'https://cepformacion.akademate.com'}/og-image.png`

    const { subject, html } = platformAccessEmail({
      name,
      email,
      password,
      role: role || 'lectura',
      loginUrl,
      heroImageUrl,
    })

    const result = await sendMail({ to: email, subject, html })

    if (result.success) {
      return NextResponse.json({ success: true, messageId: result.messageId })
    }

    return NextResponse.json({ success: false, error: result.error }, { status: 502 })
  } catch (error) {
    console.error('[email] send-access error:', error)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
