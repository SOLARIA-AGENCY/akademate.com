import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { getTenantHostBranding } from '@/app/lib/server/tenant-host-branding'
import {
  type PublishedCourse,
  getPublishedCourses,
  getStudyTypeColor,
  getStudyTypeVisualMap,
} from '@/app/lib/server/published-courses'
import { withTenantScope } from '@/app/lib/server/tenant-scope'
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

const AREA_TITLES: Record<string, string> = {
  'area-sanitaria-y-clinica': 'Área Sanitaria y Clínica',
  'area-veterinaria-y-bienestar-animal': 'Área Veterinaria y Bienestar Animal',
  'area-salud-bienestar-y-deporte': 'Área Salud, Bienestar y Deporte',
  'area-tecnologia-digital-y-diseno': 'Área Tecnología, Digital y Diseño',
  'area-empresa-administracion-y-gestion': 'Área Empresa, Administración y Gestión',
  'area-seguridad-vigilancia-y-proteccion': 'Área Seguridad, Vigilancia y Protección',
}

const STUDY_TYPE_ORDER = ['privados', 'desempleados', 'ocupados', 'teleformacion'] as const
const STUDY_TYPE_LABELS: Record<string, string> = {
  privados: 'Cursos privados',
  desempleados: 'Cursos para desempleados',
  ocupados: 'Cursos para ocupados',
  teleformacion: 'Teleformación',
}

type CycleDoc = {
  id: string | number
  slug?: string | null
  name?: string | null
  level?: string | null
  family?: string | null
  image?: { url?: string | null; filename?: string | null } | null
  total_hours?: number | null
  modality?: string | null
}

function resolveMediaImageUrl(image: CycleDoc['image']): string | null {
  if (!image || typeof image !== 'object') return null
  if (image.url) return String(image.url).replace(/^\/api\/media\/file\//, '/media/').replace(/^\/media\/file\//, '/media/')
  if (image.filename) return `/media/${image.filename}`
  return null
}

function formatCycleLevel(level: string | null | undefined): string {
  if (level === 'grado_medio') return 'GRADO MEDIO'
  if (level === 'grado_superior') return 'GRADO SUPERIOR'
  return String(level || 'CICLO FORMATIVO').replace(/_/g, ' ').toUpperCase()
}

function matchesAreaText(slug: string, value: string): boolean {
  const text = slugify(value)
  if (!text) return false
  if (slug === text || slug === slugify(`area ${value}`)) return true
  if (slug.includes('sanitaria') && /(sanidad|sanitaria|clinica|farmacia|higiene|odontologia|auxiliar)/.test(text)) return true
  if (slug.includes('veterinaria') && /(veterinaria|animal|canino|peluqueria-canina|adiestramiento)/.test(text)) return true
  if (slug.includes('salud-bienestar') && /(salud|bienestar|deporte|estetica|nutricosmetica|masaje|quiromasaje)/.test(text)) return true
  if (slug.includes('tecnologia') && /(tecnologia|digital|diseno|web|moodle|inteligencia-artificial|informatica)/.test(text)) return true
  if (slug.includes('empresa') && /(empresa|administracion|gestion|logistica|cliente|marketing|fiscal|recursos-humanos)/.test(text)) return true
  if (slug.includes('seguridad') && /(seguridad|vigilancia|proteccion|prevencion)/.test(text)) return true
  return false
}

function courseMatchesArea(course: PublishedCourse, slug: string): boolean {
  return matchesAreaText(slug, course.area) || matchesAreaText(slug, course.nombre)
}

function cycleMatchesArea(cycle: CycleDoc, slug: string): boolean {
  return matchesAreaText(slug, String(cycle.family || '')) || matchesAreaText(slug, String(cycle.name || ''))
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
  const payload = await getPayload({ config: configPromise })
  const courses = await getPublishedCourses({
    tenantId: tenant.tenantId === 'default' ? null : tenant.tenantId,
    includeInactive: false,
    includeCycles: false,
    limit: 300,
    sort: 'name',
  })
  const cyclesResult = await payload.find({
    collection: 'cycles',
    where: withTenantScope({ active: { equals: true } }, tenant.tenantId === 'default' ? null : tenant.tenantId) as any,
    depth: 1,
    limit: 100,
    sort: 'name',
  })
  const areaCourses = courses.filter((course) => courseMatchesArea(course, slug))
  const areaCycles = (cyclesResult.docs as CycleDoc[]).filter((cycle) => cycleMatchesArea(cycle, slug))

  if (areaCourses.length === 0 && areaCycles.length === 0) {
    notFound()
  }

  const title = AREA_TITLES[slug] || areaCourses[0]?.area || areaTitleFromSlug(slug)
  const groupedCourses = STUDY_TYPE_ORDER.map((studyType) => ({
    studyType,
    label: STUDY_TYPE_LABELS[studyType],
    courses: areaCourses.filter((course) => course.studyType === studyType),
  })).filter((group) => group.courses.length > 0)

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

      <section className="mx-auto max-w-7xl space-y-14 px-4 py-14 sm:px-6 lg:px-8">
        {groupedCourses.map((group) => (
          <div key={group.studyType}>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.22em] text-[var(--cep-brand)]">Cursos</p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">{group.label}</h2>
              </div>
              <span className="text-sm font-semibold text-slate-500">{group.courses.length} formaciones</span>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {group.courses.map((course) => {
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
                      <h3 className="absolute bottom-5 left-5 right-5 text-xl font-bold text-white">{course.nombre}</h3>
                    </div>
                    <div className="p-6">
                      <p className="line-clamp-3 text-sm leading-7 text-slate-600">{course.descripcion}</p>
                      <div className="mt-5 grid gap-2 text-sm text-slate-700">
                        <p><span className="font-semibold text-slate-950">Duración:</span> {course.duracionReferencia ? `${course.duracionReferencia} h` : 'Consultar'}</p>
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
          </div>
        ))}

        {areaCycles.length > 0 ? (
          <div>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.22em] text-[var(--cep-brand)]">Ciclos</p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Ciclos formativos</h2>
              </div>
              <span className="text-sm font-semibold text-slate-500">{areaCycles.length} ciclos</span>
            </div>
            <div className="grid gap-8 md:grid-cols-2">
              {areaCycles.map((cycle) => {
                const imageUrl = resolveMediaImageUrl(cycle.image) || '/website/cep/categories/ciclos-formativos.jpg'
                return (
                  <Link key={cycle.id} href={`/p/ciclos/${cycle.slug}`} className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                    <div className="relative h-64">
                      <img src={imageUrl} alt={cycle.name || 'Ciclo formativo'} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      <span className="absolute left-5 top-5 rounded-full bg-[var(--cep-brand)] px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-white">
                        {formatCycleLevel(cycle.level)}
                      </span>
                      <h3 className="absolute bottom-5 left-5 right-5 text-2xl font-black text-white">{cycle.name}</h3>
                    </div>
                    <div className="grid gap-2 p-6 text-sm text-slate-700">
                      <p><span className="font-semibold text-slate-950">Familia:</span> {cycle.family || 'Consultar'}</p>
                      <p><span className="font-semibold text-slate-950">Duración:</span> {cycle.total_hours ? `${cycle.total_hours} h` : 'Consultar'}</p>
                      <p><span className="font-semibold text-slate-950">Modalidad:</span> {cycle.modality || 'Consultar'}</p>
                      <span className="mt-4 inline-flex w-fit rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition group-hover:bg-[var(--cep-brand)]">
                        Ver ciclo
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        ) : null}
      </section>
    </main>
  )
}
