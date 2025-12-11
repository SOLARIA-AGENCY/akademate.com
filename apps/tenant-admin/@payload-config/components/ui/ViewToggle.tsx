'use client'

import { LayoutGrid, List } from 'lucide-react'
import { Button } from '@payload-config/components/ui/button'
import type { ViewType } from '@payload-config/hooks/useViewPreference'

interface ViewToggleProps {
  view: ViewType
  onViewChange: (view: ViewType) => void
}

export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Modo de visualización"
      className="inline-flex items-center gap-1 p-1 bg-muted rounded-lg"
    >
      <Button
        variant={view === 'grid' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('grid')}
        aria-label="Vista en cuadrícula"
        aria-checked={view === 'grid'}
        role="radio"
        className={`h-8 px-3 transition-all ${
          view === 'grid'
            ? 'bg-background shadow-sm'
            : 'hover:bg-background/50'
        }`}
      >
        <LayoutGrid className={`h-4 w-4 ${view === 'grid' ? 'text-foreground' : 'text-muted-foreground'}`} />
      </Button>
      <Button
        variant={view === 'list' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('list')}
        aria-label="Vista en lista"
        aria-checked={view === 'list'}
        role="radio"
        className={`h-8 px-3 transition-all ${
          view === 'list'
            ? 'bg-background shadow-sm'
            : 'hover:bg-background/50'
        }`}
      >
        <List className={`h-4 w-4 ${view === 'list' ? 'text-foreground' : 'text-muted-foreground'}`} />
      </Button>
    </div>
  )
}
