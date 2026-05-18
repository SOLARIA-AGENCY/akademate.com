'use client'

import { Badge } from '@payload-config/components/ui/badge'
import { Button } from '@payload-config/components/ui/button'
import { Card, CardContent } from '@payload-config/components/ui/card'
import { Separator } from '@payload-config/components/ui/separator'
import { cn } from '@payload-config/lib/utils'
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
    <Card
      className={cn(
        'group cursor-pointer overflow-hidden shadow-sm transition-shadow hover:shadow-md focus-within:ring-2 focus-within:ring-ring',
        className
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onClick?.()
        }
      }}
    >
      <CardContent className="grid h-20 grid-cols-[5rem_1fr_auto] items-center gap-4 border-l-4 p-0 pr-3" style={{ borderLeftColor: ciclo.tipo === 'superior' ? '#dc2626' : '#ef4444' }}>
        {ciclo.image ? (
          <img src={ciclo.image} alt={ciclo.nombre} className="h-full w-20 object-cover" />
        ) : (
          <div className="flex h-full w-20 items-center justify-center bg-muted">
            <BookOpen className="h-5 w-5 text-muted-foreground" />
          </div>
        )}

        <div className="grid min-w-0 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_150px] lg:grid-cols-[minmax(0,1fr)_190px_120px_auto]">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold leading-tight" title={ciclo.nombre}>
              {ciclo.nombre}
            </h3>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {ciclo.familia_profesional}
            </p>
          </div>

          <div className="hidden items-center gap-3 text-xs sm:flex">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-medium">{ciclo.duracion_total_horas}H</span>
            </span>
            <Separator orientation="vertical" className="h-5" />
            <span className="flex items-center gap-1 text-muted-foreground">
              <BookOpen className="h-3.5 w-3.5" />
              {ciclo.cursos.length} {ciclo.cursos.length === 1 ? 'curso' : 'cursos'}
            </span>
          </div>

          <Badge
            className={`${tipoBadgeClass} hidden whitespace-nowrap px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white lg:inline-flex`}
          >
            {ciclo.tipo === 'superior' ? 'CFGS' : 'CFGM'}
          </Badge>

          <span className="hidden items-center gap-1 text-xs md:flex">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium">{ciclo.total_alumnos || 0}</span>
            <span className="text-muted-foreground">alumnos</span>
          </span>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="h-7 shrink-0 px-3 text-xs font-semibold uppercase tracking-wide"
          onClick={(e) => {
            e.stopPropagation()
            onClick?.()
          }}
        >
          Ver
        </Button>
      </CardContent>
    </Card>
  )
}
