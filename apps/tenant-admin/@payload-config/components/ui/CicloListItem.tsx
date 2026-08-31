'use client'

import { Button } from '@payload-config/components/ui/button'
import { Clock, MapPin } from 'lucide-react'
import { EntityThumb } from '@payload-config/components/ui/entity-thumb'
import {
  DirectoryAreaBadge,
  DirectoryNeutralBadge,
} from '@payload-config/components/directory/PremiumDirectoryShell'
import type { CicloPlantilla } from '@/types'

interface CicloListItemProps {
  ciclo: CicloPlantilla
  modalidad?: string
  duracionLabel?: string
  convocatoriasActivas?: number
  sedes?: string[]
  onClick?: () => void
  className?: string
}

export function CicloListItem({
  ciclo,
  modalidad,
  duracionLabel,
  convocatoriasActivas = 0,
  sedes = [],
  onClick,
  className,
}: CicloListItemProps) {
  return (
    <div
      className={`flex min-h-20 items-center gap-4 rounded-lg border bg-card px-4 py-3 transition-shadow duration-150 hover:shadow-sm cursor-pointer ${className || ''}`}
      onClick={onClick}
      data-oid="oql_5mf"
    >
      <EntityThumb src={ciclo.image} alt={ciclo.nombre} fallback="cycle" size="sm" />

      <div className="flex min-w-0 flex-1 items-center gap-3" data-oid="9e_ey3d">
        <div className="min-w-0 flex-1" data-oid="wy5mwug">
          <h3
            className="whitespace-normal text-sm font-semibold leading-tight"
            title={ciclo.nombre}
            data-oid="g-5-x9f"
          >
            {ciclo.nombre}
          </h3>
          <div className="mt-1">
            <DirectoryAreaBadge label={ciclo.familia_profesional} color={ciclo.color} />
          </div>
        </div>

        <div className="hidden w-28 shrink-0 sm:block">
          <DirectoryNeutralBadge className="max-w-full truncate px-2.5 py-1 text-[10px] font-semibold leading-tight">
            {modalidad || 'Presencial'}
          </DirectoryNeutralBadge>
        </div>

        <div className="hidden w-20 shrink-0 items-center gap-1 text-xs md:flex">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-medium">{duracionLabel || `${ciclo.duracion_total_horas}h`}</span>
        </div>

        <div className="hidden w-16 shrink-0 text-center text-xs font-medium tabular-nums lg:block">
          {convocatoriasActivas}
        </div>

        <div className="hidden min-w-0 max-w-[10rem] items-center gap-1 text-xs xl:flex">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate" title={sedes.join(', ')}>
            {sedes.length > 0 ? sedes.join(', ') : '—'}
          </span>
        </div>

        <div className="hidden w-[140px] justify-center lg:flex" data-oid="2s8r.-y">
          <DirectoryNeutralBadge className="px-2.5 py-1 text-[10px] font-semibold leading-tight">
            {ciclo.tipo === 'superior' ? 'Ciclo superior' : 'Ciclo medio'}
          </DirectoryNeutralBadge>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="h-7 shrink-0 px-3 text-xs"
          onClick={(e) => {
            e.stopPropagation()
            onClick?.()
          }}
          data-oid="83-x4k5"
        >
          Ver
        </Button>
      </div>
    </div>
  )
}
