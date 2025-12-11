'use client'

import * as React from 'react'
import { Label } from '@payload-config/components/ui/label'
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
      <div className="text-sm text-muted-foreground text-center py-4">
        Todas las entidades han sido agregadas
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <Label>Agregar Entidad Financiadora</Label>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {entidadesDisponibles.map((entidad) => (
          <button
            key={entidad.key}
            type="button"
            onClick={() => onSelect(entidad.key)}
            className={cn(
              'flex flex-col items-center gap-2 p-3 border-2 rounded-lg',
              'hover:border-primary hover:bg-accent',
              'transition-colors cursor-pointer',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
            )}
          >
            <div className="w-12 h-12 bg-background rounded border flex items-center justify-center p-1.5">
              <div className="w-full h-full flex items-center justify-center text-[10px] font-medium text-muted-foreground text-center leading-tight">
                {entidad.nombre}
              </div>
            </div>
            <span className="text-xs font-medium text-center line-clamp-2">{entidad.nombre}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
