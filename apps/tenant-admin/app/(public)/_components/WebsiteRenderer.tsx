import type React from 'react'
import Link from 'next/link'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import type { WebsitePage, WebsiteSection } from '@/app/lib/website/types'

function resolveImageUrl(image: any): string | null {
  if (!image) return null
  if (typeof image === 'object' && image.url) return image.url
  if (typeof image === 'object' && image.filename) return `/media/${image.filename}`
  return null
}

async function HeroCarouselSection({
  section,
  brandColor,
}: {
  section: Extract<WebsiteSection, { kind: 'heroCarousel' }>
  brandColor: string
}) {
  const firstSlide = section.slides[0]
  return (
    <section className="relative overflow-hidden bg-[#140816] text-white">
      {firstSlide && (
        <div className="absolute inset-0">
          <img src={firstSlide.image} alt={firstSlide.alt} className="h-full w-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/25" />
        </div>
      )}
      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-24 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:px-8 lg:py-28">
        <div className="max-w-3xl">
          {section.eyebrow ? (
            <span className="mb-6 inline-flex rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em]" style={{ backgroundColor: brandColor }}>
              {section.eyebrow}
            </span>
          ) : null}
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">{section.title}</h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-white/80 sm:text-lg">{section.subtitle}</p>
          <div className="mt-8 flex flex-wrap gap-4">
            {section.primaryCta ? (
              <Link href={section.primaryCta.href} className="rounded-full px-6 py-3 text-sm font-semibold text-white" style={{ backgroundColor: brandColor }}>
                {section.primaryCta.label}
              </Link>
            ) : null}
            {section.secondaryCta ? (
              <Link href={section.secondaryCta.href} className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm">
                {section.secondaryCta.label}
              </Link>
            ) : null}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
          {section.slides.map((slide) => (
            <div key={slide.image} className="overflow-hidden rounded-3xl border border-white/10 bg-white/10 backdrop-blur-sm">
              <img src={slide.image} alt={slide.alt} className="h-40 w-full object-cover lg:h-44" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
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

async function CourseListSection({ section, brandColor }: { section: Extract<WebsiteSection, { kind: 'courseList' }>; brandColor: string }) {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'courses',
    depth: 1,
    limit: section.limit ?? 6,
    sort: 'name',
  })
  const docs = result.docs.filter((course: any) => {
    if (section.courseTypes?.length && !section.courseTypes.includes(course.course_type)) return false
    if (section.featuredOnly && !course.featured) return false
    return true
  })

  return (
    <section className="bg-[#fff7fa]">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-semibold text-slate-900">{section.title}</h2>
        {section.subtitle ? <p className="mt-3 max-w-2xl text-slate-600">{section.subtitle}</p> : null}
        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {docs.map((course: any) => {
            const title = course.title ?? course.name
            const description = course.short_description ?? course.description ?? course.long_description
            const imageUrl = resolveImageUrl(course.featured_image) || resolveImageUrl(course.image)
            return (
              <Link key={course.id} href={`/cursos/${course.slug}`} className="group overflow-hidden rounded-3xl border border-slate-200 bg-white">
                <div className="relative h-56 overflow-hidden">
                  {imageUrl ? <img src={imageUrl} alt={title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="h-full w-full" style={{ backgroundColor: brandColor }} />}
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
      </div>
    </section>
  )
}

async function CycleListSection({ section, brandColor }: { section: Extract<WebsiteSection, { kind: 'cycleList' }>; brandColor: string }) {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'cycles',
    where: { active: { equals: true } },
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
            return (
              <Link key={cycle.id} href={`/ciclos/${cycle.slug}`} className="group overflow-hidden rounded-3xl border border-slate-200 bg-white">
                <div className="relative h-56">
                  {imageUrl ? <img src={imageUrl} alt={cycle.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="h-full w-full" style={{ backgroundColor: brandColor }} />}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-5 left-5 right-5">
                    <p className="mb-2 inline-flex rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-slate-900">{cycle.level}</p>
                    <h3 className="text-xl font-semibold text-white">{cycle.name}</h3>
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

async function ConvocationListSection({ section, brandColor }: { section: Extract<WebsiteSection, { kind: 'convocationList' }>; brandColor: string }) {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'course-runs',
    where: { status: { in: ['published', 'enrollment_open'] } },
    depth: 2,
    limit: section.limit ?? 4,
    sort: '-start_date',
  })

  return (
    <section className="bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-semibold">{section.title}</h2>
        {section.subtitle ? <p className="mt-3 max-w-2xl text-white/70">{section.subtitle}</p> : null}
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {result.docs.map((conv: any) => {
            const course = typeof conv.course === 'object' ? conv.course : null
            const cycle = typeof conv.cycle === 'object' ? conv.cycle : null
            const displayName = cycle?.name || course?.name || course?.title || conv.codigo
            const imageUrl =
              resolveImageUrl(course?.featured_image) || resolveImageUrl(course?.image) || resolveImageUrl(cycle?.image)
            return (
              <Link key={conv.id} href={`/convocatorias/${conv.codigo || conv.id}`} className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
                <div className="relative h-52">
                  {imageUrl ? <img src={imageUrl} alt={displayName} className="h-full w-full object-cover" /> : <div className="h-full w-full" style={{ backgroundColor: brandColor }} />}
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
    </section>
  )
}

async function CampusListSection({ section }: { section: Extract<WebsiteSection, { kind: 'campusList' }> }) {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'campuses',
    where: { active: { equals: true } },
    depth: 1,
    limit: section.limit ?? 3,
    sort: 'name',
  })

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-semibold text-slate-900">{section.title}</h2>
        {section.subtitle ? <p className="mt-3 max-w-2xl text-slate-600">{section.subtitle}</p> : null}
        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {result.docs.map((campus: any) => {
            const imageUrl = resolveImageUrl(campus.image)
            return (
              <Link key={campus.id} href={`/sedes/${campus.slug}`} className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
                <div className="h-52">
                  {imageUrl ? <img src={imageUrl} alt={campus.name} className="h-full w-full object-cover" /> : <div className="h-full w-full bg-slate-200" />}
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-slate-900">{campus.name}</h3>
                  <p className="mt-2 text-sm text-slate-600">{campus.city}{campus.address ? ` · ${campus.address}` : ''}</p>
                </div>
              </Link>
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
                <img src={item.image} alt={item.title} className="h-60 w-full object-cover" />
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
              <img src={member.image} alt={member.name} className="h-72 w-full object-cover" />
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

async function renderSection(section: WebsiteSection, brandColor: string): Promise<React.ReactNode> {
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
      return <CourseListSection section={section} brandColor={brandColor} />
    case 'cycleList':
      return <CycleListSection section={section} brandColor={brandColor} />
    case 'convocationList':
      return <ConvocationListSection section={section} brandColor={brandColor} />
    case 'campusList':
      return <CampusListSection section={section} />
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
  const sections = await Promise.all(
    page.sections.map(async (section, index) => (
      <div key={`${section.kind}-${index}`}>{await renderSection(section, brandColor)}</div>
    ))
  )
  return <>{sections}</>
}
