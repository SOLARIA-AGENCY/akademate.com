'use client'

import * as React from 'react'
import { Badge } from '@payload-config/components/ui/badge'
import { cn } from '@payload-config/lib/utils'

export type EntityPublicationState = 'published' | 'draft' | 'archived' | 'active' | 'inactive' | string | null | undefined

export function EntityStatusBadge({
  status,
  className,
}: {
  status: EntityPublicationState
  className?: string
}) {
  const normalized = String(status || '').toLowerCase()
  const isPublished = ['published', 'publicado', 'active', 'activo'].includes(normalized)
  const isArchived = ['archived', 'archivado', 'inactive', 'inactivo'].includes(normalized)

  return (
    <Badge
      variant="secondary"
      className={cn(
        'rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.04em]',
        isPublished && 'border-emerald-200 bg-emerald-50 text-emerald-700',
        isArchived && 'border-slate-200 bg-slate-100 text-slate-500',
        !isPublished && !isArchived && 'border-slate-200 bg-slate-100 text-slate-600',
        className
      )}
    >
      {isPublished ? 'Publicado' : isArchived ? 'Inactivo' : 'Sin publicar'}
    </Badge>
  )
}

export function CampaignStatusBadge({
  active,
  className,
}: {
  active?: boolean | null
  className?: string
}) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        'rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.04em]',
        active
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-slate-200 bg-slate-100 text-slate-500',
        className
      )}
    >
      {active ? 'Campaña activa' : 'Sin campaña'}
    </Badge>
  )
}

export function SubsidizedTrainingBadge({ className }: { className?: string }) {
  return (
    <Badge
      variant="secondary"
      className={cn('rounded-full border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.04em] text-emerald-700', className)}
    >
      Formación gratuita subvencionada
    </Badge>
  )
}

export function MediaBadge({
  children,
  tone = 'primary',
  className,
}: {
  children: React.ReactNode
  tone?: 'primary' | 'orange' | 'green' | 'slate'
  className?: string
}) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        'rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.04em] text-white',
        tone === 'primary' && 'bg-primary',
        tone === 'orange' && 'bg-orange-500',
        tone === 'green' && 'bg-emerald-600',
        tone === 'slate' && 'bg-slate-900',
        className
      )}
    >
      {children}
    </Badge>
  )
}
