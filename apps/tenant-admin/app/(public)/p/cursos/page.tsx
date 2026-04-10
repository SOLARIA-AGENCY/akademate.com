import { getPayload } from 'payload'
import configPromise from '@payload-config'
import Link from 'next/link'
import type { Metadata } from 'next'
import { withTenantScope } from '@/app/lib/server/tenant-scope'
import { getTenantHostBranding } from '@/app/lib/server/tenant-host-branding'
import { normalizeStudyType } from '@/app/lib/website/study-types'

export const metadata: Metadata = {
  title: 'Cursos | Formación Profesional',
  description: 'Cursos de formación profesional y especialización.',
}
export const dynamic = 'force-dynamic'

function resolveImageUrl(image: any): string | null {
  if (!image) return null
  if (typeof image === 'object' && image.url) return image.url
  if (typeof image === 'object' && image.filename) return `/media/${image.filename}`
  return null
}

export default async function CursosCatalogPage({
  searchParams,
}: {
  searchParams?: { tipo?: string | string[] }
}) {
  const tenant = await getTenantHostBranding()
  const payload = await getPayload({ config: configPromise })
  const rawTipo = Array.isArray(searchParams?.tipo) ? searchParams?.tipo[0] : searchParams?.tipo
  const selectedStudyType = normalizeStudyType(rawTipo)
  const result = await payload.find({
    collection: 'courses',
    where: withTenantScope({ active: { equals: true } }, tenant.tenantId) as any,
    limit: 50,
    sort: 'name',
    depth: 1,
  })

  const courses = result.docs.filter((course: any) => {
    const courseStudyType = normalizeStudyType(String(course.course_type || ''))
    if (selectedStudyType) {
      return courseStudyType === selectedStudyType
    }
    return courseStudyType !== 'ciclo_medio' && courseStudyType !== 'ciclo_superior'
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Cursos</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Cursos especializados de formación profesional y desarrollo de competencias.
        </p>
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg">
            {selectedStudyType
              ? 'No hay cursos publicados para este tipo de estudio.'
              : 'Próximamente disponibles'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map((course: any) => {
            const title = course.title ?? course.name
            const description = course.description ?? course.short_description ?? course.long_description
            const imageUrl = resolveImageUrl(course.featured_image) || resolveImageUrl(course.image)
            return (
              <Link key={course.id} href={`/cursos/${course.slug}`} className="group">
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group-hover:-translate-y-1">
                  <div className="relative h-48 bg-gradient-to-br from-indigo-600 to-indigo-800">
                    {imageUrl && <img src={imageUrl} alt={title} className="w-full h-full object-cover" />}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <h2 className="text-xl font-bold text-white">{title}</h2>
                    </div>
                  </div>
                  <div className="p-5">
                    {description && <p className="text-sm text-gray-600 line-clamp-3 mb-4">{description}</p>}
                    <span className="text-indigo-600 font-medium text-sm group-hover:text-indigo-700">Ver más &rarr;</span>
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
