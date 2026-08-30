import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@payload-config/lib/utils'

export type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger'

/** Shared listing pill: same height as “Activo”. */
export const LISTING_PILL_CLASS =
  'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium'

const badgeVariants = cva(
  `${LISTING_PILL_CLASS} transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2`,
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 'text-foreground',
        success: 'border-transparent bg-success text-success-foreground',
        warning: 'border-transparent bg-warning text-warning-foreground',
        info: 'border-transparent bg-primary text-primary-foreground',
        neutral: 'border-transparent bg-muted text-muted-foreground',
        soft: 'border-transparent',
        solid: 'border-transparent',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

const toneClass: Record<BadgeTone, Record<'soft' | 'solid' | 'outline', string>> = {
  neutral: {
    soft: 'border-transparent bg-neutral-soft text-neutral-soft-foreground',
    solid: 'border-transparent bg-neutral text-neutral-foreground',
    outline: 'border-border text-muted-foreground',
  },
  info: {
    soft: 'border-transparent bg-info-soft text-info-soft-foreground',
    solid: 'border-transparent bg-info text-info-foreground',
    outline: 'border-info text-info',
  },
  success: {
    soft: 'border-transparent bg-success-soft text-success-soft-foreground',
    solid: 'border-transparent bg-success text-success-foreground',
    outline: 'border-success text-success',
  },
  warning: {
    soft: 'border-transparent bg-warning-soft text-warning-soft-foreground',
    solid: 'border-transparent bg-warning text-warning-foreground',
    outline: 'border-warning text-warning',
  },
  danger: {
    soft: 'border-transparent bg-danger-soft text-danger-soft-foreground',
    solid: 'border-transparent bg-destructive text-destructive-foreground',
    outline: 'border-destructive text-destructive',
  },
}

function resolveToneLook(variant: BadgeProps['variant']): 'soft' | 'solid' | 'outline' {
  if (variant === 'solid') return 'solid'
  if (variant === 'outline') return 'outline'
  return 'soft'
}

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  tone?: BadgeTone
}

function Badge({ className, variant, tone, ...props }: BadgeProps) {
  const toneLookup = tone ? toneClass[tone][resolveToneLook(variant)] : undefined

  return (
    <div
      className={cn(badgeVariants({ variant: tone ? 'soft' : variant }), toneLookup, className)}
      {...props}
    />
  )
}

export function StatusDotBadge({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={cn(LISTING_PILL_CLASS, className)} {...props}>
      {children}
    </span>
  )
}

export { Badge, badgeVariants }
