import * as React from 'react'

import { cn } from '../lib/cn'
import { Card, CardContent } from './card'

export function WorkspaceShell({
  sidebar,
  children,
  className,
}: {
  sidebar: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'min-h-screen bg-background lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]',
        className
      )}
    >
      {sidebar}
      <div className="min-w-0 p-4 sm:p-6 lg:p-8">{children}</div>
    </div>
  )
}

export function WorkspaceSidebar({ children, className }: React.HTMLAttributes<HTMLElement>) {
  return (
    <aside
      className={cn(
        'flex flex-col border-b border-sidebar-border bg-sidebar px-4 py-4 text-sidebar-foreground lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r lg:px-4 lg:py-6',
        className
      )}
    >
      {children}
    </aside>
  )
}

export function WorkspaceBrand({ eyebrow, name }: { eyebrow?: string; name: string }) {
  return (
    <div className="px-2">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary font-semibold text-sidebar-primary-foreground shadow-sm">
        A
      </div>
      <div className="mt-4 hidden lg:block">
        {eyebrow && <p className="text-xs text-sidebar-foreground/60">{eyebrow}</p>}
        <p className="text-sm font-semibold">{name}</p>
      </div>
    </div>
  )
}

export function WorkspaceNav({ children, className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <nav
      className={cn(
        'mt-4 grid grid-cols-2 gap-2 lg:mt-8 lg:flex lg:grid-cols-none lg:flex-col',
        className
      )}
      {...props}
    >
      {children}
    </nav>
  )
}

export function WorkspaceNavItem({
  active = false,
  asChild = false,
  className,
  ...props
}: React.HTMLAttributes<HTMLElement> & { active?: boolean; asChild?: boolean }) {
  const classes = cn(
    'inline-flex min-h-10 shrink-0 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/75 transition-colors duration-200 ease-in-out hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
    active && 'bg-sidebar-accent text-sidebar-accent-foreground',
    className
  )
  if (asChild && React.isValidElement(props.children)) {
    const child = props.children as React.ReactElement<{
      className?: string
      'aria-current'?: 'page'
    }>
    return React.cloneElement(child, {
      className: cn(classes, child.props.className),
      'aria-current': active ? 'page' : undefined,
    })
  }
  return <div className={classes} aria-current={active ? 'page' : undefined} {...props} />
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string
  title: string
  description?: string
  actions?: React.ReactNode
}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        {eyebrow && <p className="text-xs font-medium text-primary">{eyebrow}</p>}
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        {description && <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  )
}

export function MetricCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string
  value: React.ReactNode
  hint?: string
  icon?: React.ReactNode
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
            {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
          </div>
          {icon && (
            <div className="rounded-lg bg-primary/10 p-2 text-primary" aria-hidden="true">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string
  description: string
  action?: React.ReactNode
  icon?: React.ReactNode
}) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-lg border border-dashed border-border p-6 text-center">
      {icon && (
        <div className="mb-3 rounded-full bg-muted p-3 text-muted-foreground" aria-hidden="true">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
