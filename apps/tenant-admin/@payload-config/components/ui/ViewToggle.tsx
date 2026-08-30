'use client'

import { LayoutGrid, List } from 'lucide-react'
import { ToggleGroup, ToggleGroupItem } from './toggle-group'
import type { ViewType } from '@payload-config/hooks/useViewPreference'
import { cn } from '@payload-config/lib/utils'

interface ViewToggleProps {
  view: ViewType
  onViewChange: (view: ViewType) => void
  className?: string
}

export function ViewToggle({ view, onViewChange, className }: ViewToggleProps) {
  return (
    <ToggleGroup
      type="single"
      value={view}
      onValueChange={(next) => {
        if (next === 'grid' || next === 'list') onViewChange(next)
      }}
      variant="outline"
      size="sm"
      aria-label="Modo de visualizacion"
      className={cn(
        'inline-flex h-10 items-center rounded-md border border-input bg-background p-0.5',
        className
      )}
    >
      <ToggleGroupItem value="grid" aria-label="Vista en cuadrícula" className="h-9 px-3">
        <LayoutGrid className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="list" aria-label="Vista en lista" className="h-9 px-3">
        <List className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
