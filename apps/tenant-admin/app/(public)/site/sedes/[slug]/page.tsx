import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

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
  const result = await payload.find({
    collection: 'campuses',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 1,
  })
  const campus = result.docs[0] as any
  if (!campus) notFound()

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      {resolveImageUrl(campus.image) ? (
        <img src={resolveImageUrl(campus.image) ?? ''} alt={campus.name} className="h-[28rem] w-full rounded-3xl object-cover" />
      ) : null}
      <h1 className="mt-10 text-4xl font-semibold text-slate-950">{campus.name}</h1>
      <p className="mt-4 text-lg text-slate-600">{campus.description || `${campus.city}${campus.address ? ` · ${campus.address}` : ''}`}</p>
      <div className="mt-10 grid gap-6 rounded-3xl border border-slate-200 bg-white p-8 md:grid-cols-2">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Ubicación</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">{campus.address || 'Dirección disponible próximamente.'}</p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Contacto</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">{campus.phone || 'Teléfono pendiente'}{campus.email ? ` · ${campus.email}` : ''}</p>
        </div>
      </div>
    </div>
  )
}
