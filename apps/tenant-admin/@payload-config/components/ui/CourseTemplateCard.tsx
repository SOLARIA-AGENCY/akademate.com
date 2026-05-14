'use client'

import { useState } from 'react'
import { Card, CardContent } from '@payload-config/components/ui/card'
import { Badge } from '@payload-config/components/ui/badge'
import { Button } from '@payload-config/components/ui/button'
import { CalendarDays, Clock, Monitor, Users } from 'lucide-react'
import { COURSE_TYPE_CONFIG } from '@payload-config/lib/courseTypeConfig'
import { getPublicStudyTypeFallbackImage, toDashboardStudyType } from '@/app/lib/website/study-types'
import type { PlantillaCurso } from '@/types'

interface CourseTemplateCardProps {
  template: PlantillaCurso
  onClick?: () => void
  onGenerateConvocation?: () => void
  className?: string
}

export function CourseTemplateCard({ template, onClick, className }: CourseTemplateCardProps) {
  const typeConfig = COURSE_TYPE_CONFIG[template.tipo] || COURSE_TYPE_CONFIG.privados
  const fallbackImage = getPublicStudyTypeFallbackImage(toDashboardStudyType(template.tipo))
  const [imgError, setImgError] = useState(false)
  const description =
    template.descripcion?.trim() ||
    'Curso pendiente de completar con informacion editorial.'
  const modality = (template as PlantillaCurso & { modality?: string }).modality || 'presencial'
  const modalityLabel = modality === 'online' ? 'Online' : modality === 'semipresencial' ? 'Semipresencial' : 'Presencial'

  return (
    <Card
      className={`course-template-card h-full cursor-pointer overflow-hidden border-border/70 bg-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${className || ''}`}
      onClick={onClick}
      data-oid="w4mfu4l"
    >
      <div className="grid h-full min-h-[230px] grid-cols-[150px_1fr] gap-0 sm:grid-cols-[190px_1fr]" data-oid="card-grid">
        <div className="relative h-full min-h-[230px] overflow-hidden bg-muted" data-oid="0:ln.eo">
          {!imgError ? (
            <img
              src={template.imagenPortada || fallbackImage}
              alt={template.nombre}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 hover:scale-105"
              onError={() => setImgError(true)}
              data-oid="82e8gy5"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center bg-primary/5"
              data-oid="bxz1gyg"
            >
              <img
                src="/icon-libro.svg"
                alt=""
                aria-hidden="true"
                className="h-12 w-12 opacity-30"
              />
            </div>
          )}
        </div>

        <CardContent className="flex min-w-0 flex-col gap-3 p-4" data-oid="msupxrb">
          <div className="flex flex-wrap items-center gap-2" data-oid="le_pykk">
            <Badge
              className={`${typeConfig.bgColor} ${typeConfig.hoverColor} text-white text-[11px] font-semibold`}
              data-oid="8730cp-"
            >
              {typeConfig.label}
            </Badge>
            <Badge variant="outline" className="max-w-full truncate text-[11px]" data-oid="4kdxate">
              {template.area || 'Sin area'}
            </Badge>
          </div>

          <h3
            className="line-clamp-2 text-base font-extrabold uppercase leading-snug tracking-wide text-foreground"
            title={template.nombre}
            data-oid="i9v7h1b"
          >
            {template.nombre}
          </h3>

          <p
            className="line-clamp-2 text-sm leading-relaxed text-muted-foreground"
            data-oid="7-pkl0s"
          >
            {description}
          </p>

          <div className="grid grid-cols-2 gap-2 border-t pt-3 text-xs text-muted-foreground" data-oid="lqw1vn8">
            <div className="flex items-center gap-1.5" data-oid="mq_mh95">
              <Clock className="h-4 w-4 flex-shrink-0 text-muted-foreground" data-oid="y_pgz5i" />
              <span className="font-semibold text-foreground" data-oid="ft5an15">
                {template.duracionReferencia ? `${template.duracionReferencia} h` : 'Duracion pendiente'}
              </span>
            </div>

            <div className="flex items-center gap-1.5" data-oid="74qc2_7">
              <CalendarDays className="h-4 w-4 flex-shrink-0 text-muted-foreground" data-oid="in3hcfx" />
              <span className="font-semibold text-foreground" data-oid="be2u8o2">
                {template.totalConvocatorias} {template.totalConvocatorias === 1 ? 'convocatoria' : 'convocatorias'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Monitor className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              <span className="font-semibold text-foreground">{modalityLabel}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              <span className="font-semibold text-foreground">Grupos reducidos</span>
            </div>
          </div>

          <Button
            className="mt-auto w-full bg-[#f2014b] text-white hover:bg-[#d80143] hover:text-white"
            onClick={(e) => {
              e.stopPropagation()
              onClick?.()
            }}
            data-oid="zzt5:ot"
          >
            Abrir curso
          </Button>
        </CardContent>
      </div>
    </Card>
  )
}
