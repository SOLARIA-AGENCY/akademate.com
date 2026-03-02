'use client'

import { useState } from 'react'
import { Card, CardContent } from '@payload-config/components/ui/card'
import { Badge } from '@payload-config/components/ui/badge'
import { Button } from '@payload-config/components/ui/button'
import { MapPin, BookOpen } from 'lucide-react'
import { COURSE_TYPE_CONFIG } from '@payload-config/lib/courseTypeConfig'
import type { PlantillaCurso } from '@/types'

function toTitleCase(str: string): string {
  if (!str) return str
  return str.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase())
}

interface CourseTemplateCardProps {
  template: PlantillaCurso
  onClick?: () => void
  onGenerateConvocation?: () => void
  className?: string
}

export function CourseTemplateCard({
  template,
  onClick,
  className,
}: CourseTemplateCardProps) {
  const typeConfig = COURSE_TYPE_CONFIG[template.tipo] || COURSE_TYPE_CONFIG.privados
  const [imgError, setImgError] = useState(false)

  return (
    <Card
      className={`course-template-card cursor-pointer overflow-hidden border-border/70 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${className || ''}`}
      onClick={onClick}
    >
      {/* Course Image */}
      <div className="relative h-40 overflow-hidden bg-muted">
        {template.imagenPortada && !imgError ? (
          <img
            src={template.imagenPortada}
            alt={template.nombre}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 via-muted to-muted/60">
            <BookOpen className="h-12 w-12 text-primary/25" />
          </div>
        )}
        <div className="absolute left-3 top-3">
          <Badge
            className={`${typeConfig.bgColor} ${typeConfig.hoverColor} text-white text-[11px] font-semibold`}
          >
            {typeConfig.label}
          </Badge>
        </div>
      </div>

      <CardContent className="flex flex-col gap-3 p-4 bg-card">
        <div className="flex flex-col gap-1">
          <h3 className="line-clamp-2 text-base font-semibold leading-snug" title={template.nombre}>
            {toTitleCase(template.nombre)}
          </h3>
          <Badge variant="outline" className="w-fit text-[11px]">
            {template.area}
          </Badge>
        </div>

        <p className="line-clamp-2 text-sm text-muted-foreground leading-relaxed">
          {template.descripcion}
        </p>

        <div className="grid grid-cols-2 gap-2 border-t pt-3 text-sm">
          <div className="flex items-center gap-2 text-sm">
            <BookOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="font-medium">{template.duracionReferencia} h</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="font-medium whitespace-nowrap">
              {template.totalConvocatorias}{' '}
              {template.totalConvocatorias === 1 ? 'sede' : 'sedes'}
            </span>
          </div>
        </div>

        <Button
          variant="outline"
          className="mt-1 w-full"
          onClick={(e) => {
            e.stopPropagation()
            onClick?.()
          }}
        >
          Abrir curso
        </Button>
      </CardContent>
    </Card>
  )
}
