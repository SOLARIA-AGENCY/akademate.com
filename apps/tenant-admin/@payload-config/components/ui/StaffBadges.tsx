import type React from 'react'
import { BookOpen, MapPin } from 'lucide-react'
import { Badge, LISTING_PILL_CLASS } from '@payload-config/components/ui/badge'
import { cn } from '@payload-config/lib/utils'

type StaffStatus = 'active' | 'inactive' | 'temporary_leave' | boolean | string

const statusLabel: Record<string, string> = {
  active: 'Activo',
  inactive: 'Inactivo',
  temporary_leave: 'Baja temporal',
}

function normalizeStatus(status: StaffStatus) {
  if (typeof status === 'boolean') return status ? 'active' : 'inactive'

  const normalized = String(status).trim().toLowerCase().replace(/\s+/g, '_')
  if (normalized === 'activo' || normalized === 'activa') return 'active'
  if (normalized === 'inactivo' || normalized === 'inactiva' || normalized === 'retirado')
    return 'inactive'
  if (normalized === 'baja_temporal' || normalized === 'temporary_leave') return 'temporary_leave'
  return normalized
}

export function StaffStatusBadge({
  status,
  className,
  ...props
}: {
  status: StaffStatus
  className?: string
} & React.HTMLAttributes<HTMLDivElement>) {
  const normalized = normalizeStatus(status)
  const active = normalized === 'active'
  const temporaryLeave = normalized === 'temporary_leave'

  const styles = active
    ? 'border-emerald-600/20 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 ring-1 ring-inset ring-emerald-600/20 dark:ring-emerald-500/30'
    : temporaryLeave
      ? 'border-amber-600/20 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 ring-1 ring-inset ring-amber-600/20 dark:ring-amber-500/30'
      : 'border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 ring-1 ring-inset ring-slate-200 dark:ring-slate-700'

  return (
    <Badge
      className={cn(
        LISTING_PILL_CLASS,
        'justify-center gap-1.5 border-transparent shadow-2xs',
        styles,
        className
      )}
      {...props}
    >
      {active && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />}
      {statusLabel[normalized] ?? normalized}
    </Badge>
  )
}

export function StaffContractBadge({
  children,
  className,
  ...props
}: {
  children: React.ReactNode
  className?: string
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <Badge
      variant="outline"
      className={cn(
        LISTING_PILL_CLASS,
        'max-w-full justify-center bg-slate-100/90 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200/80 dark:border-slate-700',
        className
      )}
      {...props}
    >
      <span className="truncate">{children}</span>
    </Badge>
  )
}

export function StaffCampusBadge({
  children,
  className,
  ...props
}: {
  children: React.ReactNode
  className?: string
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        LISTING_PILL_CLASS,
        'max-w-full justify-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200/60 dark:border-slate-700',
        className
      )}
      {...props}
    >
      <MapPin className="h-3 w-3 shrink-0 text-slate-500 dark:text-slate-400" aria-hidden="true" />
      <span className="truncate">{children}</span>
    </Badge>
  )
}

const areaBadgeStyles = [
  'border-blue-200/80 dark:border-blue-800 bg-blue-50/80 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300',
  'border-purple-200/80 dark:border-purple-800 bg-purple-50/80 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300',
  'border-emerald-200/80 dark:border-emerald-800 bg-emerald-50/80 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300',
  'border-indigo-200/80 dark:border-indigo-800 bg-indigo-50/80 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300',
  'border-amber-200/80 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300',
  'border-slate-200/80 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
]

function getAreaStyle(seed: string | number) {
  const value = String(seed)
  const hash = value.split('').reduce((total, char) => total + char.charCodeAt(0), 0)
  return areaBadgeStyles[hash % areaBadgeStyles.length]
}

export function StaffAreaBadge({
  children,
  seed,
  className,
  ...props
}: {
  children: React.ReactNode
  seed: string | number
  className?: string
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <Badge
      variant="outline"
      className={cn(
        LISTING_PILL_CLASS,
        'max-w-full justify-center',
        getAreaStyle(seed),
        className
      )}
      {...props}
    >
      <span className="whitespace-normal text-center leading-tight">{children}</span>
    </Badge>
  )
}

export function StaffCountBadge({
  count,
  label = 'convocatorias',
  className,
  ...props
}: {
  count: number
  label?: string
  className?: string
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <Badge
      variant="outline"
      className={cn(
        LISTING_PILL_CLASS,
        'max-w-full justify-center gap-1 bg-blue-50/60 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200/80 dark:border-blue-800',
        className
      )}
      {...props}
    >
      <BookOpen className="h-3.5 w-3.5 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden="true" />
      {count} {label}
    </Badge>
  )
}
