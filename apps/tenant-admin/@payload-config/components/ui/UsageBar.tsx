'use client'

import { useRouter } from 'next/navigation'
import { AlertTriangle, XCircle } from 'lucide-react'
import { Button } from './button'
import { RESOURCE_LABELS, type ResourceKey } from '../../lib/planLimits'

interface UsageBarProps {
  resource: ResourceKey
  current: number
  limit: number
}

export function UsageBar({ resource, current, limit }: UsageBarProps) {
  const router = useRouter()

  // No mostrar si ilimitado, límite 0 (bloqueado por botón), o sin uso
  if (!isFinite(limit) || limit === 0 || current === 0) return null

  const ratio = current / limit
  if (ratio < 0.8) return null

  const isAtLimit = ratio >= 1
  const label = RESOURCE_LABELS[resource]
  const percentage = Math.min(Math.round(ratio * 100), 100)

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border px-4 py-2.5 text-sm ${
        isAtLimit
          ? 'border-destructive/30 bg-destructive/10 text-destructive'
          : 'border-amber-500/30 bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
      }`}
      data-oid="usage-bar"
    >
      {isAtLimit ? (
        <XCircle className="h-4 w-4 shrink-0" data-oid="usage-bar-icon" />
      ) : (
        <AlertTriangle className="h-4 w-4 shrink-0" data-oid="usage-bar-icon" />
      )}
      <span className="flex-1" data-oid="usage-bar-text">
        {isAtLimit
          ? `Límite alcanzado: ${current} de ${limit} ${label} usados`
          : `Límite próximo (${percentage}%): ${current} de ${limit} ${label} usados`}
      </span>
      <Button
        size="sm"
        variant="outline"
        className="h-7 text-xs"
        onClick={() => router.push('/facturacion')}
        data-oid="usage-bar-cta"
      >
        Ampliar plan
      </Button>
    </div>
  )
}
