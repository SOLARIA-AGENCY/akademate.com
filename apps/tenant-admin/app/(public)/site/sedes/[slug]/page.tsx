import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

function resolveImageUrl(image: any): string | null {
  if (!image) return null
  if (typeof image === 'object' && image.url) return image.url
  if (typeof image === 'object' && image.filename) return `/media/${image.filename}`
  return null
}

export default async function PublicSedeDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const payload = await getPayload({ config: configPromise })
  const campusResult = await payload.find({
    collection: 'campuses',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 2,
  })
  const runsResult = await payload.find({
    collection: 'course-runs',
    where: {
      and: [
        { status: { in: ['published', 'enrollment_open'] } },
        { campus: { exists: true } },
      ],
    },
    depth: 2,
    limit: 150,
    sort: '-start_date',
  })
  const campus = campusResult.docs[0] as any
  if (!campus) notFound()

  const campusRuns = (runsResult.docs as any[]).filter((run) => {
    const runCampus = typeof run.campus === 'object' && run.campus ? run.campus : null
    return String(runCampus?.id || '') === String(campus.id)
  })

  const cycleEntries = new Map<string, { title: string; href: string }>()
  const courseEntries = new Map<string, { title: string; href: string }>()
  for (const run of campusRuns) {
    const cycle = typeof run.cycle === 'object' ? run.cycle : null
    const course = typeof run.course === 'object' ? run.course : null
    if (cycle?.slug && cycle?.name) {
      cycleEntries.set(String(cycle.id || cycle.slug), { title: cycle.name, href: `/ciclos/${cycle.slug}` })
    }
    if (course?.slug && (course?.title || course?.name)) {
      courseEntries.set(String(course.id || course.slug), { title: course.title || course.name, href: `/cursos/${course.slug}` })
    }
  }

  const runsByCode = campusRuns.map((run) => {
    const cycle = typeof run.cycle === 'object' ? run.cycle : null
    const course = typeof run.course === 'object' ? run.course : null
    return {
      id: String(run.id),
      href: `/convocatorias/${run.codigo || run.id}`,
      code: run.codigo || `RUN-${run.id}`,
      title: cycle?.name || course?.title || course?.name || 'Convocatoria',
      startDate: run.start_date ? new Date(run.start_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : null,
    }
  })

  const staffMembers = Array.isArray(campus.staff_members)
    ? campus.staff_members.filter((member: any) => typeof member === 'object' && member !== null)
    : []

  const defaultDescription = slug === 'sede-santa-cruz'
    ? 'Nuestra sede de Santa Cruz está situada en el Bajo Estadio Heliodoro Rodríguez López, en el corazón de la capital. Instalaciones modernas con aulas equipadas para la formación sanitaria práctica. Acceso fácil en transporte público.'
    : slug === 'sede-norte'
      ? 'La sede Norte se encuentra en el Centro Comercial El Trompo, en La Orotava, en la última planta. Una ubicación estratégica para los estudiantes del norte de Tenerife, con parking disponible y todas las comodidades del centro comercial.'
      : 'Centro con instalaciones propias, equipo docente especializado y atención académica personalizada.'

  const mapsUrl = typeof campus.maps_url === 'string' ? campus.maps_url : ''
  const canEmbedMap = mapsUrl.includes('google.com/maps/embed')

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      {resolveImageUrl(campus.image) ? (
        <img src={resolveImageUrl(campus.image) ?? ''} alt={campus.name} className="h-[28rem] w-full rounded-3xl object-cover" />
      ) : null}
      <h1 className="mt-10 text-4xl font-semibold text-slate-950">{campus.name}</h1>
      <p className="mt-4 text-lg text-slate-600">{campus.description || defaultDescription}</p>
      <div className="mt-10 grid gap-6 rounded-3xl border border-slate-200 bg-white p-8 md:grid-cols-2">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Datos de contacto</h2>
          <div className="mt-3 space-y-2 text-sm leading-7 text-slate-600">
            <p><span className="font-semibold text-slate-800">Dirección:</span> {campus.address || 'Dirección disponible próximamente.'}</p>
            {campus.city ? <p><span className="font-semibold text-slate-800">Ciudad:</span> {campus.city}</p> : null}
            {campus.phone ? <p><span className="font-semibold text-slate-800">Teléfono:</span> {campus.phone}</p> : null}
            {campus.email ? <p><span className="font-semibold text-slate-800">Email:</span> {campus.email}</p> : null}
            <p><span className="font-semibold text-slate-800">Horario:</span> {campus?.schedule?.weekdays || 'Horario por confirmar'}</p>
          </div>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Mapa</h2>
          {canEmbedMap ? (
            <iframe
              src={mapsUrl}
              title={`Mapa ${campus.name}`}
              className="mt-3 h-48 w-full rounded-2xl border border-slate-200"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          ) : (
            <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-600">Mapa disponible en enlace externo.</p>
              {mapsUrl ? (
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex text-sm font-semibold text-[var(--cep-brand)]">
                  Abrir Google Maps →
                </a>
              ) : null}
            </div>
          )}
        </div>
      </div>

      <section className="mt-10 rounded-3xl border border-slate-200 bg-white p-8">
        <h2 className="text-xl font-semibold text-slate-950">Ciclos y cursos impartidos en esta sede</h2>
        {cycleEntries.size === 0 && courseEntries.size === 0 ? (
          <p className="mt-4 text-sm text-slate-600">Próximamente publicaremos la oferta formativa de esta sede.</p>
        ) : (
          <div className="mt-4 flex flex-wrap gap-2">
            {Array.from(cycleEntries.values()).map((entry) => (
              <Link key={entry.href} href={entry.href} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                {entry.title}
              </Link>
            ))}
            {Array.from(courseEntries.values()).map((entry) => (
              <Link key={entry.href} href={entry.href} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                {entry.title}
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-8">
        <h2 className="text-xl font-semibold text-slate-950">Convocatorias abiertas en esta sede</h2>
        {runsByCode.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">No hay convocatorias abiertas en este momento.</p>
        ) : (
          <div className="mt-4 grid gap-3">
            {runsByCode.map((run) => (
              <Link key={run.id} href={run.href} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-[var(--cep-brand)]">
                <p className="text-sm font-semibold text-slate-900">{run.title}</p>
                <p className="mt-1 text-xs text-slate-600">{run.code}{run.startDate ? ` · Inicio: ${run.startDate}` : ''}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-8">
        <h2 className="text-xl font-semibold text-slate-950">Equipo docente</h2>
        {staffMembers.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">Equipo docente en actualización para esta sede.</p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {staffMembers.map((member: any) => (
              <article key={String(member.id)} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">{member.full_name || member.name || 'Docente'}</p>
                <p className="mt-1 text-xs text-slate-600">{member.position || member.role || 'Equipo académico'}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
