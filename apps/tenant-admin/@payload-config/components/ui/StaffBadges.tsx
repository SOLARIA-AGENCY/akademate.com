import type React from 'react'
import { BookOpen, MapPin } from 'lucide-react'
import { Badge } from '@payload-config/components/ui/badge'
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
  if (normalized === 'inactivo' || normalized === 'inactiva' || normalized === 'retirado') return 'inactive'
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

  return (
    <Badge
      className={cn(
        'h-6 w-[6.75rem] max-w-full justify-center rounded-full px-3 text-[11px] font-bold uppercase leading-none tracking-[0.02em] shadow-sm',
        active
          ? 'border-transparent bg-primary text-primary-foreground hover:bg-primary/90'
          : 'border-transparent bg-neutral text-neutral-foreground hover:bg-neutral/90',
        className
      )}
      {...props}
    >
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
        'h-6 w-[8.75rem] max-w-full justify-center rounded-full px-3 text-[11px] font-semibold leading-none',
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
        'h-6 w-[9.25rem] max-w-full justify-center gap-1 rounded-full px-3 text-[11px] font-semibold leading-none',
        className
      )}
      {...props}
    >
      <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
      <span className="truncate">{children}</span>
    </Badge>
  )
}

const areaBadgeStyles = [
  'border-emerald-200 bg-emerald-50 text-emerald-800',
  'border-violet-200 bg-violet-50 text-violet-800',
  'border-amber-200 bg-amber-50 text-amber-800',
  'border-rose-200 bg-rose-50 text-rose-800',
  'border-red-200 bg-red-50 text-red-800',
  'border-slate-200 bg-slate-50 text-slate-800',
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
        'h-6 max-w-full justify-center rounded-full px-2.5 text-[11px] font-semibold leading-none',
        getAreaStyle(seed),
        className
      )}
      {...props}
    >
      <span className="truncate">{children}</span>
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
        'h-6 w-[8.75rem] max-w-full justify-center gap-1 rounded-full px-3 text-[11px] font-semibold leading-none',
        className
      )}
      {...props}
    >
      <BookOpen className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {count} {label}
    </Badge>
  )
}
