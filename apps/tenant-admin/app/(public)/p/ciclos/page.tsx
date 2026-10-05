import { getPayload } from 'payload'
import configPromise from '@payload-config'
import type { Metadata } from 'next'
import { withTenantScope } from '@/app/lib/server/tenant-scope'
import { getTenantHostBranding } from '@/app/lib/server/tenant-host-branding'
import { CycleCard } from '../_components/CycleCard'
import { collectOpenRunsByCycle, relationId, toCycleCardModel, type CycleOpenRun } from '../_components/cycle-display'

export const metadata: Metadata = {
  title: 'Ciclos Formativos',
  description: 'Ciclos formativos de grado medio y superior. Titulación oficial y formación práctica.',
}

export const dynamic = 'force-dynamic'

function resolveImageUrl(image: unknown): string | null {
  if (!image || typeof image !== 'object') return null
  const record = image as { url?: string; filename?: string }
  if (record.url) return record.url
  if (record.filename) return `/media/${record.filename}`
  return null
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

  const cycles = result.docs as any[]
  const cycleIds = cycles.map((cycle) => String(cycle.id))
  const courseImagesByCycleId = new Map<string, string>()
  let openRunsByCycleId = new Map<string, CycleOpenRun[]>()

  if (cycleIds.length > 0) {
    const [coursesResult, runsResult] = await Promise.all([
      payload.find({
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
      }),
      payload.find({
        collection: 'course-runs',
        where: withTenantScope({ status: { equals: 'enrollment_open' } }, tenant.tenantId) as any,
        limit: 80,
        depth: 1,
        sort: 'start_date',
      }),
    ])

    for (const course of coursesResult.docs as any[]) {
      const cycleId = relationId(course.cycle)
      const imageUrl = resolveImageUrl(course.featured_image) || resolveImageUrl(course.image)
      if (cycleId && cycleIds.includes(cycleId) && imageUrl && !courseImagesByCycleId.has(cycleId)) {
        courseImagesByCycleId.set(cycleId, imageUrl)
      }
    }

    openRunsByCycleId = collectOpenRunsByCycle(runsResult.docs, cycleIds)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-12 max-w-3xl">
        <h1 className="text-4xl font-semibold tracking-tight text-slate-950">Ciclos formativos</h1>
        <p className="mt-4 text-lg leading-8 text-slate-600">
          Formación profesional oficial de grado medio y superior, con titulación reconocida y prácticas en empresa.
        </p>
      </div>

      {cycles.length === 0 ? (
        <div className="py-16 text-slate-500">
          <p className="text-lg">Próximamente disponibles</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {cycles.map((cycle) => {
            const id = String(cycle.id)
            const imageUrl = courseImagesByCycleId.get(id) || resolveImageUrl(cycle.image)
            return (
              <CycleCard
                key={id}
                cycle={toCycleCardModel(cycle, imageUrl, openRunsByCycleId.get(id) || [], `/p/ciclos/${cycle.slug}`)}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
