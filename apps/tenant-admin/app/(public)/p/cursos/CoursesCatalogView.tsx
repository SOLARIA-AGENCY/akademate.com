'use client'

import Link from 'next/link'
import { useState } from 'react'
import { LayoutGrid, List } from 'lucide-react'
import type { PublishedCourse, StudyTypeVisualMeta } from '@/app/lib/server/published-courses'

type CourseGroup = {
  key: string
  label: string
  description: string
  courses: PublishedCourse[]
}

type CoursesCatalogViewProps = {
  groups: CourseGroup[]
  visualMap: Record<string, StudyTypeVisualMeta>
  fallbackColor: string
}

function getCourseUi(course: PublishedCourse, visualMap: Record<string, StudyTypeVisualMeta>, fallbackColor: string) {
  const color = course.studyType ? visualMap[course.studyType]?.color || course.studyTypeColor || fallbackColor : course.studyTypeColor || fallbackColor
  const isTeleformacion = course.studyType === 'teleformacion'
  return {
    color,
    isTeleformacion,
    imageUrl: course.imagenPortada,
    availabilityLabel: isTeleformacion ? 'Inicio inmediato' : course.enrollmentLabel || 'Próximamente',
    campusLabel: isTeleformacion ? '100% online · desde casa' : course.nextRun?.campusLabel || 'Sede por confirmar',
    modalityLabel: isTeleformacion ? 'Online a tu ritmo' : course.modality === 'online' ? 'Online' : 'Presencial',
    description: isTeleformacion && !course.descripcion
      ? 'Formación online para avanzar a tu ritmo, con matrícula abierta permanente.'
      : course.descripcion || 'Curso de formación profesional',
  }
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
  return (
    <Link href={`/p/cursos/${course.slug}`} className="group h-full">
      <article className="flex h-full min-h-[560px] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
        <div className="relative h-48 shrink-0">
          <img src={ui.imageUrl} alt={course.nombre} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute left-4 top-4">
            <span className="inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold text-white" style={{ backgroundColor: ui.color }}>
              {course.studyTypeLabel}
            </span>
          </div>
          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="line-clamp-2 text-xl font-bold leading-tight text-white">{course.nombre}</h3>
          </div>
        </div>
        <div className="flex flex-1 flex-col p-5">
          <div className="mb-4 flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-wide">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">{course.area || 'Formación'}</span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">{ui.modalityLabel}</span>
          </div>
          <p className="line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-gray-600">{ui.description}</p>
          <div className="mt-5 grid gap-2 text-sm text-gray-700">
            <p><span className="font-semibold text-gray-950">Disponibilidad:</span> {ui.availabilityLabel}</p>
            <p><span className="font-semibold text-gray-950">Sede:</span> {ui.campusLabel}</p>
          </div>
          <span className="mt-auto inline-flex w-fit rounded-full bg-[#f2014b] px-4 py-2 text-sm font-black text-white transition group-hover:bg-[#d0013f]">
            {ui.isTeleformacion ? 'Empezar ahora' : 'Ver curso'} &rarr;
          </span>
        </div>
      </article>
    </Link>
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
  return (
    <Link href={`/p/cursos/${course.slug}`} className="group block">
      <article className="grid overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg sm:grid-cols-[220px_1fr]">
        <div className="relative h-44 sm:h-full">
          <img src={ui.imageUrl} alt={course.nombre} className="h-full w-full object-cover" />
          <span className="absolute left-4 top-4 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold text-white" style={{ backgroundColor: ui.color }}>
            {course.studyTypeLabel}
          </span>
        </div>
        <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h3 className="line-clamp-1 text-xl font-black text-slate-950">{course.nombre}</h3>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{ui.description}</p>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-700">
              <span><strong className="text-slate-950">Área:</strong> {course.area || 'Formación'}</span>
              <span><strong className="text-slate-950">Modalidad:</strong> {ui.modalityLabel}</span>
              <span><strong className="text-slate-950">Inicio:</strong> {ui.availabilityLabel}</span>
              <span><strong className="text-slate-950">Sede:</strong> {ui.campusLabel}</span>
            </div>
          </div>
          <span className="inline-flex shrink-0 rounded-full bg-[#f2014b] px-4 py-2 text-sm font-black text-white transition group-hover:bg-[#d0013f]">
            Ver curso &rarr;
          </span>
        </div>
      </article>
    </Link>
  )
}

export function CoursesCatalogView({ groups, visualMap, fallbackColor }: CoursesCatalogViewProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[#f2014b]">Tipo de vista</p>
          <p className="mt-1 text-sm text-slate-600">Elige cards visuales o lista compacta por curso.</p>
        </div>
        <div className="inline-flex w-fit rounded-full bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-black transition ${viewMode === 'grid' ? 'bg-[#f2014b] text-white' : 'text-slate-700 hover:bg-white'}`}
          >
            <LayoutGrid className="h-4 w-4" aria-hidden="true" />
            Cards
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-black transition ${viewMode === 'list' ? 'bg-[#f2014b] text-white' : 'text-slate-700 hover:bg-white'}`}
          >
            <List className="h-4 w-4" aria-hidden="true" />
            Lista
          </button>
        </div>
      </div>

      <div className="space-y-14">
        {groups.map((group) => (
          <section key={group.key} id={group.key} className="scroll-mt-28">
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#f2014b]">{group.courses.length} formaciones</p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">{group.label}</h2>
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
              <div className="grid gap-5">
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
