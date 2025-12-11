'use client'

import { Card, CardContent } from '@payload-config/components/ui/card'
import { Badge } from '@payload-config/components/ui/badge'
import { Button } from '@payload-config/components/ui/button'
import { MapPin, BookOpen } from 'lucide-react'
import { COURSE_TYPE_CONFIG } from '@payload-config/lib/courseTypeConfig'
import type { PlantillaCurso } from '@/types'

interface CourseTemplateCardProps {
  template: PlantillaCurso
  onClick?: () => void
  onGenerateConvocation?: () => void
  className?: string
}

export function CourseTemplateCard({
  template,
  onClick,
  onGenerateConvocation,
  className,
}: CourseTemplateCardProps) {
  const typeConfig = COURSE_TYPE_CONFIG[template.tipo] || COURSE_TYPE_CONFIG.privados

  return (
    <Card
      className={`course-template-card cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden bg-card ${className || ''}`}
      onClick={onClick}
    >
      {/* Course Image */}
      <div className="relative h-48 overflow-hidden" style={{ backgroundColor: '#f5f5f5' }}>
        <img
          src={template.imagenPortada}
          alt={template.nombre}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 right-3">
          <Badge
            className={`${typeConfig.bgColor} ${typeConfig.hoverColor} text-white text-xs font-bold uppercase tracking-wide shadow-md`}
          >
            {typeConfig.label}
          </Badge>
        </div>
      </div>

      <CardContent className="p-6 space-y-3 flex flex-col bg-card">
        {/* Area Badge */}
        <Badge variant="outline" className="w-fit text-xs uppercase">
          {template.area}
        </Badge>

        {/* Title - 2 lines max */}
        <div className="min-h-[3.5rem]">
          <h3
            className="font-bold text-lg leading-7 uppercase line-clamp-2"
            title={template.nombre}
          >
            {template.nombre}
          </h3>
        </div>

        {/* Description - 3 lines max */}
        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed min-h-[4rem]">
          {template.descripcion}
        </p>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-2 py-3 border-t">
          <div className="flex items-center gap-2 text-sm">
            <BookOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="font-medium text-sm">{template.duracionReferencia}H</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="font-medium text-sm whitespace-nowrap">
              {template.totalConvocatorias}{' '}
              {template.totalConvocatorias === 1 ? 'sede' : 'sedes'}
            </span>
          </div>
        </div>

        {/* Price and Convocations */}
        <div className="py-3 border-t">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Precio:</span>
              {template.precioReferencia !== undefined && template.precioReferencia > 0 ? (
                <span className={`font-bold text-base ${typeConfig.textColor}`}>
                  {template.precioReferencia}€
                </span>
              ) : (
                <span className="font-bold text-sm text-green-600 whitespace-nowrap">
                  {template.porcentajeSubvencion || 100}% SUBV.
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Convocatorias:</span>
              <span className="font-bold text-sm">{template.totalConvocatorias}</span>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <Button
          className={`w-full ${typeConfig.bgColor} ${typeConfig.hoverColor} text-white font-bold uppercase tracking-wide shadow-md transition-all duration-300 mt-auto`}
          onClick={(e) => {
            e.stopPropagation()
            onClick?.()
          }}
        >
          Ver Curso
        </Button>
      </CardContent>
    </Card>
  )
}
