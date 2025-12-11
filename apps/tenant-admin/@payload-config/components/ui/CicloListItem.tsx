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
    ciclo.tipo === 'superior'
      ? 'bg-red-600 hover:bg-red-700'
      : 'bg-red-500 hover:bg-red-600'

  return (
    <div
      className={`flex items-center h-20 pr-4 bg-card border-y border-r rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-150 cursor-pointer ${className || ''}`}
      onClick={onClick}
    >
      {/* Borde de color como div separado - PEGADO a la imagen */}
      <div className={`h-full w-1 flex-shrink-0 ${ciclo.tipo === 'superior' ? 'bg-red-600' : 'bg-red-500'}`} />

      {/* Thumbnail - Pegada al borde sin gap */}
      <div className="flex-shrink-0 h-full">
        <img
          src={ciclo.image}
          alt={ciclo.nombre}
          className="h-full w-20 object-cover"
        />
      </div>

      {/* Contenido con padding interno */}
      <div className="flex items-center flex-1 gap-3 pl-4">
        {/* Title + Family */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm truncate leading-tight mb-0.5" title={ciclo.nombre}>
            {ciclo.nombre}
          </h3>
          <p className="text-xs text-muted-foreground truncate">{ciclo.familia_profesional}</p>
        </div>

        {/* Duration + Courses - Compacto */}
        <div className="hidden sm:flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium">{ciclo.duracion_total_horas}H</span>
          </div>
          <div className="flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">
              {ciclo.cursos.length} {ciclo.cursos.length === 1 ? 'curso' : 'cursos'}
            </span>
          </div>
        </div>

        {/* Type Badge - Más pequeño */}
        <div className="hidden lg:block w-[160px] flex justify-center">
          <Badge className={`${tipoBadgeClass} text-white text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap px-2.5 py-1 leading-tight`}>
            {ciclo.tipo === 'superior' ? 'CFGS' : 'CFGM'}
          </Badge>
        </div>

        {/* Students - Compacto */}
        <div className="hidden md:flex items-center gap-1 text-xs w-28">
          <Users className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-medium">{ciclo.total_alumnos || 0}</span>
          <span className="text-muted-foreground">alumnos</span>
        </div>

        {/* Action Button - Compacto */}
        <Button
          size="sm"
          className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold uppercase tracking-wide shrink-0 h-7 px-3"
          onClick={(e) => {
            e.stopPropagation()
            onClick?.()
          }}
        >
          VER
        </Button>
      </div>
    </div>
  )
}
