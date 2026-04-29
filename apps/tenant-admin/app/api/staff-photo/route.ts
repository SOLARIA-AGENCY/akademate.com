import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const SESSION_COOKIE = 'akademate_session'
const LEGACY_SESSION_COOKIE = 'cep_session'
const MAX_IMAGE_SIZE = 10 * 1024 * 1024
const ALLOWED_ROLES = new Set(['admin', 'gestor', 'marketing', 'asesor'])

interface SessionUser {
  id: string | number
  email?: string
  role?: string
}

interface CreatedMediaDoc {
  id: string | number
  filename?: string | null
  url?: string | null
}

function getMediaUrl(doc: { url?: string | null; filename?: string | null }) {
  if (doc.url) return doc.url
  if (doc.filename) return `/media/${doc.filename}`
  return null
}

async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const serializedSession =
    cookieStore.get(SESSION_COOKIE)?.value || cookieStore.get(LEGACY_SESSION_COOKIE)?.value

  if (!serializedSession) return null

  const candidates = [serializedSession]
  try {
    const decoded = decodeURIComponent(serializedSession)
    if (decoded !== serializedSession) candidates.push(decoded)
  } catch {
    // Keep the raw value if the cookie is not URL-encoded.
  }

  for (const candidate of candidates) {
    try {
      const session = JSON.parse(candidate) as { user?: SessionUser }
      if (session.user) return session.user
    } catch {
      // Try the next representation.
    }
  }

  return null
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser()
    if (!user?.id || !user.role || !ALLOWED_ROLES.has(user.role)) {
      return NextResponse.json(
        { success: false, error: 'No autorizado para subir fotografías' },
        { status: 401 },
      )
    }

    const contentType = request.headers.get('content-type') ?? ''
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { success: false, error: 'La subida debe ser multipart/form-data' },
        { status: 400 },
      )
    }

    const formData = await request.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: 'Falta el archivo de imagen' },
        { status: 400 },
      )
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: 'Solo se permiten imágenes para la foto del profesor' },
        { status: 400 },
      )
    }

    if (file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'La imagen no puede superar 10 MB' },
        { status: 400 },
      )
    }

    const payload = await getPayloadHMR({ config: configPromise })
    const buffer = Buffer.from(await file.arrayBuffer())
    const alt = formData.get('alt')?.toString().trim() || 'Foto de profesor'
    const mediaData = {
      alt,
      folder: 'staff/photos',
    }

    const created = (await payload.create({
      collection: 'media',
      data: mediaData,
      file: {
        data: buffer,
        mimetype: file.type,
        name: file.name,
        size: file.size,
      },
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    })) as CreatedMediaDoc

    return NextResponse.json({
      success: true,
      doc: {
        id: created.id,
        filename: created.filename,
        url: getMediaUrl(created),
      },
    })
  } catch (error) {
    console.error('[staff-photo] upload error:', error)
    const message = error instanceof Error ? error.message : 'No se pudo subir la fotografía'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
