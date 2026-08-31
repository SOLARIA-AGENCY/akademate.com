'use client'

import { Button } from '@payload-config/components/ui/button'
import { Clock, BookOpen, Users } from 'lucide-react'
import { EntityThumb } from '@payload-config/components/ui/entity-thumb'
import {
  DirectoryAreaBadge,
  DirectoryNeutralBadge,
} from '@payload-config/components/directory/PremiumDirectoryShell'
import type { CicloPlantilla } from '@/types'

interface CicloListItemProps {
  ciclo: CicloPlantilla
  onClick?: () => void
  className?: string
}

export function CicloListItem({ ciclo, onClick, className }: CicloListItemProps) {
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
            className="truncate text-sm font-semibold leading-tight"
            title={ciclo.nombre}
            data-oid="g-5-x9f"
          >
            {ciclo.nombre}
          </h3>
          <div className="mt-1">
            <DirectoryAreaBadge label={ciclo.familia_profesional} color={ciclo.color} />
          </div>
        </div>

        <div className="hidden items-center gap-3 text-xs sm:flex" data-oid="s6g7:.p">
          <div className="flex items-center gap-1" data-oid="z0j0fbh">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" data-oid="gsyomu0" />
            <span className="font-medium" data-oid="87v6u8n">
              {ciclo.duracion_total_horas}h
            </span>
          </div>
          <div className="flex items-center gap-1" data-oid="xvh.38m">
            <BookOpen className="h-3.5 w-3.5 text-muted-foreground" data-oid="ye8g7qb" />
            <span className="text-muted-foreground" data-oid="9tfjjrr">
              {ciclo.cursos.length} {ciclo.cursos.length === 1 ? 'curso' : 'cursos'}
            </span>
          </div>
        </div>

        <div className="hidden w-[160px] justify-center lg:flex" data-oid="2s8r.-y">
          <DirectoryNeutralBadge className="px-2.5 py-1 text-[10px] font-semibold leading-tight">
            {ciclo.tipo === 'superior' ? 'Ciclo superior' : 'Ciclo medio'}
          </DirectoryNeutralBadge>
        </div>

        <div className="hidden w-28 items-center gap-1 text-xs md:flex" data-oid="p:rueq5">
          <Users className="h-3.5 w-3.5 text-muted-foreground" data-oid="jlkxcxv" />
          <span className="font-medium" data-oid="kk:hi:r">
            {ciclo.total_alumnos || 0}
          </span>
          <span className="text-muted-foreground" data-oid="gmg6epv">
            alumnos
          </span>
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
