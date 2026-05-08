import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getTenantHostBranding } from '@/app/lib/server/tenant-host-branding'
import { withTenantScope } from '@/app/lib/server/tenant-scope'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
}

function resolveImageUrl(image: any): string | null {
  if (!image) return null
  if (typeof image === 'object' && image.url) return image.url
  if (typeof image === 'object' && image.filename) return `/media/${image.filename}`
  return null
}

async function getCampus(slug: string) {
  const tenant = await getTenantHostBranding()
  const payload = await getPayload({ config: configPromise })
  const where =
    /^\d+$/.test(slug)
      ? { id: { equals: Number(slug) } }
      : { slug: { equals: slug } }

  const result = await payload.find({
    collection: 'campuses',
    where: withTenantScope(where, tenant.tenantId) as any,
    limit: 1,
    depth: 2,
  })

  return result.docs[0] as any
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const campus = await getCampus(slug)
  if (!campus) return { title: 'Sede no encontrada' }
  return {
    title: `${campus.name} | CEP Formacion`,
    description: campus.description || `Sede CEP Formacion en ${campus.city || 'Canarias'}.`,
  }
}

export default async function SedePublicPage({ params }: Props) {
  const { slug } = await params
  const campus = await getCampus(slug)
  if (!campus || campus.active === false) notFound()

  const imageUrl = resolveImageUrl(campus.image)
  const photos = Array.isArray(campus.photos) ? campus.photos : []
  const staff = Array.isArray(campus.staff_members)
    ? campus.staff_members.filter((member: any) => typeof member === 'object' && member?.staff_type === 'profesor')
    : []
  const address = [campus.address, campus.postal_code, campus.city].filter(Boolean).join(', ')

  return (
    <main className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-slate-950 px-4 py-24 text-white sm:px-6 lg:px-8">
        {imageUrl ? (
          <img src={imageUrl} alt={campus.name} className="absolute inset-0 h-full w-full object-cover opacity-45" />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-slate-950/20" />
        <div className="relative mx-auto max-w-6xl">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-red-200">Sede CEP Formacion</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-tight sm:text-6xl">{campus.name}</h1>
          {campus.description ? (
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/80">{campus.description}</p>
          ) : null}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[1.5fr_0.9fr] lg:px-8">
        <div className="space-y-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-950">Informacion de la sede</h2>
            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              {address ? (
                <div>
                  <dt className="text-sm text-slate-500">Direccion</dt>
                  <dd className="mt-1 font-semibold text-slate-900">{address}</dd>
                </div>
              ) : null}
              {campus.province ? (
                <div>
                  <dt className="text-sm text-slate-500">Provincia</dt>
                  <dd className="mt-1 font-semibold text-slate-900">{campus.province}</dd>
                </div>
              ) : null}
              {campus.phone ? (
                <div>
                  <dt className="text-sm text-slate-500">Telefono</dt>
                  <dd className="mt-1 font-semibold text-slate-900">{campus.phone}</dd>
                </div>
              ) : null}
              {campus.email ? (
                <div>
                  <dt className="text-sm text-slate-500">Email</dt>
                  <dd className="mt-1 font-semibold text-slate-900">{campus.email}</dd>
                </div>
              ) : null}
              {campus.schedule?.weekdays ? (
                <div>
                  <dt className="text-sm text-slate-500">Horario</dt>
                  <dd className="mt-1 font-semibold text-slate-900">{campus.schedule.weekdays}</dd>
                </div>
              ) : null}
              {campus.capacity ? (
                <div>
                  <dt className="text-sm text-slate-500">Capacidad</dt>
                  <dd className="mt-1 font-semibold text-slate-900">{campus.capacity} plazas</dd>
                </div>
              ) : null}
            </dl>
            {campus.maps_url ? (
              <a
                href={campus.maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex rounded-full bg-red-600 px-5 py-3 text-sm font-bold text-white hover:bg-red-700"
              >
                Ver ubicacion
              </a>
            ) : null}
          </div>

          {photos.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {photos.slice(0, 4).map((item: any, index: number) => {
                const photoUrl = resolveImageUrl(item.photo)
                if (!photoUrl) return null
                return (
                  <img
                    key={item.id || index}
                    src={photoUrl}
                    alt={item.caption || campus.name}
                    className="h-56 w-full rounded-2xl object-cover"
                  />
                )
              })}
            </div>
          ) : null}
        </div>

        <aside className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-lg font-bold text-slate-950">Profesores en esta sede</h2>
            <div className="mt-4 space-y-3">
              {staff.length > 0 ? staff.slice(0, 6).map((member: any) => {
                const name = member.full_name || [member.first_name, member.last_name].filter(Boolean).join(' ')
                return (
                  <Link
                    key={member.id}
                    href={`/p/profesores/${member.id}`}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 transition hover:border-red-200 hover:shadow-sm"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-sm font-bold text-red-600">
                      {name?.[0] || 'P'}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-950">{name || 'Docente'}</p>
                      {member.position ? <p className="text-sm text-slate-500">{member.position}</p> : null}
                    </div>
                  </Link>
                )
              }) : (
                <p className="text-sm text-slate-500">Equipo docente pendiente de publicar.</p>
              )}
            </div>
          </div>
        </aside>
      </section>
    </main>
  )
}
