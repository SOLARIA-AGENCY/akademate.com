'use client'

import Link from 'next/link'
import { Card, CardContent } from '@payload-config/components/ui/card'
import { PublicCardCta } from './PublicCardCta'
import { PublicInfoGrid, PublicInfoRows } from './PublicInfo'
import { PublicMediaBadge } from './PublicBadges'

export interface PublicCourseCardData {
  id: string | number
  slug: string
  nombre: string
  area?: string | null
  studyType?: string | null
  studyTypeLabel: string
  modality?: string | null
  descripcion?: string | null
  enrollmentLabel?: string | null
  imagenPortada: string
  nextRun?: { campusLabel?: string | null } | null
}

export function getPublicCourseUi(course: PublicCourseCardData) {
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

export function CoursePublicCard({ course }: { course: PublicCourseCardData }) {
  const ui = getPublicCourseUi(course)
  return (
    <Link href={`/p/cursos/${course.slug}`} className="group h-full">
      <Card className="flex h-full min-h-[560px] flex-col overflow-hidden border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
        <div className="relative h-48 shrink-0">
          <img src={ui.imageUrl} alt={course.nombre} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <PublicMediaBadge tone={ui.isTeleformacion ? 'warning' : ui.isSubsidized ? 'success' : 'primary'} className="absolute left-4 top-4">
            {course.studyTypeLabel}
          </PublicMediaBadge>
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

export function CoursePublicListItem({ course }: { course: PublicCourseCardData }) {
  const ui = getPublicCourseUi(course)
  return (
    <Link href={`/p/cursos/${course.slug}`} className="group block">
      <Card className="grid overflow-hidden border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg sm:grid-cols-[220px_1fr]">
        <div className="relative h-44 sm:h-full">
          <img src={ui.imageUrl} alt={course.nombre} className="h-full w-full object-cover" />
          <PublicMediaBadge tone={ui.isTeleformacion ? 'warning' : ui.isSubsidized ? 'success' : 'primary'} className="absolute left-4 top-4">
            {course.studyTypeLabel}
          </PublicMediaBadge>
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
