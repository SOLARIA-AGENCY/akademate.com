import { getPayload } from 'payload'
import configPromise from '@payload-config'
import Link from 'next/link'
import type { Metadata } from 'next'
import { withTenantScope } from '@/app/lib/server/tenant-scope'
import { getTenantHostBranding } from '@/app/lib/server/tenant-host-branding'

export const metadata: Metadata = {
  title: 'Convocatorias Abiertas',
  description: 'Convocatorias de formación profesional con inscripción abierta.',
}
export const dynamic = 'force-dynamic'

function resolveImageUrl(image: any): string | null {
  if (!image) return null
  if (typeof image === 'object' && image.url) return image.url
  if (typeof image === 'object' && image.filename) return `/media/${image.filename}`
  return null
}

export default async function ConvocatoriasPage() {
  const tenant = await getTenantHostBranding()
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'course-runs',
    where: withTenantScope({ status: { in: ['enrollment_open', 'published'] } }, tenant.tenantId) as any,
    limit: 50,
    sort: '-start_date',
    depth: 2,
  })

  const convocatorias = result.docs
  const grouped = new Map<string, { title: string; city?: string; docs: any[] }>()

  for (const conv of convocatorias as any[]) {
    const campus = typeof conv.campus === 'object' && conv.campus ? conv.campus : null
    const key = campus?.id ? String(campus.id) : 'online'
    if (!grouped.has(key)) {
      grouped.set(key, {
        title: campus?.name || 'Modalidad Online / Sin sede fija',
        city: campus?.city || undefined,
        docs: [],
      })
    }
    grouped.get(key)!.docs.push(conv)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Convocatorias Abiertas</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Inscríbete en nuestras convocatorias activas. Plazas limitadas.
        </p>
      </div>

      {convocatorias.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg">No hay convocatorias abiertas en este momento</p>
          <p className="text-sm mt-2">Consulta nuestros <a href="/ciclos" className="brand-text hover:underline">ciclos formativos</a> y déjanos tu email para enterarte de nuevas convocatorias.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {Array.from(grouped.entries()).map(([groupKey, group]) => (
            <section key={groupKey}>
              <div className="mb-5 flex items-center gap-2 text-sm font-semibold text-gray-700">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s7-4.35 7-10a7 7 0 1 0-14 0c0 5.65 7 10 7 10Z" />
                  <circle cx="12" cy="11" r="2.5" />
                </svg>
                <span>{group.title}{group.city ? ` — ${group.city}` : ''}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {group.docs.map((conv: any) => {
            const course = typeof conv.course === 'object' ? conv.course : null
            const cycle = typeof conv.cycle === 'object' ? conv.cycle : null
            const campus = typeof conv.campus === 'object' ? conv.campus : null
            // Image priority: course.featured_image → cycle.image → null
            const imageUrl = (course ? resolveImageUrl(course.featured_image) : null)
              || (cycle ? resolveImageUrl(cycle.image) : null)
              || (course ? resolveImageUrl(course.image) : null)
            const plazasDisponibles = (conv.max_students || 0) - (conv.current_enrollments || 0)
            const porcentajeOcupado = conv.max_students ? Math.round(((conv.current_enrollments || 0) / conv.max_students) * 100) : 0

            return (
              <Link key={conv.id} href={`/convocatorias/${conv.codigo || conv.id}`} className="group">
                <div className="bg-white rounded-xl border-2 border-green-200 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group-hover:border-green-400">
                  <div className="relative h-40 bg-gradient-to-br from-green-600 to-green-800">
                    {imageUrl && <img src={imageUrl} alt={course?.title || ''} className="w-full h-full object-cover" />}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute top-3 right-3">
                      <span className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full uppercase">Inscripción abierta</span>
                    </div>
                    <div className="absolute bottom-3 left-4 right-4">
                      <h2 className="text-lg font-bold text-white">{course?.title || course?.name || conv.codigo}</h2>
                    </div>
                  </div>
                  <div className="p-5 space-y-3">
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      {campus && <span className="flex items-center gap-1"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>{campus.name}</span>}
                      {conv.start_date && <span className="flex items-center gap-1"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>{new Date(conv.start_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</span>}
                    </div>
                    {conv.max_students && (
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Plazas</span>
                          <span className="font-semibold text-gray-900">{plazasDisponibles} disponibles de {conv.max_students}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${Math.min(porcentajeOcupado, 100)}%` }} />
                        </div>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs text-gray-400 font-mono">{conv.codigo}</span>
                      <span className="text-green-600 font-medium text-sm group-hover:text-green-700">Reservar plaza &rarr;</span>
                    </div>
                  </div>
                </div>
              </Link>
            )
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
