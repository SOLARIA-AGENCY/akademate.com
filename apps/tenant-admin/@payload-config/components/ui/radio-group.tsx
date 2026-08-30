'use client'

import * as React from 'react'
import { cn } from '@payload-config/lib/utils'

const RadioGroupContext = React.createContext<{
  value?: string
  onValueChange?: (value: string) => void
  name: string
}>({ name: 'radio-group' })

function RadioGroup({
  className,
  value,
  onValueChange,
  name,
  children,
  ...props
}: React.ComponentProps<'div'> & {
  value?: string
  onValueChange?: (value: string) => void
  name?: string
}) {
  const generatedName = React.useId()
  return (
    <RadioGroupContext.Provider value={{ value, onValueChange, name: name ?? generatedName }}>
      <div role="radiogroup" className={cn('grid gap-3', className)} {...props}>
        {children}
      </div>
    </RadioGroupContext.Provider>
  )
}

function RadioGroupItem({
  className,
  value,
  id,
  children,
  ...props
}: React.ComponentProps<'input'> & { value: string }) {
  const group = React.useContext(RadioGroupContext)
  const inputId = id ?? `${group.name}-${value}`
  return (
    <label
      htmlFor={inputId}
      className={cn(
        'flex cursor-pointer items-start gap-3 rounded-lg border bg-card p-4 text-sm transition-colors hover:border-primary/50',
        group.value === value && 'border-primary ring-2 ring-primary/20',
        className
      )}
    >
      <input
        id={inputId}
        type="radio"
        name={group.name}
        value={value}
        checked={group.value === value}
        onChange={() => group.onValueChange?.(value)}
        className="mt-1 h-4 w-4 accent-primary"
        {...props}
      />
      <span className="min-w-0 flex-1">{children}</span>
    </label>
  )
}

export { RadioGroup, RadioGroupItem }
