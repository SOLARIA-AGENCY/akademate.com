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
  shortcut = false,
  className,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  shortcut?: boolean
  className?: string
}) {
  return (
    <div className={cn('relative min-w-0 w-full flex-1', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={cn(
          'h-10 min-w-0 bg-background pl-9 placeholder:truncate',
          shortcut && 'pr-16'
        )}
      />
      {shortcut ? (
        <CommandShortcutHint className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
      ) : null}
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
    <div className={cn('min-w-0 space-y-4', className)} data-slot="premium-directory-shell">
      <div className="flex min-w-0 flex-col gap-3 xl:flex-row xl:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {search}
          {shortcut ? <CommandShortcutHint className="shrink-0" /> : null}
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-2 xl:ml-auto">
          {segments}
          {filters}
          {view}
        </div>
      </div>
      {children}
    </div>
  )
}
