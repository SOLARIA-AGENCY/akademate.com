import type { Metadata } from 'next'
import { HeroCarouselClient } from '../../_components/HeroCarouselClient'
import { CourseDenseCatalog } from '../../_components/CourseDenseCatalog'
import type { CourseDenseRowData } from '../../_components/CourseDenseRow'
import { getTenantHostBranding } from '@/app/lib/server/tenant-host-branding'
import { getPublishedCourses } from '@/app/lib/server/published-courses'
import { getPublicPage, getTenantWebsite } from '@/app/lib/website/server'
import { applyCepHomeOverrides } from '@/app/lib/website/cep-home-overrides'
import type { WebsiteSection } from '@/app/lib/website/types'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Mock home · listado compacto de cursos',
  robots: { index: false, follow: false },
}

const MOCK_COURSES: CourseDenseRowData[] = [
  { id: '1', name: 'Auxiliar de farmacia y parafarmacia', typeLabel: 'Privados', href: '/p/cursos/auxiliar-de-farmacia', enrollmentOpen: true },
  { id: '2', name: 'Técnico en cuidados auxiliares de enfermería', typeLabel: 'Privados', href: '/p/cursos/tcAe', enrollmentOpen: false },
  { id: '3', name: 'Peluquería canina y felina', typeLabel: 'Privados', href: '/p/cursos/peluqueria-canina', enrollmentOpen: true },
  { id: '4', name: 'Auxiliar de veterinaria', typeLabel: 'Privados', href: '/p/cursos/auxiliar-veterinaria', enrollmentOpen: false },
  { id: '5', name: 'Dietética y nutrición', typeLabel: 'Ocupados', href: '/p/cursos/dietetica', enrollmentOpen: true },
  { id: '6', name: 'Atención sociosanitaria a personas dependientes', typeLabel: 'Ocupados', href: '/p/cursos/atencion-sociosanitaria', enrollmentOpen: false },
  { id: '7', name: 'Inglés profesional B1', typeLabel: 'Ocupados', href: '/p/cursos/ingles-b1', enrollmentOpen: false },
  { id: '8', name: 'Gestión de redes sociales', typeLabel: 'Desempleados', href: '/p/cursos/redes-sociales', enrollmentOpen: true },
  { id: '9', name: 'Atención al cliente y ventas', typeLabel: 'Desempleados', href: '/p/cursos/atencion-cliente', enrollmentOpen: false },
  { id: '10', name: 'Prevención de riesgos laborales', typeLabel: 'Desempleados', href: '/p/cursos/prl', enrollmentOpen: false },
  { id: '11', name: 'Tatuaje profesional online', typeLabel: 'Teleformación', href: '/p/cursos/tatuaje-profesional-online', enrollmentOpen: true },
  { id: '12', name: 'Diseño gráfico digital', typeLabel: 'Teleformación', href: '/p/cursos/diseno-grafico', enrollmentOpen: true },
  { id: '13', name: 'Community manager', typeLabel: 'Teleformación', href: '/p/cursos/community-manager', enrollmentOpen: false },
  { id: '14', name: 'Contabilidad básica', typeLabel: 'Teleformación', href: '/p/cursos/contabilidad-basica', enrollmentOpen: false },
  { id: '15', name: 'Socorrismo acuático', typeLabel: 'Privados', href: '/p/cursos/socorrismo', enrollmentOpen: true },
  { id: '16', name: 'Vigilante de seguridad', typeLabel: 'Ocupados', href: '/p/cursos/vigilante-seguridad', enrollmentOpen: false },
  { id: '17', name: 'Auxiliar de clínica dental', typeLabel: 'Privados', href: '/p/cursos/clinica-dental', enrollmentOpen: false },
  { id: '18', name: 'Educación infantil', typeLabel: 'Desempleados', href: '/p/cursos/educacion-infantil', enrollmentOpen: true },
]

const FALLBACK_HERO: Extract<WebsiteSection, { kind: 'heroCarousel' }> = {
  kind: 'heroCarousel',
  title: 'Formación profesional en Tenerife',
  subtitle: 'Cursos presenciales, subvencionados y online para dar el siguiente paso.',
  eyebrow: 'CEP Formación',
  primaryCta: { label: 'Ver cursos', href: '#catalogo' },
  slides: [
    { image: '/website/cep/hero/slideshow-1.jpg', alt: 'Aula CEP Formación' },
    { image: '/website/cep/hero/slideshow-2.jpg', alt: 'Estudiantes CEP' },
    { image: '/website/cep/hero/slideshow-3.jpg', alt: 'Sede CEP' },
  ],
}

function toDenseRow(course: {
  id: string
  slug: string
  nombre: string
  studyTypeLabel: string
  enrollmentStatus: 'open' | 'published' | 'closed' | 'none'
}): CourseDenseRowData {
  return {
    id: String(course.id),
    name: course.nombre,
    typeLabel: course.studyTypeLabel,
    href: `/p/cursos/${course.slug}`,
    enrollmentOpen: course.enrollmentStatus === 'open',
    enrollmentClosed: course.enrollmentStatus === 'closed',
  }
}

async function loadCourses(tenantId: string): Promise<{ courses: CourseDenseRowData[]; source: 'live' | 'mock' }> {
  try {
    const published = await getPublishedCourses({
      tenantId: tenantId === 'default' ? null : tenantId,
      includeInactive: false,
      includeCycles: false,
      limit: 200,
      sort: 'name',
    })
    if (published.length === 0) return { courses: MOCK_COURSES, source: 'mock' }
    return { courses: published.map(toDenseRow), source: 'live' }
  } catch {
    return { courses: MOCK_COURSES, source: 'mock' }
  }
}

export default async function MockHomePage() {
  let tenantId = 'default'
  let brandColor = '#f2014b'
  try {
    const tenant = await getTenantHostBranding()
    tenantId = tenant.tenantId
    const website = await getTenantWebsite()
    brandColor = website.visualIdentity.colorPrimary || brandColor
  } catch {
    brandColor = '#f2014b'
  }
  const { courses, source } = await loadCourses(tenantId)

  let hero = FALLBACK_HERO
  try {
    const page = await getPublicPage('/')
    if (page) {
      const normalized = applyCepHomeOverrides(page)
      const heroSection = normalized.sections.find(
        (section): section is Extract<WebsiteSection, { kind: 'heroCarousel' }> => section.kind === 'heroCarousel'
      )
      if (heroSection) hero = heroSection
    }
  } catch {
    hero = FALLBACK_HERO
  }

  const openCount = courses.filter((course) => course.enrollmentOpen).length

  return (
    <>
      <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-950">
        Mock de home. El listado compacto no sustituye la web en producción. Fuente:{' '}
        {source === 'live' ? `catálogo real (${courses.length} cursos)` : `datos de ejemplo (${courses.length} cursos)`}.
      </div>
      <HeroCarouselClient section={hero} brandColor={brandColor} />
      <section id="catalogo" className="bg-[#fff7fa]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Cursos</h2>
              <p className="mt-2 max-w-2xl text-base leading-7 text-slate-600">
                Catálogo agrupado por tipo de formación. Cada fila es el nombre del curso y el acceso a la ficha.
              </p>
            </div>
            <p className="text-sm text-slate-500">
              {courses.length} formaciones · {openCount} con matrícula abierta
            </p>
          </div>
          <CourseDenseCatalog courses={courses} />
        </div>
      </section>
    </>
  )
}
