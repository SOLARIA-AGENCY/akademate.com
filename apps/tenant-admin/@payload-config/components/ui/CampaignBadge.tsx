'use client'

import Link from 'next/link'
import { Megaphone } from 'lucide-react'

type CampaignState = 'active' | 'paused' | 'draft' | 'completed' | 'archived' | 'none'

const CONFIG: Record<CampaignState, {
  label: string
  dotClass: string
  bgClass: string
  textClass: string
  borderClass: string
}> = {
  active: {
    label: 'Campaña activa',
    dotClass: 'bg-green-500 animate-pulse',
    bgClass: 'bg-green-50 dark:bg-green-950',
    textClass: 'text-green-700 dark:text-green-400',
    borderClass: 'border-green-200 dark:border-green-800',
  },
  paused: {
    label: 'Campaña en pausa',
    dotClass: 'bg-yellow-500',
    bgClass: 'bg-yellow-50 dark:bg-yellow-950',
    textClass: 'text-yellow-700 dark:text-yellow-400',
    borderClass: 'border-yellow-200 dark:border-yellow-800',
  },
  draft: {
    label: 'Campaña borrador',
    dotClass: 'bg-gray-400',
    bgClass: 'bg-muted',
    textClass: 'text-muted-foreground',
    borderClass: 'border-border',
  },
  completed: {
    label: 'Campaña finalizada',
    dotClass: 'bg-blue-500',
    bgClass: 'bg-blue-50 dark:bg-blue-950',
    textClass: 'text-blue-700 dark:text-blue-400',
    borderClass: 'border-blue-200 dark:border-blue-800',
  },
  archived: {
    label: 'Campaña archivada',
    dotClass: 'bg-gray-300',
    bgClass: 'bg-muted',
    textClass: 'text-muted-foreground',
    borderClass: 'border-border',
  },
  none: {
    label: 'Sin campaña',
    dotClass: 'bg-gray-300',
    bgClass: 'bg-muted/50',
    textClass: 'text-muted-foreground',
    borderClass: 'border-dashed border-border',
  },
}

interface CampaignBadgeProps {
  status: CampaignState
  campaignId?: string | null
  className?: string
}

export function CampaignBadge({ status, campaignId, className = '' }: CampaignBadgeProps) {
  const config = CONFIG[status] || CONFIG.none

  const content = (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium transition-colors
        ${config.bgClass} ${config.textClass} ${config.borderClass}
        ${campaignId || status === 'none' ? 'hover:opacity-80 cursor-pointer' : ''}
        ${className}`}
    >
      <Megaphone className="h-3.5 w-3.5 shrink-0" />
      <span className={`h-2 w-2 rounded-full shrink-0 ${config.dotClass}`} />
      <span className="whitespace-nowrap">{config.label}</span>
    </span>
  )

  // If there's a campaign, link to it
  if (campaignId) {
    return (
      <Link href={`/campanas/${campaignId}`} onClick={(e) => e.stopPropagation()}>
        {content}
      </Link>
    )
  }

  // If no campaign, link to create one
  if (status === 'none') {
    return (
      <Link href="/campanas" onClick={(e) => e.stopPropagation()}>
        {content}
      </Link>
    )
  }

  return content
}

export type { CampaignState }
