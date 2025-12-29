import React from 'react'

export const Switch = ({
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
    role="switch"
    checked={checked}
    onChange={(e) => onCheckedChange?.(e.target.checked)}
    data-testid="switch"
    {...props}
  />
)
