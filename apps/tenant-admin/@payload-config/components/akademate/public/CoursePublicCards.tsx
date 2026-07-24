'use client'

import Link from 'next/link'
import { Card, CardContent } from '@payload-config/components/ui/card'
import { PublicCardCta } from './PublicCardCta'
import { PublicInfoGrid, PublicInfoRows } from './PublicInfo'
import { PublicMediaBadge } from './PublicBadges'
import { formatPublicDate } from '@/app/lib/public-convocations'

export interface PublicCourseCardData {
  id: string | number
  slug: string
  nombre: string
  area?: string | null
  studyType?: string | null
  studyTypeLabel: string
  studyTypeColor?: string | null
  modality?: string | null
  descripcion?: string | null
  enrollmentLabel?: string | null
  enrollmentStatus?: 'open' | 'published' | 'none' | string | null
  imagenPortada: string
  areaColor?: string | null
  nextRun?: {
    campusLabel?: string | null
    campusHref?: string | null
    href?: string | null
    startDate?: string | null
  } | null
}

export function normalizePublicCampusLabel(value: string | null | undefined): string {
  const rawName = String(value || '').split(' · ')[0].trim()
  const normalized = rawName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

  if (normalized.includes('santa cruz')) return 'Sede CEP SANTA CRUZ'
  if (normalized.includes('norte')) return 'Sede CEP NORTE'
  if (normalized.includes('sur')) return 'Sede CEP SUR'
  if (!rawName) return 'Sede por confirmar'

  const location = rawName.replace(/^sede\s+/i, '').replace(/^cep\s+/i, '').trim()
  return location ? `Sede CEP ${location.toLocaleUpperCase('es-ES')}` : 'Sede por confirmar'
}

export function getPublicCourseUi(course: PublicCourseCardData) {
  const isTeleformacion = course.studyType === 'teleformacion'
  const isSubsidized = course.studyType === 'ocupados' || course.studyType === 'desempleados'
  const isOpen = course.enrollmentStatus === 'open'
  const startLabel = isTeleformacion
    ? 'Inicio inmediato'
    : isOpen && course.nextRun?.startDate
      ? formatPublicDate(course.nextRun.startDate, { day: '2-digit', month: 'short', year: 'numeric' })
      : 'Fecha por confirmar'
  return {
    isTeleformacion,
    isSubsidized,
    isOpen,
    imageUrl: course.imagenPortada,
    availabilityLabel: startLabel,
    statusLabel: isOpen ? 'Matrícula abierta' : 'Próximamente',
    campusLabel: isTeleformacion
      ? '100% online'
      : normalizePublicCampusLabel(course.nextRun?.campusLabel),
    campusHref: isTeleformacion ? null : course.nextRun?.campusHref || null,
    modalityLabel: isTeleformacion ? 'Online a tu ritmo' : course.modality === 'online' ? 'Online' : 'Presencial',
    description: isTeleformacion && !course.descripcion
      ? 'Formación online para avanzar a tu ritmo, con matrícula abierta permanente.'
      : course.descripcion || 'Curso de formación profesional',
  }
}

export function CoursePublicCard({ course }: { course: PublicCourseCardData }) {
  const ui = getPublicCourseUi(course)
  const typeColor = course.studyTypeColor || '#f2014b'
  return (
    <Link href={`/p/cursos/${course.slug}`} className="group h-full">
      <Card className="flex h-full min-h-[560px] flex-col overflow-hidden border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
        <div className="relative h-48 shrink-0">
          <img src={ui.imageUrl} alt={course.nombre} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <span
            className="absolute left-4 top-4 inline-flex items-center rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-white shadow-sm"
            style={{ backgroundColor: typeColor }}
          >
            {course.studyTypeLabel}
          </span>
          {ui.isTeleformacion ? <PublicMediaBadge tone="success" className="absolute right-4 top-4">Empieza cuando quieras</PublicMediaBadge> : null}
          {ui.isSubsidized ? <PublicMediaBadge tone="success" className="absolute right-4 top-4">Formación gratuita</PublicMediaBadge> : null}
          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="line-clamp-2 text-xl font-bold leading-tight text-white">{course.nombre}</h3>
          </div>
        </div>
        <CardContent className="flex flex-1 flex-col p-5">
          <div className="mb-4 flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-wide">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">{course.area || 'Formación'}</span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">{ui.modalityLabel}</span>
            <span className={`rounded-full px-3 py-1 text-white ${ui.isOpen ? 'bg-green-600' : 'bg-slate-500'}`}>{ui.statusLabel}</span>
          </div>
          <p className="line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-slate-600">{ui.description}</p>
          <PublicInfoGrid
            className="mt-5"
            columns={2}
            items={[
              { label: 'Inicio', value: ui.availabilityLabel },
              { label: 'Sede', value: ui.campusLabel },
            ]}
          />
          <div className="mt-auto flex justify-start pt-5">
            <PublicCardCta>{ui.isTeleformacion ? 'Empezar ahora' : 'Ver curso'}</PublicCardCta>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export function CoursePublicListItem({
  course,
  compact = false,
}: {
  course: PublicCourseCardData
  compact?: boolean
}) {
  const ui = getPublicCourseUi(course)
  const typeColor = course.studyTypeColor || '#f2014b'

  if (compact) {
    const href = course.enrollmentStatus === 'open' && course.nextRun?.href ? course.nextRun.href : `/p/cursos/${course.slug}`
    const accentColor = course.areaColor || typeColor
    return (
      <div className="group grid gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm transition hover:border-rose-200 hover:bg-rose-50/35 hover:shadow-md sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <Link href={href} className="min-w-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400">
            <div className="flex min-w-0 items-center gap-3">
              <span className="h-10 w-14 shrink-0 overflow-hidden rounded-lg border-2 bg-slate-100" style={{ borderColor: accentColor }}>
                <img src={ui.imageUrl} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
              </span>
              <h3 className="min-w-0 flex-1 truncate text-sm font-black leading-6 text-slate-950 sm:text-base">
                {course.nombre}
              </h3>
            </div>
          </Link>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <span className={`inline-flex w-fit items-center justify-center rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-wide text-white ${ui.isOpen ? 'bg-green-600' : 'bg-slate-500'}`}>
              {ui.statusLabel}
            </span>
            {ui.isOpen ? (
              <span className="inline-flex w-fit items-center justify-center rounded-full bg-rose-50 px-3 py-1.5 text-[11px] font-black text-rose-700 ring-1 ring-inset ring-rose-200">
                Inicio {ui.availabilityLabel}
              </span>
            ) : null}
            {ui.campusHref ? (
              <Link
                href={ui.campusHref}
                aria-label={`Abrir ${ui.campusLabel}`}
                className="inline-flex h-7 w-44 shrink-0 items-center justify-center truncate rounded-full bg-slate-100 px-3 text-[11px] font-bold uppercase tracking-wide text-slate-700 ring-1 ring-inset ring-slate-200 transition hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                title={ui.campusLabel}
              >
                {ui.campusLabel}
              </Link>
            ) : (
              <span className="inline-flex h-7 w-44 shrink-0 items-center justify-center truncate rounded-full bg-slate-100 px-3 text-[11px] font-bold uppercase tracking-wide text-slate-700 ring-1 ring-inset ring-slate-200" title={ui.campusLabel}>
                {ui.campusLabel}
              </span>
            )}
            <Link href={href} className="inline-flex w-fit items-center justify-center rounded-full bg-[#f2014b] px-3 py-1.5 text-xs font-black text-white transition hover:bg-[#d0013f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400">
              Ver curso
            </Link>
          </div>
      </div>
    )
  }

  return (
    <Link href={`/p/cursos/${course.slug}`} className="group block">
      <Card className="grid overflow-hidden border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg sm:grid-cols-[220px_1fr]">
        <div className="relative h-44 sm:h-full">
          <img src={ui.imageUrl} alt={course.nombre} className="h-full w-full object-cover" />
          <span
            className="absolute left-4 top-4 inline-flex items-center rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-white shadow-sm"
            style={{ backgroundColor: typeColor }}
          >
            {course.studyTypeLabel}
          </span>
          {ui.isTeleformacion ? <PublicMediaBadge tone="success" className="absolute bottom-4 left-4">Empieza cuando quieras</PublicMediaBadge> : null}
        </div>
        <CardContent className="flex min-w-0 flex-col gap-4 p-5">
          <div className="grid gap-4 xl:grid-cols-[1fr_1.45fr]">
            <div className="min-w-0">
              <h3 className="line-clamp-2 text-xl font-black text-slate-950">{course.nombre}</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">Curso de formación profesional</p>
              {ui.isSubsidized ? <PublicMediaBadge tone="success" className="mt-3">Formación gratuita subvencionada</PublicMediaBadge> : null}
            </div>
            <PublicInfoRows
              items={[
                { label: 'Área', value: course.area || 'Formación' },
                { label: 'Modalidad', value: ui.modalityLabel },
                { label: 'Inicio', value: ui.availabilityLabel },
                { label: 'Sede', value: ui.campusLabel },
              ]}
            />
          </div>
          <div className="mt-auto flex justify-end pt-2">
            <PublicCardCta>Ver curso</PublicCardCta>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
