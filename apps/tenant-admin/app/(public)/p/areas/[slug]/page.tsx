import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getTenantHostBranding } from '@/app/lib/server/tenant-host-branding'
import {
  getPublishedCourses,
  getStudyTypeColor,
  getStudyTypeVisualMap,
} from '@/app/lib/server/published-courses'
import { getPublicStudyTypeFallbackImage } from '@/app/lib/website/study-types'

export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ slug: string }>
}

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function areaTitleFromSlug(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const title = areaTitleFromSlug(slug)
  return {
    title: `${title} | CEP Formación`,
    description: `Cursos publicados de ${title} en CEP Formación.`,
  }
}

export default async function PublicAreaPage({ params }: Props) {
  const { slug } = await params
  const tenant = await getTenantHostBranding()
  const studyTypeVisualMap = await getStudyTypeVisualMap()
  const courses = await getPublishedCourses({
    tenantId: tenant.tenantId === 'default' ? null : tenant.tenantId,
    includeInactive: false,
    includeCycles: false,
    limit: 300,
    sort: 'name',
  })
  const areaCourses = courses.filter((course) => slugify(course.area) === slug || slugify(`area ${course.area}`) === slug)

  if (areaCourses.length === 0) {
    notFound()
  }

  const title = areaCourses[0]?.area || areaTitleFromSlug(slug)

  return (
    <main className="min-h-screen bg-white">
      <section className="bg-slate-950 px-4 py-16 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-black uppercase tracking-[0.28em] text-red-200">Área de formación</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">{title}</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-white/75">
            Programas disponibles en esta especialidad, con modalidad, duración y convocatorias actualizadas.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {areaCourses.map((course) => {
            const imageUrl = course.imagenPortada || getPublicStudyTypeFallbackImage(course.studyType)
            const color = getStudyTypeColor(course.studyType, studyTypeVisualMap) || tenant.primaryColor || '#f2014b'
            return (
              <Link key={course.id} href={`/p/cursos/${course.slug}`} className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                <div className="relative h-56">
                  <img src={imageUrl} alt={course.nombre} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <span className="absolute left-5 top-5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-white" style={{ backgroundColor: color }}>
                    {course.studyTypeLabel}
                  </span>
                  <h2 className="absolute bottom-5 left-5 right-5 text-xl font-bold text-white">{course.nombre}</h2>
                </div>
                <div className="p-6">
                  <p className="line-clamp-3 text-sm leading-7 text-slate-600">{course.descripcion}</p>
                  <div className="mt-5 grid gap-2 text-sm text-slate-700">
                    <p><span className="font-semibold text-slate-950">Duración:</span> {course.duracionReferencia || 'Consultar'} h</p>
                    <p><span className="font-semibold text-slate-950">Modalidad:</span> {course.modality || 'Consultar'}</p>
                    <p><span className="font-semibold text-slate-950">Convocatoria:</span> {course.enrollmentLabel}</p>
                  </div>
                  <span className="mt-6 inline-flex rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition group-hover:bg-[var(--cep-brand)]">
                    Ver curso
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </section>
    </main>
  )
}
