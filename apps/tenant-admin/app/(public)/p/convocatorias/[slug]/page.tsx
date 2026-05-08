import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { PreinscripcionForm } from './PreinscripcionForm'
import { withTenantScope } from '@/app/lib/server/tenant-scope'
import { getTenantHostBranding } from '@/app/lib/server/tenant-host-branding'

export const dynamic = 'force-dynamic'

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function resolveImageUrl(image: any): string | null {
  if (!image) return null
  if (typeof image === 'object' && image.url) return image.url
  if (typeof image === 'object' && image.filename) return `/media/${image.filename}`
  return null
}

function resolveInstructorName(instructor: any): string {
  if (!instructor || typeof instructor !== 'object') return ''
  const fullName = typeof instructor.full_name === 'string' ? instructor.full_name.trim() : ''
  if (fullName) return fullName
  return [instructor.first_name, instructor.last_name].filter(Boolean).join(' ').trim()
}

function resolvePrimaryInstructor(conv: any): any {
  if (typeof conv.instructor === 'object' && conv.instructor !== null) return conv.instructor
  const instructors = Array.isArray(conv.instructors) ? conv.instructors : []
  return instructors.find((item: unknown) => typeof item === 'object' && item !== null) ?? null
}

function resolveCampusHref(campus: any): string | null {
  if (!campus || typeof campus !== 'object') return null
  return `/p/sedes/${campus.slug || campus.id}`
}

function resolveInstructorHref(instructor: any): string | null {
  if (!instructor || typeof instructor !== 'object' || !instructor.id) return null
  return `/p/profesores/${instructor.id}`
}

function formatMonth(date: string): string {
  const d = new Date(date)
  const month = d.toLocaleDateString('es-ES', { month: 'long' })
  return `${month.charAt(0).toUpperCase()}${month.slice(1)} ${d.getFullYear()}`
}

function modalityLabel(modality: string | undefined): string {
  const map: Record<string, string> = {
    presencial: 'Presencial',
    semipresencial: 'Semipresencial',
    online: '100% Online',
    mixto: 'Modalidad mixta',
  }
  return modality ? map[modality] || modality : ''
}

function levelLabel(level: string | undefined): string {
  const map: Record<string, string> = {
    fp_basica: 'FP Basica',
    grado_medio: 'Grado Medio',
    grado_superior: 'Grado Superior',
    certificado_profesionalidad: 'Certificado de Profesionalidad',
  }
  return level ? map[level] || level : ''
}

function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return 'A consultar'
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(Number(value))
}

/* -------------------------------------------------------------------------- */
/*  SEO Metadata                                                               */
/* -------------------------------------------------------------------------- */

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const tenant = await getTenantHostBranding()
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'course-runs',
    where: withTenantScope({ codigo: { equals: slug } }, tenant.tenantId) as any,
    limit: 1,
    depth: 2,
  })
  const conv = result.docs[0] as any
  if (!conv) return { title: 'Convocatoria no encontrada' }

  const cycle = typeof conv.cycle === 'object' ? conv.cycle : null
  const course = typeof conv.course === 'object' ? conv.course : null
  const campus = typeof conv.campus === 'object' ? conv.campus : null
  const displayName = cycle?.name || course?.title || course?.name || ''
  const sedeName = campus?.name || ''

  return {
    title: `${displayName} — Convocatoria abierta${sedeName ? ` en ${sedeName}` : ''}`,
    description: `Inscripcion abierta para ${displayName}${sedeName ? ` en ${sedeName}` : ''}. Formacion oficial con orientacion practica y profesional. Solicita informacion sin compromiso.`,
    openGraph: {
      title: `${displayName} — Inscripcion abierta`,
      description: `Reserva tu plaza en ${displayName}. Formacion oficial.`,
    },
  }
}

/* -------------------------------------------------------------------------- */
/*  Icon components (inline SVG, no external deps)                             */
/* -------------------------------------------------------------------------- */

const IconCalendar = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
  </svg>
)
const IconMapPin = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
  </svg>
)
const IconAcademicCap = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
  </svg>
)
const IconBriefcase = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
)
const IconCurrencyEuro = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 7.756a4.5 4.5 0 100 8.488M7.5 10.5H5.25m2.25 3H5.25M9 7.5h3.75M9 16.5h3.75" />
  </svg>
)
const IconClock = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)
const IconCheck = () => (
  <svg className="h-4 w-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
)
const IconChevronDown = () => (
  <svg className="h-4 w-4 flex-shrink-0 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
  </svg>
)
const IconShield = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
)

/* -------------------------------------------------------------------------- */
/*  Summary card component                                                     */
/* -------------------------------------------------------------------------- */

function SummaryCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg brand-bg-light brand-text">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
        <p className="text-sm font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default async function ConvocatoriaLandingPage({ params }: Props) {
  const { slug } = await params
  const tenant = await getTenantHostBranding()
  const payload = await getPayload({ config: configPromise })

  // Fetch by codigo first, then by ID
  let result = await payload.find({
    collection: 'course-runs',
    where: withTenantScope({ codigo: { equals: slug } }, tenant.tenantId) as any,
    limit: 1,
    depth: 2,
  })
  if (result.docs.length === 0) {
    result = await payload.find({
      collection: 'course-runs',
      where: withTenantScope({ id: { equals: slug } }, tenant.tenantId) as any,
      limit: 1,
      depth: 2,
    })
  }

  const conv = result.docs[0] as any
  if (!conv) notFound()

  // Resolve relationships
  const course = typeof conv.course === 'object' ? conv.course : null
  const cycle = typeof conv.cycle === 'object' ? conv.cycle : null
  const campus = typeof conv.campus === 'object' ? conv.campus : null
  const instructor = resolvePrimaryInstructor(conv)
  const instructorName = resolveInstructorName(instructor)
  const instructorPhoto = resolveImageUrl(instructor?.photo)
  const instructorHref = resolveInstructorHref(instructor)
  const campusHref = resolveCampusHref(campus)
  const instructorCertifications = Array.isArray(instructor?.certifications)
    ? instructor.certifications.filter((cert: any) => typeof cert?.title === 'string' && cert.title.trim())
    : []

  // Image: cycle first, then course
  const cycleImage = cycle ? resolveImageUrl(cycle.image) : null
  const courseImage = course ? resolveImageUrl(course.image || course.featured_image) : null
  const imageUrl = cycleImage || courseImage

  // Display name
  const displayName = cycle?.name || course?.title || course?.name || ''
  const sedeName = campus?.name || ''

  // Cycle data
  const modality = cycle?.duration?.modality
  const totalHours = cycle?.duration?.totalHours
  const practiceHours = cycle?.duration?.practiceHours
  const scheduleText = cycle?.duration?.schedule
  const classFrequency = cycle?.duration?.classFrequency
  const competencies = Array.isArray(cycle?.competencies) ? cycle.competencies : []
  const careerPaths = Array.isArray(cycle?.careerPaths) ? cycle.careerPaths : []
  const requirements = Array.isArray(cycle?.requirements) ? cycle.requirements : []
  const cycleLevel = cycle?.level
  const officialTitle = cycle?.officialTitle
  const pricing = cycle?.pricing ?? {}
  const effectivePrice =
    (typeof conv.price_override === 'number' ? conv.price_override : null) ??
    (typeof pricing.totalPrice === 'number' ? pricing.totalPrice : null) ??
    (typeof pricing.monthlyFee === 'number' ? pricing.monthlyFee : null) ??
    (typeof course?.base_price === 'number' ? course.base_price : null)
  const enrollmentFee = typeof pricing.enrollmentFee === 'number' ? pricing.enrollmentFee : null
  const monthlyFee = typeof pricing.monthlyFee === 'number' ? pricing.monthlyFee : null
  const paymentOptions = Array.isArray(pricing.paymentOptions)
    ? pricing.paymentOptions
      .map((item: any) => (typeof item?.option === 'string' ? item.option.trim() : ''))
      .filter((item: string) => item.length > 0)
    : []
  const scholarships = Array.isArray(cycle?.scholarships) ? cycle.scholarships : []
  const financingTypes = new Set<string>()
  if (conv.financial_aid_available) financingTypes.add('Financiación interna CEP')
  if (cycle?.fundaeEligible) financingTypes.add('Bonificación FUNDAE')
  scholarships.forEach((sch: any) => {
    if (sch?.type === 'beca') financingTypes.add('Becas')
    if (sch?.type === 'subvencion') financingTypes.add('Subvenciones')
    if (sch?.type === 'financiacion') financingTypes.add('Pago financiado')
  })
  const financingTypesList = Array.from(financingTypes)

  // Start month
  const startMonth = conv.start_date ? formatMonth(conv.start_date) : null

  // Build summary cards
  const summaryCards: { icon: React.ReactNode; label: string; value: string }[] = []
  if (startMonth) {
    summaryCards.push({ icon: <IconCalendar />, label: 'Inicio', value: startMonth })
  }
  if (sedeName) {
    summaryCards.push({ icon: <IconMapPin />, label: 'Sede', value: sedeName })
  }
  if (officialTitle || cycleLevel) {
    summaryCards.push({ icon: <IconAcademicCap />, label: 'Titulacion', value: officialTitle || `${levelLabel(cycleLevel)} oficial` })
  }
  if (practiceHours) {
    summaryCards.push({ icon: <IconBriefcase />, label: 'Practicas', value: `${practiceHours}h en empresa` })
  }
  if (modality) {
    summaryCards.push({ icon: <IconClock />, label: 'Modalidad', value: modalityLabel(modality) })
  }
  if (effectivePrice !== null) {
    summaryCards.push({ icon: <IconCurrencyEuro />, label: 'Precio', value: formatCurrency(effectivePrice) })
  }
  if (conv.financial_aid_available) {
    summaryCards.push({ icon: <IconCurrencyEuro />, label: 'Financiacion', value: 'Disponible' })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ================================================================== */}
      {/* 1. HERO                                                             */}
      {/* ================================================================== */}
      <section className="relative min-h-[420px] sm:min-h-[480px] flex items-end">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={displayName}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 brand-bg" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/20" />

        <div className="relative z-10 w-full px-4 pb-10 pt-32 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            {/* Badges */}
            <div className="mb-5 flex flex-wrap items-center justify-center gap-2">
              <span className="inline-flex items-center rounded-full brand-btn px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white">
                Inscripcion abierta
              </span>
              <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur-sm">
                Plazas limitadas
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl font-extrabold leading-tight text-white sm:text-4xl lg:text-5xl">
              {displayName}
              {sedeName && (
                <span className="mt-1 block text-lg font-medium text-white/80 sm:text-xl">
                  Convocatoria abierta en {sedeName}
                </span>
              )}
            </h1>

            {/* Subtitle */}
            <p className="mx-auto mt-4 max-w-xl text-base text-white/75 sm:text-lg">
              {startMonth ? `Comienza en ${startMonth.toLowerCase()}. ` : ''}
              Formacion oficial con orientacion practica y profesional
            </p>

            {/* CTA */}
            <a
              href="#formulario"
              className="mt-6 inline-flex items-center rounded-lg brand-btn px-8 py-3.5 text-base font-bold uppercase tracking-wide text-white shadow-lg transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              Solicitar informacion
            </a>

            {/* Codigo subtle */}
            {conv.codigo && (
              <p className="mt-4 text-xs font-mono text-white/40">
                Ref. {conv.codigo}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* 2. ESTA CONVOCATORIA INCLUYE                                        */}
      {/* ================================================================== */}
      {summaryCards.length > 0 && (
        <section className="relative z-10 -mt-8 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="mb-5 text-center text-lg font-bold text-gray-900">
                Esta convocatoria incluye
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {summaryCards.map((card, i) => (
                  <SummaryCard key={i} {...card} />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Centered single-column content */}
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8 space-y-16">

        {/* ================================================================ */}
        {/* 3. QUE APRENDERAS Y SALIDAS                                       */}
        {/* ================================================================ */}
        {(competencies.length > 0 || careerPaths.length > 0) && (
          <section>
            {competencies.length > 0 && (
              <div className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-5">Que aprenderas</h2>
                <ul className="space-y-3">
                  {competencies.slice(0, 6).map((c: any, i: number) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="brand-text"><IconCheck /></span>
                      <div>
                        <p className="font-medium text-gray-900">{c.title}</p>
                        {c.description && (
                          <p className="mt-0.5 text-sm text-gray-600">{c.description}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {careerPaths.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-5">Salidas profesionales</h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {careerPaths.slice(0, 8).map((cp: any, i: number) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4"
                    >
                      <span className="brand-text"><IconBriefcase /></span>
                      <div>
                        <p className="font-medium text-gray-900">{cp.title}</p>
                        {cp.sector && (
                          <p className="text-xs text-gray-500">{cp.sector}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* ================================================================ */}
        {/* 4. SEDE Y MODALIDAD                                               */}
        {/* ================================================================ */}
        {(campus || modality || scheduleText) && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-5">Sede y modalidad</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {campus && (
                <Link
                  href={campusHref ?? '#'}
                  className="rounded-xl border border-gray-200 bg-white p-5 transition hover:border-red-200 hover:shadow-md"
                  aria-disabled={!campusHref}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="brand-text"><IconMapPin /></span>
                    <h3 className="font-semibold text-gray-900">Sede</h3>
                  </div>
                  <p className="font-medium text-gray-900">{campus.name}</p>
                  {campus.address && <p className="text-sm text-gray-600 mt-1">{campus.address}</p>}
                  {campus.city && <p className="text-sm text-gray-600">{campus.city}</p>}
                  {campus.phone && <p className="text-sm text-gray-600 mt-1">Tel: {campus.phone}</p>}
                  <span className="mt-3 inline-flex items-center text-sm font-medium brand-text">
                    Ver ficha de la sede
                  </span>
                </Link>
              )}

              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="brand-text"><IconClock /></span>
                  <h3 className="font-semibold text-gray-900">Horario y modalidad</h3>
                </div>
                <ul className="space-y-2 text-sm text-gray-700">
                  {modality && (
                    <li><span className="font-medium">Modalidad:</span> {modalityLabel(modality)}</li>
                  )}
                  {scheduleText && (
                    <li><span className="font-medium">Horario:</span> {scheduleText}</li>
                  )}
                  {classFrequency && (
                    <li><span className="font-medium">Frecuencia:</span> {classFrequency}</li>
                  )}
                  {totalHours && (
                    <li><span className="font-medium">Duracion:</span> {totalHours} horas</li>
                  )}
                  {conv.start_date && (
                    <li>
                      <span className="font-medium">Inicio:</span>{' '}
                      {new Date(conv.start_date).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </li>
                  )}
                  {conv.end_date && (
                    <li>
                      <span className="font-medium">Fin:</span>{' '}
                      {new Date(conv.end_date).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </section>
        )}

        {instructorName && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-5">Docente asignado</h2>
            <Link
              href={instructorHref ?? '#'}
              className="flex flex-col gap-5 rounded-xl border border-gray-200 bg-white p-5 transition hover:border-red-200 hover:shadow-md sm:flex-row sm:items-center"
              aria-disabled={!instructorHref}
            >
              {instructorPhoto ? (
                <img
                  src={instructorPhoto}
                  alt={instructorName}
                  className="h-24 w-24 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-red-50 text-red-600">
                  <IconAcademicCap />
                </div>
              )}
              <div>
                <p className="text-sm font-medium uppercase tracking-wide text-gray-500">Docente</p>
                <h3 className="text-lg font-bold text-gray-900">{instructorName}</h3>
                {instructorCertifications.length > 0 && (
                  <ul className="mt-2 space-y-1 text-sm text-gray-600">
                    {instructorCertifications.slice(0, 3).map((cert: any, index: number) => (
                      <li key={`${cert.title}-${index}`}>
                        {cert.title}
                        {cert.institution ? ` · ${cert.institution}` : ''}
                        {cert.year ? ` · ${cert.year}` : ''}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Link>
          </section>
        )}

        {/* ================================================================ */}
        {/* 5. PRECIO, FINANCIACION Y PAGOS                                   */}
        {/* ================================================================ */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-5">Precio, financiacion y pagos</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="mb-3 flex items-center gap-2">
                <span className="brand-text"><IconCurrencyEuro /></span>
                <h3 className="font-semibold text-gray-900">Precio del ciclo</h3>
              </div>
              <ul className="space-y-1.5 text-sm text-gray-700">
                <li><span className="font-medium">Precio orientativo:</span> {formatCurrency(effectivePrice)}</li>
                {enrollmentFee !== null && (
                  <li><span className="font-medium">Matricula:</span> {formatCurrency(enrollmentFee)}</li>
                )}
                {monthlyFee !== null && (
                  <li><span className="font-medium">Mensualidad:</span> {formatCurrency(monthlyFee)}</li>
                )}
                {pricing?.priceNotes && (
                  <li className="pt-1 text-xs text-gray-500">{pricing.priceNotes}</li>
                )}
              </ul>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="mb-3 flex items-center gap-2">
                <span className="brand-text"><IconCheck /></span>
                <h3 className="font-semibold text-gray-900">Financiacion disponible</h3>
              </div>
              <ul className="space-y-1.5 text-sm text-gray-700">
                {financingTypesList.length > 0 ? (
                  financingTypesList.map((item) => (
                    <li key={item}>• {item}</li>
                  ))
                ) : (
                  <li>• Financiacion a consultar con asesor academico.</li>
                )}
                {scholarships.slice(0, 3).map((sch: any, i: number) => (
                  <li key={`${sch?.name || 'scholarship'}-${i}`} className="text-xs text-gray-600">
                    {sch?.name}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="mb-3 flex items-center gap-2">
                <span className="brand-text"><IconClock /></span>
                <h3 className="font-semibold text-gray-900">Tipos de pago aceptados</h3>
              </div>
              <ul className="space-y-1.5 text-sm text-gray-700">
                {paymentOptions.length > 0 ? (
                  paymentOptions.map((option: string) => (
                    <li key={option}>• {option}</li>
                  ))
                ) : (
                  <>
                    <li>• Transferencia bancaria</li>
                    <li>• Tarjeta</li>
                    <li>• Pago fraccionado (segun estudio)</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* 6. REQUISITOS DE ACCESO                                           */}
        {/* ================================================================ */}
        {requirements.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-5">Requisitos de acceso</h2>
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <ul className="space-y-2.5">
                {requirements.map((req: any, i: number) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="brand-text"><IconCheck /></span>
                    <span className="text-sm text-gray-700">
                      {req.text}
                      {req.type === 'obligatorio' && (
                        <span className="ml-1.5 text-xs font-medium text-red-600">(obligatorio)</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
              {cycle?.slug && (
                <p className="mt-4 text-sm text-gray-500">
                  Consulta todos los detalles en la{' '}
                  <a href={`/p/ciclos/${cycle.slug}`} className="brand-text font-medium hover:underline">
                    ficha completa del ciclo
                  </a>
                  .
                </p>
              )}
            </div>
          </section>
        )}

        {/* ================================================================ */}
        {/* 7. FORMULARIO CENTRADO (the star)                                  */}
        {/* ================================================================ */}
        <section id="formulario" className="scroll-mt-24">
          <div className="mx-auto max-w-xl rounded-2xl brand-bg-light border-2 brand-border p-6 sm:p-8">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
                Solicita informacion o inicia tu inscripcion
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Te contactaremos para confirmar detalles sobre sede, fechas, acceso y proceso de matricula
              </p>
            </div>

            <PreinscripcionForm
              convocatoriaId={String(conv.id)}
              convocatoriaCodigo={conv.codigo || ''}
              displayName={displayName}
            />
          </div>
        </section>

        {/* ================================================================ */}
        {/* 8. CONFIANZA / FAQ                                                */}
        {/* ================================================================ */}
        <section>
          {/* Trust badges */}
          <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { icon: <IconShield />, title: '26 anos de experiencia', desc: 'Formando profesionales desde 2000' },
              { icon: <IconAcademicCap />, title: 'Centro autorizado', desc: 'Titulaciones reconocidas por el MEC' },
              { icon: <IconCheck />, title: 'Calidad certificada', desc: 'Sistema de gestion ISO 9001' },
            ].map((badge, i) => (
              <div
                key={i}
                className="flex flex-col items-center rounded-xl border border-gray-200 bg-white p-5 text-center"
              >
                <span className="brand-text mb-2">{badge.icon}</span>
                <p className="text-sm font-semibold text-gray-900">{badge.title}</p>
                <p className="mt-0.5 text-xs text-gray-500">{badge.desc}</p>
              </div>
            ))}
          </div>

          {/* FAQ */}
          <h2 className="text-xl font-bold text-gray-900 mb-4">Preguntas frecuentes</h2>
          <div className="space-y-2">
            {[
              {
                q: 'Que necesito para inscribirme?',
                a: 'Rellena el formulario de esta pagina y nos pondremos en contacto contigo en menos de 24h para guiarte en el proceso de matricula y verificar los requisitos de acceso.',
              },
              {
                q: 'Puedo financiar mis estudios?',
                a: conv.financial_aid_available
                  ? 'Si, esta convocatoria dispone de opciones de financiacion. Te informaremos de las condiciones cuando contactemos contigo.'
                  : 'Consulta con nuestro equipo las opciones de financiacion y becas disponibles.',
              },
              {
                q: 'La titulacion es oficial?',
                a: officialTitle
                  ? `Si, al completar el ciclo obtendras el titulo de "${officialTitle}", reconocido oficialmente.`
                  : 'Si, nuestras titulaciones son oficiales y reconocidas por el Ministerio de Educacion.',
              },
              {
                q: 'Cuando puedo empezar?',
                a: startMonth
                  ? `Esta convocatoria tiene previsto su inicio en ${startMonth.toLowerCase()}. El plazo de inscripcion esta abierto.`
                  : 'Las fechas exactas se confirman al completar la inscripcion. Contactanos para mas informacion.',
              },
            ].map((faq, i) => (
              <details key={i} className="group rounded-xl border border-gray-200 bg-white">
                <summary className="flex cursor-pointer items-center justify-between gap-2 px-5 py-4 text-sm font-semibold text-gray-900 list-none [&::-webkit-details-marker]:hidden">
                  {faq.q}
                  <IconChevronDown />
                </summary>
                <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <div className="text-center pb-4">
          <a
            href="#formulario"
            className="inline-flex items-center rounded-lg brand-btn px-8 py-3 text-sm font-bold uppercase tracking-wide text-white transition-transform hover:scale-[1.02]"
          >
            Solicitar informacion
          </a>
          <p className="mt-2 text-xs text-gray-400">Sin compromiso. Te contactamos en 24h.</p>
        </div>
      </div>
    </div>
  )
}
