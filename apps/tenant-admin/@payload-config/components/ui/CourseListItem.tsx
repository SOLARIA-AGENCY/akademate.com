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
      className={`flex items-center h-24 px-6 bg-card rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-150 cursor-pointer ${className || ''}`}
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div className="flex-shrink-0 h-16 w-24 rounded overflow-hidden" style={{ backgroundColor: '#f5f5f5' }}>
        <img
          src={course.imagenPortada}
          alt={course.nombre}
          className="h-full w-full object-cover"
        />
      </div>

      {/* Contenido con padding interno */}
      <div className="flex items-center flex-1 gap-8 pl-6">
        {/* Title + Area */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm truncate leading-tight mb-1 uppercase" title={course.nombre}>
            {course.nombre}
          </h3>
          <Badge variant="outline" className="text-xs uppercase">
            {course.area}
          </Badge>
        </div>

        {/* Info Fields - Con más separación */}
        <div className="hidden sm:flex items-center gap-6 text-sm">
          <div className="flex flex-col items-center gap-1">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">{course.duracionReferencia}H</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">
              {course.totalConvocatorias} {course.totalConvocatorias === 1 ? 'sede' : 'sedes'}
            </span>
          </div>
        </div>

        {/* Type Badge */}
        <div className="hidden lg:flex items-center justify-center min-w-[140px]">
          <Badge
            className={`${typeConfig.bgColor} ${typeConfig.hoverColor} text-white text-xs font-bold uppercase tracking-wide px-3 py-1`}
          >
            {typeConfig.label}
          </Badge>
        </div>

        {/* Price + Convocations */}
        <div className="hidden md:flex flex-col gap-1 min-w-[140px] items-end">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Precio:</span>
            {course.precioReferencia !== undefined && course.precioReferencia > 0 ? (
              <span className={`font-bold text-lg ${typeConfig.textColor}`}>
                {course.precioReferencia}€
              </span>
            ) : (
              <span className="font-bold text-lg text-green-600">
                {course.porcentajeSubvencion || 100}% SUBV.
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Convocatorias:</span>
            <span className="font-bold text-sm">{course.totalConvocatorias}</span>
          </div>
        </div>

        {/* Action Button */}
        <Button
          size="sm"
          className={`${typeConfig.bgColor} ${typeConfig.hoverColor} text-white text-xs font-bold uppercase tracking-wide shrink-0 h-8 px-4`}
          onClick={(e) => {
            e.stopPropagation()
            onClick?.()
          }}
        >
          VER CURSO
        </Button>
      </div>
    </div>
  )
}
