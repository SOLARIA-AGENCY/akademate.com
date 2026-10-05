'use client'

import Link from 'next/link'
import { useState } from 'react'
import { LayoutGrid, List } from 'lucide-react'
import type { PublishedCourse, StudyTypeVisualMeta } from '@/app/lib/server/published-courses'
import { displayCourseTitle } from '../../_components/course-title'
import { campusPublicHref, displayCampusName } from '@/app/lib/public-campus-name'

export type CourseGroup = {
  key: string
  label: string
  description: string
  courses: PublishedCourse[]
}

type CoursesCatalogViewProps = {
  groups: CourseGroup[]
  visualMap: Record<string, StudyTypeVisualMeta>
  fallbackColor: string
  defaultViewMode?: 'grid' | 'list'
  hideViewToggle?: boolean
}

function formatCourseStart(iso: string | null | undefined): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}

function cleanArea(value: string | null | undefined): string {
  const text = String(value || '').replace(/^Área\s+/i, '').trim()
  if (!text || /^sin área$/i.test(text)) return ''
  return text
}

function isMissingFact(value: string | null | undefined): boolean {
  const text = String(value || '').trim()
  return !text || /^por confirmar$/i.test(text) || text === '-'
}

function getCourseUi(course: PublishedCourse, visualMap: Record<string, StudyTypeVisualMeta>, fallbackColor: string) {
  const color = course.studyType ? visualMap[course.studyType]?.color || course.studyTypeColor || fallbackColor : course.studyTypeColor || fallbackColor
  const isTeleformacion = course.studyType === 'teleformacion'
  const isSubsidized = course.studyType === 'ocupados' || course.studyType === 'desempleados'
  const closed = course.enrollmentStatus === 'closed'
  const open = course.enrollmentStatus === 'open'
  const dummyDescription = !course.descripcion || course.descripcion === 'Curso de formación profesional'
  return {
    color,
    isTeleformacion,
    isSubsidized,
    open,
    closed,
    imageUrl: course.imagenPortada,
    badgeLabel: closed ? 'Matrícula cerrada' : open ? 'Matrícula abierta' : 'Próximamente',
    badgeColor: open
      ? course.studyType === 'desempleados'
        ? '#1d4ed8'
        : course.studyType === 'ocupados'
          ? '#16a34a'
          : course.studyType === 'teleformacion'
            ? '#f97316'
            : '#f2014b'
      : '#64748b',
    areaLabel: cleanArea(course.area),
    campusLabel: isTeleformacion ? 'Online' : displayCampusName(course.nextRun?.campusLabel) || '',
    modalityLabel: isTeleformacion ? 'Online' : course.modality === 'online' ? 'Online' : 'Presencial',
    startLabel: isTeleformacion ? 'Inicio inmediato' : formatCourseStart(course.nextRun?.startDate),
    description: dummyDescription ? '' : course.descripcion,
  }
}

function CampusValue({ label, href }: { label: string; href: string }) {
  if (!href) return <>{label}</>
  return (
    <Link href={href} className="relative z-10 text-inherit hover:text-[#f2014b] hover:underline">
      {label}
    </Link>
  )
}

function CourseGridCard({
  course,
  visualMap,
  fallbackColor,
}: {
  course: PublishedCourse
  visualMap: Record<string, StudyTypeVisualMeta>
  fallbackColor: string
}) {
  const ui = getCourseUi(course, visualMap, fallbackColor)
  const title = displayCourseTitle(course.nombre) || course.nombre
  const campusHref = campusPublicHref(ui.campusLabel)
  return (
    <article className={`relative flex h-full flex-col overflow-hidden rounded-2xl border ${ui.open ? 'border-emerald-200 bg-[#ecfdf5]' : 'border-gray-200 bg-white'}`}>
      <Link href={`/p/cursos/${course.slug}`} className="absolute inset-0 z-0" aria-label={title} />
      <div className="relative h-48 shrink-0 bg-slate-100">
        <img src={ui.imageUrl} alt={title} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <span className="absolute right-4 top-4 rounded-full px-2.5 py-1 text-[11px] font-semibold text-white" style={{ backgroundColor: ui.badgeColor }}>
          {ui.badgeLabel}
        </span>
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="line-clamp-2 min-h-[2.6em] text-xl font-semibold leading-tight text-white">{title}</h3>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        {ui.description ? (
          <p className="line-clamp-2 min-h-[3rem] text-sm leading-6 text-gray-600">{ui.description}</p>
        ) : (
          <div className="min-h-[3rem]" aria-hidden="true" />
        )}
        <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          {!isMissingFact(ui.areaLabel) ? (
            <div>
              <dt className="text-xs font-semibold text-slate-500">Área</dt>
              <dd className="mt-0.5 truncate font-semibold text-slate-950">{ui.areaLabel}</dd>
            </div>
          ) : null}
          <div>
            <dt className="text-xs font-semibold text-slate-500">Modalidad</dt>
            <dd className="mt-0.5 truncate font-semibold text-slate-950">{ui.modalityLabel}</dd>
          </div>
          {!isMissingFact(ui.startLabel) ? (
            <div>
              <dt className="text-xs font-semibold text-slate-500">Inicio</dt>
              <dd className="mt-0.5 truncate font-semibold text-slate-950">{ui.startLabel}</dd>
            </div>
          ) : null}
          {!isMissingFact(ui.campusLabel) ? (
            <div>
              <dt className="text-xs font-semibold text-slate-500">Sede</dt>
              <dd className="mt-0.5 truncate font-semibold text-slate-950">
                <CampusValue label={ui.campusLabel} href={campusHref} />
              </dd>
            </div>
          ) : null}
        </dl>
        <span className="mt-auto inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#f2014b] px-4 text-sm font-semibold text-white">
          {ui.isTeleformacion ? 'Empezar ahora' : 'Ver curso'}
        </span>
      </div>
    </article>
  )
}

function Fact({ label, value, href }: { label: string; value: string; href?: string }) {
  if (isMissingFact(value)) return null
  return (
    <div className="min-h-11 min-w-0">
      <p className="truncate text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-0.5 truncate text-sm font-semibold text-slate-950">
        {href ? <CampusValue label={value} href={href} /> : value}
      </p>
    </div>
  )
}

function CourseListCard({
  course,
  visualMap,
  fallbackColor,
}: {
  course: PublishedCourse
  visualMap: Record<string, StudyTypeVisualMeta>
  fallbackColor: string
}) {
  const ui = getCourseUi(course, visualMap, fallbackColor)
  const title = displayCourseTitle(course.nombre) || course.nombre
  const campusHref = campusPublicHref(ui.campusLabel)
  return (
    <article className={`cep-course-row relative grid min-h-[13.75rem] overflow-hidden rounded-2xl border text-inherit no-underline md:grid-cols-[18rem_minmax(0,1fr)] ${ui.open ? 'border-emerald-200 bg-[#ecfdf5]' : 'border-gray-200 bg-white'}`}>
      <Link href={`/p/cursos/${course.slug}`} className="absolute inset-0 z-0" aria-label={title} />
      <div className="relative min-h-44 bg-slate-100 md:min-h-[13.75rem]">
        <img src={ui.imageUrl} alt={title} className="h-full w-full object-cover" />
      </div>
      <div className="relative flex min-w-0 flex-col px-5 py-5 md:px-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 min-h-[2.6em] text-xl font-semibold leading-tight text-slate-950">{title}</h3>
          <span className="shrink-0 rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ backgroundColor: ui.badgeColor }}>
            {ui.badgeLabel}
          </span>
        </div>
        {ui.description ? (
          <p className="mb-4 line-clamp-2 text-sm leading-6 text-slate-600">{ui.description}</p>
        ) : null}
        <div className="grid flex-1 grid-cols-2 items-end gap-x-4 gap-y-3 md:grid-cols-3">
          <Fact label="Área" value={ui.areaLabel} />
          <Fact label="Modalidad" value={ui.modalityLabel} />
          <Fact label="Inicio" value={ui.startLabel} />
          <Fact label="Sede" value={ui.campusLabel} href={campusHref} />
          <div className="hidden min-h-11 md:block" aria-hidden="true" />
          <div className="col-span-2 flex items-end md:col-span-1">
            <span className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#f2014b] text-sm font-semibold text-white">
              Ver curso
            </span>
          </div>
        </div>
      </div>
    </article>
  )
}

export function CoursesCatalogView({
  groups,
  visualMap,
  fallbackColor,
  defaultViewMode = 'list',
  hideViewToggle = false,
}: CoursesCatalogViewProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(defaultViewMode)

  return (
    <div>
      {!hideViewToggle ? (
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <div className="inline-flex w-fit rounded-full bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${viewMode === 'list' ? 'bg-[#f2014b] text-white' : 'text-slate-700 hover:bg-white'}`}
            >
              <List className="h-4 w-4" aria-hidden="true" />
              Lista
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${viewMode === 'grid' ? 'bg-[#f2014b] text-white' : 'text-slate-700 hover:bg-white'}`}
            >
              <LayoutGrid className="h-4 w-4" aria-hidden="true" />
              Cuadrícula
            </button>
          </div>
        </div>
      ) : null}

      <div className="space-y-14">
        {groups.map((group) => (
          <section key={group.key} id={group.key} className="scroll-mt-28">
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold text-[#f2014b]">{group.courses.length} formaciones</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{group.label}</h2>
                <p className="mt-2 max-w-3xl text-base leading-7 text-slate-600">{group.description}</p>
              </div>
            </div>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                {group.courses.map((course) => (
                  <CourseGridCard key={course.id} course={course} visualMap={visualMap} fallbackColor={fallbackColor} />
                ))}
              </div>
            ) : (
              <div className="grid gap-5" data-cep-course-list="catalog">
                {group.courses.map((course) => (
                  <CourseListCard key={course.id} course={course} visualMap={visualMap} fallbackColor={fallbackColor} />
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  )
}
