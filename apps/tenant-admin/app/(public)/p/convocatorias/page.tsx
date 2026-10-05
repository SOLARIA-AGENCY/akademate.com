import { getPayload } from 'payload'
import configPromise from '@payload-config'
import Link from 'next/link'
import type { Metadata } from 'next'
import { withTenantScope } from '@/app/lib/server/tenant-scope'
import { getTenantHostBranding } from '@/app/lib/server/tenant-host-branding'
import { displayCourseTitle } from '../_components/course-title'
import { campusPublicName } from '@/app/lib/public-campus-name'
import { enrollmentFromRun, enrollmentLabelFor } from '@/app/lib/server/published-courses'

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

function formatRunSchedule(conv: any): string {
  const days = Array.isArray(conv.schedule_days) ? conv.schedule_days.join(', ') : ''
  const start = typeof conv.schedule_time_start === 'string' ? conv.schedule_time_start.replace(/:00$/, '') : ''
  const end = typeof conv.schedule_time_end === 'string' ? conv.schedule_time_end.replace(/:00$/, '') : ''
  if (days && start && end) return `${days} · ${start}-${end}`
  if (start && end) return `${start}-${end}`
  return days || 'Horario por confirmar'
}

function formatPrice(value: unknown): string {
  const price = Number(value)
  if (!Number.isFinite(price) || price <= 0) return 'Consultar'
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(price)
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-[0.95rem] font-semibold leading-snug text-slate-950">{value}</p>
    </div>
  )
}

export default async function ConvocatoriasPage() {
  const tenant = await getTenantHostBranding()
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'course-runs',
    where: withTenantScope({ status: { in: ['enrollment_open', 'published', 'enrollment_closed'] } }, tenant.tenantId) as any,
    limit: 50,
    sort: '-start_date',
    depth: 2,
  })

  const convocatorias = result.docs
  const grouped = new Map<string, { title: string; city?: string; docs: any[] }>()

  for (const conv of convocatorias as any[]) {
    const campus = typeof conv.campus === 'object' && conv.campus ? conv.campus : null
    const key = campus?.id ? String(campus.id) : 'online'
    if (!grouped.has(key)) {
      grouped.set(key, {
        title: campusPublicName(campus) || 'Modalidad Online / Sin sede fija',
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
              <div className="mb-5 flex items-center gap-2 text-sm font-semibold text-gray-700">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s7-4.35 7-10a7 7 0 1 0-14 0c0 5.65 7 10 7 10Z" />
                  <circle cx="12" cy="11" r="2.5" />
                </svg>
                <span>{group.title}{group.city ? ` — ${group.city}` : ''}</span>
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
            const detailHref = `/convocatorias/${conv.codigo || conv.id}`
            const courseName = displayCourseTitle(
              String(course?.title || course?.name || cycle?.title || cycle?.name || conv.codigo || ''),
            )
            const startDateText = conv.start_date
              ? new Date(conv.start_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
              : 'Fecha por confirmar'
            const endDateText = conv.end_date
              ? new Date(conv.end_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
              : null
            const maxStudents = Number(conv.max_students ?? 0)
            const currentEnrollments = Number(conv.current_enrollments ?? 0)
            const enrollment = enrollmentFromRun({
              status: conv.status,
              enrollment_deadline: conv.enrollment_deadline ?? null,
            })
            const isOpen = enrollment === 'open'
            const isClosed = enrollment === 'closed'

            return (
              <article
                key={conv.id}
                className={`group grid overflow-hidden rounded-2xl border shadow-sm md:grid-cols-[15.5rem_minmax(0,1fr)] ${isOpen ? 'border-emerald-200 bg-[#ecfdf5]' : 'border-gray-200 bg-white'}`}
              >
                  <div className="relative min-h-44 bg-gradient-to-br from-gray-200 to-gray-100 md:min-h-full">
                    {imageUrl && <img src={imageUrl} alt={courseName} className="h-full w-full object-cover" />}
                  </div>
                  <div className="flex min-w-0 flex-col gap-4 p-5 md:p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="line-clamp-2 text-xl font-semibold leading-tight tracking-tight text-gray-950">
                          {courseName}
                        </h2>
                        <p className="mt-1 font-mono text-sm text-gray-500">{conv.codigo}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold text-white ${isOpen ? 'bg-emerald-600' : 'bg-[#64748b]'}`}>
                        {isClosed ? 'Matrícula cerrada' : isOpen ? 'Matrícula abierta' : enrollmentLabelFor(enrollment || 'published')}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-x-5 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
                      <Fact
                        label="Sede"
                        value={`${campusPublicName(campus) || 'Sede por confirmar'}${classroom?.name ? ` · ${classroom.name}` : ''}`}
                      />
                      <Fact
                        label="Fechas"
                        value={`${startDateText}${endDateText ? ` - ${endDateText}` : ''}`}
                      />
                      <Fact label="Horario" value={formatRunSchedule(conv)} />
                      <Fact label="Plazas" value={`${currentEnrollments}/${maxStudents || '-'} plazas`} />
                      <Fact label="Precio" value={formatPrice(conv.price ?? course?.base_price)} />
                    </div>
                    <div className="mt-auto flex justify-end pt-1">
                      <Link
                        href={detailHref}
                        className="inline-flex min-h-11 min-w-[10.75rem] items-center justify-center rounded-full bg-[#f2014b] px-5 text-sm font-semibold text-white hover:bg-[#d0013f]"
                      >
                        Ver convocatoria
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
