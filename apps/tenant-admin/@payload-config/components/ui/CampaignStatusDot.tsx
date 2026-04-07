'use client'

import { Megaphone } from 'lucide-react'

type CampaignState = 'active' | 'paused' | 'draft' | 'completed' | 'archived' | 'none'

const CONFIG: Record<CampaignState, { label: string; dotClass: string; textClass: string }> = {
  active: { label: 'Campaña activa', dotClass: 'bg-green-500 animate-pulse', textClass: 'text-green-600' },
  paused: { label: 'Campaña en pausa', dotClass: 'bg-yellow-500', textClass: 'text-yellow-600' },
  draft: { label: 'Campaña borrador', dotClass: 'bg-gray-400', textClass: 'text-muted-foreground' },
  completed: { label: 'Campaña finalizada', dotClass: 'bg-blue-500', textClass: 'text-blue-600' },
  archived: { label: 'Campaña archivada', dotClass: 'bg-gray-300', textClass: 'text-muted-foreground' },
  none: { label: 'Sin campaña', dotClass: '', textClass: 'text-muted-foreground/50' },
}

interface CampaignStatusDotProps {
  status: CampaignState
  showLabel?: boolean
  size?: 'sm' | 'md'
  className?: string
}

export function CampaignStatusDot({ status, showLabel = false, size = 'sm', className = '' }: CampaignStatusDotProps) {
  const config = CONFIG[status] || CONFIG.none

  if (status === 'none') {
    if (!showLabel) return null
    return (
      <span className={`flex items-center gap-1 text-[10px] ${config.textClass} ${className}`} title="Sin campaña de marketing">
        <Megaphone className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
        {showLabel && <span>Sin campaña</span>}
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${className}`}
      title={config.label}
    >
      <Megaphone className={`${size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} ${config.textClass}`} />
      <span className={`${size === 'sm' ? 'h-2 w-2' : 'h-2.5 w-2.5'} rounded-full ${config.dotClass}`} />
      {showLabel && <span className={`text-[10px] font-medium ${config.textClass}`}>{config.label}</span>}
    </span>
  )
}

export type { CampaignState }
