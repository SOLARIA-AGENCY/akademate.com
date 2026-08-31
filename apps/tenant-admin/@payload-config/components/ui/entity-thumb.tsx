'use client'

import { useState } from 'react'
import { BookOpen, Building2, FileText, GraduationCap, type LucideIcon } from 'lucide-react'
import { cn } from '@payload-config/lib/utils'

const FALLBACKS: Record<'book' | 'cycle' | 'campus' | 'page', LucideIcon> = {
  book: BookOpen,
  cycle: GraduationCap,
  campus: Building2,
  page: FileText,
}

const SIZES = {
  sm: 'h-12 w-12',
  md: 'h-16 w-16',
  lg: 'h-20 w-20',
} as const

export type EntityThumbFallback = keyof typeof FALLBACKS
export type EntityThumbSize = keyof typeof SIZES

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
  const [failed, setFailed] = useState(false)
  const Icon = FALLBACKS[fallback]
  const showImage = Boolean(src?.trim()) && !failed

  return (
    <div
      data-slot="entity-thumb"
      className={cn(
        'aspect-square shrink-0 overflow-hidden rounded-lg bg-muted',
        SIZES[size],
        className
      )}
    >
      {showImage ? (
        <img
          src={src ?? ''}
          alt={alt}
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
          <Icon className="h-1/2 w-1/2" aria-hidden="true" />
          <span className="sr-only">{alt}</span>
        </div>
      )}
    </div>
  )
}
