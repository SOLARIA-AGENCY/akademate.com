import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { sendMail, welcomeUserEmail } from '../../../../src/lib/email'

/**
 * POST /api/email/send-welcome
 * Sends welcome email with credentials to a new user.
 * Called after user creation in the admin panel.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password, role } = body

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'name, email, password required' }, { status: 400 })
    }

    const tenantBaseUrl = process.env.NEXT_PUBLIC_TENANT_URL?.trim() || request.nextUrl.origin
    const loginUrl = `${tenantBaseUrl}/auth/login`

    const { subject, html } = welcomeUserEmail({
      name,
      email,
      password,
      role: role || 'lectura',
      loginUrl,
    })

    const result = await sendMail({ to: email, subject, html })

    if (result.success) {
      return NextResponse.json({ success: true, messageId: result.messageId })
    }

    return NextResponse.json({ success: false, error: result.error }, { status: 502 })
  } catch (error) {
    console.error('[email] send-welcome error:', error)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
