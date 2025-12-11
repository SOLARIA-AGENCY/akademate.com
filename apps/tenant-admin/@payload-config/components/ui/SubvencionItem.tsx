'use client'

import * as React from 'react'
import { Label } from '@payload-config/components/ui/label'
import { Input } from '@payload-config/components/ui/input'
import { Textarea } from '@payload-config/components/ui/textarea'
import { Button } from '@payload-config/components/ui/button'
import { Switch } from '@payload-config/components/ui/switch'
import { Trash2 } from 'lucide-react'
import { getEntidadInfo } from '@payload-config/lib/entidadesFinanciadoras'
import type { Subvencion } from '@/types'

interface SubvencionItemProps {
  subvencion: Subvencion
  onUpdate: (subvencion: Subvencion) => void
  onRemove: () => void
}

export function SubvencionItem({ subvencion, onUpdate, onRemove }: SubvencionItemProps) {
  const entidadInfo = getEntidadInfo(subvencion.entidad)

  return (
    <div className="flex items-start gap-4 p-4 bg-card border rounded-lg">
      {/* Logo de la entidad */}
      <div className="flex-shrink-0 w-16 h-16 bg-background rounded border flex items-center justify-center p-2">
        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs font-medium">
          {entidadInfo.nombre}
        </div>
      </div>

      {/* Información */}
      <div className="flex-1 min-w-0 space-y-3">
        <div>
          <h4 className="font-semibold text-sm">{entidadInfo.nombre}</h4>
          <p className="text-xs text-muted-foreground">{entidadInfo.descripcion}</p>
        </div>

        {/* Controles */}
        <div className="grid grid-cols-2 gap-3">
          {/* Porcentaje */}
          <div>
            <Label className="text-xs">Porcentaje de subvención</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                max="100"
                value={subvencion.porcentaje}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0
                  onUpdate({ ...subvencion, porcentaje: Math.min(100, Math.max(0, value)) })
                }}
                className="h-8"
              />
              <span className="text-sm font-medium">%</span>
            </div>
          </div>

          {/* Estado */}
          <div className="flex items-end">
            <div className="flex items-center space-x-2">
              <Switch
                id={`activa-${subvencion.id}`}
                checked={subvencion.activa}
                onCheckedChange={(activa) => onUpdate({ ...subvencion, activa })}
              />
              <Label htmlFor={`activa-${subvencion.id}`} className="text-xs cursor-pointer">
                Activa
              </Label>
            </div>
          </div>
        </div>

        {/* Requisitos (opcional) */}
        <div>
          <Label className="text-xs">Requisitos (opcional)</Label>
          <Textarea
            value={subvencion.requisitos || ''}
            onChange={(e) => onUpdate({ ...subvencion, requisitos: e.target.value })}
            placeholder="Ej: Trabajadores en activo, autónomos..."
            rows={2}
            className="text-xs mt-1"
          />
        </div>

        {/* URL info (opcional) */}
        <div>
          <Label className="text-xs">URL de información (opcional)</Label>
          <Input
            type="url"
            value={subvencion.urlInfo || ''}
            onChange={(e) => onUpdate({ ...subvencion, urlInfo: e.target.value })}
            placeholder="https://..."
            className="h-8 text-xs mt-1"
          />
        </div>
      </div>

      {/* Botón eliminar */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onRemove}
        className="text-destructive hover:bg-destructive/10 flex-shrink-0"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  )
}
