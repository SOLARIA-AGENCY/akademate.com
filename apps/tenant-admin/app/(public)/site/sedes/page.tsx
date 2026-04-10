import Link from 'next/link'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export const dynamic = 'force-dynamic'

function resolveImageUrl(image: any): string | null {
  if (!image) return null
  if (typeof image === 'object' && image.url) return image.url
  if (typeof image === 'object' && image.filename) return `/media/${image.filename}`
  return null
}

export default async function PublicSedesPage() {
  const payload = await getPayload({ config: configPromise })
  const campusResult = await payload.find({
    collection: 'campuses',
    where: { active: { equals: true } },
    sort: 'name',
    limit: 20,
    depth: 1,
  })
  const runsResult = await payload.find({
    collection: 'course-runs',
    where: { status: { in: ['published', 'enrollment_open'] } },
    sort: '-start_date',
    limit: 120,
    depth: 2,
  })
  const offeringsByCampus = new Map<string, Array<{ label: string; href: string }>>()

  for (const run of runsResult.docs as any[]) {
    const campus = typeof run.campus === 'object' && run.campus ? run.campus : null
    if (!campus?.id) continue
    const key = String(campus.id)
    const cycle = typeof run.cycle === 'object' ? run.cycle : null
    const course = typeof run.course === 'object' ? run.course : null
    const label = cycle?.name || course?.title || course?.name
    const href = cycle?.slug ? `/ciclos/${cycle.slug}` : course?.slug ? `/cursos/${course.slug}` : ''
    if (!label || !href) continue
    const entries = offeringsByCampus.get(key) ?? []
    if (!entries.some((entry) => entry.href === href)) {
      entries.push({ label, href })
      offeringsByCampus.set(key, entries)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-semibold text-slate-950">Nuestras sedes</h1>
      <p className="mt-4 max-w-3xl text-slate-600">Dos centros en Tenerife con atención académica personalizada, instalaciones propias y equipo docente especializado.</p>
      <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {campusResult.docs.map((campus: any) => (
          <article key={campus.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
            {resolveImageUrl(campus.image) ? (
              <img src={resolveImageUrl(campus.image) ?? ''} alt={campus.name} className="h-56 w-full object-cover" />
            ) : null}
            <div className="space-y-3 p-6">
              <h2 className="text-xl font-semibold text-slate-950">{campus.name}</h2>
              <p className="text-sm text-slate-600">{campus.city}{campus.address ? ` · ${campus.address}` : ''}</p>
              {campus.phone ? <p className="text-sm text-slate-700"><span className="font-semibold">Teléfono:</span> {campus.phone}</p> : null}
              <p className="text-sm text-slate-700"><span className="font-semibold">Horario:</span> {campus?.schedule?.weekdays || 'Horario por confirmar'}</p>
              {(offeringsByCampus.get(String(campus.id)) ?? []).length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {(offeringsByCampus.get(String(campus.id)) ?? []).slice(0, 6).map((entry) => (
                    <Link key={`${campus.id}-${entry.href}`} href={entry.href} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-700 transition hover:border-[var(--cep-brand)] hover:text-[var(--cep-brand)]">
                      {entry.label}
                    </Link>
                  ))}
                </div>
              ) : null}
              <Link href={`/sedes/${campus.slug}`} className="inline-flex text-sm font-semibold text-[var(--cep-brand)]">Ver sede completa →</Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
