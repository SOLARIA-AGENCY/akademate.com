'use client'

import * as React from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { Input } from '../ui/input'
import { Kbd } from '../ui/kbd'
import { Badge } from '../ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
import { EntityThumb } from '../ui/entity-thumb'
import { cn } from '@payload-config/lib/utils'
import {
  DIRECTORY_CAMPUS_PILL_CLASS,
  formatDirectoryAreaLabel,
  getDirectoryAreaTone,
  parseDirectoryHexColor,
} from '@payload-config/lib/courseTypeConfig'
import { isStockAcademicCover, useCampusIdentityMap } from './campus-identity-map'
import { canonicalizePayloadMediaUrl } from '@/app/lib/payload-media-url'
export { useCampusIdentityMap, buildCampusIdentityMap } from './campus-identity-map'
export type { CampusIdentityMap } from './campus-identity-map'

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

export function DirectoryNeutralBadge({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <Badge
      variant="static"
      data-slot="directory-neutral-badge"
      className={cn(
        'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-100',
        className,
      )}
    >
      {children}
    </Badge>
  )
}

export function DirectoryAreaBadge({
  label,
  color,
  className,
}: {
  label?: string | null
  color?: string | null
  className?: string
}) {
  const text = formatDirectoryAreaLabel(label)
  const hex = parseDirectoryHexColor(color)
  const tone = getDirectoryAreaTone(text)

  return (
    <Badge
      variant="static"
      data-slot="directory-area-badge"
      title={text}
      className={cn(
        hex ? 'border' : tone.pillClass,
        'max-w-[14rem] truncate whitespace-nowrap hover:opacity-100',
        className,
      )}
      style={
        hex
          ? {
              backgroundColor: `${hex}26`,
              color: hex,
              borderColor: `${hex}59`,
            }
          : undefined
      }
    >
      {text}
    </Badge>
  )
}

export function DirectoryCampusIdentity({
  name,
  imageUrl,
  href,
}: {
  name?: string | null
  imageUrl?: string | null
  href?: string
}) {
  const trimmed = (name ?? '').trim()
  const displayName = !trimmed || /^sin sede$/i.test(trimmed) ? '—' : trimmed
  const photo = imageUrl && !isStockAcademicCover(imageUrl) ? imageUrl : null
  const inner = (
    <span
      data-slot="directory-campus-identity"
      className="inline-flex min-w-0 max-w-full shrink-0 items-center gap-2"
    >
      <EntityThumb src={photo} alt={displayName} fallback="campus" size="sm" />
      <span className="min-w-0 truncate text-sm font-medium" title={displayName}>
        {displayName}
      </span>
    </span>
  )

  if (href) {
    return (
      <Link
        href={href}
        className="min-w-0 max-w-full"
        onClick={(event) => event.stopPropagation()}
      >
        {inner}
      </Link>
    )
  }
  return inner
}

export function DirectoryCampusBadge({
  name,
  className,
}: {
  name?: string | null
  className?: string
}) {
  const text = (name ?? '').trim() || 'Sin sede'
  return (
    <Badge
      variant="static"
      data-slot="directory-campus-badge"
      className={cn(DIRECTORY_CAMPUS_PILL_CLASS, className)}
    >
      {text}
    </Badge>
  )
}

export type DirectoryStaffRef = {
  id?: string | number | null
  name: string
  photo?: string | null
  src?: string | null
}

function DirectoryStaffIcon({ staff }: { staff: DirectoryStaffRef }) {
  const name = staff.name.trim() || 'Sin asignar'
  const id = staff.id == null || staff.id === '' ? null : String(staff.id)
  const photo = canonicalizePayloadMediaUrl(staff.photo ?? staff.src ?? null)
  const avatar = (
    <span
      data-slot="directory-staff-icon"
      className="inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-background bg-muted text-muted-foreground"
      aria-label={name}
    >
      <EntityThumb src={photo} alt={name} fallback="person" size="sm" />
    </span>
  )

  const node = id ? (
    <Link
      href={`/dashboard/profesores/${id}`}
      onClick={(event) => event.stopPropagation()}
      className="inline-flex rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {avatar}
    </Link>
  ) : (
    <span className="inline-flex" onClick={(event) => event.stopPropagation()}>
      {avatar}
    </span>
  )

  return (
    <Tooltip>
      <TooltipTrigger asChild>{node}</TooltipTrigger>
      <TooltipContent>{name}</TooltipContent>
    </Tooltip>
  )
}

export function DirectoryStaffIcons({
  staff,
  className,
}: {
  staff: DirectoryStaffRef[]
  className?: string
}) {
  const items = staff.filter((item) => (item.name ?? '').trim().length > 0)
  if (items.length === 0) return null

  return (
    <div
      data-slot="directory-staff-icons"
      className={cn('flex min-w-0 items-center -space-x-1.5', className)}
    >
      {items.map((item, index) => (
        <DirectoryStaffIcon
          key={`${item.id ?? 'no-id'}-${item.name}-${index}`}
          staff={item}
        />
      ))}
    </div>
  )
}
