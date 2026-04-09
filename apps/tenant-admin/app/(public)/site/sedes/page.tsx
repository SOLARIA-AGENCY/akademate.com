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
  const result = await payload.find({
    collection: 'campuses',
    where: { active: { equals: true } },
    sort: 'name',
    limit: 20,
    depth: 1,
  })

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-semibold text-slate-950">Sedes</h1>
      <p className="mt-4 max-w-2xl text-slate-600">Información dinámica de cada campus desde la base de datos de la plataforma.</p>
      <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {result.docs.map((campus: any) => (
          <Link key={campus.id} href={`/sedes/${campus.slug}`} className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
            {resolveImageUrl(campus.image) ? (
              <img src={resolveImageUrl(campus.image) ?? ''} alt={campus.name} className="h-56 w-full object-cover" />
            ) : null}
            <div className="p-6">
              <h2 className="text-xl font-semibold text-slate-950">{campus.name}</h2>
              <p className="mt-2 text-sm text-slate-600">{campus.city}{campus.address ? ` · ${campus.address}` : ''}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
