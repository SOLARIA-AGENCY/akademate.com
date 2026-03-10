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
    <div className="flex items-start gap-4 p-4 bg-card border rounded-lg" data-oid="vp8e:7j">
      {/* Logo de la entidad */}
      <div
        className="flex-shrink-0 w-16 h-16 bg-background rounded border flex items-center justify-center p-2"
        data-oid="um1pcrq"
      >
        <div
          className="w-full h-full flex items-center justify-center text-muted-foreground text-xs font-medium"
          data-oid="6ow2scu"
        >
          {entidadInfo.nombre}
        </div>
      </div>

      {/* Información */}
      <div className="flex-1 min-w-0 space-y-3" data-oid="o5ba1gu">
        <div data-oid="pcxxbpf">
          <h4 className="font-semibold text-sm" data-oid="rl20m:r">
            {entidadInfo.nombre}
          </h4>
          <p className="text-xs text-muted-foreground" data-oid="6nwrv1o">
            {entidadInfo.descripcion}
          </p>
        </div>

        {/* Controles */}
        <div className="grid grid-cols-2 gap-3" data-oid="zo412js">
          {/* Porcentaje */}
          <div data-oid="ruybspp">
            <Label className="text-xs" data-oid="wga7:1x">
              Porcentaje de subvención
            </Label>
            <div className="flex items-center gap-2" data-oid="7ssfp_5">
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
                data-oid="4xgv14d"
              />

              <span className="text-sm font-medium" data-oid="se5x1ac">
                %
              </span>
            </div>
          </div>

          {/* Estado */}
          <div className="flex items-end" data-oid="db8-hxc">
            <div className="flex items-center space-x-2" data-oid="m5:m._q">
              <Switch
                id={`activa-${subvencion.id}`}
                checked={subvencion.activa}
                onCheckedChange={(activa) => onUpdate({ ...subvencion, activa })}
                data-oid="7h3.vh6"
              />

              <Label
                htmlFor={`activa-${subvencion.id}`}
                className="text-xs cursor-pointer"
                data-oid="mld5.jv"
              >
                Activa
              </Label>
            </div>
          </div>
        </div>

        {/* Requisitos (opcional) */}
        <div data-oid="20mmk5r">
          <Label className="text-xs" data-oid="4q23c6:">
            Requisitos (opcional)
          </Label>
          <Textarea
            value={subvencion.requisitos || ''}
            onChange={(e) => onUpdate({ ...subvencion, requisitos: e.target.value })}
            placeholder="Ej: Trabajadores en activo, autónomos..."
            rows={2}
            className="text-xs mt-1"
            data-oid="spm9slo"
          />
        </div>

        {/* URL info (opcional) */}
        <div data-oid="leuz03o">
          <Label className="text-xs" data-oid="_f5j5ui">
            URL de información (opcional)
          </Label>
          <Input
            type="url"
            value={subvencion.urlInfo || ''}
            onChange={(e) => onUpdate({ ...subvencion, urlInfo: e.target.value })}
            placeholder="https://..."
            className="h-8 text-xs mt-1"
            data-oid="jk9390m"
          />
        </div>
      </div>

      {/* Botón eliminar */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onRemove}
        className="text-destructive hover:bg-destructive/10 flex-shrink-0"
        data-oid="co0ku7g"
      >
        <Trash2 className="w-4 h-4" data-oid="9isc6m7" />
      </Button>
    </div>
  )
}
