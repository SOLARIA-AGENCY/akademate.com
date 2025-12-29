import React from 'react'

export const Select = ({
  children,
  value,
  onValueChange,
  ...props
}: {
  children: React.ReactNode
  value?: string
  onValueChange?: (value: string) => void
  [key: string]: any
}) => (
  <select
    value={value}
    onChange={(e) => onValueChange?.(e.target.value)}
    data-testid="select"
    {...props}
  >
    {children}
  </select>
)
