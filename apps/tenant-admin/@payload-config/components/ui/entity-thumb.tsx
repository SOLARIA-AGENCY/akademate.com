'use client'

import { useState } from 'react'
import { BookOpen, Building2, FileText, GraduationCap, User, type LucideIcon } from 'lucide-react'
import { cn } from '@payload-config/lib/utils'
import { canonicalizePayloadMediaUrl } from '@/app/lib/payload-media-url'
import { STOCK_FALLBACK_IMAGES, type StockFallbackKind } from '@/app/lib/stock-fallbacks'

const ICON_FALLBACKS: Record<StockFallbackKind, LucideIcon> = {
  book: BookOpen,
  cycle: GraduationCap,
  campus: Building2,
  page: FileText,
  person: User,
  student: User,
  admin: User,
}

const SIZES = {
  sm: 'h-10 w-10',
  md: 'h-12 w-12',
  lg: 'h-12 w-12',
} as const

export type EntityThumbFallback = StockFallbackKind
export type EntityThumbSize = keyof typeof SIZES

function initialsFromName(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (parts.length === 0) return '—'
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function EntityThumb({
  src,
  alt,
  fallback = 'book',
  size = 'md',
  className,
}: {
  src?: string | null
  alt: string
  fallback?: EntityThumbFallback
  size?: EntityThumbSize
  className?: string
}) {
  const [customFailed, setCustomFailed] = useState(false)
  const [stockFailed, setStockFailed] = useState(false)
  const Icon = ICON_FALLBACKS[fallback]
  const resolved = canonicalizePayloadMediaUrl(src)
  const stockSrc = STOCK_FALLBACK_IMAGES[fallback]
  const customOk = Boolean(resolved) && !customFailed
  const usesInitialsFallback =
    fallback === 'person' || fallback === 'student' || fallback === 'admin'
  const imageSrc = customOk ? resolved : usesInitialsFallback || stockFailed ? null : stockSrc
  const useInitials = !imageSrc && usesInitialsFallback

  return (
    <div
      data-slot="entity-thumb"
      className={cn(
        'aspect-square h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-muted',
        SIZES[size],
        className
      )}
    >
      {imageSrc ? (
        <img
          src={imageSrc}
          alt={alt}
          className="h-full w-full object-cover"
          onError={() => {
            if (customOk) {
              setCustomFailed(true)
              return
            }
            setStockFailed(true)
          }}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
          {useInitials ? (
            <span className="text-xs font-semibold uppercase tracking-wide" aria-hidden="true">
              {initialsFromName(alt)}
            </span>
          ) : (
            <Icon className="h-1/2 w-1/2" aria-hidden="true" />
          )}
          <span className="sr-only">{alt}</span>
        </div>
      )}
    </div>
  )
}
