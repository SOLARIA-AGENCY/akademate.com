import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { LeadForm } from './LeadForm'
import { withTenantScope } from '@/app/lib/server/tenant-scope'
import { getTenantHostBranding } from '@/app/lib/server/tenant-host-branding'

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveImageUrl(image: any): string | null {
  if (!image) return null
  if (typeof image === 'object' && image.url) return image.url
  if (typeof image === 'object' && image.filename) return `/media/${image.filename}`
  return null
}

function getRelationId(relation: unknown): string | null {
  if (!relation) return null
  if (typeof relation === 'object' && 'id' in relation && relation.id) return String(relation.id)
  if (typeof relation === 'number' || typeof relation === 'string') return String(relation)
  return null
}

const LEVEL_LABELS: Record<string, string> = {
  basico: 'FP Basica',
  medio: 'Grado Medio',
  superior: 'Grado Superior',
}

const MODALITY_LABELS: Record<string, string> = {
  presencial: 'Presencial',
  semipresencial: 'Semipresencial',
  online: 'Online',
  distancia: 'A distancia',
}

const MODULE_TYPE_STYLES: Record<string, string> = {
  troncal: 'bg-blue-100 text-blue-800',
  optativo: 'bg-purple-100 text-purple-800',
  transversal: 'bg-amber-100 text-amber-800',
  fct: 'bg-green-100 text-green-800',
}

const ENROLLMENT_REQUIREMENTS = [
  'Titulación Adecuada',
  'Pago de Matrícula',
  'DNI',
  'Foto Tipo Carnet',
] as const

/** Build an aspirational headline from cycle name */
function buildHeadline(name: string): string {
  const lower = name.toLowerCase()
  if (lower.startsWith('tecnico') || lower.startsWith('técnico')) return `Formate como ${name}`
  return `Estudia ${name}`
}

/** Format a convocatoria for display (no internal codes) */
function formatConvocatoriaDisplay(conv: any): string {
  const parts: string[] = []
  if (conv.start_date) {
    const d = new Date(conv.start_date)
    const month = d.toLocaleDateString('es-ES', { month: 'long' })
    parts.push(`${month.charAt(0).toUpperCase() + month.slice(1)} ${d.getFullYear()}`)
  }
  const campus = typeof conv.campus === 'object' ? conv.campus : null
  if (campus?.name) parts.push(`Sede ${campus.name}`)
  return parts.join(' · ') || 'Convocatoria abierta'
}

function formatAccessRequirementText(text: string, level: string): string {
  const normalized = text.toLowerCase()
  if (level === 'superior' && normalized.includes('prueba de acceso')) {
    return 'Requisitos Prueba de Acceso a Grado Superior "Tipo C".'
  }
  return text
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const tenant = await getTenantHostBranding()
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'cycles',
    where: withTenantScope({ slug: { equals: slug } }, tenant.tenantId) as any,
    limit: 1,
    depth: 0,
  })
  const cycle = result.docs[0]
  if (!cycle) return { title: 'Ciclo no encontrado' }

  const description =
    cycle.description?.substring(0, 160) ||
    `Ciclo formativo: ${cycle.name}. Titulacion oficial, formacion practica y orientacion profesional.`

  return {
    title: `${cycle.name} | Ciclo Formativo`,
    description,
    openGraph: {
      title: cycle.name,
      description,
    },
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function CicloLandingPage({ params }: Props) {
  const { slug } = await params
  const tenant = await getTenantHostBranding()
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'cycles',
    where: withTenantScope({ slug: { equals: slug } }, tenant.tenantId) as any,
    limit: 1,
    depth: 1,
  })

  const cycle = result.docs[0] as any
  if (!cycle) notFound()

  // Data extraction
  const linkedCoursesResult = await payload.find({
    collection: 'courses',
    where: withTenantScope(
      {
        active: { equals: true },
        course_type: { in: ['ciclo_medio', 'ciclo_superior'] },
      },
      tenant.tenantId,
    ) as any,
    limit: 100,
    depth: 1,
  })
  const linkedCourse = (linkedCoursesResult.docs as any[]).find((course) => getRelationId(course.cycle) === String(cycle.id))
  const imageUrl = resolveImageUrl(linkedCourse?.featured_image) || resolveImageUrl(cycle.image)
  const modules = cycle.modules || []
  const requirements = cycle.requirements || []
  const careerPaths = cycle.careerPaths || []
  const competencies = cycle.competencies || []
  const features = cycle.features || []
  const duration = cycle.duration || {}
  const level = LEVEL_LABELS[cycle.level] || cycle.level
  const modality = MODALITY_LABELS[duration.modality] || duration.modality || ''
  const totalHours = modules.reduce((s: number, m: any) => s + (m.hours || 0), 0)

  // Group modules by courseYear for collapsible plan
  const modulesByYear: Record<number, any[]> = {}
  for (const m of modules) {
    const year = m.courseYear || 1
    if (!modulesByYear[year]) modulesByYear[year] = []
    modulesByYear[year].push(m)
  }
  const sortedYears = Object.keys(modulesByYear)
    .map(Number)
    .sort((a, b) => a - b)

  // Fetch active convocatorias for this cycle
  const convsResult = await payload.find({
    collection: 'course-runs',
    where: withTenantScope({ status: { in: ['enrollment_open', 'published'] } }, tenant.tenantId) as any,
    limit: 10,
    depth: 2,
  })
  const activeConvocatorias = (convsResult.docs || []).filter((conv: any) => {
    const convCycle = typeof conv.cycle === 'object' ? conv.cycle : null
    return convCycle && String(convCycle.id) === String(cycle.id)
  })

  // Hero badges
  const heroBadges: string[] = []
  if (cycle.officialTitle || level) heroBadges.push('Titulacion oficial')
  if (modality) heroBadges.push(modality)
  if (duration.practiceHours) heroBadges.push(`${duration.practiceHours}h practicas`)
  if (features.length > 0 || cycle.family) heroBadges.push('Centro autorizado')

  return (
    <div className="bg-white">
      {/* ================================================================ */}
      {/* 1. HERO — aspirational, full-width                              */}
      {/* ================================================================ */}
      <section className="relative min-h-[420px] sm:min-h-[500px] flex items-end brand-bg">
        {imageUrl && (
          <img
            src={imageUrl}
            alt={cycle.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />

        <div className="relative w-full max-w-5xl mx-auto px-4 sm:px-6 pb-10 pt-32 sm:pt-40">
          {/* Badges */}
          {heroBadges.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {heroBadges.map((badge, i) => (
                <span
                  key={i}
                  className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-sm border border-white/20"
                >
                  {badge}
                </span>
              ))}
            </div>
          )}

          <h1 className="text-3xl sm:text-5xl font-bold text-white leading-tight mb-3">
            {buildHeadline(cycle.name)}
          </h1>

          {cycle.description && (
            <p className="text-lg sm:text-xl text-white/85 max-w-2xl mb-6 leading-relaxed">
              {cycle.description.length > 200
                ? cycle.description.substring(0, 200).trim() + '...'
                : cycle.description}
            </p>
          )}

          <a
            href="#solicitar-info"
            className="inline-flex items-center gap-2 px-6 py-3 brand-btn rounded-lg text-base font-semibold shadow-lg hover:opacity-90 transition-opacity"
          >
            Solicitar informacion
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </a>
        </div>
      </section>

      {/* ================================================================ */}
      {/* 2. QUE APRENDERAS — competencies                                */}
      {/* ================================================================ */}
      {competencies.length > 0 && (
        <section className="py-16 px-4 sm:px-6 max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Que aprenderas en este ciclo</h2>
          <p className="text-gray-500 mb-8">Competencias profesionales que adquiriras durante la formacion</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {competencies.map((c: any, i: number) => (
              <div key={i} className="p-5 rounded-xl bg-gray-50 border border-gray-100 hover:shadow-sm transition-shadow">
                <div className="h-10 w-10 rounded-lg brand-bg-light brand-text flex items-center justify-center mb-3">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{c.title}</h3>
                {c.description && <p className="text-sm text-gray-600 leading-relaxed">{c.description}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ================================================================ */}
      {/* 3. SALIDAS PROFESIONALES — career paths                         */}
      {/* ================================================================ */}
      {careerPaths.length > 0 && (
        <section className="py-16 px-4 sm:px-6 bg-gray-50">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Donde podras trabajar</h2>
            <p className="text-gray-500 mb-8">Salidas profesionales reales con este titulo</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {careerPaths.map((cp: any, i: number) => (
                <div key={i} className="p-5 bg-white rounded-xl border border-gray-200 hover:shadow-sm transition-shadow">
                  <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.193 23.193 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{cp.title}</h3>
                  {cp.sector && <p className="text-sm text-gray-500">{cp.sector}</p>}
                  {cp.description && <p className="text-sm text-gray-600 mt-1">{cp.description}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ================================================================ */}
      {/* 4. REQUISITOS DE ACCESO                                         */}
      {/* ================================================================ */}
      {requirements.length > 0 && (
        <section className="py-16 px-4 sm:px-6 max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Requisito de acceso</h2>
          <ul className="space-y-3 max-w-2xl">
            {requirements.map((r: any, i: number) => (
              <li key={i} className="flex items-start gap-3">
                <svg className="h-5 w-5 text-green-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">{formatAccessRequirementText(r.text, cycle.level)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8 max-w-2xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Requisitos de Matriculación</h3>
            <ul className="space-y-2">
              {ENROLLMENT_REQUIREMENTS.map((item) => (
                <li key={item} className="text-gray-700">- {item}</li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ================================================================ */}
      {/* 5. MODALIDAD Y VENTAJAS DEL CENTRO                              */}
      {/* ================================================================ */}
      <section className="py-16 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Por que estudiar este ciclo con nosotros</h2>
          <p className="text-gray-500 mb-8">Ventajas de nuestro centro</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Show cycle features if available, otherwise show defaults */}
            {features.length > 0 ? (
              features.map((f: any, i: number) => (
                <div key={i} className="p-5 bg-white rounded-xl border border-gray-200">
                  <div className="h-10 w-10 rounded-lg brand-bg-light brand-text flex items-center justify-center mb-3">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
                  {f.description && <p className="text-sm text-gray-600">{f.description}</p>}
                </div>
              ))
            ) : (
              <>
                {[
                  { icon: 'calendar', title: modality || 'Formacion flexible', desc: 'Modalidad adaptada a tu disponibilidad' },
                  { icon: 'briefcase', title: duration.practiceHours ? `${duration.practiceHours}h practicas en empresa` : 'Practicas en empresa', desc: 'Formacion practica en entornos profesionales reales' },
                  { icon: 'users', title: 'Grupos reducidos', desc: 'Atencion personalizada para cada alumno' },
                  { icon: 'award', title: 'Centro autorizado', desc: 'Titulacion oficial reconocida en todo el territorio' },
                  { icon: 'credit', title: 'Financiacion disponible', desc: 'Facilidades de pago adaptadas a tus necesidades' },
                  { icon: 'clock', title: 'Experiencia contrastada', desc: 'Anos de trayectoria formando profesionales' },
                ].map((item, i) => (
                  <div key={i} className="p-5 bg-white rounded-xl border border-gray-200">
                    <div className="h-10 w-10 rounded-lg brand-bg-light brand-text flex items-center justify-center mb-3">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                    <p className="text-sm text-gray-600">{item.desc}</p>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* 6. CONVOCATORIAS ABIERTAS                                       */}
      {/* ================================================================ */}
      <section className="py-16 px-4 sm:px-6 max-w-5xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Convocatorias abiertas</h2>
        <p className="text-gray-500 mb-8">Proximas fechas de inicio disponibles</p>

        {activeConvocatorias.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {activeConvocatorias.map((conv: any) => {
              const campus = typeof conv.campus === 'object' ? conv.campus : null
              const hasPlazas = conv.max_students
                ? conv.current_enrollments < conv.max_students
                : true

              return (
                <div
                  key={conv.id}
                  className="p-6 bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold brand-bg-light brand-text">
                      {hasPlazas ? 'Plazas disponibles' : 'Convocatoria abierta'}
                    </span>
                  </div>

                  <h3 className="font-semibold text-gray-900 text-lg mb-1">
                    {formatConvocatoriaDisplay(conv)}
                  </h3>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 mb-4">
                    {conv.start_date && (
                      <span>
                        Inicio:{' '}
                        {new Date(conv.start_date).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                    )}
                    {campus?.name && <span>Sede: {campus.name}</span>}
                  </div>

                  <a
                    href={`/p/convocatorias/${conv.codigo || conv.id}`}
                    className="inline-flex items-center gap-1 text-sm font-semibold brand-text hover:underline"
                  >
                    Ver convocatoria
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="p-8 bg-gray-50 rounded-xl border border-gray-200 text-center">
            <p className="text-gray-600 mb-2 font-medium">Proximamente</p>
            <p className="text-sm text-gray-500">
              No hay convocatorias abiertas en este momento. Dejanos tu email y te avisaremos cuando se abra una nueva.
            </p>
          </div>
        )}
      </section>

      {/* ================================================================ */}
      {/* 7. PLAN DE ESTUDIOS — collapsible by year                       */}
      {/* ================================================================ */}
      {modules.length > 0 && (
        <section className="py-16 px-4 sm:px-6 bg-gray-50">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Plan de estudios completo</h2>
            <p className="text-gray-500 mb-8">
              {modules.length} modulos{totalHours > 0 ? ` · ${totalHours} horas totales` : ''}
            </p>

            <div className="space-y-4">
              {sortedYears.map((year) => (
                <details key={year} className="group bg-white rounded-xl border border-gray-200 overflow-hidden" open>
                  <summary className="flex items-center justify-between p-5 cursor-pointer select-none hover:bg-gray-50 transition-colors">
                    <span className="font-semibold text-gray-900 text-lg">
                      {year}o Curso
                      <span className="ml-2 text-sm font-normal text-gray-500">
                        ({modulesByYear[year].length} modulos
                        {modulesByYear[year].reduce((s: number, m: any) => s + (m.hours || 0), 0) > 0
                          ? ` · ${modulesByYear[year].reduce((s: number, m: any) => s + (m.hours || 0), 0)}h`
                          : ''}
                        )
                      </span>
                    </span>
                    <svg className="h-5 w-5 text-gray-400 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>

                  <div className="px-5 pb-5">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 pr-4 font-semibold text-gray-700">Modulo</th>
                          <th className="text-center py-2 px-2 font-semibold text-gray-700 w-16">Horas</th>
                          <th className="text-center py-2 pl-2 font-semibold text-gray-700 w-24">Tipo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {modulesByYear[year].map((m: any, i: number) => (
                          <tr key={i} className="border-b border-gray-100 last:border-0">
                            <td className="py-2.5 pr-4 text-gray-700">{m.name}</td>
                            <td className="py-2.5 px-2 text-center text-gray-500">{m.hours || '-'}</td>
                            <td className="py-2.5 pl-2 text-center">
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${MODULE_TYPE_STYLES[m.type] || 'bg-gray-100 text-gray-600'}`}
                              >
                                {m.type}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              ))}
            </div>

            {totalHours > 0 && (
              <p className="mt-4 text-right text-sm font-semibold text-gray-700">
                Total: {totalHours} horas
              </p>
            )}
          </div>
        </section>
      )}

      {/* ================================================================ */}
      {/* 8. FORMULARIO DE SOLICITUD                                      */}
      {/* ================================================================ */}
      <section id="solicitar-info" className="py-16 px-4 sm:px-6 scroll-mt-8">
        <div className="max-w-xl mx-auto">
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 sm:p-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
              Solicita informacion del ciclo
            </h2>
            <p className="text-gray-500 text-center mb-8 text-sm leading-relaxed">
              Te contactamos para resolver dudas sobre acceso, modalidad, fechas y proceso de matricula
            </p>

            <LeadForm
              cycleId={String(cycle.id)}
              cycleName={cycle.name}
              hasActiveConvocatorias={activeConvocatorias.length > 0}
            />
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* 9. FAQ                                                          */}
      {/* ================================================================ */}
      <section className="py-16 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">Preguntas frecuentes</h2>

          <div className="space-y-3">
            {[
              {
                q: 'Cual es la modalidad de estudio?',
                a: modality
                  ? `Este ciclo se imparte en modalidad ${modality.toLowerCase()}. ${duration.classFrequency ? `La frecuencia de clases es: ${duration.classFrequency}.` : 'Consulta con nosotros para conocer el horario exacto.'}`
                  : 'Consulta con nosotros para conocer las modalidades disponibles y los horarios de clase.',
              },
              {
                q: 'Las practicas en empresa estan incluidas?',
                a: duration.practiceHours
                  ? `Si, el ciclo incluye ${duration.practiceHours} horas de formacion en centros de trabajo (FCT). Gestionamos los convenios con empresas del sector.`
                  : 'Si, el ciclo incluye un periodo de formacion en centros de trabajo (FCT). Consulta con nosotros los detalles.',
              },
              {
                q: 'Que titulacion obtendre?',
                a: cycle.officialTitle
                  ? `Obtendras el titulo oficial de ${cycle.officialTitle}, con validez en todo el territorio nacional.`
                  : `Obtendras un titulo oficial de ${level || 'formacion profesional'} reconocido en todo el territorio nacional.`,
              },
              {
                q: 'Cuales son los requisitos de acceso?',
                a: requirements.length > 0
                  ? `Los requisitos principales incluyen: ${requirements.slice(0, 3).map((r: any) => r.text).join('; ')}. Consulta con nosotros si tienes dudas sobre tu situacion.`
                  : 'Los requisitos de acceso dependen del nivel del ciclo. Contacta con nosotros y te informaremos segun tu perfil academico.',
              },
              {
                q: 'Hay opciones de financiacion?',
                a: 'Si, ofrecemos facilidades de pago y opciones de financiacion. Contacta con nosotros para conocer las condiciones disponibles.',
              },
            ].map((item, i) => (
              <details key={i} className="group bg-white rounded-xl border border-gray-200 overflow-hidden">
                <summary className="flex items-center justify-between p-5 cursor-pointer select-none hover:bg-gray-50 transition-colors">
                  <span className="font-medium text-gray-900 pr-4">{item.q}</span>
                  <svg className="h-5 w-5 text-gray-400 shrink-0 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-5 pb-5">
                  <p className="text-gray-600 text-sm leading-relaxed">{item.a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-12 px-4 sm:px-6 text-center">
        <p className="text-gray-500 mb-4">Tienes dudas? Contacta con nosotros sin compromiso</p>
        <a
          href="#solicitar-info"
          className="inline-flex items-center gap-2 px-6 py-3 brand-btn rounded-lg text-base font-semibold hover:opacity-90 transition-opacity"
        >
          Solicitar informacion
        </a>
      </section>
    </div>
  )
}
