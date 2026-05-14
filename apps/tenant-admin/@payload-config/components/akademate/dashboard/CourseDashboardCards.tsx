'use client'

import { useState } from 'react'
import { CalendarDays, Clock, Monitor, Users } from 'lucide-react'
import { Badge } from '@payload-config/components/ui/badge'
import { Button } from '@payload-config/components/ui/button'
import { Card, CardContent } from '@payload-config/components/ui/card'
import { COURSE_TYPE_CONFIG } from '@payload-config/lib/courseTypeConfig'
import { getPublicStudyTypeFallbackImage, toDashboardStudyType } from '@/app/lib/website/study-types'
import type { PlantillaCurso } from '@/types'

interface CourseDashboardCardProps {
  course: PlantillaCurso
  onClick?: () => void
  className?: string
}

function getCourseDashboardUi(course: PlantillaCurso) {
  const type = toDashboardStudyType(course.tipo)
  const typeConfig = COURSE_TYPE_CONFIG[type] || COURSE_TYPE_CONFIG.privados
  const fallbackImage = getPublicStudyTypeFallbackImage(type)
  const description = course.descripcion?.trim() || 'Curso pendiente de completar con informacion editorial.'
  const modality = (course as PlantillaCurso & { modality?: string }).modality || 'presencial'
  const modalityLabel =
    modality === 'online' ? 'Online' : modality === 'semipresencial' ? 'Semipresencial' : 'Presencial'

  return { typeConfig, fallbackImage, description, modalityLabel }
}

export function CourseDashboardCard({ course, onClick, className }: CourseDashboardCardProps) {
  const { typeConfig, fallbackImage, description, modalityLabel } = getCourseDashboardUi(course)
  const [imgError, setImgError] = useState(false)

  return (
    <Card
      className={`h-full cursor-pointer overflow-hidden border-border/70 bg-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${className || ''}`}
      onClick={onClick}
    >
      <div className="grid h-full min-h-[230px] grid-cols-[150px_1fr] gap-0 sm:grid-cols-[190px_1fr]">
        <div className="relative h-full min-h-[230px] overflow-hidden bg-muted">
          {!imgError ? (
            <img
              src={course.imagenPortada || fallbackImage}
              alt={course.nombre}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 hover:scale-105"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-primary/5">
              <img src="/icon-libro.svg" alt="" aria-hidden="true" className="h-12 w-12 opacity-30" />
            </div>
          )}
        </div>

        <CardContent className="flex min-w-0 flex-col gap-3 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={`${typeConfig.bgColor} ${typeConfig.hoverColor} text-[11px] font-semibold text-white`}>
              {typeConfig.label}
            </Badge>
            <Badge variant="outline" className="max-w-full truncate text-[11px]">
              {course.area || 'Sin area'}
            </Badge>
          </div>

          <h3 className="line-clamp-2 text-base font-extrabold uppercase leading-snug tracking-wide text-foreground" title={course.nombre}>
            {course.nombre}
          </h3>

          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{description}</p>

          <div className="grid grid-cols-2 gap-2 border-t pt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="font-semibold text-foreground">
                {course.duracionReferencia ? `${course.duracionReferencia} h` : 'Duracion pendiente'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="font-semibold text-foreground">
                {course.totalConvocatorias} {course.totalConvocatorias === 1 ? 'convocatoria' : 'convocatorias'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Monitor className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="font-semibold text-foreground">{modalityLabel}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="font-semibold text-foreground">Grupos reducidos</span>
            </div>
          </div>

          <Button
            className="mt-auto w-full bg-[#f2014b] text-white hover:bg-[#d80143] hover:text-white"
            onClick={(event) => {
              event.stopPropagation()
              onClick?.()
            }}
          >
            Abrir curso
          </Button>
        </CardContent>
      </div>
    </Card>
  )
}

export function CourseDashboardListItem({ course, onClick, className }: CourseDashboardCardProps) {
  const { typeConfig, fallbackImage } = getCourseDashboardUi(course)
  const [imgError, setImgError] = useState(false)

  return (
    <div
      className={`flex cursor-pointer items-center gap-4 rounded-lg border bg-card px-4 py-3 transition-shadow hover:shadow-sm ${className || ''}`}
      onClick={onClick}
    >
      <div className="h-16 w-24 shrink-0 overflow-hidden rounded bg-muted">
        {!imgError ? (
          <img
            src={course.imagenPortada || fallbackImage}
            alt={course.nombre}
            className="h-full w-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-primary/5">
            <img src="/icon-libro.svg" alt="" aria-hidden="true" className="h-8 w-8 opacity-30" />
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="mb-1 truncate text-sm font-extrabold uppercase leading-tight tracking-wide" title={course.nombre}>
            {course.nombre}
          </h3>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[11px]">
              {course.area}
            </Badge>
            <Badge className={`${typeConfig.bgColor} ${typeConfig.hoverColor} text-[11px] text-white`}>
              {typeConfig.label}
            </Badge>
          </div>
        </div>

        <div className="hidden items-center gap-5 text-sm md:flex">
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{course.duracionReferencia ? `${course.duracionReferencia} h` : 'Pendiente'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">
              {course.totalConvocatorias} {course.totalConvocatorias === 1 ? 'convocatoria' : 'convocatorias'}
            </span>
          </div>
        </div>

        <Button
          size="sm"
          className="h-8 shrink-0 bg-[#f2014b] px-3 text-xs text-white hover:bg-[#d80143] hover:text-white"
          onClick={(event) => {
            event.stopPropagation()
            onClick?.()
          }}
        >
          Abrir
        </Button>
      </div>
    </div>
  )
}
