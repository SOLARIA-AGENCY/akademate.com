'use client'

import { Button } from '@payload-config/components/ui/button'
import { CalendarDays, Clock } from 'lucide-react'
import { EntityThumb } from '@payload-config/components/ui/entity-thumb'
import {
  CourseFundingBadge,
  CourseModalityBadge,
} from '@payload-config/components/akademate/dashboard/CourseTaxonomyBadges'
import { DirectoryAreaBadge } from '@payload-config/components/directory/PremiumDirectoryShell'
import type { PlantillaCurso } from '@/types'

interface CourseListItemProps {
  course: PlantillaCurso
  onClick?: () => void
  className?: string
}

export function CourseListItem({ course, onClick, className }: CourseListItemProps) {
  const modality = (course as PlantillaCurso & { modality?: string }).modality
  const areaColor = (course as PlantillaCurso & { areaColor?: string | null }).areaColor

  return (
    <div
      className={`flex items-center gap-4 rounded-lg border bg-card px-4 py-3 transition-shadow hover:shadow-sm cursor-pointer ${className || ''}`}
      onClick={onClick}
      data-oid="bfba_ve"
    >
      <EntityThumb src={course.imagenPortada} alt={course.nombre} fallback="book" size="sm" />

      <div className="flex min-w-0 flex-1 items-center gap-4" data-oid="ku49jm4">
        <div className="min-w-0 flex-1" data-oid="2.vkthd">
          <h3
            className="mb-1 truncate text-sm font-semibold leading-tight"
            title={course.nombre}
            data-oid=".22tcmh"
          >
            {course.nombre}
          </h3>
          <div className="flex min-w-0 flex-wrap items-center gap-2" data-oid="royfh3h">
            <CourseFundingBadge courseType={course.tipo} />
            <DirectoryAreaBadge label={course.area} color={areaColor} />
            <CourseModalityBadge courseType={course.tipo} modality={modality} />
          </div>
        </div>

        <div className="hidden md:flex items-center gap-5 text-sm" data-oid="g.oqgk7">
          <div className="flex items-center gap-1.5" data-oid="3w1ar4y">
            <Clock className="h-4 w-4 text-muted-foreground" data-oid=".z32xno" />
            <span className="font-medium" data-oid="t7.uut_">
              {course.duracionReferencia ? `${course.duracionReferencia} h` : 'Pendiente'}
            </span>
          </div>
          <div className="flex items-center gap-1.5" data-oid="in3hcfx">
            <CalendarDays className="h-4 w-4 text-muted-foreground" data-oid="in3hcfx" />
            <span className="font-medium" data-oid="4w4-k36">
              {course.totalConvocatorias} {course.totalConvocatorias === 1 ? 'convocatoria' : 'convocatorias'}
            </span>
          </div>
        </div>

        <Button
          size="sm"
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
