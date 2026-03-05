'use client'

import { useState } from 'react'
import { Badge } from '@payload-config/components/ui/badge'
import { Button } from '@payload-config/components/ui/button'
import { BookOpen, MapPin } from 'lucide-react'
import { COURSE_TYPE_CONFIG } from '@payload-config/lib/courseTypeConfig'
import type { PlantillaCurso } from '@/types'

interface CourseListItemProps {
  course: PlantillaCurso
  onClick?: () => void
  className?: string
}

export function CourseListItem({ course, onClick, className }: CourseListItemProps) {
  const typeConfig = COURSE_TYPE_CONFIG[course.tipo] || COURSE_TYPE_CONFIG.privados
  const [imgError, setImgError] = useState(false)

  return (
    <div
      className={`flex items-center gap-4 rounded-lg border bg-card px-4 py-3 transition-shadow hover:shadow-sm cursor-pointer ${className || ''}`}
      onClick={onClick}
      data-oid="bfba_ve"
    >
      <div className="h-16 w-24 flex-shrink-0 overflow-hidden rounded bg-muted" data-oid="__da7mf">
        {course.imagenPortada && !imgError ? (
          <img
            src={course.imagenPortada}
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
            className="mb-1 truncate text-sm font-semibold leading-tight"
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
            <BookOpen className="h-4 w-4 text-muted-foreground" data-oid=".z32xno" />
            <span className="font-medium" data-oid="t7.uut_">
              {course.duracionReferencia} h
            </span>
          </div>
          <div className="flex items-center gap-1.5" data-oid="sa8jbtd">
            <MapPin className="h-4 w-4 text-muted-foreground" data-oid="97xktqx" />
            <span className="font-medium" data-oid="4w4-k36">
              {course.totalConvocatorias} {course.totalConvocatorias === 1 ? 'sede' : 'sedes'}
            </span>
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          className="h-8 shrink-0 px-3 text-xs"
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
