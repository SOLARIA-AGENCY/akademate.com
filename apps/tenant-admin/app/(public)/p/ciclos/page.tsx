import { getPayload } from 'payload'
import configPromise from '@payload-config'
import Link from 'next/link'
import type { Metadata } from 'next'
import { withTenantScope } from '@/app/lib/server/tenant-scope'
import { getTenantHostBranding } from '@/app/lib/server/tenant-host-branding'

export const metadata: Metadata = {
  title: 'Ciclos Formativos',
  description: 'Descubre nuestros ciclos formativos de grado medio y superior.',
}

export const dynamic = 'force-dynamic'

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

const LEVEL_META: Record<string, { label: string; bgColor: string; textColor: string }> = {
  grado_medio: { label: 'Grado Medio · CFGM', bgColor: '#2563EB', textColor: '#FFFFFF' },
  grado_superior: { label: 'Grado Superior · CFGS', bgColor: '#E3003A', textColor: '#FFFFFF' },
}

function getCycleSubtitle(cycle: any): string | null {
  const slug = String(cycle?.slug || '')
  const name = String(cycle?.name || '').toLowerCase()
  if (slug.includes('farmacia') || name.includes('farmacia')) {
    return 'Ciclo Formativo de Grado Medio (LOE) · Ref. SANMS · Semipresencial'
  }
  if (slug.includes('higiene-bucodental') || name.includes('higiene')) {
    return 'Ciclo Formativo de Grado Superior (LOE) · Ref. SANSS · Semipresencial'
  }
  return null
}

function getCycleChips(cycle: any): string[] {
  const chips = [
    'Régimen LOE',
    'Titulación oficial reconocida por el Ministerio de Educación',
    'Modalidad semipresencial (1 día/semana presencial)',
  ]
  const practiceHours = cycle?.duration?.practiceHours
  chips.push(practiceHours && Number.isFinite(practiceHours) ? `${practiceHours}h de prácticas en empresa` : '500h de prácticas en empresa')
  const hasFSE = Array.isArray(cycle?.scholarships)
    && cycle.scholarships.some((s: any) => {
      const name = String(s?.name || '').toLowerCase()
      const description = String(s?.description || '').toLowerCase()
      return name.includes('fondo social europeo') || description.includes('fondo social europeo')
    })
  if (hasFSE) chips.push('Cofinanciado por el Fondo Social Europeo')
  return chips
}

export default async function CiclosCatalogPage() {
  const tenant = await getTenantHostBranding()
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'cycles',
    where: withTenantScope({ active: { equals: true } }, tenant.tenantId) as any,
    limit: 50,
    sort: 'name',
    depth: 1,
  })

  const cycles = result.docs
  const cycleIds = cycles.map((cycle: any) => String(cycle.id))
  const courseImagesByCycleId = new Map<string, any>()

  if (cycleIds.length > 0) {
    const coursesResult = await payload.find({
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

    for (const course of coursesResult.docs as any[]) {
      const cycleId = getRelationId(course.cycle)
      if (cycleId && cycleIds.includes(cycleId) && course.featured_image && !courseImagesByCycleId.has(cycleId)) {
        courseImagesByCycleId.set(cycleId, course.featured_image)
      }
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Ciclos Formativos</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Formación Profesional oficial de Grado Medio y Superior. Titulaciones reconocidas por el Ministerio de Educación y con plena validez en todo el territorio nacional.
        </p>
      </div>

      {cycles.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg">Próximamente disponibles</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {cycles.map((cycle: any) => {
            const imageUrl = resolveImageUrl(courseImagesByCycleId.get(String(cycle.id))) || resolveImageUrl(cycle.image)
            const levelMeta = LEVEL_META[cycle.level] ?? null
            const subtitle = getCycleSubtitle(cycle)
            const chips = getCycleChips(cycle)
            return (
              <Link key={cycle.id} href={`/ciclos/${cycle.slug}`} className="group">
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group-hover:-translate-y-1">
                  {/* Image */}
                  <div className="relative h-48 bg-gradient-to-br brand-bg">
                    {imageUrl && (
                      <img src={imageUrl} alt={cycle.name} className="w-full h-full object-cover" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <span
                        className="inline-block px-2 py-1 rounded text-xs font-semibold mb-2"
                        style={levelMeta ? { backgroundColor: levelMeta.bgColor, color: levelMeta.textColor } : undefined}
                      >
                        {levelMeta?.label || cycle.level}
                      </span>
                      <h2 className="text-xl font-bold text-white">{cycle.name}</h2>
                    </div>
                  </div>
                  {/* Content */}
                  <div className="p-5 space-y-4">
                    {subtitle ? (
                      <p className="text-sm text-gray-700">{subtitle}</p>
                    ) : null}
                    {cycle.description && (
                      <p className="text-sm text-gray-600 line-clamp-3 mb-4">{cycle.description}</p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {chips.map((chip) => (
                        <span key={`${cycle.id}-${chip}`} className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-[11px] font-medium text-gray-700">
                          {chip}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      {cycle.duration?.totalHours && (
                        <span className="text-gray-500">{cycle.duration.totalHours}h</span>
                      )}
                      {cycle.duration?.modality && (
                        <span className="text-gray-500 capitalize">{cycle.duration.modality}</span>
                      )}
                      <span className="brand-text font-medium group-hover:brand-text">Ver más &rarr;</span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
