import { getPayload } from 'payload'
import configPromise from '@payload-config'
import Link from 'next/link'
import type { Metadata } from 'next'

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

const LEVEL_LABELS: Record<string, string> = {
  basico: 'FP Basica', medio: 'Grado Medio', superior: 'Grado Superior',
}

export default async function CiclosCatalogPage() {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'cycles',
    where: { active: { equals: true } },
    limit: 50,
    sort: 'name',
    depth: 1,
  })

  const cycles = result.docs

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Ciclos Formativos</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Formacion profesional oficial de grado medio y superior. Titulaciones reconocidas por el Ministerio de Educacion.
        </p>
      </div>

      {cycles.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg">Proximamente disponibles</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {cycles.map((cycle: any) => {
            const imageUrl = resolveImageUrl(cycle.image)
            const level = LEVEL_LABELS[cycle.level] || cycle.level
            return (
              <Link key={cycle.id} href={`/ciclos/${cycle.slug}`} className="group">
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group-hover:-translate-y-1">
                  {/* Image */}
                  <div className="relative h-48 bg-gradient-to-br from-blue-600 to-blue-800">
                    {imageUrl && (
                      <img src={imageUrl} alt={cycle.name} className="w-full h-full object-cover" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <span className="inline-block px-2 py-1 rounded text-xs font-semibold bg-white/90 text-gray-800 mb-2">{level}</span>
                      <h2 className="text-xl font-bold text-white">{cycle.name}</h2>
                    </div>
                  </div>
                  {/* Content */}
                  <div className="p-5">
                    {cycle.description && (
                      <p className="text-sm text-gray-600 line-clamp-3 mb-4">{cycle.description}</p>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      {cycle.duration?.totalHours && (
                        <span className="text-gray-500">{cycle.duration.totalHours}h</span>
                      )}
                      {cycle.duration?.modality && (
                        <span className="text-gray-500 capitalize">{cycle.duration.modality}</span>
                      )}
                      <span className="text-blue-600 font-medium group-hover:text-blue-700">Ver mas &rarr;</span>
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
