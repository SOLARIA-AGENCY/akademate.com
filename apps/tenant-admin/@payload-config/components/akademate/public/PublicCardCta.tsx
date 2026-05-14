'use client'

import type * as React from 'react'
import { ArrowRight } from 'lucide-react'
import { cn } from '@payload-config/lib/utils'

export function PublicCardCta({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full bg-[#f2014b] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-[#d0013f]',
        className
      )}
    >
      {children}
      <ArrowRight className="size-4" />
    </span>
  )
}
