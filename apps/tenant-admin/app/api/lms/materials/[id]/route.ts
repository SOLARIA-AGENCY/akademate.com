import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { campusEnvironmentError } from '@/src/lib/campus/environment'
import { readCampusSession, relatedId } from '@/src/lib/campus/auth'

interface RelatedCourse {
  id?: string | number
}

interface RelatedModule {
  id?: string | number
  course?: string | number | RelatedCourse
}

interface RelatedLesson {
  id?: string | number
  module?: string | number | RelatedModule
}

interface MediaFile {
  url?: string
  filename?: string
  mimeType?: string
  filesize?: number
}

interface MaterialDocument {
  id: string | number
  title?: string
  description?: string
  material_type?: string
  is_published?: boolean
  is_downloadable?: boolean
  external_url?: string
  file?: string | number | MediaFile
  course?: string | number | RelatedCourse
  module?: string | number | RelatedModule
  lesson?: string | number | RelatedLesson
}

interface PayloadClient {
  findByID: (args: Record<string, unknown>) => Promise<unknown>
}

function courseIdForMaterial(material: MaterialDocument): string | null {
  const directCourseId = relatedId(material.course)
  if (directCourseId) return directCourseId

  const module = typeof material.module === 'object' && material.module !== null ? material.module : null
  const moduleCourseId = relatedId(module?.course)
  if (moduleCourseId) return moduleCourseId

  const lesson = typeof material.lesson === 'object' && material.lesson !== null ? material.lesson : null
  const lessonModule = typeof lesson?.module === 'object' && lesson.module !== null ? lesson.module : null
  return relatedId(lessonModule?.course)
}

function safeFilename(value: string | undefined): string {
  return (value ?? 'material').replace(/[^a-zA-Z0-9._-]+/g, '_')
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const environmentError = campusEnvironmentError()
  if (environmentError) return environmentError

  const session = await readCampusSession(request)
  if (!session) return NextResponse.json({ success: false, error: 'Sesion no autorizada' }, { status: 401 })

  const { id } = await params
  const enrollmentId = new URL(request.url).searchParams.get('enrollmentId')
  if (!id || !enrollmentId) {
    return NextResponse.json({ success: false, error: 'Material y matricula son obligatorios' }, { status: 400 })
  }

  const enrollment = session.enrollments.find((item) => item.id === enrollmentId)
  if (!enrollment) return NextResponse.json({ success: false, error: 'La matricula no esta autorizada' }, { status: 403 })

  try {
    const payload = (await getPayload({ config })) as unknown as PayloadClient
    const material = await payload.findByID({
      collection: 'materials',
      id,
      depth: 3,
      overrideAccess: true,
    }) as MaterialDocument | null

    if (!material || material.is_published !== true) {
      return NextResponse.json({ success: false, error: 'Material no disponible' }, { status: 404 })
    }

    if (courseIdForMaterial(material) !== enrollment.courseId) {
      return NextResponse.json({ success: false, error: 'El material no pertenece a la matricula' }, { status: 403 })
    }

    if (material.external_url) {
      const external = new URL(material.external_url)
      if (!['http:', 'https:'].includes(external.protocol)) {
        return NextResponse.json({ success: false, error: 'Enlace externo no permitido' }, { status: 422 })
      }
      return NextResponse.redirect(external, { status: 302 })
    }

    const file = typeof material.file === 'object' && material.file !== null ? material.file : null
    if (!file?.url) return NextResponse.json({ success: false, error: 'Archivo no disponible' }, { status: 404 })

    const fileUrl = new URL(file.url, request.url)
    const upstream = await fetch(fileUrl, { cache: 'no-store' })
    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ success: false, error: 'No se pudo recuperar el archivo' }, { status: 502 })
    }

    const headers = new Headers()
    headers.set('Content-Type', file.mimeType ?? upstream.headers.get('content-type') ?? 'application/octet-stream')
    headers.set('Content-Disposition', `${material.is_downloadable === false ? 'inline' : 'attachment'}; filename="${safeFilename(file.filename)}"`)
    const length = file.filesize?.toString() ?? upstream.headers.get('content-length')
    if (length) headers.set('Content-Length', length)
    headers.set('Cache-Control', 'private, no-store')

    return new NextResponse(upstream.body, { status: 200, headers })
  } catch (error) {
    console.error('[Campus Material] Error:', error)
    return NextResponse.json({ success: false, error: 'No se pudo cargar el material' }, { status: 500 })
  }
}
