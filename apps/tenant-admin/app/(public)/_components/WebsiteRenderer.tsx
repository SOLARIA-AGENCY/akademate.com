import type React from 'react'
import Link from 'next/link'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { withTenantScope } from '@/app/lib/server/tenant-scope'
import { getTenantHostBranding } from '@/app/lib/server/tenant-host-branding'
import type { WebsitePage, WebsiteSection } from '@/app/lib/website/types'
import { normalizeStudyType } from '@/app/lib/website/study-types'
import { HeroCarouselClient } from './HeroCarouselClient'

function resolveImageUrl(image: any): string | null {
  if (!image) return null
  if (typeof image === 'object' && image.url) return image.url
  if (typeof image === 'object' && image.filename) return `/media/${image.filename}`
  return null
}

const CYCLE_LEVEL_META: Record<string, { label: string; bgColor: string; textColor: string }> = {
  grado_medio: { label: 'Grado Medio · CFGM', bgColor: '#2563EB', textColor: '#FFFFFF' },
  grado_superior: { label: 'Grado Superior · CFGS', bgColor: '#E3003A', textColor: '#FFFFFF' },
}

function getCycleLevelMeta(level: string | undefined) {
  if (!level) return null
  return CYCLE_LEVEL_META[level] ?? null
}

function getCycleSubtitle(cycle: any): string | null {
  const slug = String(cycle?.slug || '')
  const name = String(cycle?.name || '')
  if (slug.includes('farmacia') || name.toLowerCase().includes('farmacia')) {
    return 'Ciclo Formativo de Grado Medio (LOE) · Ref. SANMS · Semipresencial'
  }
  if (slug.includes('higiene-bucodental') || name.toLowerCase().includes('higiene')) {
    return 'Ciclo Formativo de Grado Superior (LOE) · Ref. SANSS · Semipresencial'
  }
  return null
}

function getCycleChips(cycle: any): string[] {
  const chips = [
    'Régimen LOE',
    'Titulación oficial reconocida por el Ministerio de Educación',
    'Modalidad semipresencial (1 día/semana presencial)',
  ]
  const practiceHours = cycle?.duration?.practiceHours
  chips.push(practiceHours && Number.isFinite(practiceHours) ? `${practiceHours}h de prácticas en empresa` : '500h de prácticas en empresa')
  const hasFSE = Array.isArray(cycle?.scholarships)
    && cycle.scholarships.some((s: any) => {
      const name = String(s?.name || '').toLowerCase()
      const description = String(s?.description || '').toLowerCase()
      return name.includes('fondo social europeo') || description.includes('fondo social europeo')
    })
  if (hasFSE) chips.push('Cofinanciado por el Fondo Social Europeo')
  return chips
}

async function HeroCarouselSection({
  section,
  brandColor,
}: {
  section: Extract<WebsiteSection, { kind: 'heroCarousel' }>
  brandColor: string
}) {
  return <HeroCarouselClient section={section} brandColor={brandColor} />
}

function StatsStripSection({ section, brandColor }: { section: Extract<WebsiteSection, { kind: 'statsStrip' }>; brandColor: string }) {
  return (
    <section style={{ backgroundColor: brandColor }}>
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-8 text-white sm:px-6 md:grid-cols-4 lg:px-8">
        {section.items.map((item) => (
          <div key={item.label} className="text-center">
            <p className="text-3xl font-semibold">{item.value}</p>
            <p className="mt-1 text-sm text-white/80">{item.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function FeatureStripSection({ section }: { section: Extract<WebsiteSection, { kind: 'featureStrip' }> }) {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {section.title ? <h2 className="text-3xl font-semibold text-slate-900">{section.title}</h2> : null}
        {section.subtitle ? <p className="mt-3 max-w-2xl text-slate-600">{section.subtitle}</p> : null}
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {section.items.map((item) => (
            <article key={item.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function CtaBannerSection({
  section,
  brandColor,
}: {
  section: Extract<WebsiteSection, { kind: 'ctaBanner' }>
  brandColor: string
}) {
  const isDark = section.theme === 'dark'
  const className = isDark ? 'bg-slate-950 text-white' : section.theme === 'brand' ? 'text-white' : 'bg-white text-slate-950'
  return (
    <section className={className} style={section.theme === 'brand' ? { backgroundColor: brandColor } : undefined}>
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 py-14 sm:px-6 lg:flex-row lg:items-center lg:px-8">
        <div>
          <h2 className="text-3xl font-semibold">{section.title}</h2>
          <p className={`mt-3 max-w-2xl ${isDark ? 'text-white/75' : 'text-slate-600'}`}>{section.body}</p>
        </div>
        {section.cta ? (
          <Link
            href={section.cta.href}
            className={`rounded-full px-6 py-3 text-sm font-semibold ${isDark ? 'bg-white text-slate-950' : 'text-white'}`}
            style={!isDark ? { backgroundColor: brandColor } : undefined}
          >
            {section.cta.label}
          </Link>
        ) : null}
      </div>
    </section>
  )
}

async function CourseListSection({
  section,
  brandColor,
  tenantId,
}: {
  section: Extract<WebsiteSection, { kind: 'courseList' }>
  brandColor: string
  tenantId: string
}) {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'courses',
    where: withTenantScope({ active: { equals: true } }, tenantId) as any,
    depth: 1,
    limit: section.limit ?? 6,
    sort: 'name',
  })
  const requestedTypes = (section.courseTypes ?? [])
    .map((value) => normalizeStudyType(value))
    .filter((value): value is NonNullable<typeof value> => Boolean(value))

  const docs = result.docs.filter((course: any) => {
    const normalizedStudyType = normalizeStudyType(String(course.course_type || ''))
    if (!requestedTypes.length && (normalizedStudyType === 'ciclo_medio' || normalizedStudyType === 'ciclo_superior')) {
      return false
    }
    if (requestedTypes.length && (!normalizedStudyType || !requestedTypes.includes(normalizedStudyType))) {
      return false
    }
    if (section.featuredOnly && !course.featured) return false
    return true
  })

  return (
    <section className="bg-[#fff7fa]">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-semibold text-slate-900">{section.title}</h2>
        {section.subtitle ? <p className="mt-3 max-w-2xl text-slate-600">{section.subtitle}</p> : null}
        {docs.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-8">
            <p className="text-base text-slate-700">
              Próximamente nuevos cursos de especialización. Consulta nuestras convocatorias abiertas.
            </p>
            <Link
              href="/convocatorias"
              className="mt-5 inline-flex rounded-full px-5 py-2.5 text-sm font-semibold text-white"
              style={{ backgroundColor: brandColor }}
            >
              Ver convocatorias
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {docs.map((course: any) => {
              const title = course.title ?? course.name
              const description = course.short_description ?? course.description ?? course.long_description
              const imageUrl = resolveImageUrl(course.featured_image) || resolveImageUrl(course.image)
              return (
                <Link key={course.id} href={`/cursos/${course.slug}`} className="group overflow-hidden rounded-3xl border border-slate-200 bg-white">
                  <div className="relative h-56 overflow-hidden">
                    {imageUrl ? <img src={imageUrl} alt={title} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="h-full w-full" style={{ backgroundColor: brandColor }} />}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
                    <h3 className="absolute bottom-5 left-5 right-5 text-xl font-semibold text-white">{title}</h3>
                  </div>
                  <div className="p-6">
                    <p className="line-clamp-3 text-sm leading-7 text-slate-600">{description || 'Programa especializado con orientación práctica.'}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

async function CycleListSection({
  section,
  brandColor,
  tenantId,
}: {
  section: Extract<WebsiteSection, { kind: 'cycleList' }>
  brandColor: string
  tenantId: string
}) {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'cycles',
    where: withTenantScope({ active: { equals: true } }, tenantId) as any,
    depth: 1,
    limit: section.limit ?? 6,
    sort: 'name',
  })

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-semibold text-slate-900">{section.title}</h2>
        {section.subtitle ? <p className="mt-3 max-w-2xl text-slate-600">{section.subtitle}</p> : null}
        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {result.docs.map((cycle: any) => {
            const imageUrl = resolveImageUrl(cycle.image)
            const levelMeta = getCycleLevelMeta(cycle.level)
            const subtitle = getCycleSubtitle(cycle)
            const chips = getCycleChips(cycle)
            return (
              <Link key={cycle.id} href={`/ciclos/${cycle.slug}`} className="group overflow-hidden rounded-3xl border border-slate-200 bg-white">
                <div className="relative h-56">
                  {imageUrl ? <img src={imageUrl} alt={cycle.name} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="h-full w-full" style={{ backgroundColor: brandColor }} />}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-5 left-5 right-5">
                    <p
                      className="mb-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold"
                      style={levelMeta ? { backgroundColor: levelMeta.bgColor, color: levelMeta.textColor } : undefined}
                    >
                      {levelMeta?.label || cycle.level}
                    </p>
                    <h3 className="text-xl font-semibold text-white">{cycle.name}</h3>
                  </div>
                </div>
                <div className="space-y-4 p-5">
                  {subtitle ? <p className="text-sm leading-6 text-slate-700">{subtitle}</p> : null}
                  <div className="flex flex-wrap gap-2">
                    {chips.map((chip) => (
                      <span key={`${cycle.id}-${chip}`} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-700">
                        {chip}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}

async function ConvocationListSection({
  section,
  brandColor,
  tenantId,
}: {
  section: Extract<WebsiteSection, { kind: 'convocationList' }>
  brandColor: string
  tenantId: string
}) {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'course-runs',
    where: withTenantScope({ status: { in: ['published', 'enrollment_open'] } }, tenantId) as any,
    depth: 2,
    limit: section.limit ?? 4,
    sort: '-start_date',
  })

  const grouped = new Map<string, { title: string; city?: string; docs: any[] }>()
  for (const conv of result.docs) {
    const campus = typeof conv.campus === 'object' && conv.campus ? conv.campus : null
    const key = campus?.id ? String(campus.id) : 'online'
    if (!grouped.has(key)) {
      grouped.set(key, {
        title: campus?.name || 'Modalidad Online / Sin sede fija',
        city: campus?.city || undefined,
        docs: [],
      })
    }
    grouped.get(key)!.docs.push(conv)
  }

  return (
    <section className="bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-semibold">{section.title}</h2>
        {section.subtitle ? <p className="mt-3 max-w-2xl text-white/70">{section.subtitle}</p> : null}
        <div className="mt-10 space-y-10">
          {Array.from(grouped.entries()).map(([groupKey, group]) => (
            <div key={groupKey}>
              <div className="mb-5 flex items-center gap-2 text-sm font-semibold text-white/90">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s7-4.35 7-10a7 7 0 1 0-14 0c0 5.65 7 10 7 10Z" />
                  <circle cx="12" cy="11" r="2.5" />
                </svg>
                <span>{group.title}{group.city ? ` — ${group.city}` : ''}</span>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                {group.docs.map((conv: any) => {
            const course = typeof conv.course === 'object' ? conv.course : null
            const cycle = typeof conv.cycle === 'object' ? conv.cycle : null
            const displayName = cycle?.name || course?.name || course?.title || conv.codigo
            const imageUrl =
              resolveImageUrl(course?.featured_image) || resolveImageUrl(course?.image) || resolveImageUrl(cycle?.image)
            return (
              <Link key={conv.id} href={`/convocatorias/${conv.codigo || conv.id}`} className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
                <div className="relative h-52">
                  {imageUrl ? <img src={imageUrl} alt={displayName} loading="lazy" decoding="async" className="h-full w-full object-cover" /> : <div className="h-full w-full" style={{ backgroundColor: brandColor }} />}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-5 left-5 right-5">
                    <span className="mb-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase text-white" style={{ backgroundColor: brandColor }}>
                      Inscripción abierta
                    </span>
                    <h3 className="text-xl font-semibold">{displayName}</h3>
                  </div>
                </div>
              </Link>
            )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

async function CampusListSection({
  section,
  tenantId,
}: {
  section: Extract<WebsiteSection, { kind: 'campusList' }>
  tenantId: string
}) {
  const payload = await getPayload({ config: configPromise })
  const campusResult = await payload.find({
    collection: 'campuses',
    where: withTenantScope({ active: { equals: true } }, tenantId) as any,
    depth: 1,
    limit: section.limit ?? 3,
    sort: 'name',
  })
  const runsResult = await payload.find({
    collection: 'course-runs',
    where: withTenantScope({ status: { in: ['published', 'enrollment_open'] } }, tenantId) as any,
    depth: 2,
    limit: 120,
    sort: '-start_date',
  })

  const offeringsByCampus = new Map<string, Array<{ label: string; href: string }>>()
  for (const run of runsResult.docs as any[]) {
    const campus = typeof run.campus === 'object' && run.campus ? run.campus : null
    if (!campus?.id) continue
    const key = String(campus.id)
    const course = typeof run.course === 'object' ? run.course : null
    const cycle = typeof run.cycle === 'object' ? run.cycle : null
    const label = cycle?.name || course?.title || course?.name
    const href = cycle?.slug ? `/ciclos/${cycle.slug}` : course?.slug ? `/cursos/${course.slug}` : ''
    if (!label || !href) continue
    const items = offeringsByCampus.get(key) ?? []
    if (!items.some((item) => item.href === href)) {
      items.push({ label, href })
      offeringsByCampus.set(key, items)
    }
  }

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-semibold text-slate-900">{section.title}</h2>
        {section.subtitle ? <p className="mt-3 max-w-2xl text-slate-600">{section.subtitle}</p> : null}
        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {campusResult.docs.map((campus: any) => {
            const imageUrl = resolveImageUrl(campus.image)
            const campusOfferings = offeringsByCampus.get(String(campus.id)) ?? []
            const schedule = campus?.schedule?.weekdays || campus?.schedule?.saturday || 'Horario pendiente'
            return (
              <article key={campus.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
                <div className="h-52">
                  {imageUrl ? <img src={imageUrl} alt={campus.name} loading="lazy" decoding="async" className="h-full w-full object-cover" /> : <div className="h-full w-full bg-slate-200" />}
                </div>
                <div className="space-y-3 p-6">
                  <h3 className="text-xl font-semibold text-slate-900">{campus.name}</h3>
                  <p className="text-sm text-slate-600">{campus.city}{campus.address ? ` · ${campus.address}` : ''}</p>
                  {campus.phone ? <p className="text-sm text-slate-700"><span className="font-semibold">Teléfono:</span> {campus.phone}</p> : null}
                  <p className="text-sm text-slate-700"><span className="font-semibold">Horario:</span> {schedule}</p>
                  {campusOfferings.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {campusOfferings.slice(0, 6).map((offering) => (
                        <Link key={`${campus.id}-${offering.href}`} href={offering.href} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-700 transition hover:border-[var(--cep-brand)] hover:text-[var(--cep-brand)]">
                          {offering.label}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                  <Link href={`/sedes/${campus.slug}`} className="inline-flex text-sm font-semibold text-[var(--cep-brand)]">
                    Ver sede completa →
                  </Link>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function CategoryGridSection({ section }: { section: Extract<WebsiteSection, { kind: 'categoryGrid' }> }) {
  return (
    <section className="bg-[#fff7fa]">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-semibold text-slate-900">{section.title}</h2>
        {section.subtitle ? <p className="mt-3 max-w-2xl text-slate-600">{section.subtitle}</p> : null}
        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {section.items.map((item) => {
            const content = (
              <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
                <img src={item.image} alt={item.title} loading="lazy" decoding="async" className="h-60 w-full object-cover" />
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                </div>
              </article>
            )
            return item.href ? (
              <Link key={item.title} href={item.href}>
                {content}
              </Link>
            ) : (
              <div key={item.title}>{content}</div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function TeamGridSection({ section }: { section: Extract<WebsiteSection, { kind: 'teamGrid' }> }) {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-semibold text-slate-900">{section.title}</h2>
        {section.subtitle ? <p className="mt-3 max-w-2xl text-slate-600">{section.subtitle}</p> : null}
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {section.members.map((member) => (
            <article key={member.name} className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
              <img src={member.image} alt={member.name} loading="lazy" decoding="async" className="h-72 w-full object-cover" />
              <div className="p-5">
                <h3 className="text-lg font-semibold text-slate-900">{member.name}</h3>
                <p className="mt-1 text-sm text-slate-600">{member.role}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function LeadFormSection({
  section,
  brandColor,
}: {
  section: Extract<WebsiteSection, { kind: 'leadForm' }>
  brandColor: string
}) {
  return (
    <section className="bg-slate-950 text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
        <div>
          <h2 className="text-3xl font-semibold">{section.title}</h2>
          {section.subtitle ? <p className="mt-3 text-white/70">{section.subtitle}</p> : null}
        </div>
        <form className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-6">
          <input className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-white/40" placeholder="Nombre" />
          <input className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-white/40" placeholder="Email" />
          <input className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-white/40" placeholder="Teléfono" />
          <textarea className="min-h-28 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-white/40" placeholder="Cuéntanos qué te interesa" />
          <button type="button" className="rounded-full px-6 py-3 text-sm font-semibold text-white" style={{ backgroundColor: brandColor }}>
            Solicitar información
          </button>
        </form>
      </div>
    </section>
  )
}

async function renderSection(
  section: WebsiteSection,
  brandColor: string,
  tenantId: string
): Promise<React.ReactNode> {
  switch (section.kind) {
    case 'heroCarousel':
      return <HeroCarouselSection section={section} brandColor={brandColor} />
    case 'statsStrip':
      return <StatsStripSection section={section} brandColor={brandColor} />
    case 'featureStrip':
      return <FeatureStripSection section={section} />
    case 'ctaBanner':
      return <CtaBannerSection section={section} brandColor={brandColor} />
    case 'courseList':
      return <CourseListSection section={section} brandColor={brandColor} tenantId={tenantId} />
    case 'cycleList':
      return <CycleListSection section={section} brandColor={brandColor} tenantId={tenantId} />
    case 'convocationList':
      return <ConvocationListSection section={section} brandColor={brandColor} tenantId={tenantId} />
    case 'campusList':
      return <CampusListSection section={section} tenantId={tenantId} />
    case 'categoryGrid':
      return <CategoryGridSection section={section} />
    case 'teamGrid':
      return <TeamGridSection section={section} />
    case 'leadForm':
      return <LeadFormSection section={section} brandColor={brandColor} />
    default:
      return null
  }
}

export async function WebsiteRenderer({
  page,
  brandColor,
}: {
  page: WebsitePage
  brandColor: string
}) {
  const tenant = await getTenantHostBranding()
  const visibleSections = page.sections.filter((section) => section.enabled !== false)
  const sections = await Promise.all(
    visibleSections.map(async (section, index) => (
      <div key={section.id || `${section.kind}-${index}`}>
        {await renderSection(section, brandColor, tenant.tenantId)}
      </div>
    ))
  )
  return <>{sections}</>
}
