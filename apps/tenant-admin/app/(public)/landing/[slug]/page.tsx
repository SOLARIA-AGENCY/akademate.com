import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'
import { PageViewTracker } from './PageViewTracker'
import { ContactForm } from './ContactForm'

// ---------------------------------------------------------------------------
// Types (inline — avoid importing heavy payload-types for public page)
// ---------------------------------------------------------------------------

interface MediaObject {
  url?: string
  filename?: string
}

interface CycleData {
  id: number
  name?: string
  description?: string
  level?: string
  totalHours?: number
  image?: MediaObject | number | null
  modules?: Array<{ name: string; courseYear: string; hours: number; type: string }>
  careerPaths?: Array<{ title: string; sector: string }>
  requirements?: Array<{ text: string; type: string }>
}

interface CourseData {
  id: number
  name?: string
  short_description?: string
  long_description?: unknown
  course_type?: string
  modality?: string
  featured_image?: MediaObject | number | null
  cycle?: CycleData | number | null
}

interface CampusData {
  id: number
  name?: string
  city?: string
  address?: string
  phone?: string
  email?: string
}

interface StaffData {
  id: number
  full_name?: string | null
  first_name?: string | null
  last_name?: string | null
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MODALITY_LABELS: Record<string, string> = {
  presencial: 'Presencial',
  online: 'Online',
  hibrido: 'Hibrido',
  semipresencial: 'Semipresencial',
  dual: 'Dual',
}

const DAY_LABELS: Record<string, string> = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miercoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sabado',
  sunday: 'Domingo',
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '--'
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function resolveImageUrl(image: MediaObject | number | null | undefined): string | null {
  if (!image) return null
  if (typeof image === 'number') return null
  if (image.url) return image.url
  if (image.filename) return `/media/${image.filename}`
  return null
}

function resolveInstructorName(instructor: StaffData | number | null | undefined): string {
  if (!instructor || typeof instructor === 'number') return ''
  const full = instructor.full_name?.trim()
  if (full) return full
  const combined = `${instructor.first_name?.trim() ?? ''} ${instructor.last_name?.trim() ?? ''}`.trim()
  return combined || ''
}

function formatSchedule(days?: string[] | null, startTime?: string | null, endTime?: string | null): string {
  if (!days || days.length === 0) return ''
  const dayNames = days.map((d) => DAY_LABELS[d] ?? d).join(', ')
  const time = startTime && endTime ? ` de ${startTime.slice(0, 5)} a ${endTime.slice(0, 5)}` : ''
  return `${dayNames}${time}`
}

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

async function getCourseRunBySlug(slug: string) {
  const payload = await getPayloadHMR({ config: configPromise })

  // Try finding by codigo first (e.g., "NOR-2025-001")
  const byCode = await payload.find({
    collection: 'course-runs',
    where: {
      codigo: { equals: slug.toUpperCase() },
      status: { in: ['published', 'enrollment_open'] },
    },
    depth: 2,
    limit: 1,
  })

  if (byCode.docs.length > 0) return byCode.docs[0]

  // Try finding by numeric ID as fallback
  const numId = parseInt(slug, 10)
  if (!isNaN(numId)) {
    try {
      const byId = await payload.findByID({
        collection: 'course-runs',
        id: numId,
        depth: 2,
      })
      // Only return if published or enrollment_open
      if (byId && (byId.status === 'published' || byId.status === 'enrollment_open')) {
        return byId
      }
    } catch {
      // Not found
    }
  }

  return null
}

// ---------------------------------------------------------------------------
// Dynamic Metadata (SEO)
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const courseRun = await getCourseRunBySlug(slug)

  if (!courseRun) {
    return { title: 'Convocatoria no encontrada' }
  }

  const course = typeof courseRun.course === 'object' ? (courseRun.course as CourseData) : null
  const cycle =
    course && typeof course.cycle === 'object' ? (course.cycle as CycleData) : null
  const courseName = course?.name ?? cycle?.name ?? 'Formacion'
  const description =
    course?.short_description ?? cycle?.description ?? 'Descubre esta convocatoria de formacion profesional.'
  const heroUrl =
    resolveImageUrl(course?.featured_image as MediaObject | number | null) ??
    resolveImageUrl(cycle?.image as MediaObject | number | null)

  return {
    title: `${courseName} - Convocatoria ${courseRun.codigo}`,
    description,
    openGraph: {
      title: `${courseName} - Convocatoria ${courseRun.codigo}`,
      description,
      type: 'website',
      ...(heroUrl ? { images: [{ url: heroUrl, width: 1200, height: 630 }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: `${courseName} - Convocatoria ${courseRun.codigo}`,
      description,
      ...(heroUrl ? { images: [heroUrl] } : {}),
    },
  }
}

// ---------------------------------------------------------------------------
// JSON-LD Structured Data
// ---------------------------------------------------------------------------

function generateJsonLdScript(courseRun: any, courseName: string, description: string, campus: CampusData | null): string {
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: courseName,
    description,
    provider: {
      '@type': 'Organization',
      name: 'Akademate',
    },
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: campus ? 'Blended' : 'Online',
      startDate: courseRun.start_date,
      endDate: courseRun.end_date,
      ...(campus
        ? {
            location: {
              '@type': 'Place',
              name: campus.name,
              address: {
                '@type': 'PostalAddress',
                addressLocality: campus.city,
                streetAddress: campus.address,
              },
            },
          }
        : {}),
      ...(courseRun.price_override != null && courseRun.price_override > 0
        ? {
            offers: {
              '@type': 'Offer',
              price: courseRun.price_override,
              priceCurrency: 'EUR',
              availability: courseRun.status === 'enrollment_open' ? 'https://schema.org/InStock' : 'https://schema.org/PreOrder',
            },
          }
        : {}),
    },
  }
  // Safely serialize: escape closing script tags and HTML entities
  return JSON.stringify(data).replace(/</g, '\\u003c').replace(/>/g, '\\u003e')
}

// ---------------------------------------------------------------------------
// Page Component (Server Component)
// ---------------------------------------------------------------------------

export default async function LandingPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const courseRun = await getCourseRunBySlug(slug)

  if (!courseRun) {
    notFound()
  }

  // Resolve nested data
  const course = typeof courseRun.course === 'object' ? (courseRun.course as CourseData) : null
  const campus = typeof courseRun.campus === 'object' && courseRun.campus !== null ? (courseRun.campus as CampusData) : null
  const instructor = typeof courseRun.instructor === 'object' && courseRun.instructor !== null ? (courseRun.instructor as StaffData) : null
  const cycle = course && typeof course.cycle === 'object' && course.cycle !== null ? (course.cycle as CycleData) : null

  const courseName = course?.name ?? cycle?.name ?? 'Formacion Profesional'
  const courseDescription = course?.short_description ?? cycle?.description ?? null
  const courseModality = MODALITY_LABELS[course?.modality ?? ''] ?? course?.modality ?? ''
  const heroUrl =
    resolveImageUrl(course?.featured_image as MediaObject | number | null) ??
    resolveImageUrl(cycle?.image as MediaObject | number | null)

  const campusName = campus?.name ?? null
  const campusCity = campus?.city ?? null
  const instructorName = resolveInstructorName(instructor)
  const currentEnrollments = courseRun.current_enrollments ?? 0
  const maxStudents = courseRun.max_students ?? 0
  const spotsLeft = maxStudents - currentEnrollments
  const price = courseRun.price_override ?? 0
  const schedule = formatSchedule(courseRun.schedule_days, courseRun.schedule_time_start, courseRun.schedule_time_end)
  const isEnrollmentOpen = courseRun.status === 'enrollment_open'

  const jsonLdScript = generateJsonLdScript(
    courseRun,
    courseName,
    courseDescription ?? 'Formacion profesional de calidad.',
    campus,
  )

  return (
    <>
      {/* Structured Data for SEO - server-generated, safe content */}
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: jsonLdScript }}
      />

      {/* Page View Tracker */}
      <PageViewTracker path={`/landing/${slug}`} slug={slug} />

      {/* ================================================================
          HERO SECTION
      ================================================================ */}
      <header className="relative w-full overflow-hidden bg-gray-900">
        {heroUrl ? (
          <img
            src={heroUrl}
            alt={courseName}
            className="absolute inset-0 w-full h-full object-cover opacity-40"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/50 to-gray-900/30" />

        <div className="relative mx-auto max-w-5xl px-6 py-20 md:py-28">
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            {isEnrollmentOpen && (
              <span className="inline-flex items-center rounded-full bg-green-500 px-3 py-1 text-xs font-semibold text-white">
                Inscripcion Abierta
              </span>
            )}
            {courseModality && (
              <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                {courseModality}
              </span>
            )}
            {courseRun.codigo && (
              <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur-sm">
                {courseRun.codigo}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight mb-4 max-w-3xl">
            {courseName}
          </h1>

          {courseDescription && (
            <p className="text-lg text-white/80 leading-relaxed max-w-2xl mb-8">
              {courseDescription}
            </p>
          )}

          {/* Quick info row */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/70">
            {courseRun.start_date && (
              <span className="flex items-center gap-1.5">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
                Inicio: {formatDate(courseRun.start_date)}
              </span>
            )}
            {campusName && (
              <span className="flex items-center gap-1.5">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                {campusName}{campusCity ? `, ${campusCity}` : ''}
              </span>
            )}
            {instructorName && (
              <span className="flex items-center gap-1.5">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                {instructorName}
              </span>
            )}
            {spotsLeft > 0 && (
              <span className="flex items-center gap-1.5">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>
                {spotsLeft} plazas disponibles
              </span>
            )}
          </div>
        </div>
      </header>

      {/* ================================================================
          MAIN CONTENT
      ================================================================ */}
      <main className="mx-auto max-w-5xl px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* LEFT COLUMN -- Content */}
          <div className="lg:col-span-2 space-y-10">

            {/* Quick Stats Grid */}
            <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center">
                <p className="text-xs font-medium text-gray-500 uppercase mb-1">Inicio</p>
                <p className="text-sm font-semibold text-gray-900">{formatDate(courseRun.start_date)}</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center">
                <p className="text-xs font-medium text-gray-500 uppercase mb-1">Fin</p>
                <p className="text-sm font-semibold text-gray-900">{formatDate(courseRun.end_date)}</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center">
                <p className="text-xs font-medium text-gray-500 uppercase mb-1">Plazas</p>
                <p className="text-sm font-semibold text-gray-900">{currentEnrollments}/{maxStudents}</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center">
                <p className="text-xs font-medium text-gray-500 uppercase mb-1">Modalidad</p>
                <p className="text-sm font-semibold text-gray-900">{courseModality || 'Presencial'}</p>
              </div>
            </section>

            {/* Schedule */}
            {schedule && (
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">Horario</h2>
                <p className="text-gray-600">{schedule}</p>
              </section>
            )}

            {/* Modules (from cycle) */}
            {cycle?.modules && cycle.modules.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Plan de Estudios
                  <span className="ml-2 text-sm font-normal text-gray-500">({cycle.modules.length} modulos)</span>
                </h2>
                <div className="space-y-2">
                  {cycle.modules.map((mod, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3.5 hover:bg-gray-50 transition"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{mod.name}</p>
                        <p className="text-xs text-gray-500">
                          {mod.courseYear ? `${mod.courseYear}o curso` : ''}{mod.type ? ` - ${mod.type}` : ''}
                        </p>
                      </div>
                      <span className="ml-3 flex-shrink-0 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                        {mod.hours}h
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex justify-between rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-900">
                  <span>Total horas lectivas</span>
                  <span>{cycle.modules.reduce((sum, m) => sum + (m.hours || 0), 0)}h</span>
                </div>
              </section>
            )}

            {/* Career Paths (from cycle) */}
            {cycle?.careerPaths && cycle.careerPaths.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Salidas Profesionales</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {cycle.careerPaths.map((cp, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-lg border border-gray-200 p-3.5">
                      <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{cp.title}</p>
                        {cp.sector && <p className="text-xs text-gray-500">{cp.sector}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Requirements (from cycle) */}
            {cycle?.requirements && cycle.requirements.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Requisitos de Acceso</h2>
                <ul className="space-y-2.5">
                  {cycle.requirements.map((req, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm text-gray-700">{req.text}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Campus Info */}
            {campus && (
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">Sede</h2>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-5">
                  <p className="font-semibold text-gray-900">{campus.name}</p>
                  {campus.address && <p className="text-sm text-gray-600 mt-1">{campus.address}</p>}
                  {campus.city && <p className="text-sm text-gray-600">{campus.city}</p>}
                  {campus.phone && (
                    <p className="text-sm text-gray-600 mt-2">
                      Tel: <a href={`tel:${campus.phone}`} className="text-blue-600 hover:underline">{campus.phone}</a>
                    </p>
                  )}
                  {campus.email && (
                    <p className="text-sm text-gray-600">
                      Email: <a href={`mailto:${campus.email}`} className="text-blue-600 hover:underline">{campus.email}</a>
                    </p>
                  )}
                </div>
              </section>
            )}
          </div>

          {/* RIGHT COLUMN -- Sticky sidebar */}
          <aside className="lg:col-span-1">
            <div className="sticky top-6 space-y-6">

              {/* Pricing Card */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                {price > 0 ? (
                  <>
                    <p className="text-xs font-medium text-gray-500 uppercase mb-1">Precio del curso</p>
                    <p className="text-3xl font-bold text-gray-900 mb-1">
                      {price.toLocaleString('es-ES')} <span className="text-lg font-medium text-gray-500">EUR</span>
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-xs font-medium text-gray-500 uppercase mb-1">Precio</p>
                    <span className="inline-flex items-center rounded-full bg-green-100 px-4 py-1.5 text-sm font-bold text-green-800">
                      Subvencionado
                    </span>
                  </>
                )}
                {courseRun.financial_aid_available && (
                  <p className="text-sm text-gray-500 mt-2">Becas y ayudas disponibles</p>
                )}

                {spotsLeft > 0 && spotsLeft <= 5 && (
                  <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs font-medium text-amber-800">
                    Solo quedan {spotsLeft} plazas
                  </div>
                )}

                {/* Enrollment deadline */}
                {courseRun.enrollment_deadline && (
                  <p className="mt-3 text-xs text-gray-500">
                    Plazo de inscripcion hasta {formatDate(courseRun.enrollment_deadline)}
                  </p>
                )}
              </div>

              {/* Contact Form */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-1">Solicita informacion</h3>
                <p className="text-sm text-gray-500 mb-4">Sin compromiso. Te asesoramos sobre esta convocatoria.</p>
                <ContactForm
                  courseRunId={courseRun.id}
                  courseName={courseName}
                  slug={slug}
                />
              </div>

            </div>
          </aside>
        </div>
      </main>

      {/* ================================================================
          FOOTER
      ================================================================ */}
      <footer className="border-t border-gray-200 bg-gray-50 py-8">
        <div className="mx-auto max-w-5xl px-6 text-center text-sm text-gray-500">
          <p>Powered by Akademate</p>
          <div className="mt-2 flex justify-center gap-4">
            <a href="/legal/privacidad" className="hover:text-gray-700 transition">Privacidad</a>
            <a href="/legal/terminos" className="hover:text-gray-700 transition">Terminos</a>
            <a href="/legal/cookies" className="hover:text-gray-700 transition">Cookies</a>
          </div>
        </div>
      </footer>
    </>
  )
}
