'use client'

import Link from 'next/link'
import { useState } from 'react'
import { LayoutGrid, List } from 'lucide-react'
import type { PublishedCourse, StudyTypeVisualMeta } from '@/app/lib/server/published-courses'
import {
  PublicCardCta,
  PublicInfoGrid,
  PublicMediaBadge,
} from '../../_components/PublicShadcnPrimitives'
import { Card, CardContent } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'

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

function getCourseUi(course: PublishedCourse, visualMap: Record<string, StudyTypeVisualMeta>, fallbackColor: string) {
  const isTeleformacion = course.studyType === 'teleformacion'
  const isSubsidized = course.studyType === 'ocupados' || course.studyType === 'desempleados'
  return {
    isTeleformacion,
    isSubsidized,
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
      <Card className="flex h-full min-h-[560px] flex-col overflow-hidden border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
        <div className="relative h-48 shrink-0">
          <img src={ui.imageUrl} alt={course.nombre} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute left-4 top-4">
            <PublicMediaBadge tone={ui.isTeleformacion ? 'warning' : ui.isSubsidized ? 'success' : 'primary'}>
              {course.studyTypeLabel}
            </PublicMediaBadge>
          </div>
          {ui.isTeleformacion ? (
            <div className="absolute right-4 top-4">
              <PublicMediaBadge tone="success">Empieza cuando quieras</PublicMediaBadge>
            </div>
          ) : null}
          {ui.isSubsidized ? (
            <div className="absolute right-4 top-4">
              <PublicMediaBadge tone="success">Formación gratuita</PublicMediaBadge>
            </div>
          ) : null}
          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="line-clamp-2 text-xl font-bold leading-tight text-white">{course.nombre}</h3>
          </div>
        </div>
        <CardContent className="flex flex-1 flex-col p-5">
          <div className="mb-4 flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-wide">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">{course.area || 'Formación'}</span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">{ui.modalityLabel}</span>
          </div>
          <p className="line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-gray-600">{ui.description}</p>
          <PublicInfoGrid
            className="mt-5"
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
      <Card className="grid overflow-hidden border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg sm:grid-cols-[220px_1fr]">
        <div className="relative h-44 sm:h-full">
          <img src={ui.imageUrl} alt={course.nombre} className="h-full w-full object-cover" />
          <PublicMediaBadge
            tone={ui.isTeleformacion ? 'warning' : ui.isSubsidized ? 'success' : 'primary'}
            className="absolute left-4 top-4"
          >
            {course.studyTypeLabel}
          </PublicMediaBadge>
          {ui.isTeleformacion ? (
            <PublicMediaBadge tone="success" className="absolute bottom-4 left-4">
              Empieza cuando quieras
            </PublicMediaBadge>
          ) : null}
        </div>
        <CardContent className="flex min-w-0 flex-col gap-4 p-5">
          <div className="grid gap-4 xl:grid-cols-[1fr_1.45fr]">
            <div className="min-w-0">
              <h3 className="line-clamp-2 text-xl font-black text-slate-950">{course.nombre}</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">Curso de formación profesional</p>
              {ui.isSubsidized ? (
                <PublicMediaBadge tone="success" className="mt-3">
                  Formación gratuita subvencionada
                </PublicMediaBadge>
              ) : null}
            </div>
            <PublicInfoGrid
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

export function CoursesCatalogView({
  groups,
  visualMap,
  fallbackColor,
  defaultViewMode = 'grid',
  hideViewToggle = false,
}: CoursesCatalogViewProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(defaultViewMode)

  return (
    <div>
      {!hideViewToggle ? <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[#f2014b]">Tipo de vista</p>
          <p className="mt-1 text-sm text-slate-600">Elige cards visuales o lista compacta por curso.</p>
        </div>
        <div className="inline-flex w-fit rounded-full bg-slate-100 p-1">
          <Button
            type="button"
            onClick={() => setViewMode('grid')}
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            className={`rounded-full font-black ${viewMode === 'grid' ? 'bg-[#f2014b] text-white hover:bg-[#d0013f]' : 'text-slate-700 hover:bg-white'}`}
          >
            <LayoutGrid data-icon="inline-start" aria-hidden="true" />
            Cards
          </Button>
          <Button
            type="button"
            onClick={() => setViewMode('list')}
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            className={`rounded-full font-black ${viewMode === 'list' ? 'bg-[#f2014b] text-white hover:bg-[#d0013f]' : 'text-slate-700 hover:bg-white'}`}
          >
            <List data-icon="inline-start" aria-hidden="true" />
            Lista
          </Button>
        </div>
      </div> : null}

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
