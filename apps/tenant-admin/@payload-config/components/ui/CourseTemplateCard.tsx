'use client'

import { Card, CardContent } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { CalendarDays, Clock, Users } from 'lucide-react'
import { EntityThumb } from '@payload-config/components/ui/entity-thumb'
import {
  CourseFundingBadge,
  CourseModalityBadge,
} from '@payload-config/components/akademate/dashboard/CourseTaxonomyBadges'
import { DirectoryAreaBadge } from '@payload-config/components/directory/PremiumDirectoryShell'
import type { PlantillaCurso } from '@/types'

interface CourseTemplateCardProps {
  template: PlantillaCurso
  onClick?: () => void
  onGenerateConvocation?: () => void
  className?: string
}

export function CourseTemplateCard({ template, onClick, className }: CourseTemplateCardProps) {
  const description =
    template.descripcion?.trim() ||
    'Curso pendiente de completar con informacion editorial.'
  const modality = (template as PlantillaCurso & { modality?: string }).modality
  const areaColor = (template as PlantillaCurso & { areaColor?: string | null }).areaColor

  return (
    <Card
      className={`course-template-card h-full cursor-pointer overflow-hidden ${className || ''}`}
      onClick={onClick}
      data-oid="w4mfu4l"
    >
      <CardContent className="flex min-w-0 items-start gap-4 p-4" data-oid="msupxrb">
        <EntityThumb src={template.imagenPortada} alt={template.nombre} fallback="book" size="lg" />

        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2" data-oid="le_pykk">
            <CourseFundingBadge courseType={template.tipo} />
            <DirectoryAreaBadge label={template.area || 'Sin area'} color={areaColor} />
            <CourseModalityBadge courseType={template.tipo} modality={modality} />
          </div>

          <h3
            className="line-clamp-2 text-base font-semibold leading-snug text-foreground"
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
              <Users className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              <span className="font-semibold text-foreground">Grupos reducidos</span>
            </div>
          </div>

          <Button
            className="mt-auto w-full"
            onClick={(e) => {
              e.stopPropagation()
              onClick?.()
            }}
            data-oid="zzt5:ot"
          >
            Abrir curso
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
