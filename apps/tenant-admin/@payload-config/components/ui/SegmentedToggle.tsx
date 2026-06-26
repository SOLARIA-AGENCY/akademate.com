'use client'

import type { LucideIcon } from 'lucide-react'
import { cn } from '@payload-config/lib/utils'
import { ToggleGroup, ToggleGroupItem } from './toggle-group'

export interface SegmentedToggleOption<TValue extends string> {
  value: TValue
  label: string
  icon?: LucideIcon
  shortLabel?: string
}

interface SegmentedToggleProps<TValue extends string> {
  value: TValue
  options: SegmentedToggleOption<TValue>[]
  onValueChange: (value: TValue) => void
  ariaLabel: string
  className?: string
}

export function SegmentedToggle<TValue extends string>({
  value,
  options,
  onValueChange,
  ariaLabel,
  className,
}: SegmentedToggleProps<TValue>) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(nextValue) => {
        if (nextValue) onValueChange(nextValue as TValue)
      }}
      aria-label={ariaLabel}
      className={cn('rounded-lg bg-muted p-1', className)}
    >
      {options.map((option) => {
        const Icon = option.icon
        return (
          <ToggleGroupItem
            key={option.value}
            value={option.value}
            variant="outline"
            size="sm"
            aria-label={option.label}
            className={cn(
              'h-8 border-0 px-3 text-xs font-semibold transition-all focus-visible:ring-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary',
              value === option.value
                ? 'bg-primary text-primary-foreground shadow-sm hover:bg-primary'
                : 'text-muted-foreground hover:bg-primary/10 hover:text-foreground'
            )}
          >
            {Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
            <span className="hidden sm:inline">{option.label}</span>
            {option.shortLabel ? <span className="sm:hidden">{option.shortLabel}</span> : null}
          </ToggleGroupItem>
        )
      })}
    </ToggleGroup>
  )
}
