'use client'

import { Badge } from '@payload-config/components/ui/badge'
import { Button } from '@payload-config/components/ui/button'
import { Clock, BookOpen, Users } from 'lucide-react'
import type { CicloPlantilla } from '@/types'

interface CicloListItemProps {
  ciclo: CicloPlantilla
  onClick?: () => void
  className?: string
}

export function CicloListItem({ ciclo, onClick, className }: CicloListItemProps) {
  const tipoBadgeClass =
    ciclo.tipo === 'superior' ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'

  return (
    <div
      className={`flex items-center h-20 pr-4 bg-card border-y border-r rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-150 cursor-pointer ${className || ''}`}
      onClick={onClick}
      data-oid="oql_5mf"
    >
      {/* Borde de color como div separado - PEGADO a la imagen */}
      <div
        className={`h-full w-1 flex-shrink-0 ${ciclo.tipo === 'superior' ? 'bg-red-600' : 'bg-red-500'}`}
        data-oid=".a1aocx"
      />

      {/* Thumbnail - Pegada al borde sin gap */}
      <div className="flex-shrink-0 h-full" data-oid="i_utyui">
        {ciclo.image ? (
          <img
            src={ciclo.image}
            alt={ciclo.nombre}
            className="h-full w-20 object-cover"
            data-oid="znzsh04"
          />
        ) : (
          <div className="h-full w-20 bg-muted flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Contenido con padding interno */}
      <div className="flex items-center flex-1 gap-3 pl-4" data-oid="9e_ey3d">
        {/* Title + Family */}
        <div className="flex-1 min-w-0" data-oid="wy5mwug">
          <h3
            className="font-semibold text-sm truncate leading-tight mb-0.5"
            title={ciclo.nombre}
            data-oid="g-5-x9f"
          >
            {ciclo.nombre}
          </h3>
          <p className="text-xs text-muted-foreground truncate" data-oid="0-:5dy7">
            {ciclo.familia_profesional}
          </p>
        </div>

        {/* Duration + Courses - Compacto */}
        <div className="hidden sm:flex items-center gap-3 text-xs" data-oid="s6g7:.p">
          <div className="flex items-center gap-1" data-oid="z0j0fbh">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" data-oid="gsyomu0" />
            <span className="font-medium" data-oid="87v6u8n">
              {ciclo.duracion_total_horas}H
            </span>
          </div>
          <div className="flex items-center gap-1" data-oid="xvh.38m">
            <BookOpen className="h-3.5 w-3.5 text-muted-foreground" data-oid="ye8g7qb" />
            <span className="text-muted-foreground" data-oid="9tfjjrr">
              {ciclo.cursos.length} {ciclo.cursos.length === 1 ? 'curso' : 'cursos'}
            </span>
          </div>
        </div>

        {/* Type Badge - Más pequeño */}
        <div className="hidden lg:block w-[160px] flex justify-center" data-oid="2s8r.-y">
          <Badge
            className={`${tipoBadgeClass} text-white text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap px-2.5 py-1 leading-tight`}
            data-oid="6t0-3d9"
          >
            {ciclo.tipo === 'superior' ? 'CFGS' : 'CFGM'}
          </Badge>
        </div>

        {/* Students - Compacto */}
        <div className="hidden md:flex items-center gap-1 text-xs w-28" data-oid="p:rueq5">
          <Users className="h-3.5 w-3.5 text-muted-foreground" data-oid="jlkxcxv" />
          <span className="font-medium" data-oid="kk:hi:r">
            {ciclo.total_alumnos || 0}
          </span>
          <span className="text-muted-foreground" data-oid="gmg6epv">
            alumnos
          </span>
        </div>

        {/* Action Button - Compacto */}
        <Button
          variant="outline"
          size="sm"
          className="text-xs font-semibold uppercase tracking-wide shrink-0 h-7 px-3"
          onClick={(e) => {
            e.stopPropagation()
            onClick?.()
          }}
          data-oid="83-x4k5"
        >
          VER
        </Button>
      </div>
    </div>
  )
}
