import * as React from 'react'

export interface PremiumCardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean
}

export const PremiumCard = React.forwardRef<HTMLDivElement, PremiumCardProps>(
  ({ className = '', hoverEffect = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.03),0_1px_2px_-1px_rgba(0,0,0,0.03)] ${
          hoverEffect ? 'transition-all duration-200 hover:border-slate-300 hover:shadow-[0_4px_12px_0_rgba(0,0,0,0.05)]' : ''
        } ${className}`}
        {...props}
      >
        {children}
      </div>
    )
  }
)
PremiumCard.displayName = 'PremiumCard'

export interface PremiumCardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  subtitle?: string
  icon?: React.ReactNode
  action?: React.ReactNode
}

export const PremiumCardHeader: React.FC<PremiumCardHeaderProps> = ({
  title,
  subtitle,
  icon,
  action,
  className = '',
}) => {
  return (
    <div className={`flex items-center justify-between border-b border-slate-100 pb-4 mb-5 ${className}`}>
      <div className="flex items-center gap-3">
        {icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100/80 shadow-2xs">
            {icon}
          </div>
        )}
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 font-normal mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

export interface PremiumDataListProps extends React.HTMLAttributes<HTMLDListElement> {
  columns?: 1 | 2 | 3 | 4
}

export const PremiumDataList: React.FC<PremiumDataListProps> = ({
  columns = 2,
  className = '',
  children,
  ...props
}) => {
  const colClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4',
  }[columns]

  return (
    <dl className={`grid gap-x-6 gap-y-5 ${colClass} ${className}`} {...props}>
      {children}
    </dl>
  )
}

export interface PremiumDataItemProps {
  label: string
  value: React.ReactNode
  mono?: boolean
  className?: string
}

export const PremiumDataItem: React.FC<PremiumDataItemProps> = ({
  label,
  value,
  mono = false,
  className = '',
}) => {
  return (
    <div className={className}>
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 select-none">
        {label}
      </dt>
      <dd
        className={`mt-1.5 text-sm font-bold text-slate-900 ${
          mono ? 'font-mono inline-block rounded-md bg-slate-100/90 px-2 py-0.5 text-xs text-slate-700 border border-slate-200/80 font-semibold' : ''
        }`}
      >
        {value}
      </dd>
    </div>
  )
}

export type PremiumBadgeVariant = 'success' | 'warning' | 'info' | 'neutral' | 'danger'

export interface PremiumBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: PremiumBadgeVariant
  pulse?: boolean
  dot?: boolean
}

export const PremiumBadge: React.FC<PremiumBadgeProps> = ({
  variant = 'neutral',
  pulse = false,
  dot = true,
  children,
  className = '',
  ...props
}) => {
  const styles = {
    success: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dot-bg-emerald-600',
    warning: 'bg-amber-50 text-amber-700 ring-amber-600/20 dot-bg-amber-500',
    info: 'bg-blue-50 text-blue-700 ring-blue-600/20 dot-bg-blue-600',
    neutral: 'bg-slate-100 text-slate-700 ring-slate-300 dot-bg-slate-500',
    danger: 'bg-rose-50 text-rose-700 ring-rose-600/20 dot-bg-rose-600',
  }[variant]

  const dotColor = {
    success: 'bg-emerald-600',
    warning: 'bg-amber-500',
    info: 'bg-blue-600',
    neutral: 'bg-slate-500',
    danger: 'bg-rose-600',
  }[variant]

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ring-inset ${styles} ${className}`}
      {...props}
    >
      {dot && (
        <span
          className={`h-1.5 w-1.5 rounded-full ${dotColor} ${pulse ? 'animate-pulse' : ''}`}
        />
      )}
      {children}
    </span>
  )
}

export interface PremiumListItemProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode
  title: string
  subtitle?: React.ReactNode
  badge?: React.ReactNode
  action?: React.ReactNode
}

export const PremiumListItem: React.FC<PremiumListItemProps> = ({
  icon,
  title,
  subtitle,
  badge,
  action,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`group flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-4 transition-all duration-200 hover:border-blue-200 hover:bg-slate-50/50 hover:shadow-xs ${className}`}
      {...props}
    >
      <div className="flex items-center gap-3.5">
        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100/80 text-slate-600 font-bold border border-slate-200/80 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-100 transition-colors">
            {icon}
          </div>
        )}
        <div>
          <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors tracking-tight">
            {title}
          </h4>
          {subtitle && (
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mt-0.5">
              {subtitle}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {badge}
        {action}
      </div>
    </div>
  )
}
