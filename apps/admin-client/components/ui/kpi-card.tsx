 
import * as React from 'react'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export interface KPICardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string
  value: string | number
  trend?: {
    value: number
    direction: 'up' | 'down' | 'neutral'
    label?: string
  }
  icon?: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  loading?: boolean
}

const variantStyles = {
  default: '',
  success: 'border-l-4 border-l-success',
  warning: 'border-l-4 border-l-warning',
  danger: 'border-l-4 border-l-destructive',
  info: 'border-l-4 border-l-info',
}

const valueColors = {
  default: 'text-foreground',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-destructive',
  info: 'text-info',
}

function KPICard({
  className,
  label,
  value,
  trend,
  icon,
  variant = 'default',
  loading = false,
  ...props
}: KPICardProps) {
  if (loading) {
    return (
      <div
        className={cn('kpi-card', variantStyles[variant], className) as string}
        {...props}
      >
        <div className="flex items-start justify-between">
          <div className="space-y-3 flex-1">
            <div className="skeleton-text w-24" />
            <div className="skeleton-title w-20" />
          </div>
          {icon && <div className="skeleton-avatar !h-10 !w-10" />}
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn('kpi-card', variantStyles[variant], className) as string}
      {...props}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="kpi-label">{label}</p>
          <p className={cn('kpi-value', valueColors[variant]) as string}>{value}</p>
          {trend && (
            <div className="flex items-center gap-1.5 mt-2">
              {trend.direction === 'up' && (
                <TrendingUp className="h-4 w-4 text-success" />
              )}
              {trend.direction === 'down' && (
                <TrendingDown className="h-4 w-4 text-destructive" />
              )}
              {trend.direction === 'neutral' && (
                <Minus className="h-4 w-4 text-muted-foreground" />
              )}
              <span
                className={cn(
                  'text-sm font-medium',
                  trend.direction === 'up' && 'text-success',
                  trend.direction === 'down' && 'text-destructive',
                  trend.direction === 'neutral' && 'text-muted-foreground'
                ) as string}
              >
                {trend.value > 0 ? '+' : ''}{trend.value}%
              </span>
              {trend.label && (
                <span className="text-xs text-muted-foreground">
                  {trend.label}
                </span>
              )}
            </div>
          )}
        </div>
        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}

export { KPICard }
