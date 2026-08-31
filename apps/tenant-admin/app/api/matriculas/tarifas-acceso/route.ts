import { getPayload } from 'payload'
import configPromise from '@payload-config'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getAuthenticatedUserContext } from '../../leads/_lib/auth'
import {
  deleteTariff,
  listTariffs,
  parseAccessKind,
  parseTariffPeriod,
  upsertTariff,
} from './_lib/store'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return {}
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
    const data = listTariffs(tenantId, {
      kind: kind ?? undefined,
      q: q || undefined,
    })

    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No se pudieron listar las tarifas' },
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
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const kind = parseAccessKind(body.kind)
    const period = parseTariffPeriod(body.period)
    const price = typeof body.price === 'number' ? body.price : Number(body.price)
    const campusName = typeof body.campusName === 'string' ? body.campusName.trim() : ''
    const active = body.active !== false
    const id = typeof body.id === 'string' ? body.id : undefined

    if (!name) {
      return NextResponse.json({ error: 'name es obligatorio' }, { status: 400 })
    }
    if (!kind) {
      return NextResponse.json({ error: 'kind es obligatorio' }, { status: 400 })
    }
    if (!period) {
      return NextResponse.json({ error: 'period es obligatorio' }, { status: 400 })
    }
    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json({ error: 'price no es válido' }, { status: 400 })
    }

    const tariff = upsertTariff({
      id,
      tenantId: authUser.tenantId ?? 0,
      name,
      kind,
      period,
      price,
      campusName,
      active,
    })

    return NextResponse.json({ success: true, data: tariff })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No se pudo guardar la tarifa' },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise })
    const authUser = await getAuthenticatedUserContext(request, payload)
    if (!authUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')?.trim() ?? ''
    if (!id) {
      return NextResponse.json({ error: 'id es obligatorio' }, { status: 400 })
    }

    const removed = deleteTariff(authUser.tenantId ?? 0, id)
    if (!removed) {
      return NextResponse.json({ error: 'Tarifa no encontrada' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No se pudo eliminar la tarifa' },
      { status: 500 },
    )
  }
}
