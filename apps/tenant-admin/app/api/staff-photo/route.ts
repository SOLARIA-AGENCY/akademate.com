import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'
import sharp from 'sharp'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const SESSION_COOKIE = 'akademate_session'
const LEGACY_SESSION_COOKIE = 'cep_session'
const MAX_IMAGE_SIZE = 10 * 1024 * 1024
const MAX_OPTIMIZED_DIMENSION = 1200
const WEBP_QUALITY = 82
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

interface OptimizedImage {
  buffer: Buffer
  filename: string
  mimetype: 'image/webp'
  originalSize: number
  optimizedSize: number
}

function getMediaUrl(doc: { url?: string | null; filename?: string | null }) {
  if (doc.url) return doc.url
  if (doc.filename) return `/api/media/file/${doc.filename}`
  return null
}

function normalizeFilename(filename: string): string {
  const baseName = filename
    .replace(/\.[^.]+$/, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)

  return `${baseName || 'foto-profesor'}-${Date.now()}.webp`
}

async function optimizeStaffPhoto(file: File): Promise<OptimizedImage> {
  const originalBuffer = Buffer.from(await file.arrayBuffer())
  const optimizedBuffer = await sharp(originalBuffer, { failOn: 'none' })
    .rotate()
    .resize({
      width: MAX_OPTIMIZED_DIMENSION,
      height: MAX_OPTIMIZED_DIMENSION,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({
      quality: WEBP_QUALITY,
      effort: 4,
    })
    .toBuffer()

  return {
    buffer: optimizedBuffer,
    filename: normalizeFilename(file.name),
    mimetype: 'image/webp',
    originalSize: file.size,
    optimizedSize: optimizedBuffer.length,
  }
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
    const optimizedImage = await optimizeStaffPhoto(file)
    const alt = formData.get('alt')?.toString().trim() || 'Foto de profesor'
    const mediaData = {
      alt,
      folder: 'staff/photos',
    }

    const created = (await payload.create({
      collection: 'media',
      data: mediaData,
      file: {
        data: optimizedImage.buffer,
        mimetype: optimizedImage.mimetype,
        name: optimizedImage.filename,
        size: optimizedImage.optimizedSize,
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
        optimized: {
          format: 'webp',
          originalSize: optimizedImage.originalSize,
          optimizedSize: optimizedImage.optimizedSize,
        },
      },
    })
  } catch (error) {
    console.error('[staff-photo] upload error:', error)
    const message = error instanceof Error ? error.message : 'No se pudo subir la fotografía'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
