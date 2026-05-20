'use client'

import { LayoutGrid, List } from 'lucide-react'
import { ToggleGroup, ToggleGroupItem } from '@payload-config/components/ui/toggle-group'
import type { ViewType } from '@payload-config/hooks/useViewPreference'

interface ViewToggleProps {
  view: ViewType
  onViewChange: (view: ViewType) => void
}

export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <ToggleGroup
      type="single"
      value={view}
      onValueChange={(nextView) => {
        if (nextView === 'grid' || nextView === 'list') onViewChange(nextView)
      }}
      aria-label="Modo de visualización"
      className="rounded-lg bg-muted p-1"
      data-oid="uo:m47o"
    >
      <ToggleGroupItem
        value="grid"
        variant="outline"
        size="sm"
        aria-label="Vista en cuadrícula"
        className={`h-8 border-0 px-3 transition-all focus-visible:ring-primary ${
          view === 'grid'
            ? 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90'
            : 'text-muted-foreground hover:bg-background/70 hover:text-foreground'
        }`}
        data-oid="yx7_2a1"
      >
        <LayoutGrid
          className="h-4 w-4"
          data-oid="-a_7hzw"
        />
      </ToggleGroupItem>
      <ToggleGroupItem
        value="list"
        variant="outline"
        size="sm"
        aria-label="Vista en lista"
        className={`h-8 border-0 px-3 transition-all focus-visible:ring-primary ${
          view === 'list'
            ? 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90'
            : 'text-muted-foreground hover:bg-background/70 hover:text-foreground'
        }`}
        data-oid="j4bg:mv"
      >
        <List
          className="h-4 w-4"
          data-oid="zc:16kd"
        />
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
