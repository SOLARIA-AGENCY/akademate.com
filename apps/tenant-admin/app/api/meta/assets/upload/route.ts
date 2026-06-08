import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const SESSION_COOKIE = 'akademate_session'
const LEGACY_SESSION_COOKIE = 'cep_session'
const MAX_ASSET_SIZE = 50 * 1024 * 1024
const ALLOWED_ROLES = new Set(['superadmin', 'admin', 'gestor', 'marketing', 'asesor'])
const ALLOWED_RATIOS = new Set(['1:1', '9:16', '16:9'])

interface SessionUser {
  id: string | number
  email?: string
  role?: string
}

interface CreatedMediaDoc {
  id: string | number
  filename?: string | null
  url?: string | null
  mimeType?: string | null
  filesize?: number | null
  width?: number | null
  height?: number | null
}

interface UploadFileLike {
  name: string
  type: string
  size: number
  arrayBuffer: () => Promise<ArrayBuffer>
}

async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const serializedSession = cookieStore.get(SESSION_COOKIE)?.value || cookieStore.get(LEGACY_SESSION_COOKIE)?.value
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
      // try next candidate
    }
  }
  return null
}

function getMediaUrl(doc: { url?: string | null; filename?: string | null }) {
  if (doc.url) return doc.url
  if (doc.filename) return `/api/media/file/${doc.filename}`
  return null
}

function normalizeFilename(filename: string, ratio: string) {
  const ext = filename.includes('.') ? filename.split('.').pop() || 'bin' : 'bin'
  const baseName = filename
    .replace(/\.[^.]+$/, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
  return `${baseName || 'meta-ad'}-${ratio.replace(':', 'x')}-${Date.now()}.${ext}`
}

function isUploadFileLike(value: unknown): value is UploadFileLike {
  const file = value as Partial<UploadFileLike>
  return Boolean(
    file &&
      typeof file === 'object' &&
      typeof file.name === 'string' &&
      typeof file.type === 'string' &&
      typeof file.size === 'number' &&
      typeof file.arrayBuffer === 'function',
  )
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser()
    if (!user?.id || !user.role || !ALLOWED_ROLES.has(user.role)) {
      return NextResponse.json({ success: false, error: 'No autorizado para subir creatividades Meta' }, { status: 401 })
    }

    const contentType = request.headers.get('content-type') ?? ''
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ success: false, error: 'La subida debe ser multipart/form-data' }, { status: 400 })
    }

    const formData = await request.formData()
    const file = formData.get('file')
    const ratio = String(formData.get('ratio') || '').trim()
    const convocatoriaId = String(formData.get('convocatoriaId') || '').trim()
    const courseName = String(formData.get('courseName') || 'Convocatoria').trim()

    if (!ALLOWED_RATIOS.has(ratio)) {
      return NextResponse.json({ success: false, error: 'ratio debe ser 1:1, 9:16 o 16:9' }, { status: 400 })
    }
    if (!isUploadFileLike(file)) {
      return NextResponse.json({ success: false, error: 'Falta el archivo' }, { status: 400 })
    }
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      return NextResponse.json({ success: false, error: 'Solo se permiten imagenes o videos' }, { status: 400 })
    }
    if (file.size > MAX_ASSET_SIZE) {
      return NextResponse.json({ success: false, error: 'El asset no puede superar 50 MB' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const payload = await getPayload({ config: configPromise })
    const created = (await payload.create({
      collection: 'media',
      data: {
        alt: `Creatividad Meta ${ratio} - ${courseName}`,
        folder: 'marketing/meta-ads',
      } as any,
      file: {
        data: buffer,
        mimetype: file.type,
        name: normalizeFilename(file.name, ratio),
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
        mimeType: created.mimeType || file.type,
        filesize: created.filesize || file.size,
        width: created.width || null,
        height: created.height || null,
        ratio,
      },
    })
  } catch (error) {
    console.error('[meta-assets-upload] upload error:', error)
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'No se pudo subir creatividad Meta' }, { status: 500 })
  }
}
