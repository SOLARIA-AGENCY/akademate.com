import React from 'react'

export function CommandDialog({
  children,
  open,
  title,
}: {
  children?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  title?: string
  description?: string
}) {
  if (!open) return null
  return (
    <div role="dialog" aria-label={title}>
      {children}
    </div>
  )
}

export function CommandInput({ placeholder }: { placeholder?: string }) {
  return <input placeholder={placeholder} />
}

export function CommandList({ children }: { children?: React.ReactNode }) {
  return <div>{children}</div>
}

export function CommandEmpty({ children }: { children?: React.ReactNode }) {
  return <div>{children}</div>
}

export function CommandGroup({ children, heading }: { children?: React.ReactNode; heading?: string }) {
  return (
    <div>
      {heading ? <p>{heading}</p> : null}
      {children}
    </div>
  )
}

export function CommandItem({
  children,
  onSelect,
}: {
  children?: React.ReactNode
  value?: string
  onSelect?: () => void
}) {
  return (
    <button type="button" onClick={onSelect}>
      {children}
    </button>
  )
}
