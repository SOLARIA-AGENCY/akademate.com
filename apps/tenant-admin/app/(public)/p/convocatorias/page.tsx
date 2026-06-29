import { getPayload } from 'payload'
import configPromise from '@payload-config'
import Link from 'next/link'
import type { Metadata } from 'next'
import { withTenantScope } from '@/app/lib/server/tenant-scope'
import { getTenantHostBranding } from '@/app/lib/server/tenant-host-branding'
import { CalendarDays, Clock, Euro, MapPin, Users } from 'lucide-react'
import { getCourseRunEnrollmentStatusInfo } from '@/app/lib/course-run-enrollment-status'
import {
  formatPublicCurrency,
  formatPublicDate,
  formatRunSchedule,
  getPublicConvocationHref,
  getRunPrice,
} from '@/app/lib/public-convocations'

export const metadata: Metadata = {
  title: 'Convocatorias Abiertas',
  description: 'Convocatorias de formación profesional con inscripción abierta.',
}
export const dynamic = 'force-dynamic'

function resolveImageUrl(image: any): string | null {
  if (!image) return null
  if (typeof image === 'object' && image.url) return image.url
  if (typeof image === 'object' && image.filename) return `/media/${image.filename}`
  return null
}

export default async function ConvocatoriasPage() {
  const tenant = await getTenantHostBranding()
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'course-runs',
    where: withTenantScope({ status: { in: ['enrollment_open', 'published'] } }, tenant.tenantId) as any,
    limit: 50,
    sort: 'start_date',
    depth: 2,
  })

  const convocatorias = result.docs
  const grouped = new Map<string, { title: string; city?: string; docs: any[] }>()

  for (const conv of convocatorias as any[]) {
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Convocatorias Abiertas</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Inscríbete en nuestras convocatorias activas.
        </p>
      </div>

      {convocatorias.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg">No hay convocatorias abiertas en este momento</p>
          <p className="text-sm mt-2">Consulta nuestros <a href="/ciclos" className="brand-text hover:underline">ciclos formativos</a> y déjanos tu email para enterarte de nuevas convocatorias.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {Array.from(grouped.entries()).map(([groupKey, group]) => (
            <section key={groupKey}>
              <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div className="flex items-start gap-3">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s7-4.35 7-10a7 7 0 1 0-14 0c0 5.65 7 10 7 10Z" />
                  <circle cx="12" cy="11" r="2.5" />
                </svg>
                    <div>
                      <h2 className="text-2xl font-black text-slate-950">{group.title}</h2>
                      {group.city ? <p className="mt-1 text-sm font-semibold text-slate-600">{group.city}</p> : null}
                    </div>
                  </div>
                  <span className="rounded-full bg-rose-50 px-4 py-2 text-xs font-black uppercase tracking-wide text-[#f2014b]">
                    {group.docs.length} convocatorias
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-6">
                {group.docs.map((conv: any) => {
            const course = typeof conv.course === 'object' ? conv.course : null
            const cycle = typeof conv.cycle === 'object' ? conv.cycle : null
            const campus = typeof conv.campus === 'object' ? conv.campus : null
            const classroom = typeof conv.classroom === 'object' ? conv.classroom : null
            // Image priority: course.featured_image → cycle.image → null
            const imageUrl = (course ? resolveImageUrl(course.featured_image) : null)
              || (cycle ? resolveImageUrl(cycle.image) : null)
              || (course ? resolveImageUrl(course.image) : null)
            const detailHref = getPublicConvocationHref(conv)
            const courseName = course?.title || course?.name || cycle?.title || cycle?.name || conv.codigo
            const startDateText = formatPublicDate(conv.start_date)
            const endDateText = conv.end_date ? formatPublicDate(conv.end_date) : null
            const maxStudents = Number(conv.max_students ?? 0)
            const currentEnrollments = Number(conv.current_enrollments ?? 0)
            const enrollmentInfo = getCourseRunEnrollmentStatusInfo(conv)

            return (
              <article
                key={conv.id}
                className="group grid overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:border-red-300 hover:shadow-lg md:grid-cols-[240px_1fr]"
              >
                  <div className="relative min-h-[210px] bg-gradient-to-br from-gray-200 to-gray-100">
                    {imageUrl && <img src={imageUrl} alt={courseName} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />}
                  </div>
                  <div className="min-w-0 p-6">
                    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="line-clamp-2 text-xl font-extrabold uppercase leading-tight tracking-wide text-gray-950">
                          {courseName}
                        </h2>
                        <p className="mt-1 font-mono text-sm text-gray-500">{conv.codigo}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-white ${enrollmentInfo.allowsEnrollment ? 'bg-green-600' : 'bg-slate-500'}`}>
                        {enrollmentInfo.publicLabel}
                      </span>
                    </div>

                    <div className="grid gap-3 text-sm text-gray-700 sm:grid-cols-2">
                      <span className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-red-600" />
                        {campus?.name || 'Sede por confirmar'}{classroom?.name ? ` · ${classroom.name}` : ''}
                      </span>
                      <span className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-red-600" />
                        {startDateText}{endDateText ? ` - ${endDateText}` : ''}
                      </span>
                      <span className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-red-600" />
                        {formatRunSchedule(conv)}
                      </span>
                      <span className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-red-600" />
                        {currentEnrollments}/{maxStudents || '-'} plazas
                      </span>
                      <span className="flex items-center gap-2">
                        <Euro className="h-4 w-4 text-red-600" />
                        {formatPublicCurrency(getRunPrice(conv, course, cycle))}
                      </span>
                    </div>

                    <div className="mt-5 grid gap-2 sm:grid-cols-2">
                        <Link
                          href={detailHref}
                          className="inline-flex w-full items-center justify-center rounded-md bg-red-600 px-3 py-3 text-sm font-extrabold uppercase tracking-wide text-white hover:bg-red-700"
                        >
                          VER CONVOCATORIA
                        </Link>
                        <Link
                          href={detailHref}
                          className="inline-flex w-full items-center justify-center rounded-md border border-red-200 bg-white px-3 py-3 text-sm font-extrabold uppercase tracking-wide text-red-700 hover:bg-red-50"
                        >
                          {enrollmentInfo.ctaLabel.toUpperCase()}
                        </Link>
                    </div>
                  </div>
                </article>
            )
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
