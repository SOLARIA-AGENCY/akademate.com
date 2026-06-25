import { getPayload } from 'payload'
import configPromise from '@payload-config'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

type Params = { params: Promise<{ id: string }> }

function isValidHexColor(value: unknown): value is string {
  return typeof value === 'string' && /^#[0-9A-Fa-f]{6}$/.test(value)
}

function parseId(value: string): number | null {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id: rawId } = await params
    const id = parseId(rawId)
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 })
    }

    const body = (await request.json()) as Record<string, unknown>
    const data: Record<string, unknown> = {}

    if (typeof body.nombre === 'string') data.nombre = body.nombre.trim()
    if (typeof body.codigo === 'string') data.codigo = body.codigo.trim().toUpperCase()
    if (typeof body.descripcion === 'string') data.descripcion = body.descripcion.trim()
    if (isValidHexColor(body.color)) data.color = body.color
    if (typeof body.activo === 'boolean') data.activo = body.activo

    if (!data.nombre && !data.codigo && !data.descripcion && !data.color && typeof data.activo !== 'boolean') {
      return NextResponse.json({ success: false, error: 'Sin cambios válidos' }, { status: 400 })
    }

    const payload = await getPayload({ config: configPromise })
    const area = await payload.update({
      collection: 'areas-formativas',
      id,
      data,
    })

    return NextResponse.json({ success: true, data: area })
  } catch (error) {
    console.error('Error updating area formativa:', error)
    return NextResponse.json({ success: false, error: 'Error al actualizar área formativa' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { id: rawId } = await params
    const id = parseId(rawId)
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 })
    }

    const payload = await getPayload({ config: configPromise })
    await payload.delete({
      collection: 'areas-formativas',
      id,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting area formativa:', error)
    return NextResponse.json({ success: false, error: 'Error al eliminar área formativa' }, { status: 500 })
  }
}
