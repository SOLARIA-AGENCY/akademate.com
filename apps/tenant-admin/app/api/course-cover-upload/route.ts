import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import sharp from 'sharp'
import { SESSION_V2_COOKIE, verifyAvailableSession } from '@/lib/server/session'
import { createPayloadIdentityResolver, type PrincipalUser } from '@/lib/server/payload-principal'
import { enforceSensitiveRateLimit, sensitiveRateLimitResponse } from '@/lib/server/rate-limit'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

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

async function getSessionUser(payload: Awaited<ReturnType<typeof getPayload>>): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const users = new Map<string, PrincipalUser>()
  const verified = await verifyAvailableSession({
    payloadToken: cookieStore.get('payload-token')?.value,
    sessionV2: cookieStore.get(SESSION_V2_COOKIE)?.value,
  }, {
    resolveIdentity: createPayloadIdentityResolver(payload, users),
    requireResolvedIdentity: true,
  })
  if (!verified) return null
  const user = users.get(verified.principal.userId)
  return {
    id: verified.principal.userId,
    email: user?.email ?? undefined,
    role: verified.principal.roles[0],
  }
}

export async function POST(request: Request) {
  try {
    const payload = await getPayload({ config: configPromise })
    const user = await getSessionUser(payload)
    if (!user?.id || !user.role || !ALLOWED_ROLES.has(user.role)) {
      return NextResponse.json(
        { success: false, error: 'No autorizado para subir portadas de curso' },
        { status: 401 },
      )
    }
    const rateLimit = await enforceSensitiveRateLimit(request, { action: 'upload', principalId: user.id })
    if (!rateLimit.allowed) return sensitiveRateLimitResponse(rateLimit)

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
    }, { headers: rateLimit.headers })
  } catch (error) {
    console.error('[course-cover-upload] upload error:', error)
    const message = error instanceof Error ? error.message : 'No se pudo subir la portada del curso'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
