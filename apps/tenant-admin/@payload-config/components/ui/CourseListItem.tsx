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
  const areaLabel = course.area || 'Sin área'
  const hoursLabel = course.duracionReferencia ? `${course.duracionReferencia} h` : '—'

  return (
    <div
      className={`flex min-h-16 items-center gap-4 rounded-lg border bg-card px-4 py-3 transition-shadow hover:shadow-sm cursor-pointer ${className || ''}`}
      onClick={onClick}
      data-oid="bfba_ve"
    >
      <EntityThumb src={course.imagenPortada} alt={course.nombre} fallback="book" size="sm" />

      <div className="flex min-w-0 flex-1 items-center gap-3" data-oid="ku49jm4">
        <div className="min-w-0 flex-1" data-oid="2.vkthd">
          <h3
            className="whitespace-normal text-sm font-semibold leading-tight"
            title={course.nombre}
            data-oid=".22tcmh"
          >
            {course.nombre}
          </h3>
        </div>

        <div className="hidden min-w-0 w-[8.5rem] overflow-hidden sm:block">
          <DirectoryAreaBadge
            label={areaLabel}
            color={areaColor}
            className="max-w-full"
          />
        </div>

        <div className="hidden min-w-0 w-[7.5rem] overflow-hidden md:block">
          <CourseFundingBadge courseType={course.tipo} className="max-w-full truncate" />
        </div>

        <div className="hidden min-w-0 w-[6.5rem] overflow-hidden lg:block">
          <CourseModalityBadge
            courseType={course.tipo}
            modality={modality}
            className="max-w-full truncate"
          />
        </div>

        <div className="flex w-16 shrink-0 items-center gap-1 text-sm" data-oid="3w1ar4y">
          <span className="font-medium tabular-nums" title={hoursLabel} data-oid="t7.uut_">
            {hoursLabel}
          </span>
          <Clock className="h-3 w-3 text-muted-foreground" aria-hidden="true" data-oid=".z32xno" />
        </div>
        <div className="flex w-14 shrink-0 items-center gap-1 text-sm" data-oid="in3hcfx">
          <CalendarDays className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
          <span className="font-medium tabular-nums" title={String(course.totalConvocatorias)}>
            {course.totalConvocatorias}
          </span>
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
