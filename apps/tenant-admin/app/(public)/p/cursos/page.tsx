import type { Metadata } from 'next'
import { getTenantHostBranding } from '@/app/lib/server/tenant-host-branding'
import {
  DEFAULT_STUDY_TYPE_VISUALS,
  getPublishedCourses,
  getStudyTypeVisualMap,
} from '@/app/lib/server/published-courses'
import { getPublicStudyTypeFallbackImage, normalizePublicStudyType } from '@/app/lib/website/study-types'
import { CoursesCatalogView } from './CoursesCatalogView'

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

const COURSE_SECTIONS = [
  {
    key: 'privados',
    label: 'Cursos privados',
    description: 'Formaciones especializadas con matrícula privada, orientación práctica y próximas fechas disponibles.',
  },
  {
    key: 'desempleados',
    label: 'Cursos para desempleados',
    description: 'Programas orientados a mejorar la empleabilidad y adquirir competencias útiles para volver al mercado laboral.',
  },
  {
    key: 'ocupados',
    label: 'Cursos para ocupados',
    description: 'Formación para profesionales en activo que necesitan actualizar competencias o reforzar su perfil.',
  },
  {
    key: 'teleformacion',
    label: 'Teleformación',
    description: 'Cursos online para estudiar a tu ritmo, con matrícula flexible y acceso desde casa.',
  },
]

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
  const heroImageUrl = selectedStudyType ? getPublicStudyTypeFallbackImage(selectedStudyType) : null
  const pageLabel = getReadableTypeLabel(rawTipo)
  const visibleSections = COURSE_SECTIONS
    .map((section) => ({
      ...section,
      courses: courses.filter((course) => course.studyType === section.key),
    }))
    .filter((section) => section.courses.length > 0)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div
        className="relative mb-12 overflow-hidden rounded-3xl px-6 py-10 text-white shadow-sm sm:px-10"
        style={!heroImageUrl ? buildHeroStyle(heroColor) : undefined}
      >
        {heroImageUrl ? (
          <img
            src={heroImageUrl}
            alt={selectedStudyTypeMeta?.label || 'Cursos'}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="relative z-10">
          <h1 className="text-4xl font-bold mb-3">Cursos</h1>
          <p className="text-lg text-white/85 max-w-3xl">
            {selectedStudyTypeMeta
              ? `${pageLabel}. Programas orientados a empleabilidad real y formación aplicada en Canarias.`
              : 'Cursos especializados de formación profesional y desarrollo de competencias.'}
          </p>
        </div>
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
        <CoursesCatalogView groups={visibleSections} visualMap={studyTypeVisualMap} fallbackColor={heroColor} />
      )}
    </div>
  )
}
