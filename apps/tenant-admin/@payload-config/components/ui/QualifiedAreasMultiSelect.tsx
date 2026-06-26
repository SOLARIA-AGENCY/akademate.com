'use client'

import { ChevronDown, X } from 'lucide-react'

import { Badge } from './badge'
import { Button } from './button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from './dropdown-menu'

export interface QualifiedAreaOption {
  id: number
  nombre: string
}

interface QualifiedAreasMultiSelectProps {
  areas: QualifiedAreaOption[]
  selectedAreaIds: number[]
  onToggleArea: (areaId: number) => void
}

export function QualifiedAreasMultiSelect({
  areas,
  selectedAreaIds,
  onToggleArea,
}: QualifiedAreasMultiSelectProps) {
  const selectedAreas = areas.filter((area) => selectedAreaIds.includes(area.id))
  const selectedCount = selectedAreas.length

  return (
    <div className="space-y-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-between gap-3 sm:w-auto"
          >
            <span>
              {selectedCount > 0 ? `${selectedCount} áreas seleccionadas` : 'Seleccionar áreas'}
            </span>
            <ChevronDown className="h-4 w-4 opacity-60" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="max-h-72 w-[min(28rem,calc(100vw-2rem))] overflow-y-auto"
        >
          {areas.map((area) => (
            <DropdownMenuCheckboxItem
              key={area.id}
              checked={selectedAreaIds.includes(area.id)}
              onCheckedChange={() => onToggleArea(area.id)}
              onSelect={(event) => event.preventDefault()}
              className="items-start gap-2"
            >
              <span className="whitespace-normal leading-snug">{area.nombre}</span>
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {selectedAreas.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {selectedAreas.map((area) => (
            <Badge
              key={area.id}
              variant="outline"
              className="min-h-7 gap-1.5 rounded-full border-primary/20 bg-primary/10 py-1 pl-3 pr-1 text-primary"
            >
              <span className="whitespace-normal leading-snug">{area.nombre}</span>
              <button
                type="button"
                className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/15"
                aria-label={`Quitar ${area.nombre}`}
                onClick={() => onToggleArea(area.id)}
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  )
}
