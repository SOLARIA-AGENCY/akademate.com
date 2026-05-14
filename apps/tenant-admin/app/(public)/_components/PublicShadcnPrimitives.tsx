import type * as React from 'react'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { Badge } from '@payload-config/components/ui/badge'
import { buttonVariants } from '@payload-config/components/ui/button'
import { Card, CardContent } from '@payload-config/components/ui/card'
import { cn } from '@payload-config/lib/utils'

export function PublicMediaBadge({
  children,
  tone = 'primary',
  className,
}: {
  children: React.ReactNode
  tone?: 'primary' | 'success' | 'warning' | 'info' | 'neutral'
  className?: string
}) {
  const toneClass = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700',
    warning: 'bg-orange-500 text-white hover:bg-orange-600',
    info: 'bg-blue-600 text-white hover:bg-blue-700',
    neutral: 'bg-slate-900 text-white hover:bg-slate-950',
  }[tone]

  return <Badge className={cn('rounded-full shadow-sm', toneClass, className)}>{children}</Badge>
}

export function PublicInfoTile({
  label,
  value,
  helper,
  className,
}: {
  label: string
  value: React.ReactNode
  helper?: React.ReactNode
  className?: string
}) {
  return (
    <Card className={cn('border-slate-200 bg-white/90 shadow-sm', className)}>
      <CardContent className="p-3">
        <p className="text-[10px] font-black uppercase tracking-[0.08em] text-slate-500">{label}</p>
        <p className="mt-1 line-clamp-2 text-sm font-bold leading-snug text-slate-950">{value}</p>
        {helper ? <p className="mt-1 line-clamp-2 text-xs leading-snug text-slate-500">{helper}</p> : null}
      </CardContent>
    </Card>
  )
}

export function PublicInfoGrid({
  items,
  columns = 2,
  className,
}: {
  items: Array<{ label: string; value: React.ReactNode; helper?: React.ReactNode }>
  columns?: 1 | 2 | 4
  className?: string
}) {
  return (
    <div
      className={cn(
        'grid gap-2',
        columns === 1 && 'grid-cols-1',
        columns === 2 && 'sm:grid-cols-2',
        columns === 4 && 'sm:grid-cols-2 xl:grid-cols-4',
        className
      )}
    >
      {items.map((item) => (
        <PublicInfoTile key={item.label} {...item} />
      ))}
    </div>
  )
}

export function PublicInfoRows({
  items,
  className,
}: {
  items: Array<{ label: string; value: React.ReactNode }>
  className?: string
}) {
  return (
    <div className={cn('grid gap-3 rounded-xl bg-slate-50 p-4', className)}>
      {items.map((item) => (
        <div key={item.label} className="grid gap-1 text-sm sm:grid-cols-[120px_minmax(0,1fr)] sm:gap-4">
          <span className="font-bold text-slate-950">{item.label}</span>
          <span className="min-w-0 text-slate-600 sm:text-right">{item.value}</span>
        </div>
      ))}
    </div>
  )
}

export function PublicBulletList({ items, className }: { items: string[]; className?: string }) {
  return (
    <ul className={cn('grid gap-2 text-sm leading-relaxed text-slate-600', className)}>
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2">
          <CheckCircle2 data-icon="inline-start" className="mt-0.5 text-primary" />
          <span className="min-w-0">{item}</span>
        </li>
      ))}
    </ul>
  )
}

export function PublicCardCta({
  children = 'Ver detalle',
  className,
}: {
  children?: React.ReactNode
  className?: string
}) {
  return (
    <span className={cn(buttonVariants(), 'rounded-full bg-[#f2014b] px-5 font-black text-white hover:bg-[#d0013f]', className)}>
      {children}
      <ArrowRight data-icon="inline-end" />
    </span>
  )
}
