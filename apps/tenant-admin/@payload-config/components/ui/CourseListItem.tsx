'use client'

import { useState } from 'react'
import { Badge } from '@payload-config/components/ui/badge'
import { Button } from '@payload-config/components/ui/button'
import { CalendarDays, Clock } from 'lucide-react'
import { COURSE_TYPE_CONFIG } from '@payload-config/lib/courseTypeConfig'
import { getPublicStudyTypeFallbackImage, toDashboardStudyType } from '@/app/lib/website/study-types'
import type { PlantillaCurso } from '@/types'

interface CourseListItemProps {
  course: PlantillaCurso
  onClick?: () => void
  className?: string
}

export function CourseListItem({ course, onClick, className }: CourseListItemProps) {
  const typeConfig = COURSE_TYPE_CONFIG[course.tipo] || COURSE_TYPE_CONFIG.privados
  const fallbackImage = getPublicStudyTypeFallbackImage(toDashboardStudyType(course.tipo))
  const [imgError, setImgError] = useState(false)

  return (
    <div
      className={`flex items-center gap-4 rounded-lg border bg-card px-4 py-3 transition-shadow hover:shadow-sm cursor-pointer ${className || ''}`}
      onClick={onClick}
      data-oid="bfba_ve"
    >
      <div className="h-16 w-24 flex-shrink-0 overflow-hidden rounded bg-muted" data-oid="__da7mf">
        {!imgError ? (
          <img
            src={course.imagenPortada || fallbackImage}
            alt={course.nombre}
            className="h-full w-full object-cover"
            onError={() => setImgError(true)}
            data-oid="wwyrlfw"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-primary/5">
            <img
              src="/icon-libro.svg"
              alt=""
              aria-hidden="true"
              className="h-8 w-8 opacity-30"
            />
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-4" data-oid="ku49jm4">
        <div className="min-w-0 flex-1" data-oid="2.vkthd">
          <h3
            className="mb-1 truncate text-sm font-extrabold uppercase tracking-wide leading-tight"
            title={course.nombre}
            data-oid=".22tcmh"
          >
            {course.nombre}
          </h3>
          <div className="flex items-center gap-2" data-oid="royfh3h">
            <Badge variant="outline" className="text-[11px]" data-oid="ggfknjb">
              {course.area}
            </Badge>
            <Badge
              className={`${typeConfig.bgColor} ${typeConfig.hoverColor} text-white text-[11px]`}
              data-oid=":y7r6uz"
            >
              {typeConfig.label}
            </Badge>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-5 text-sm" data-oid="g.oqgk7">
          <div className="flex items-center gap-1.5" data-oid="3w1ar4y">
            <Clock className="h-4 w-4 text-muted-foreground" data-oid=".z32xno" />
            <span className="font-medium" data-oid="t7.uut_">
              {course.duracionReferencia ? `${course.duracionReferencia} h` : 'Pendiente'}
            </span>
          </div>
          <div className="flex items-center gap-1.5" data-oid="sa8jbtd">
            <CalendarDays className="h-4 w-4 text-muted-foreground" data-oid="97xktqx" />
            <span className="font-medium" data-oid="4w4-k36">
              {course.totalConvocatorias} {course.totalConvocatorias === 1 ? 'convocatoria' : 'convocatorias'}
            </span>
          </div>
        </div>

        <Button
          size="sm"
          className="h-8 shrink-0 bg-[#f2014b] px-3 text-xs text-white hover:bg-[#d80143] hover:text-white"
          onClick={(e) => {
            e.stopPropagation()
            onClick?.()
          }}
          data-oid="1m:bi7k"
        >
          Abrir
        </Button>
      </div>
    </div>
  )
}
