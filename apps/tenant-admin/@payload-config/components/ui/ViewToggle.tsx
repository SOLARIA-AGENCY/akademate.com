'use client'

import { LayoutGrid, List } from 'lucide-react'
import type { ViewType } from '@payload-config/hooks/useViewPreference'
import { SegmentedToggle } from './SegmentedToggle'

interface ViewToggleProps {
  view: ViewType
  onViewChange: (view: ViewType) => void
}

export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <SegmentedToggle
      value={view}
      onValueChange={onViewChange}
      ariaLabel="Modo de visualización"
      iconOnly
      options={[
        { value: 'grid', label: 'Vista en cuadrícula', shortLabel: 'Grid', icon: LayoutGrid },
        { value: 'list', label: 'Vista de lista', shortLabel: 'Lista', icon: List },
      ]}
    />
  )
}
