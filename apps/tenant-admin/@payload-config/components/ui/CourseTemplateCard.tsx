'use client'

import { useState } from 'react'
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

export function CourseTemplateCard({ template, onClick, className }: CourseTemplateCardProps) {
  const typeConfig = COURSE_TYPE_CONFIG[template.tipo] || COURSE_TYPE_CONFIG.privados
  const [imgError, setImgError] = useState(false)

  return (
    <Card
      className={`course-template-card cursor-pointer overflow-hidden border-border/70 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${className || ''}`}
      onClick={onClick}
      data-oid="w4mfu4l"
    >
      {/* Course Image */}
      <div className="relative h-40 overflow-hidden bg-muted" data-oid="0:ln.eo">
        {template.imagenPortada && !imgError ? (
          <img
            src={template.imagenPortada}
            alt={template.nombre}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            onError={() => setImgError(true)}
            data-oid="82e8gy5"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center bg-primary/5"
            data-oid="bxz1gyg"
          >
            <img
              src="/icon-libro.svg"
              alt=""
              aria-hidden="true"
              className="h-16 w-16 opacity-30"
            />
          </div>
        )}
        <div className="absolute left-3 top-3" data-oid="846ppen">
          <Badge
            className={`${typeConfig.bgColor} ${typeConfig.hoverColor} text-white text-[11px] font-semibold`}
            data-oid="8730cp-"
          >
            {typeConfig.label}
          </Badge>
        </div>
      </div>

      <CardContent className="flex flex-col gap-3 p-4 bg-card" data-oid="msupxrb">
        <div className="flex flex-col gap-1" data-oid="le_pykk">
          <h3
            className="line-clamp-2 text-base font-bold leading-snug"
            title={template.nombre}
            data-oid="i9v7h1b"
          >
            {template.nombre}
          </h3>
          <Badge variant="outline" className="w-fit text-[11px]" data-oid="4kdxate">
            {template.area}
          </Badge>
        </div>

        <p
          className="line-clamp-2 text-sm text-muted-foreground leading-relaxed"
          data-oid="7-pkl0s"
        >
          {template.descripcion}
        </p>

        <div className="grid grid-cols-2 gap-2 border-t pt-3 text-sm" data-oid="lqw1vn8">
          <div className="flex items-center gap-2 text-sm" data-oid="mq_mh95">
            <BookOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" data-oid="y_pgz5i" />
            <span className="font-medium" data-oid="ft5an15">
              {template.duracionReferencia} h
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm" data-oid="74qc2_7">
            <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" data-oid="in3hcfx" />
            <span className="font-medium whitespace-nowrap" data-oid="be2u8o2">
              {template.totalConvocatorias} {template.totalConvocatorias === 1 ? 'sede' : 'sedes'}
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
          data-oid="zzt5:ot"
        >
          Abrir curso
        </Button>
      </CardContent>
    </Card>
  )
}
