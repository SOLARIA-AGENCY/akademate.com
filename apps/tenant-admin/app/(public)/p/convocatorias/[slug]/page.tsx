import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { PreinscripcionForm } from './PreinscripcionForm'

export const dynamic = 'force-dynamic'

function resolveImageUrl(image: any): string | null {
  if (!image) return null
  if (typeof image === 'object' && image.url) return image.url
  if (typeof image === 'object' && image.filename) return `/media/${image.filename}`
  return null
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
    collection: 'course-runs',
    where: { codigo: { equals: slug } },
    limit: 1, depth: 1,
  })
  const conv = result.docs[0] as any
  if (!conv) return { title: 'Convocatoria no encontrada' }
  const displayName = typeof conv.course === 'object' ? (conv.course.title || conv.course.name) : ''
  return {
    title: `${displayName} — Inscripcion Abierta`,
    description: `Reserva tu plaza en ${displayName}. Plazas limitadas.`,
  }
}

export default async function ConvocatoriaLandingPage({ params }: Props) {
  const { slug } = await params
  const payload = await getPayload({ config: configPromise })

  // Try by codigo first, then by ID
  let result = await payload.find({
    collection: 'course-runs',
    where: { codigo: { equals: slug } },
    limit: 1,
    depth: 2,
  })
  if (result.docs.length === 0) {
    result = await payload.find({
      collection: 'course-runs',
      where: { id: { equals: slug } },
      limit: 1,
      depth: 2,
    })
  }

  const conv = result.docs[0] as any
  if (!conv) notFound()

  const course = typeof conv.course === 'object' ? conv.course : null
  const cycle = typeof conv.cycle === 'object' ? conv.cycle : null
  const campus = typeof conv.campus === 'object' ? conv.campus : null
  // Image: try cycle first, then course
  const cycleImage = cycle ? resolveImageUrl(cycle.image) : null
  const courseImage = course ? resolveImageUrl(course.image || course.featured_image) : null
  const imageUrl = cycleImage || courseImage
  // Name: prefer cycle name, then course
  const displayName = cycle?.name || course?.title || course?.name || ''
  const plazasDisponibles = (conv.max_students || 0) - (conv.current_enrollments || 0)
  const porcentajeOcupado = conv.max_students ? Math.round(((conv.current_enrollments || 0) / conv.max_students) * 100) : 0

  return (
    <div>
      {/* HERO — aggressive CTA with brand color */}
      <div className="relative h-72 sm:h-96 brand-bg">
        {imageUrl && <img src={imageUrl} alt={displayName} className="absolute inset-0 w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-12 max-w-7xl mx-auto">
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="inline-block px-4 py-1.5 brand-btn text-sm font-bold rounded-full uppercase tracking-wide">Convocatoria Abierta</span>
            {plazasDisponibles <= 10 && plazasDisponibles > 0 && (
              <span className="inline-block px-4 py-1.5 bg-white text-gray-900 text-sm font-bold rounded-full uppercase tracking-wide animate-pulse">Plazas Limitadas</span>
            )}
            {plazasDisponibles > 10 && (
              <span className="inline-block px-4 py-1.5 bg-white/20 text-white text-sm font-bold rounded-full uppercase tracking-wide">{plazasDisponibles} plazas disponibles</span>
            )}
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold text-white mb-2">{displayName}</h1>
          {conv.codigo && <p className="text-lg text-white/70 font-mono">{conv.codigo}</p>}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* MAIN */}
          <div className="lg:col-span-2 space-y-10">
            {/* Key info cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {campus && (
                <div className="p-5 bg-white border border-gray-200 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="h-5 w-5 brand-text" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </div>
                    <h3 className="font-semibold text-gray-900">Sede</h3>
                  </div>
                  <p className="font-medium text-gray-900">{campus.name}</p>
                  {campus.address && <p className="text-sm text-gray-600">{campus.address}</p>}
                  {campus.city && <p className="text-sm text-gray-600">{campus.city}</p>}
                  {campus.phone && <p className="text-sm text-gray-600 mt-1">Tel: {campus.phone}</p>}
                </div>
              )}
              <div className="p-5 bg-white border border-gray-200 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 bg-amber-100 rounded-full flex items-center justify-center">
                    <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                  <h3 className="font-semibold text-gray-900">Fechas</h3>
                </div>
                {conv.start_date ? (
                  <>
                    <p className="text-gray-900">Inicio: <strong>{new Date(conv.start_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</strong></p>
                    {conv.end_date && <p className="text-sm text-gray-600">Fin: {new Date(conv.end_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>}
                  </>
                ) : (
                  <p className="text-gray-600">Fechas por confirmar</p>
                )}
              </div>
            </div>

            {/* Plazas progress */}
            {conv.max_students && (
              <div className="p-6 bg-white border-2 brand-border rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-gray-900">Plazas disponibles</h3>
                  <span className="text-2xl font-bold brand-text">{plazasDisponibles}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                  <div className="brand-bg h-3 rounded-full transition-all" style={{ width: `${Math.min(porcentajeOcupado, 100)}%` }} />
                </div>
                <p className="text-sm text-gray-500">{conv.current_enrollments || 0} de {conv.max_students} plazas ocupadas ({porcentajeOcupado}%)</p>
                {plazasDisponibles <= 5 && plazasDisponibles > 0 && (
                  <p className="text-sm font-semibold text-red-600 mt-2">Ultimas plazas disponibles</p>
                )}
              </div>
            )}

            {/* Course description */}
            {course?.description && (
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Sobre {displayName}</h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">{course.description}</p>
              </section>
            )}
          </div>

          {/* SIDEBAR — preinscripcion */}
          <div className="space-y-6">
            {/* CTA Card */}
            <div className="brand-bg-light border-2 brand-border rounded-xl p-6 sticky top-24">
              <h3 className="text-xl font-bold text-gray-900 mb-1">Inscribete ahora</h3>
              <p className="text-sm font-semibold brand-text mb-1">Convocatoria abierta · Plazas limitadas</p>
              <p className="text-sm text-gray-600 mb-4">
                Completa el formulario para reservar tu plaza. Te contactaremos en 24h.
              </p>
              <PreinscripcionForm
                convocatoriaId={String(conv.id)}
                convocatoriaCodigo={conv.codigo || ''}
                displayName={displayName}
              />
            </div>

            {/* Share */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Compartir</h3>
              <div className="flex gap-3">
                <a href={`https://wa.me/?text=${encodeURIComponent(`${displayName} — Inscripcion abierta!`)}`} target="_blank" rel="noopener" className="flex items-center gap-2 px-4 py-2 brand-bg text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors">WhatsApp</a>
                <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">Copiar enlace</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
