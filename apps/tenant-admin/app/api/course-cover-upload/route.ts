import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'
import sharp from 'sharp'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const SESSION_COOKIE = 'akademate_session'
const LEGACY_SESSION_COOKIE = 'cep_session'
const MAX_IMAGE_SIZE = 12 * 1024 * 1024
const MAX_WIDTH = 1600
const MAX_HEIGHT = 900
const WEBP_QUALITY = 84
const ALLOWED_ROLES = new Set(['superadmin', 'admin', 'gestor', 'marketing', 'asesor', 'lectura'])

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

function normalizeFilename(filename: string) {
  const baseName = filename
    .replace(/\.[^.]+$/, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)

  return `${baseName || 'course-cover'}-${Date.now()}.webp`
}

async function optimizeCourseCover(file: File): Promise<OptimizedImage> {
  const originalBuffer = Buffer.from(await file.arrayBuffer())
  const optimizedBuffer = await sharp(originalBuffer, { failOn: 'none' })
    .rotate()
    .resize({
      width: MAX_WIDTH,
      height: MAX_HEIGHT,
      fit: 'cover',
      position: 'centre',
      withoutEnlargement: false,
    })
    .webp({
      quality: WEBP_QUALITY,
      effort: 5,
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
    // keep raw value
  }

  for (const candidate of candidates) {
    try {
      const session = JSON.parse(candidate) as { user?: SessionUser }
      if (session.user) return session.user
    } catch {
      // try next representation
    }
  }

  return null
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser()
    if (!user?.id || !user.role || !ALLOWED_ROLES.has(user.role)) {
      return NextResponse.json(
        { success: false, error: 'No autorizado para subir portadas de curso' },
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
    const courseId = Number.parseInt(formData.get('courseId')?.toString() || '', 10)
    const courseName = formData.get('courseName')?.toString().trim() || 'Curso'

    if (!Number.isFinite(courseId) || courseId <= 0) {
      return NextResponse.json(
        { success: false, error: 'courseId es obligatorio' },
        { status: 400 },
      )
    }

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: 'Falta el archivo de imagen' },
        { status: 400 },
      )
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: 'Solo se permiten imagenes para la portada del curso' },
        { status: 400 },
      )
    }

    if (file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'La imagen no puede superar 12 MB' },
        { status: 400 },
      )
    }

    const payload = await getPayloadHMR({ config: configPromise })
    const optimizedImage = await optimizeCourseCover(file)
    const mediaData = {
      alt: `Portada del curso ${courseName}`,
      folder: 'courses/private-ai',
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

    await payload.update({
      collection: 'courses',
      id: courseId,
      data: {
        featured_image: Number(created.id),
      },
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    })

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
    console.error('[course-cover-upload] upload error:', error)
    const message = error instanceof Error ? error.message : 'No se pudo subir la portada del curso'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
