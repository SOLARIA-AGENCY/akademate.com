import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { validatePublicLeadInput } from '@/lib/public-forms'

const CMS_URL = process.env.PAYLOAD_CMS_URL ?? 'http://localhost:3003'

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json()
    const validation = validatePublicLeadInput(body)
    if (!validation.ok) {
      return NextResponse.json({ success: false, error: validation.error }, { status: 400 })
    }

    const response = await fetch(`${CMS_URL}/api/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
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
