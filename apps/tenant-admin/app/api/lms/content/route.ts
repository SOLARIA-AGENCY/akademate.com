/**
 * Protected Campus content API.
 *
 * This route is intentionally not public: IDs are not authorization.
 * A student must have an active campus-enrollment bridge for the course.
 */
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { campusEnvironmentError } from '@/src/lib/campus/environment'
import { readCampusSession } from '@/src/lib/campus/auth'

interface PayloadLMS {
  find: (args: Record<string, unknown>) => Promise<{ docs: unknown[]; totalDocs: number }>
  findByID: (args: Record<string, unknown>) => Promise<unknown>
}

function relatedId(value: unknown): string | null {
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (typeof value === 'object' && value !== null && 'id' in value) {
    const id = (value as { id?: unknown }).id
    return typeof id === 'string' || typeof id === 'number' ? String(id) : null
  }
  return null
}

export async function GET(request: NextRequest) {
  const environmentError = campusEnvironmentError()
  if (environmentError) return environmentError

  const session = await readCampusSession(request)
  if (!session) return NextResponse.json({ success: false, error: 'Sesion no valida.' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const courseId = searchParams.get('courseId')
  const moduleId = searchParams.get('moduleId')
  if (!courseId && !moduleId) {
    return NextResponse.json({ success: false, error: 'courseId o moduleId es obligatorio.' }, { status: 400 })
  }

  try {
    const payload = (await getPayload({ config: configPromise })) as unknown as PayloadLMS

    if (courseId) {
      const access = session.enrollments.some((enrollment) => enrollment.courseId === String(courseId))
      if (!access) return NextResponse.json({ success: false, error: 'No tienes acceso a este curso.' }, { status: 403 })

      const modules = await payload.find({
        collection: 'modules',
        where: {
          and: [
            { course: { equals: courseId } },
            { is_published: { equals: true } },
          ],
        },
        sort: 'order',
        depth: 1,
        overrideAccess: true,
      })
      return NextResponse.json({
        success: true,
        data: { courseId, modules: modules.docs, totalModules: modules.totalDocs },
      }, { headers: { 'Cache-Control': 'private, no-store' } })
    }

    const module = await payload.findByID({
      collection: 'modules',
      id: moduleId as string,
      depth: 2,
      overrideAccess: true,
    }) as { course?: unknown } | null
    if (!module) return NextResponse.json({ success: false, error: 'Modulo no encontrado.' }, { status: 404 })

    const moduleCourseId = relatedId(module.course)
    const access = session.enrollments.some((enrollment) => enrollment.courseId === moduleCourseId)
    if (!access) return NextResponse.json({ success: false, error: 'No tienes acceso a este modulo.' }, { status: 403 })

    const [lessons, materials] = await Promise.all([
      payload.find({
        collection: 'lessons',
        where: {
          and: [
            { module: { equals: moduleId } },
            { is_published: { equals: true } },
          ],
        },
        sort: 'order',
        depth: 1,
        overrideAccess: true,
      }),
      payload.find({
        collection: 'materials',
        where: {
          and: [
            { module: { equals: moduleId } },
            { is_published: { equals: true } },
          ],
        },
        sort: 'order',
        depth: 0,
        overrideAccess: true,
      }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        moduleId,
        lessons: lessons.docs,
        totalLessons: lessons.totalDocs,
        materials: materials.docs.map((material) => ({
          ...(material as Record<string, unknown>),
          url: `/api/lms/materials/${String((material as { id: string | number }).id)}?enrollmentId=${encodeURIComponent(
            session.enrollments.find((enrollment) => enrollment.courseId === moduleCourseId)?.id ?? '',
          )}`,
        })),
        totalMaterials: materials.totalDocs,
      },
    }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    console.error('[LMS Content] Error:', error)
    return NextResponse.json({ success: false, error: 'No se pudo cargar el contenido.' }, { status: 500 })
  }
}
