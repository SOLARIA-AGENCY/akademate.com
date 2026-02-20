'use client'

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

  return (
    <div
      className={`flex items-center gap-4 rounded-lg border bg-card px-4 py-3 transition-shadow hover:shadow-sm cursor-pointer ${className || ''}`}
      onClick={onClick}
    >
      <div className="h-16 w-24 flex-shrink-0 overflow-hidden rounded bg-muted">
        <img
          src={course.imagenPortada}
          alt={course.nombre}
          className="h-full w-full object-cover"
        />
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="mb-1 truncate text-sm font-semibold leading-tight" title={course.nombre}>
            {course.nombre}
          </h3>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[11px]">
              {course.area}
            </Badge>
            <Badge className={`${typeConfig.bgColor} ${typeConfig.hoverColor} text-white text-[11px]`}>
              {typeConfig.label}
            </Badge>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-5 text-sm">
          <div className="flex items-center gap-1.5">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{course.duracionReferencia} h</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">
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
        >
          Abrir
        </Button>
      </div>
    </div>
  )
}
