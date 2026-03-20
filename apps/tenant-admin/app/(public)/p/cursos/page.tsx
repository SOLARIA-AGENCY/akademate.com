import { getPayload } from 'payload'
import configPromise from '@payload-config'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cursos | Formacion Profesional',
  description: 'Cursos de formacion profesional y especializacion.',
}
export const dynamic = 'force-dynamic'

function resolveImageUrl(image: any): string | null {
  if (!image) return null
  if (typeof image === 'object' && image.url) return image.url
  if (typeof image === 'object' && image.filename) return `/media/${image.filename}`
  return null
}

export default async function CursosCatalogPage() {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'courses',
    // No status filter — courses collection may not have status field
    limit: 50,
    sort: 'title',
    depth: 1,
  })

  const courses = result.docs

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Cursos</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Cursos especializados de formacion profesional y desarrollo de competencias.
        </p>
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg">Proximamente disponibles</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map((course: any) => {
            const imageUrl = resolveImageUrl(course.image)
            return (
              <Link key={course.id} href={`/p/cursos/${course.slug}`} className="group">
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group-hover:-translate-y-1">
                  <div className="relative h-48 bg-gradient-to-br from-indigo-600 to-indigo-800">
                    {imageUrl && <img src={imageUrl} alt={course.title} className="w-full h-full object-cover" />}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <h2 className="text-xl font-bold text-white">{course.title}</h2>
                    </div>
                  </div>
                  <div className="p-5">
                    {course.description && <p className="text-sm text-gray-600 line-clamp-3 mb-4">{course.description}</p>}
                    <span className="text-indigo-600 font-medium text-sm group-hover:text-indigo-700">Ver mas &rarr;</span>
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
