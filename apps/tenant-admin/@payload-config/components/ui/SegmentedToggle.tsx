'use client'

import { ToggleGroup, ToggleGroupItem } from './toggle-group'
import { cn } from '@payload-config/lib/utils'

export type SegmentedToggleOption = {
  value: string
  label: string
  count?: number
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
      data-slot="segmented-toggle"
      className={cn(
        'inline-flex h-auto min-h-10 max-w-full flex-wrap items-center rounded-md border border-input bg-background p-0.5',
        className
      )}
    >
      {options.map((option) => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          className="group h-9 gap-1.5 px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
        >
          {option.label}
          {option.count != null ? (
            <span className="rounded-full bg-muted px-1.5 text-[10px] font-medium tabular-nums text-muted-foreground group-data-[state=on]:bg-primary-foreground/20 group-data-[state=on]:text-primary-foreground">
              {option.count}
            </span>
          ) : null}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
