import { NextResponse } from 'next/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'
import { requireV1Auth } from '@/lib/v1Auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// ============================================================================
// POST /api/v1/media
// Uploads a file to the media collection for the authenticated tenant.
// Accepts multipart/form-data with a "file" field.
// Requires: courses:write (any write scope)
// ============================================================================

export async function POST(request: Request) {
  const auth = await requireV1Auth(request, 'courses:write')
  if (!auth.ok) return auth.response

  try {
    const contentType = request.headers.get('content-type') ?? ''

    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Content-Type must be multipart/form-data', code: 'INVALID_CONTENT_TYPE' },
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const formData = await request.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'Missing "file" field in multipart form data', code: 'MISSING_FILE' },
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const payload = await getPayloadHMR({ config: configPromise })

    // Convert File to Buffer for Payload
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const created = await payload.create({
      collection: 'media',
      data: {
        tenant: Number(auth.auth.tenantId),
        alt: formData.get('alt')?.toString() ?? file.name,
      },
      file: {
        data: buffer,
        mimetype: file.type,
        name: file.name,
        size: file.size,
      },
    })

    return NextResponse.json(
      { data: created },
      { status: 201, headers: { 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('[v1/media] POST error:', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json(
      { error: message, code: 'INTERNAL_ERROR' },
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}
