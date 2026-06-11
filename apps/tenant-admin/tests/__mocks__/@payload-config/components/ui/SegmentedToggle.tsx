import type { LucideIcon } from 'lucide-react'

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
}

export function SegmentedToggle<TValue extends string>({
  value,
  options,
  onValueChange,
  ariaLabel,
}: SegmentedToggleProps<TValue>) {
  return (
    <div role="radiogroup" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onValueChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
