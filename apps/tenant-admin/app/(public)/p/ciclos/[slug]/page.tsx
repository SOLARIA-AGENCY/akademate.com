import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { LeadForm } from './LeadForm'

export const dynamic = 'force-dynamic'

// Helper functions
function resolveImageUrl(image: any): string | null {
  if (!image) return null
  if (typeof image === 'object' && image.url) return image.url
  if (typeof image === 'object' && image.filename) return `/media/${image.filename}`
  return null
}

const LEVEL_LABELS: Record<string, string> = {
  basico: 'FP Basica', medio: 'Grado Medio', superior: 'Grado Superior',
}

const MODULE_TYPE_STYLES: Record<string, string> = {
  troncal: 'bg-blue-100 text-blue-800',
  optativo: 'bg-purple-100 text-purple-800',
  transversal: 'bg-amber-100 text-amber-800',
  fct: 'bg-green-100 text-green-800',
}

function formatCurrency(v: number | undefined): string {
  if (v == null) return ''
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(v)
}

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'cycles',
    where: { slug: { equals: slug } },
    limit: 1, depth: 0,
  })
  const cycle = result.docs[0]
  if (!cycle) return { title: 'Ciclo no encontrado' }
  return {
    title: `${cycle.name} | Ciclo Formativo`,
    description: cycle.description?.substring(0, 160) || `Ciclo formativo: ${cycle.name}`,
    openGraph: {
      title: cycle.name,
      description: cycle.description?.substring(0, 160),
    },
  }
}

export default async function CicloLandingPage({ params }: Props) {
  const { slug } = await params
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'cycles',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 1,
  })

  const cycle = result.docs[0] as any
  if (!cycle) notFound()

  const imageUrl = resolveImageUrl(cycle.image)
  const modules = cycle.modules || []
  const requirements = cycle.requirements || []
  const careerPaths = cycle.careerPaths || []
  const competencies = cycle.competencies || []
  const features = cycle.features || []
  const duration = cycle.duration || {}
  const pricing = cycle.pricing || {}
  const level = LEVEL_LABELS[cycle.level] || cycle.level
  const totalHours = modules.reduce((s: number, m: any) => s + (m.hours || 0), 0)

  // Check if there are active convocatorias
  const convsResult = await payload.find({
    collection: 'course-runs',
    where: {
      status: { in: ['enrollment_open', 'published'] },
    },
    limit: 10,
    depth: 1,
  })
  const activeConvocatorias = convsResult.docs || []

  return (
    <div>
      {/* HERO */}
      <div className="relative h-72 sm:h-96 bg-gradient-to-br from-blue-700 to-blue-900">
        {imageUrl && <img src={imageUrl} alt={cycle.name} className="absolute inset-0 w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-12 max-w-7xl mx-auto">
          <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-white/90 text-gray-800 mb-3">{level}</span>
          <h1 className="text-3xl sm:text-5xl font-bold text-white mb-2">{cycle.name}</h1>
          {cycle.officialTitle && <p className="text-lg text-white/80">{cycle.officialTitle}</p>}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* MAIN CONTENT (2/3) */}
          <div className="lg:col-span-2 space-y-10">
            {/* Description */}
            {cycle.description && (
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Sobre este ciclo</h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">{cycle.description}</p>
              </section>
            )}

            {/* Key info pills */}
            <div className="flex flex-wrap gap-3">
              {duration.totalHours && <span className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">{duration.totalHours}h totales</span>}
              {duration.courses && <span className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">{duration.courses} cursos</span>}
              {duration.modality && <span className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium capitalize">{duration.modality}</span>}
              {duration.practiceHours && <span className="px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-medium">{duration.practiceHours}h practicas</span>}
              {cycle.family && <span className="px-4 py-2 bg-purple-50 text-purple-700 rounded-full text-sm font-medium">{cycle.family}</span>}
            </div>

            {/* Modules */}
            {modules.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Plan de Estudios ({modules.length} modulos)</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 pr-4 font-semibold text-gray-900">Modulo</th>
                        <th className="text-center py-3 px-2 font-semibold text-gray-900 w-16">Curso</th>
                        <th className="text-center py-3 px-2 font-semibold text-gray-900 w-16">Horas</th>
                        <th className="text-center py-3 pl-2 font-semibold text-gray-900 w-24">Tipo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modules.map((m: any, i: number) => (
                        <tr key={i} className="border-b border-gray-100">
                          <td className="py-2.5 pr-4 text-gray-700">{m.name}</td>
                          <td className="py-2.5 px-2 text-center text-gray-500">{m.courseYear}o</td>
                          <td className="py-2.5 px-2 text-center text-gray-500">{m.hours || '-'}</td>
                          <td className="py-2.5 pl-2 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${MODULE_TYPE_STYLES[m.type] || 'bg-gray-100 text-gray-600'}`}>{m.type}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    {totalHours > 0 && (
                      <tfoot>
                        <tr className="font-semibold text-gray-900">
                          <td className="py-3">Total</td>
                          <td></td>
                          <td className="text-center">{totalHours}h</td>
                          <td></td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </section>
            )}

            {/* Competencias */}
            {competencies.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Competencias</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {competencies.map((c: any, i: number) => (
                    <div key={i} className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-1">{c.title}</h3>
                      {c.description && <p className="text-sm text-gray-600">{c.description}</p>}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Salidas profesionales */}
            {careerPaths.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Salidas Profesionales</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {careerPaths.map((cp: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                        <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.193 23.193 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{cp.title}</p>
                        {cp.sector && <p className="text-xs text-gray-500">{cp.sector}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Requisitos */}
            {requirements.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Requisitos de Acceso</h2>
                <ul className="space-y-2">
                  {requirements.map((r: any, i: number) => (
                    <li key={i} className="flex items-start gap-3">
                      <svg className="h-5 w-5 text-green-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      <span className="text-gray-700">{r.text}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Features */}
            {features.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Caracteristicas</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {features.map((f: any, i: number) => (
                    <div key={i} className="p-4 border border-gray-200 rounded-lg">
                      <h3 className="font-semibold text-gray-900">{f.title}</h3>
                      {f.description && <p className="text-sm text-gray-600 mt-1">{f.description}</p>}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* SIDEBAR (1/3) */}
          <div className="space-y-6">
            {/* Pricing card */}
            {(pricing.totalPrice || pricing.enrollmentFee || pricing.monthlyFee) && (
              <div className="bg-white border-2 border-blue-200 rounded-xl p-6 sticky top-24">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Precios</h3>
                {pricing.totalPrice != null && (
                  <p className="text-3xl font-bold text-blue-600 mb-2">{formatCurrency(pricing.totalPrice)}</p>
                )}
                {pricing.enrollmentFee != null && (
                  <p className="text-sm text-gray-600">Matricula: {formatCurrency(pricing.enrollmentFee)}</p>
                )}
                {pricing.monthlyFee != null && (
                  <p className="text-sm text-gray-600">Mensualidad: {formatCurrency(pricing.monthlyFee)}</p>
                )}
                {pricing.priceNotes && (
                  <p className="text-xs text-gray-500 mt-2">{pricing.priceNotes}</p>
                )}
                {cycle.fundaeEligible && (
                  <div className="mt-3 px-3 py-1.5 bg-green-50 text-green-700 rounded text-xs font-medium inline-block">
                    Bonificable FUNDAE
                  </div>
                )}
              </div>
            )}

            {/* Lead form */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Pedir informacion</h3>
              <p className="text-sm text-gray-600 mb-4">Dejanos tu email y te informaremos de proximas convocatorias y novedades.</p>
              <LeadForm cycleId={String(cycle.id)} cycleName={cycle.name} hasActiveConvocatorias={activeConvocatorias.length > 0} />
            </div>

            {/* Active convocatorias */}
            {activeConvocatorias.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Convocatorias Abiertas</h3>
                <div className="space-y-3">
                  {activeConvocatorias.map((conv: any) => (
                    <a key={conv.id} href={`/p/convocatorias/${conv.codigo || conv.id}`} className="block p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors">
                      <p className="font-medium text-gray-900 text-sm">{conv.codigo}</p>
                      {conv.start_date && <p className="text-xs text-gray-500">Inicio: {new Date(conv.start_date).toLocaleDateString('es-ES')}</p>}
                      {conv.max_students && <p className="text-xs text-blue-600 font-medium">{conv.max_students - (conv.current_enrollments || 0)} plazas disponibles</p>}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Quick info */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Informacion rapida</h3>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between"><dt className="text-gray-500">Nivel</dt><dd className="font-medium text-gray-900">{level}</dd></div>
                {cycle.family && <div className="flex justify-between"><dt className="text-gray-500">Familia</dt><dd className="font-medium text-gray-900">{cycle.family}</dd></div>}
                {duration.totalHours && <div className="flex justify-between"><dt className="text-gray-500">Duracion</dt><dd className="font-medium text-gray-900">{duration.totalHours}h</dd></div>}
                {duration.modality && <div className="flex justify-between"><dt className="text-gray-500">Modalidad</dt><dd className="font-medium text-gray-900 capitalize">{duration.modality}</dd></div>}
                {duration.classFrequency && <div className="flex justify-between"><dt className="text-gray-500">Frecuencia</dt><dd className="font-medium text-gray-900">{duration.classFrequency}</dd></div>}
                {modules.length > 0 && <div className="flex justify-between"><dt className="text-gray-500">Modulos</dt><dd className="font-medium text-gray-900">{modules.length}</dd></div>}
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
