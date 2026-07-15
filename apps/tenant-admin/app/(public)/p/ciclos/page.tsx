import { getPayload } from 'payload'
import configPromise from '@payload-config'
import Link from 'next/link'
import type { Metadata } from 'next'
import { withTenantScope } from '@/app/lib/server/tenant-scope'
import { getTenantHostBranding } from '@/app/lib/server/tenant-host-branding'
import { PublicPageHero } from '../../_components/PublicPageHero'
import { CEP_PUBLIC_HERO_ASSETS } from '../../_components/public-hero-assets'

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
  grado_medio: { label: 'Grado Medio · CFGM', bgColor: '#16A34A', textColor: '#FFFFFF' },
  grado_superior: { label: 'Grado Superior · CFGS', bgColor: '#E3003A', textColor: '#FFFFFF' },
}

function getCycleSubtitle(cycle: any): string | null {
  const slug = String(cycle?.slug || '')
  const name = String(cycle?.name || '').toLowerCase()
  if (slug.includes('farmacia') || name.includes('farmacia')) {
    return 'Ciclo Formativo de Grado Medio (LOE)'
  }
  if (slug.includes('higiene-bucodental') || name.includes('higiene')) {
    return 'Ciclo Formativo de Grado Superior (LOE)'
  }
  return null
}

function getCycleReference(cycle: any): string | null {
  const slug = String(cycle?.slug || '')
  const name = String(cycle?.name || '').toLowerCase()
  if (slug.includes('farmacia') || name.includes('farmacia')) return 'Ref. SANMS'
  if (slug.includes('higiene-bucodental') || name.includes('higiene')) return 'Ref. SANSS'
  return null
}

function getPracticeHours(cycle: any): number | null {
  const value = cycle?.duration?.practiceHours
  const numberValue = typeof value === 'number' ? value : Number.parseInt(String(value || ''), 10)
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : null
}

function getCycleChips(cycle: any): string[] {
  const chips = [
    'Régimen LOE',
    'Titulación oficial reconocida por el Ministerio de Educación',
    'Modalidad semipresencial (1 día/semana presencial)',
  ]
  const practiceHours = getPracticeHours(cycle)
  chips.push(
    practiceHours ? `${practiceHours}h de prácticas en empresa` : '500h de prácticas en empresa'
  )
  const hasFSE =
    Array.isArray(cycle?.scholarships) &&
    cycle.scholarships.some((s: any) => {
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
        tenant.tenantId
      ) as any,
      limit: 100,
      depth: 1,
    })

    for (const course of coursesResult.docs as any[]) {
      const cycleId = getRelationId(course.cycle)
      if (
        cycleId &&
        cycleIds.includes(cycleId) &&
        course.featured_image &&
        !courseImagesByCycleId.has(cycleId)
      ) {
        courseImagesByCycleId.set(cycleId, course.featured_image)
      }
    }
  }

  return (
    <div>
      <PublicPageHero
        eyebrow="Titulación oficial"
        title="Ciclos Formativos"
        description={
          <>
            Formación Profesional oficial de <strong className="font-bold text-white">Grado Medio</strong> y{' '}
            <strong className="font-bold text-white">Grado Superior</strong>, con orientación académica,
            acompañamiento cercano y prácticas profesionales.
          </>
        }
        imageSrc={CEP_PUBLIC_HERO_ASSETS.ciclos}
        imageAlt="Estudiantes y docente en un entorno de formación profesional"
        actions={[{ href: '/convocatorias', label: 'Ver convocatorias' }]}
      />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">

      {cycles.length === 0 ? (
        <div className="py-16 text-center text-slate-500">
          <p className="text-lg">Próximamente disponibles</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
          {cycles.map((cycle: any) => {
            const imageUrl =
              resolveImageUrl(courseImagesByCycleId.get(String(cycle.id))) ||
              resolveImageUrl(cycle.image)
            const levelMeta = LEVEL_META[cycle.level] ?? null
            const subtitle = getCycleSubtitle(cycle)
            const reference = getCycleReference(cycle)
            const practiceHours = getPracticeHours(cycle)
            const chips = getCycleChips(cycle)
            return (
              <Link key={cycle.id} href={`/ciclos/${cycle.slug}`} className="group h-full">
                <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[var(--brand)] hover:shadow-2xl">
                  <div className="relative min-h-72 bg-slate-950">
                    {imageUrl && (
                      <img
                        src={imageUrl}
                        alt={cycle.name}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/25 to-transparent" />
                    <div className="absolute left-5 right-5 top-5 flex flex-wrap items-center justify-between gap-3">
                      <span
                        className="inline-flex rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.18em]"
                        style={
                          levelMeta
                            ? { backgroundColor: levelMeta.bgColor, color: levelMeta.textColor }
                            : undefined
                        }
                      >
                        {levelMeta?.label || cycle.level}
                      </span>
                      {reference ? (
                        <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-800">
                          {reference}
                        </span>
                      ) : null}
                    </div>
                    <div className="absolute bottom-6 left-5 right-5">
                      <h2 className="text-2xl font-black leading-tight tracking-tight text-white sm:text-3xl">
                        {cycle.name}
                      </h2>
                      {subtitle ? (
                        <p className="mt-2 text-sm font-semibold text-white/85">{subtitle}</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-6 sm:p-7">
                    {cycle.description && (
                      <p className="text-base leading-7 text-slate-600">
                        <em>{cycle.description}</em>
                      </p>
                    )}

                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                          Modalidad
                        </p>
                        <p className="mt-2 text-sm font-bold text-slate-950">Semipresencial</p>
                        <p className="mt-1 text-xs leading-5 text-slate-600">
                          Un día presencial a la semana.
                        </p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                          Prácticas
                        </p>
                        <p className="mt-2 text-sm font-bold text-slate-950">
                          {practiceHours ? `${practiceHours} horas` : '500 horas'}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-600">
                          Formación práctica en empresa.
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {chips.map((chip) => (
                        <span
                          key={`${cycle.id}-${chip}`}
                          className="rounded-full border border-rose-100 bg-rose-50 px-3 py-1 text-[11px] font-bold text-slate-700"
                        >
                          {chip}
                        </span>
                      ))}
                    </div>

                    <div className="mt-auto flex flex-col gap-4 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-sm text-slate-600">
                        {cycle.duration?.totalHours ? (
                          <p>
                            <strong className="font-bold text-slate-950">
                              {cycle.duration.totalHours}h
                            </strong>{' '}
                            de formación
                          </p>
                        ) : (
                          <p>
                            <strong className="font-bold text-slate-950">Formación oficial</strong>{' '}
                            con validez nacional
                          </p>
                        )}
                      </div>
                      <span className="inline-flex items-center justify-center rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-black text-white shadow-sm transition group-hover:bg-[var(--brand-dark)]">
                        Ver ciclo
                      </span>
                    </div>
                  </div>
                </article>
              </Link>
            )
          })}
        </div>
      )}
      </div>
    </div>
  )
}
