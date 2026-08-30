'use client'

import * as React from 'react'
import { Badge, type BadgeTone } from '@payload-config/components/ui/badge'
import { cn } from '@payload-config/lib/utils'

export type EntityPublicationState =
  | 'published'
  | 'draft'
  | 'archived'
  | 'active'
  | 'inactive'
  | string
  | null
  | undefined

function publicationTone(status: EntityPublicationState): { tone: BadgeTone; label: string } {
  const normalized = String(status || '').toLowerCase()
  if (['published', 'publicado', 'active', 'activo'].includes(normalized)) {
    return { tone: 'success', label: 'Publicado' }
  }
  if (['archived', 'archivado', 'inactive', 'inactivo'].includes(normalized)) {
    return { tone: 'neutral', label: 'Inactivo' }
  }
  return { tone: 'neutral', label: 'Sin publicar' }
}

export function EntityStatusBadge({
  status,
  className,
}: {
  status: EntityPublicationState
  className?: string
}) {
  const { tone, label } = publicationTone(status)
  return (
    <Badge tone={tone} className={className}>
      {label}
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
    <Badge tone={active ? 'success' : 'neutral'} className={className}>
      {active ? 'Campaña activa' : 'Sin campaña'}
    </Badge>
  )
}

export function SubsidizedTrainingBadge({ className }: { className?: string }) {
  return (
    <Badge tone="success" className={className}>
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
  const mapped: BadgeTone =
    tone === 'green' ? 'success' : tone === 'orange' ? 'warning' : tone === 'slate' ? 'neutral' : 'info'

  return (
    <Badge tone={mapped} variant={tone === 'primary' ? 'solid' : 'soft'} className={cn(className)}>
      {children}
    </Badge>
  )
}
