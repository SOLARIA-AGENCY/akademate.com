import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { LeadForm } from '../../ciclos/[slug]/LeadForm'

export const dynamic = 'force-dynamic'

function resolveImageUrl(image: any): string | null {
  if (!image) return null
  if (typeof image === 'object' && image.url) return image.url
  if (typeof image === 'object' && image.filename) return `/media/${image.filename}`
  return null
}

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'courses',
    where: { slug: { equals: slug } },
    limit: 1, depth: 0,
  })
  const course = result.docs[0]
  if (!course) return { title: 'Curso no encontrado' }
  const title = (course as { title?: string; name?: string }).title ?? (course as { name?: string }).name ?? 'Curso'
  const description =
    (course as { description?: string }).description ??
    `Curso: ${title}`
  return {
    title: `${title} | Curso`,
    description: description.substring(0, 160),
  }
}

export default async function CursoLandingPage({ params }: Props) {
  const { slug } = await params
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'courses',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 1,
  })

  const course = result.docs[0] as any
  if (!course) notFound()

  const title = course.title ?? course.name
  const description = course.description ?? course.short_description ?? course.long_description
  const imageUrl = resolveImageUrl(course.featured_image) || resolveImageUrl(course.image)

  return (
    <div>
      {/* HERO */}
      <div className="relative h-72 sm:h-80 bg-gradient-to-br from-indigo-700 to-indigo-900">
        {imageUrl && <img src={imageUrl} alt={title} className="absolute inset-0 w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-12 max-w-7xl mx-auto">
          <h1 className="text-3xl sm:text-5xl font-bold text-white mb-2">{title}</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-10">
            {description && (
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Sobre este curso</h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">{description}</p>
              </section>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Pedir informacion</h3>
              <p className="text-sm text-gray-600 mb-4">Dejanos tu email y te informaremos.</p>
              <LeadForm cycleId={String(course.id)} cycleName={title} hasActiveConvocatorias={false} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
