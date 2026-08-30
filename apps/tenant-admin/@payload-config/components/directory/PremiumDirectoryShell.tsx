'use client'

import * as React from 'react'
import { Search } from 'lucide-react'
import { Input } from '../ui/input'
import { Kbd } from '../ui/kbd'
import { cn } from '@payload-config/lib/utils'

export function ListingSearch({
  value,
  onChange,
  placeholder = 'Buscar...',
  className,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}) {
  return (
    <div className={cn('relative min-w-[220px] flex-1', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-10 bg-background pl-9"
      />
    </div>
  )
}

export function CommandShortcutHint({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'hidden items-center gap-1 text-xs text-muted-foreground sm:inline-flex',
        className
      )}
      aria-hidden="true"
    >
      <Kbd>⌘</Kbd>
      <Kbd>K</Kbd>
    </span>
  )
}

export function PremiumDirectoryShell({
  search,
  segments,
  filters,
  view,
  shortcut = true,
  children,
  className,
}: {
  search?: React.ReactNode
  segments?: React.ReactNode
  filters?: React.ReactNode
  view?: React.ReactNode
  shortcut?: boolean
  children?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('space-y-4', className)} data-slot="premium-directory-shell">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        {search}
        <div className="ml-0 flex h-auto flex-wrap items-center gap-2 lg:ml-auto lg:h-10 lg:flex-nowrap">
          {segments}
          {filters}
          {view}
          {shortcut ? <CommandShortcutHint /> : null}
        </div>
      </div>
      {children}
    </div>
  )
}
