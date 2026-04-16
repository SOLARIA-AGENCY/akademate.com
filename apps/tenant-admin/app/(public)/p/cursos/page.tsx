import Link from 'next/link'
import type { Metadata } from 'next'
import { getTenantHostBranding } from '@/app/lib/server/tenant-host-branding'
import {
  DEFAULT_STUDY_TYPE_VISUALS,
  getPublishedCourses,
  getStudyTypeColor,
  getStudyTypeVisualMap,
} from '@/app/lib/server/published-courses'
import { normalizePublicStudyType } from '@/app/lib/website/study-types'

export const metadata: Metadata = {
  title: 'Cursos | Formación Profesional',
  description: 'Cursos de formación profesional y especialización.',
}
export const dynamic = 'force-dynamic'

function getReadableTypeLabel(type: string | null | undefined): string {
  if (!type) return 'Catálogo de cursos'
  const normalized = normalizePublicStudyType(type)
  if (!normalized || !(normalized in DEFAULT_STUDY_TYPE_VISUALS)) return 'Catálogo de cursos'
  return DEFAULT_STUDY_TYPE_VISUALS[normalized as keyof typeof DEFAULT_STUDY_TYPE_VISUALS].label
}

function buildHeroStyle(color: string) {
  return { background: `linear-gradient(135deg, ${color} 0%, #0f172a 100%)` }
}

export default async function CursosCatalogPage({
  searchParams,
}: {
  searchParams?: { tipo?: string | string[] }
}) {
  const tenant = await getTenantHostBranding()
  const rawTipo = Array.isArray(searchParams?.tipo) ? searchParams?.tipo[0] : searchParams?.tipo
  const selectedStudyType = normalizePublicStudyType(rawTipo)
  const studyTypeVisualMap = await getStudyTypeVisualMap()
  const selectedStudyTypeMeta =
    selectedStudyType && selectedStudyType in studyTypeVisualMap
      ? studyTypeVisualMap[selectedStudyType]
      : null

  const courses = await getPublishedCourses({
    tenantId: tenant.tenantId === 'default' ? null : tenant.tenantId,
    studyType: rawTipo,
    includeInactive: false,
    includeCycles: false,
    limit: 200,
    sort: 'name',
  })

  const heroColor = selectedStudyTypeMeta?.color || tenant.primaryColor || '#0F172A'
  const pageLabel = getReadableTypeLabel(rawTipo)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div
        className="mb-12 rounded-3xl px-6 py-10 text-white shadow-sm sm:px-10"
        style={buildHeroStyle(heroColor)}
      >
        <h1 className="text-4xl font-bold mb-3">Cursos</h1>
        <p className="text-lg text-white/85 max-w-3xl">
          {selectedStudyTypeMeta
            ? `${pageLabel}. Programas orientados a empleabilidad real y formación aplicada en Canarias.`
            : 'Cursos especializados de formación profesional y desarrollo de competencias.'}
        </p>
      </div>

      {courses.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-gray-500">
          <p className="text-lg mb-2">
            {selectedStudyTypeMeta
              ? 'No hay cursos publicados para este tipo de estudio.'
              : 'Próximamente disponibles'}
          </p>
          {selectedStudyTypeMeta ? (
            <p className="text-sm text-gray-600">
              Puedes revisar convocatorias abiertas mientras completamos el catálogo.
            </p>
          ) : null}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map((course) => {
            const imageUrl = course.imagenPortada !== '/placeholder-course.svg' ? course.imagenPortada : null
            const fallbackColor = getStudyTypeColor(course.studyType, studyTypeVisualMap) || heroColor
            return (
              <Link key={course.id} href={`/p/cursos/${course.slug}`} className="group">
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group-hover:-translate-y-1">
                  <div className="relative h-48" style={!imageUrl ? buildHeroStyle(fallbackColor) : undefined}>
                    {imageUrl ? (
                      <img src={imageUrl} alt={course.nombre} className="w-full h-full object-cover" />
                    ) : null}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute top-4 left-4">
                      <span
                        className="inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold text-white"
                        style={{ backgroundColor: fallbackColor }}
                      >
                        {course.studyTypeLabel}
                      </span>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <h2 className="text-xl font-bold text-white">{course.nombre}</h2>
                    </div>
                  </div>
                  <div className="p-5">
                    <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">{course.area}</p>
                    <p className="text-sm text-gray-600 line-clamp-3 mb-4">{course.descripcion}</p>
                    <span className="font-medium text-sm group-hover:opacity-90" style={{ color: fallbackColor }}>
                      Ver más &rarr;
                    </span>
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
