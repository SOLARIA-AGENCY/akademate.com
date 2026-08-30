'use client'

import { ToggleGroup, ToggleGroupItem } from './toggle-group'
import { cn } from '@payload-config/lib/utils'

export type SegmentedToggleOption = {
  value: string
  label: string
}

export function SegmentedToggle({
  value,
  onValueChange,
  options,
  ariaLabel,
  className,
}: {
  value: string
  onValueChange: (value: string) => void
  options: SegmentedToggleOption[]
  ariaLabel: string
  className?: string
}) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(next) => {
        if (next) onValueChange(next)
      }}
      variant="outline"
      size="sm"
      aria-label={ariaLabel}
      className={cn(
        'inline-flex h-auto min-h-10 max-w-full flex-wrap items-center rounded-md border border-input bg-background p-0.5',
        className
      )}
    >
      {options.map((option) => (
        <ToggleGroupItem key={option.value} value={option.value} className="h-9 px-3">
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
