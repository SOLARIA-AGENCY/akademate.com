'use client'

import * as React from 'react'
import { ArrowLeft, Search, type LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@payload-config/components/ui/badge'
import { Button } from '@payload-config/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@payload-config/components/ui/card'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@payload-config/components/ui/breadcrumb'
import { Input } from '@payload-config/components/ui/input'
import { Separator } from '@payload-config/components/ui/separator'
import { cn } from '@payload-config/lib/utils'

export interface AkadematePageShellProps {
  children: React.ReactNode
  className?: string
  contentClassName?: string
}

export function AkadematePageShell({
  children,
  className,
  contentClassName,
}: AkadematePageShellProps) {
  return (
    <div className={cn('min-h-full bg-background', className)}>
      <div className={cn('mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8', contentClassName)}>
        {children}
      </div>
    </div>
  )
}

export interface DashboardPageHeaderProps {
  title: string
  description?: string
  eyebrow?: string
  backHref?: string
  backLabel?: string
  actions?: React.ReactNode
  meta?: React.ReactNode
  className?: string
}

export function DashboardPageHeader({
  title,
  backHref,
  backLabel = 'Volver',
  actions,
  className,
}: DashboardPageHeaderProps) {
  return (
    <header className={cn('flex flex-col gap-4', className)}>
      {backHref ? (
        <Button asChild variant="ghost" size="sm" className="w-fit px-0">
          <Link href={backHref}>
            <ArrowLeft data-icon="inline-start" />
            {backLabel}
          </Link>
        </Button>
      ) : null}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground md:text-3xl">{title}</h1>
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  )
}

export interface DashboardBreadcrumbItem {
  label: string
  href?: string
}

export function DashboardBreadcrumb({
  items,
  className,
}: {
  items: DashboardBreadcrumbItem[]
  className?: string
}) {
  if (!items.length) return null

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <React.Fragment key={`${item.label}-${index}`}>
              <BreadcrumbItem>
                {item.href && !isLast ? (
                  <BreadcrumbLink asChild>
                    <Link href={item.href}>{item.label}</Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
              {!isLast ? <BreadcrumbSeparator /> : null}
            </React.Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

export interface DashboardToolbarProps {
  searchValue?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  filters?: React.ReactNode
  clearAction?: React.ReactNode
  actions?: React.ReactNode
  viewToggle?: React.ReactNode
  className?: string
}

export function DashboardToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Buscar...',
  filters,
  clearAction,
  actions,
  viewToggle,
  className,
}: DashboardToolbarProps) {
  return (
    <Card className={cn('border-border/80 shadow-sm', className)}>
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-3 xl:flex-nowrap">
          {typeof searchValue === 'string' && onSearchChange ? (
            <div className="relative min-w-[240px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchValue}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-9"
              />
            </div>
          ) : null}
          {filters ? <div className="flex flex-1 flex-wrap items-center gap-3 xl:flex-none">{filters}</div> : null}
          {clearAction ? <div className="flex flex-wrap items-center gap-2">{clearAction}</div> : null}
          {actions ? <div className="flex flex-wrap items-center gap-2 xl:ml-auto">{actions}</div> : null}
          {viewToggle ? <div className="ml-auto flex items-center">{viewToggle}</div> : null}
        </div>
      </CardContent>
    </Card>
  )
}

export const DashboardEntityHeader = DashboardPageHeader

export interface DashboardTitleCardProps {
  title: string
  description?: string
  actions?: React.ReactNode
  className?: string
}

export function DashboardTitleCard({
  title,
  description,
  actions,
  className,
}: DashboardTitleCardProps) {
  return (
    <Card className={cn('border-border/80 shadow-sm', className)}>
      <CardContent className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h1>
            {description ? (
              <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
      </CardContent>
    </Card>
  )
}

export interface DashboardStatItem {
  label: string
  value: React.ReactNode
  description?: React.ReactNode
  icon?: LucideIcon
  tone?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
}

const statToneClass: Record<NonNullable<DashboardStatItem['tone']>, string> = {
  default: 'text-foreground',
  primary: 'text-primary',
  success: 'text-emerald-600',
  warning: 'text-amber-600',
  danger: 'text-destructive',
  info: 'text-primary',
}

export function DashboardStatsGrid({
  items,
  className,
}: {
  items: DashboardStatItem[]
  className?: string
}) {
  if (!items.length) return null

  return (
    <div className={cn('grid gap-4 sm:grid-cols-2 xl:grid-cols-4', className)}>
      {items.map((item) => {
        const Icon = item.icon
        const tone = item.tone ?? 'default'
        return (
          <Card key={item.label} className="border-border/80 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-muted-foreground">{item.label}</p>
                  <div className={cn('mt-1 text-2xl font-bold leading-none', statToneClass[tone])}>
                    {item.value}
                  </div>
                  {item.description ? (
                    <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
                  ) : null}
                </div>
                {Icon ? <Icon className={cn('h-5 w-5 shrink-0 opacity-70', statToneClass[tone])} /> : null}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

export function DashboardListingLayout({
  title,
  description,
  actions,
  stats,
  toolbar,
  children,
  className,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
  stats?: DashboardStatItem[]
  toolbar?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('space-y-6', className)}>
      <DashboardTitleCard title={title} description={description} actions={actions} />
      {stats ? <DashboardStatsGrid items={stats} /> : null}
      {toolbar}
      {children}
    </div>
  )
}

export function DashboardListingShell({
  header,
  toolbar,
  children,
  className,
}: {
  header: React.ReactNode
  toolbar?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('space-y-6', className)}>
      {header}
      {toolbar}
      {children}
    </div>
  )
}

export interface DashboardSectionProps {
  title?: string
  description?: string
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
  contentClassName?: string
}

export function DashboardSection({
  title,
  description,
  actions,
  children,
  className,
  contentClassName,
}: DashboardSectionProps) {
  return (
    <section className={cn('flex flex-col gap-4', className)}>
      {title || description || actions ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            {title ? <h2 className="text-xl font-semibold tracking-tight text-foreground">{title}</h2> : null}
            {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      <div className={contentClassName}>{children}</div>
    </section>
  )
}

export interface EntityHeroCardProps {
  title: string
  subtitle?: string
  eyebrow?: string
  image?: string | null
  imageAlt?: string
  badges?: React.ReactNode
  fields?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}

export function EntityHeroCard({
  title,
  subtitle,
  eyebrow,
  image,
  imageAlt = '',
  badges,
  fields,
  actions,
  className,
}: EntityHeroCardProps) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col justify-between gap-6 p-6 lg:p-8">
          <div>
            {eyebrow ? (
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-primary">{eyebrow}</p>
            ) : null}
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground lg:text-3xl">{title}</h2>
            {subtitle ? <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">{subtitle}</p> : null}
            {badges ? <div className="mt-4 flex flex-wrap gap-2">{badges}</div> : null}
          </div>
          {fields ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{fields}</div> : null}
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </div>
        {image ? (
          <div className="min-h-64 bg-muted lg:min-h-full">
            <img src={image} alt={imageAlt} className="h-full min-h-64 w-full object-cover" />
          </div>
        ) : null}
      </div>
    </Card>
  )
}

export interface EntitySummaryCardProps {
  icon?: LucideIcon
  title: string
  description?: string
  badge?: React.ReactNode
  rows?: Array<{ label: string; value: React.ReactNode }>
  actions?: React.ReactNode
  className?: string
}

export function EntitySummaryCard({
  icon: Icon,
  title,
  description,
  badge,
  rows,
  actions,
  className,
}: EntitySummaryCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="min-w-0">
          <CardTitle className="flex items-center gap-2 text-base">
            {Icon ? <Icon data-icon="inline-start" /> : null}
            <span className="truncate">{title}</span>
          </CardTitle>
          {description ? <CardDescription className="mt-1 line-clamp-2">{description}</CardDescription> : null}
        </div>
        {badge ? <div className="shrink-0">{badge}</div> : null}
      </CardHeader>
      {(rows?.length || actions) ? (
        <CardContent className="flex flex-col gap-4">
          {rows?.length ? (
            <div className="flex flex-col gap-2">
              {rows.map((row) => (
                <div key={row.label} className="grid grid-cols-[120px_minmax(0,1fr)] items-start gap-3 text-sm">
                  <span className="font-medium text-muted-foreground">{row.label}</span>
                  <span className="min-w-0 text-right font-medium text-foreground">{row.value}</span>
                </div>
              ))}
            </div>
          ) : null}
          {actions ? (
            <>
              {rows?.length ? <Separator /> : null}
              <div className="flex justify-end gap-2">{actions}</div>
            </>
          ) : null}
        </CardContent>
      ) : null}
    </Card>
  )
}

export function ActionFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-end', className)}>
      {children}
    </div>
  )
}

export function SmallStatusBadge({
  children,
  variant = 'secondary',
}: {
  children: React.ReactNode
  variant?: React.ComponentProps<typeof Badge>['variant']
}) {
  return (
    <Badge variant={variant} className="rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.04em]">
      {children}
    </Badge>
  )
}
