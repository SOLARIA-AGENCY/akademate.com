import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { LeadForm } from '../../ciclos/[slug]/LeadForm'
import { getTenantHostBranding } from '@/app/lib/server/tenant-host-branding'
import {
  getPublishedCourses,
  getPublishedCourseBySlug,
  getStudyTypeColor,
  getStudyTypeVisualMap,
} from '@/app/lib/server/published-courses'
import { getPublicStudyTypeFallbackImage } from '@/app/lib/website/study-types'

export const dynamic = 'force-dynamic'

interface Props { params: Promise<{ slug: string }> }

type ProgramSection = {
  title: string
  body: string
  items: string[]
}

function splitProgramLine(line: string): ProgramSection {
  const [rawTitle, ...rest] = line.split(':')
  const hasTitle = rest.length > 0 && rawTitle.length < 80
  const title = hasTitle ? rawTitle.trim() : 'Programa'
  const body = hasTitle ? rest.join(':').trim() : line.trim()
  const parts = body
    .split(/,\s+(?=[a-záéíóúñü0-9])/i)
    .map((item) => item.trim().replace(/\.$/, ''))
    .filter(Boolean)

  if (parts.length < 3 || body.length < 150) {
    return { title, body, items: [] }
  }

  return {
    title,
    body: '',
    items: parts,
  }
}

function buildCourseFeatures(course: NonNullable<Awaited<ReturnType<typeof getPublishedCourseBySlug>>>) {
  const isTeleformacion = course.studyType === 'teleformacion'
  return [
    course.duracionReferencia > 0 ? `${course.duracionReferencia} h de formación` : null,
    course.duracionReferencia === 48 ? '12 sesiones de 4 h' : null,
    'Agencia de colocación oficial',
    isTeleformacion ? 'Modalidad teleformación' : 'Clases presenciales',
    isTeleformacion ? 'Aprendizaje flexible' : 'Grupos reducidos',
    'Contenido teórico-práctico',
  ].filter(Boolean) as string[]
}

function normalizeSearchText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function getRelatedCoursePriority(
  relatedCourse: Awaited<ReturnType<typeof getPublishedCourses>>[number],
  currentCourse: NonNullable<Awaited<ReturnType<typeof getPublishedCourseBySlug>>>
) {
  const title = normalizeSearchText(relatedCourse.nombre)
  const currentTitle = normalizeSearchText(currentCourse.nombre)
  const healthContinuityKeywords = [
    'auxiliar de clinicas esteticas',
    'auxiliar de enfermeria',
    'farmacia y dermocosmetica',
    'farmacia',
    'quiromasaje',
    'entrenamiento personal',
    'dietetica',
    'nutricion',
  ]

  if (currentTitle.includes('nutricosmetica')) {
    const preferredIndex = healthContinuityKeywords.findIndex((keyword) => title.includes(keyword))
    if (preferredIndex >= 0) return preferredIndex
  }

  return 100
}

function isPreferredHealthContinuityCourse(
  relatedCourse: Awaited<ReturnType<typeof getPublishedCourses>>[number],
  currentCourse: NonNullable<Awaited<ReturnType<typeof getPublishedCourseBySlug>>>
) {
  return getRelatedCoursePriority(relatedCourse, currentCourse) < 100
}

function getUniqueRelatedCourses(courses: Awaited<ReturnType<typeof getPublishedCourses>>) {
  const seen = new Set<string>()
  return courses.filter((course) => {
    const key = normalizeSearchText(course.nombre)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const tenant = await getTenantHostBranding()
  const tenantId = tenant.tenantId === 'default' ? null : tenant.tenantId
  const course = await getPublishedCourseBySlug({
    slug,
    tenantId,
    includeInactive: false,
    includeCycles: false,
  })
  if (!course) return { title: 'Curso no encontrado' }
  const title = course.nombre
  const description = course.descripcion || `Curso: ${title}`
  return {
    title: `${title} | Curso`,
    description: description.substring(0, 160),
  }
}

export default async function CursoLandingPage({ params }: Props) {
  const { slug } = await params
  const tenant = await getTenantHostBranding()
  const tenantId = tenant.tenantId === 'default' ? null : tenant.tenantId
  const studyTypeVisualMap = await getStudyTypeVisualMap()
  const course = await getPublishedCourseBySlug({
    slug,
    tenantId,
    includeInactive: false,
    includeCycles: false,
  })

  if (!course) notFound()

  const allRelatedCourses = await getPublishedCourses({
    tenantId,
    includeInactive: false,
    includeCycles: false,
    limit: 200,
    sort: 'name',
  })

  const title = course.nombre
  const description = course.descripcion
  const detailedDescription = course.descripcionDetallada
  const imageUrl = course.imagenPortada || getPublicStudyTypeFallbackImage(course.studyType)
  const heroColor = getStudyTypeColor(course.studyType, studyTypeVisualMap) || tenant.primaryColor || '#0F172A'
  const contentLines = detailedDescription.filter((line) => line !== description)
  const programSections = contentLines.map(splitProgramLine)
  const courseFeatures = buildCourseFeatures(course)
  const eligibleRelatedCourses = allRelatedCourses.filter((relatedCourse) => relatedCourse.slug !== course.slug)
  const preferredHealthContinuityCourses = eligibleRelatedCourses
    .filter((relatedCourse) => isPreferredHealthContinuityCourse(relatedCourse, course))
    .sort((left, right) => {
      const priorityDiff = getRelatedCoursePriority(left, course) - getRelatedCoursePriority(right, course)
      return priorityDiff || left.nombre.localeCompare(right.nombre, 'es')
    })
  const sameAreaRelatedCourses = eligibleRelatedCourses
    .filter(
      (relatedCourse) =>
        relatedCourse.area === course.area &&
        !preferredHealthContinuityCourses.some((preferredCourse) => preferredCourse.slug === relatedCourse.slug)
    )
    .sort((left, right) => {
      const priorityDiff = getRelatedCoursePriority(left, course) - getRelatedCoursePriority(right, course)
      return priorityDiff || left.nombre.localeCompare(right.nombre, 'es')
    })
  const sameTypeRelatedCourses = eligibleRelatedCourses.filter(
    (relatedCourse) =>
      relatedCourse.studyType === course.studyType &&
      !preferredHealthContinuityCourses.some((preferredCourse) => preferredCourse.slug === relatedCourse.slug) &&
      !sameAreaRelatedCourses.some((sameAreaCourse) => sameAreaCourse.slug === relatedCourse.slug)
  )
  const relatedCourses = getUniqueRelatedCourses([
    ...preferredHealthContinuityCourses,
    ...sameAreaRelatedCourses,
    ...sameTypeRelatedCourses,
  ]).slice(0, 8)

  return (
    <div>
      {/* HERO */}
      <div
        className="relative h-72 sm:h-80"
        style={{ background: `linear-gradient(135deg, ${heroColor} 0%, #0f172a 100%)` }}
      >
        <img src={imageUrl} alt={title} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-12 max-w-7xl mx-auto">
          <span
            className="mb-3 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold text-white"
            style={{ backgroundColor: heroColor }}
          >
            {course.studyTypeLabel}
          </span>
          <h1 className="text-3xl sm:text-5xl font-bold text-white mb-2">{title}</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-10">
            {description && (
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Sobre este curso</h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">{description}</p>
              </section>
            )}

            {courseFeatures.length > 0 && (
              <section className="space-y-5">
                <div className="max-w-2xl">
                  <p
                    className="mb-3 h-1 w-16 rounded-full"
                    style={{ backgroundColor: heroColor }}
                    aria-hidden="true"
                  />
                  <h2 className="text-3xl font-bold text-gray-900">Características del curso</h2>
                </div>
                <div className="grid gap-x-10 gap-y-4 sm:grid-cols-2">
                  {courseFeatures.map((feature) => (
                    <div key={feature} className="flex items-center gap-3 border-b border-gray-200 pb-4">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: heroColor }}
                        aria-hidden="true"
                      />
                      <span className="font-semibold text-gray-900">{feature}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {contentLines.length > 0 && (
              <section className="space-y-8">
                <div className="max-w-2xl">
                  <p
                    className="mb-3 h-1 w-16 rounded-full"
                    style={{ backgroundColor: heroColor }}
                    aria-hidden="true"
                  />
                  <h2 className="text-3xl font-bold text-gray-900">Información del programa</h2>
                </div>

                <div className="divide-y divide-gray-200 border-y border-gray-200">
                  {programSections.map((section, index) => (
                    <article key={`${section.title}-${index}`} className="grid gap-4 py-7 md:grid-cols-[220px_1fr] md:gap-8">
                      <div>
                        <span
                          className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white"
                          style={{ backgroundColor: heroColor }}
                        >
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <h3 className="text-xl font-bold text-gray-900">{section.title}</h3>
                      </div>
                      {section.items.length > 0 ? (
                        <ul className="grid gap-3 text-gray-700 sm:grid-cols-2">
                          {section.items.map((item) => (
                            <li key={item} className="flex gap-3 leading-relaxed">
                              <span
                                className="mt-2 h-2 w-2 shrink-0 rounded-full"
                                style={{ backgroundColor: heroColor }}
                                aria-hidden="true"
                              />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-lg leading-relaxed text-gray-700">{section.body}</p>
                      )}
                    </article>
                  ))}
                </div>
              </section>
            )}

            {relatedCourses.length > 0 && (
              <section className="space-y-5">
                <div className="max-w-2xl">
                  <p
                    className="mb-3 h-1 w-16 rounded-full"
                    style={{ backgroundColor: heroColor }}
                    aria-hidden="true"
                  />
                  <h2 className="text-3xl font-bold text-gray-900">También puede interesarte</h2>
                  <p className="mt-3 text-gray-600">
                    Amplía tu itinerario con otros cursos relacionados del mismo ámbito formativo.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  {relatedCourses.map((relatedCourse) => (
                    <a
                      key={relatedCourse.slug}
                      href={`/p/cursos/${relatedCourse.slug}`}
                      className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 transition hover:border-gray-900 hover:bg-gray-900 hover:text-white"
                    >
                      {relatedCourse.nombre}
                    </a>
                  ))}
                </div>
              </section>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Datos del curso</h3>
              <dl className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-gray-500">Área</dt>
                  <dd className="font-semibold text-gray-900 text-right">{course.area}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-gray-500">Modalidad</dt>
                  <dd className="font-semibold text-gray-900 text-right">Presencial</dd>
                </div>
                {course.duracionReferencia > 0 && (
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-gray-500">Duración</dt>
                    <dd className="font-semibold text-gray-900 text-right">{course.duracionReferencia} h</dd>
                  </div>
                )}
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-gray-500">Tipo</dt>
                  <dd className="font-semibold text-gray-900 text-right">{course.studyTypeLabel}</dd>
                </div>
              </dl>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Pedir informacion</h3>
              <p className="text-sm text-gray-600 mb-4">Dejanos tu email y te informaremos.</p>
              <LeadForm cycleId={course.id} cycleName={title} hasActiveConvocatorias={false} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
