import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { LeadForm } from '../../ciclos/[slug]/LeadForm'
import { getTenantHostBranding } from '@/app/lib/server/tenant-host-branding'
import {
  getPublishedCourseBySlug,
  getStudyTypeColor,
  getStudyTypeVisualMap,
} from '@/app/lib/server/published-courses'
import { getPublicStudyTypeFallbackImage } from '@/app/lib/website/study-types'

export const dynamic = 'force-dynamic'

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const tenant = await getTenantHostBranding()
  const tenantId = tenant.tenantId === 'default' ? null : tenant.tenantId
  const course = await getPublishedCourseBySlug({
    slug,
    tenantId,
    includeInactive: false,
    includeCycles: false,
  })
  if (!course) return { title: 'Curso no encontrado' }
  const title = course.nombre
  const description = course.descripcion || `Curso: ${title}`
  return {
    title: `${title} | Curso`,
    description: description.substring(0, 160),
  }
}

export default async function CursoLandingPage({ params }: Props) {
  const { slug } = await params
  const tenant = await getTenantHostBranding()
  const tenantId = tenant.tenantId === 'default' ? null : tenant.tenantId
  const studyTypeVisualMap = await getStudyTypeVisualMap()
  const course = await getPublishedCourseBySlug({
    slug,
    tenantId,
    includeInactive: false,
    includeCycles: false,
  })

  if (!course) notFound()

  const title = course.nombre
  const description = course.descripcion
  const imageUrl = course.imagenPortada || getPublicStudyTypeFallbackImage(course.studyType)
  const heroColor = getStudyTypeColor(course.studyType, studyTypeVisualMap) || tenant.primaryColor || '#0F172A'

  return (
    <div>
      {/* HERO */}
      <div
        className="relative h-72 sm:h-80"
        style={{ background: `linear-gradient(135deg, ${heroColor} 0%, #0f172a 100%)` }}
      >
        <img src={imageUrl} alt={title} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-12 max-w-7xl mx-auto">
          <span
            className="mb-3 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold text-white"
            style={{ backgroundColor: heroColor }}
          >
            {course.studyTypeLabel}
          </span>
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
              <LeadForm cycleId={course.id} cycleName={title} hasActiveConvocatorias={false} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
