import React from 'react'

export const Checkbox = ({
  id,
  checked,
  onCheckedChange,
  ...props
}: {
  id?: string
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  [key: string]: any
}) => (
  <input
    type="checkbox"
    id={id}
    checked={checked}
    onChange={(e) => onCheckedChange?.(e.target.checked)}
    data-testid="checkbox"
    {...props}
  />
)
