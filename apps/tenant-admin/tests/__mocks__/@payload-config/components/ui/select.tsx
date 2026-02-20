import React from 'react'

export const Select = ({
  children,
  value,
  onValueChange: _onValueChange,
  ...props
}: {
  children: React.ReactNode
  value?: string
  onValueChange?: (value: string) => void
  [key: string]: any
}) => (
  <div data-testid="select" data-value={value} {...props}>
    {children}
  </div>
)

export const SelectTrigger = ({
  children,
  ...props
}: {
  children: React.ReactNode
  [key: string]: any
}) => (
  <div data-testid="select-trigger" {...props}>
    {children}
  </div>
)

export const SelectValue = ({
  placeholder,
}: {
  placeholder?: string
}) => <span data-testid="select-value">{placeholder ?? ''}</span>

export const SelectContent = ({
  children,
  ...props
}: {
  children: React.ReactNode
  [key: string]: any
}) => (
  <div data-testid="select-content" {...props}>
    {children}
  </div>
)

export const SelectItem = ({
  children,
  value,
  ...props
}: {
  children: React.ReactNode
  value: string
  [key: string]: any
}) => (
  <div data-testid="select-item" data-value={value} {...props}>
    {children}
  </div>
)
