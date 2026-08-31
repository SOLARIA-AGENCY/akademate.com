import { getPayload } from 'payload'
import configPromise from '@payload-config'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getAuthenticatedUserContext } from '../leads/_lib/auth'
import {
  addEvent,
  listEvents,
  parseAccessChannel,
  parseAccessDirection,
  parseAccessKind,
  parseAccessPass,
} from './_lib/store'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return {}
}

function nullableString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise })
    const authUser = await getAuthenticatedUserContext(request, payload)
    if (!authUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const tenantId = authUser.tenantId ?? 0
    const { searchParams } = new URL(request.url)
    const kind = parseAccessKind(searchParams.get('kind'))
    const q = searchParams.get('q')?.trim() ?? ''
    const events = listEvents(tenantId, {
      kind: kind ?? undefined,
      q: q || undefined,
    })

    return NextResponse.json({ success: true, data: events })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No se pudieron listar los accesos' },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise })
    const authUser = await getAuthenticatedUserContext(request, payload)
    if (!authUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = asRecord(await request.json().catch(() => ({})))
    const personName = typeof body.personName === 'string' ? body.personName.trim() : ''
    const kind = parseAccessKind(body.kind)
    const pass = parseAccessPass(body.pass)

    if (!personName) {
      return NextResponse.json({ error: 'personName es obligatorio' }, { status: 400 })
    }
    if (!kind) {
      return NextResponse.json({ error: 'kind es obligatorio' }, { status: 400 })
    }
    if (!pass) {
      return NextResponse.json({ error: 'pass es obligatorio' }, { status: 400 })
    }

    const event = addEvent({
      tenantId: authUser.tenantId ?? 0,
      personName,
      personId: nullableString(body.personId),
      enrollmentId: nullableString(body.enrollmentId),
      courseRunId: nullableString(body.courseRunId),
      campusName: typeof body.campusName === 'string' ? body.campusName : '',
      kind,
      pass,
      channel: parseAccessChannel(body.channel),
      direction: parseAccessDirection(body.direction),
      note: typeof body.note === 'string' ? body.note : '',
    })

    return NextResponse.json({ success: true, data: event }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No se pudo registrar el acceso' },
      { status: 500 },
    )
  }
}
