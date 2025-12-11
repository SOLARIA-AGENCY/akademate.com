import * as React from 'react'
import { cn } from '@/lib/utils'
import { ArrowRight, ChevronRight } from 'lucide-react'
import Link from 'next/link'

export interface ActionCardProps {
  title: string
  description: string
  href?: string
  action?: {
    label: string
    onClick?: () => void
  }
  icon?: React.ReactNode
  variant?: 'default' | 'gradient' | 'warning' | 'danger' | 'outlined'
  badge?: {
    text: string
    variant?: 'default' | 'success' | 'warning' | 'danger'
  }
  loading?: boolean
  className?: string
}

const badgeVariants = {
  default: 'bg-muted text-muted-foreground',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-destructive/10 text-destructive',
}

function ActionCard({
  className,
  title,
  description,
  href,
  action,
  icon,
  variant = 'default',
  badge,
  loading = false,
}: ActionCardProps) {
  if (loading) {
    return (
      <div className={cn('action-card', className)}>
        <div className="flex items-start gap-4">
          {icon && <div className="skeleton-avatar" />}
          <div className="flex-1 space-y-2">
            <div className="skeleton-text w-32" />
            <div className="skeleton-text w-full" />
            <div className="skeleton-text w-24 mt-3" />
          </div>
        </div>
      </div>
    )
  }

  const cardContent = (
    <>
      <div className="flex items-start gap-4">
        {icon && (
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
              variant === 'gradient'
                ? 'bg-white/20'
                : 'bg-primary/10 text-primary'
            )}
          >
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3
              className={cn(
                'font-semibold',
                variant === 'gradient' ? 'text-white' : 'text-foreground'
              )}
            >
              {title}
            </h3>
            {badge && (
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                  badgeVariants[badge.variant || 'default']
                )}
              >
                {badge.text}
              </span>
            )}
          </div>
          <p
            className={cn(
              'text-sm',
              variant === 'gradient'
                ? 'text-white/80'
                : 'text-muted-foreground'
            )}
          >
            {description}
          </p>
        </div>
        {(href || action) && (
          <ChevronRight
            className={cn(
              'h-5 w-5 shrink-0 transition-transform group-hover:translate-x-0.5',
              variant === 'gradient'
                ? 'text-white/60'
                : 'text-muted-foreground'
            )}
          />
        )}
      </div>

      {action && !href && (
        <div className="mt-4 pt-4 border-t border-border/50">
          <button
            onClick={action.onClick}
            className={cn(
              'inline-flex items-center gap-2 text-sm font-medium transition-colors',
              variant === 'gradient'
                ? 'text-white hover:text-white/80'
                : 'text-primary hover:text-primary/80'
            )}
          >
            {action.label}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </>
  )

  const cardClasses = cn(
    'action-card group',
    variant === 'gradient' && 'action-card-gradient',
    variant === 'warning' && 'action-card-warning',
    variant === 'danger' && 'action-card-danger',
    variant === 'outlined' && 'bg-transparent',
    href && 'cursor-pointer',
    className
  )

  if (href) {
    return (
      <Link href={href} className={cardClasses}>
        {cardContent}
      </Link>
    )
  }

  return (
    <div className={cardClasses}>
      {cardContent}
    </div>
  )
}

export { ActionCard }
