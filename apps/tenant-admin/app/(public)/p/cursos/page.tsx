import type { Metadata } from 'next'
import { getTenantHostBranding } from '@/app/lib/server/tenant-host-branding'
import {
  DEFAULT_STUDY_TYPE_VISUALS,
  getPublishedCourses,
  getStudyTypeVisualMap,
} from '@/app/lib/server/published-courses'
import { getPublicStudyTypeFallbackImage, normalizePublicStudyType } from '@/app/lib/website/study-types'
import { CoursesCatalogView, type CourseGroup } from './CoursesCatalogView'
import { PublicPageHero } from '../../_components/PublicPageHero'
import { CEP_PUBLIC_HERO_ASSETS } from '../../_components/public-hero-assets'
import { compareCoursesByPublicAvailability } from '@/app/lib/public-course-availability'

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

export function buildCourseGroups(courses: Awaited<ReturnType<typeof getPublishedCourses>>): CourseGroup[] {
  return COURSE_SECTIONS
    .map((section) => ({
      ...section,
      courses: courses
        .filter((course) => course.studyType === section.key)
        .sort(compareCoursesByPublicAvailability),
    }))
    .filter((section) => section.courses.length > 0)
}

export default async function CursosCatalogPage({
  searchParams,
}: {
  searchParams?: Promise<{ tipo?: string | string[] }>
}) {
  const tenant = await getTenantHostBranding()
  const resolvedSearchParams = await searchParams
  const rawTipo = Array.isArray(resolvedSearchParams?.tipo)
    ? resolvedSearchParams.tipo[0]
    : resolvedSearchParams?.tipo
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
  const heroImageUrl =
    (selectedStudyType ? getPublicStudyTypeFallbackImage(selectedStudyType) : null) ||
    CEP_PUBLIC_HERO_ASSETS.cursos
  const pageLabel = getReadableTypeLabel(rawTipo)
  const visibleSections = buildCourseGroups(courses)

  return (
    <div>
      <PublicPageHero
        eyebrow={selectedStudyTypeMeta?.label || 'Catálogo formativo'}
        title="Cursos"
        description={
          selectedStudyTypeMeta
            ? `${pageLabel}. Programas orientados a empleabilidad real y formación aplicada en Canarias.`
            : 'Cursos especializados de formación profesional y desarrollo de competencias.'
        }
        imageSrc={heroImageUrl}
        imageAlt={selectedStudyTypeMeta?.label || 'Estudiantes en una formación profesional'}
        actions={[{ href: '/convocatorias', label: 'Ver próximas fechas' }]}
      />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">

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
    </div>
  )
}
