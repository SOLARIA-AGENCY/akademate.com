'use client'

import * as React from 'react'
import { Label } from '@payload-config/components/ui/label'
import { Button } from '@payload-config/components/ui/button'
import { cn } from '@/lib/utils'
import { getEntidadesDisponibles } from '@payload-config/lib/entidadesFinanciadoras'
import type { EntidadFinanciadoraKey } from '@/types'

interface EntidadSelectorProps {
  onSelect: (entidad: EntidadFinanciadoraKey) => void
  excluidas?: EntidadFinanciadoraKey[]
  entidadesUsadas?: EntidadFinanciadoraKey[] // Alias for excluidas (Visual-First dev)
}

export function EntidadSelector({ onSelect, excluidas, entidadesUsadas }: EntidadSelectorProps) {
  const excludedEntidades = excluidas || entidadesUsadas || []
  const entidadesDisponibles = getEntidadesDisponibles(excludedEntidades)

  if (entidadesDisponibles.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-4" data-oid="v2bxrby">
        Todas las entidades han sido agregadas
      </div>
    )
  }

  return (
    <div className="space-y-3" data-oid="qiuxu4r">
      <Label data-oid="ewav9zq">Agregar Entidad Financiadora</Label>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3" data-oid="z4bt744">
        {entidadesDisponibles.map((entidad) => (
          <Button
            key={entidad.key}
            type="button"
            variant="outline"
            onClick={() => onSelect(entidad.key)}
            className={cn(
              'h-auto flex-col items-center gap-2 p-3',
              'hover:border-primary hover:bg-accent'
            )}
            data-oid="rmvfktf"
          >
            <div
              className="w-12 h-12 bg-background rounded border flex items-center justify-center p-1.5"
              data-oid="qmd.h_o"
            >
              <div
                className="w-full h-full flex items-center justify-center text-[10px] font-medium text-muted-foreground text-center leading-tight"
                data-oid="qlx0ibr"
              >
                {entidad.nombre}
              </div>
            </div>
            <span className="text-xs font-medium text-center line-clamp-2" data-oid="uq8c_3v">
              {entidad.nombre}
            </span>
          </Button>
        ))}
      </div>
    </div>
  )
}
