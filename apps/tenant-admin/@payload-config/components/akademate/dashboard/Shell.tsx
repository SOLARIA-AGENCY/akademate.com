'use client'

import * as React from 'react'
import { ArrowLeft, Search, Printer, Download, type LucideIcon } from 'lucide-react'
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
    <div className={cn('min-h-full w-full bg-background', className)}>
      <div className={cn('flex w-full flex-col gap-6 p-4 sm:p-6 lg:p-8', contentClassName)}>
        {children}
      </div>
    </div>
  )
}

export interface DashboardPageHeaderProps {
  title: string
  description?: string
  eyebrow?: string
  icon?: LucideIcon
  backHref?: string
  backLabel?: string
  actions?: React.ReactNode
  meta?: React.ReactNode
  className?: string
}

export function DashboardPageHeader({
  title,
  description,
  eyebrow,
  icon: HeaderIcon,
  backHref,
  backLabel = 'Volver',
  actions,
  meta,
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
        <div className="flex min-w-0 items-start gap-3">
          {HeaderIcon ? (
            <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <HeaderIcon className="h-4 w-4" aria-hidden="true" />
            </span>
          ) : null}
          <div className="min-w-0">
            {eyebrow ? (
              <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                {eyebrow}
              </p>
            ) : null}
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
            {description ? (
              <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            ) : null}
            {meta ? <div className="mt-2 flex flex-wrap items-center gap-2">{meta}</div> : null}
          </div>
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
  desktopSingleLine?: boolean
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
  desktopSingleLine = false,
  className,
}: DashboardToolbarProps) {
  return (
    <Card className={cn('border-slate-200/80 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900 rounded-2xl', className)}>
      <CardContent className="p-4 sm:p-5">
        <div
          className={cn(
            'flex flex-wrap items-center gap-3 xl:flex-nowrap',
            desktopSingleLine && 'lg:flex-nowrap lg:gap-2'
          )}
          data-slot="dashboard-toolbar-row"
        >
          {typeof searchValue === 'string' && onSearchChange ? (
            <div
              className={cn(
                'relative min-w-[240px] flex-1',
                desktopSingleLine && 'min-w-0 basis-full sm:basis-64 lg:min-w-48 lg:basis-auto'
              )}
              data-slot="dashboard-toolbar-search"
            >
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchValue}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-9"
              />
            </div>
          ) : null}
          {filters ? (
            <div
              className={cn(
                'flex flex-1 flex-wrap items-center gap-3 xl:flex-none',
                desktopSingleLine && 'w-full lg:w-auto lg:flex-none lg:flex-nowrap lg:gap-2'
              )}
              data-slot="dashboard-toolbar-filters"
            >
              {filters}
            </div>
          ) : null}
          {clearAction ? <div className="flex flex-wrap items-center gap-2">{clearAction}</div> : null}
          {actions ? (
            <div
              className={cn(
                'flex flex-wrap items-center gap-2 xl:ml-auto',
                desktopSingleLine && 'lg:ml-auto lg:flex-nowrap'
              )}
            >
              {actions}
            </div>
          ) : null}
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
  icon?: LucideIcon
  actions?: React.ReactNode
  className?: string
  compact?: boolean
}

export function DashboardTitleCard({
  title,
  description,
  icon: TitleIcon,
  actions,
  className,
  compact = false,
}: DashboardTitleCardProps) {
  return (
    <Card className={cn('border-slate-200/80 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900 rounded-2xl', compact && 'rounded-xl', className)}>
      <CardContent className={compact ? 'px-4 py-2.5' : 'p-5 sm:p-6'}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3.5">
            {TitleIcon ? (
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100/80 dark:border-blue-900/60 shadow-2xs">
                <TitleIcon className="h-5 w-5" aria-hidden="true" />
              </span>
            ) : null}
            <div className="min-w-0">
              <h2 className="truncate text-xl sm:text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white">
                {title}
              </h2>
              {description ? (
                <p className={cn('mt-0.5 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400', compact && 'sr-only')}>
                  {description}
                </p>
              ) : null}
            </div>
          </div>
          {actions ? (
            <div className="flex shrink-0 flex-wrap items-center gap-2.5">{actions}</div>
          ) : null}
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
  default: 'text-slate-950 dark:text-white',
  primary: 'text-blue-600 dark:text-blue-400',
  success: 'text-emerald-600 dark:text-emerald-400',
  warning: 'text-amber-600 dark:text-amber-400',
  danger: 'text-rose-600 dark:text-rose-400',
  info: 'text-blue-600 dark:text-blue-400',
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
          <Card key={item.label} className="border-slate-200/80 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900 rounded-2xl">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{item.label}</p>
                  <div className={cn('mt-2 text-2xl font-extrabold tabular-nums tracking-tight', statToneClass[tone])}>
                    {item.value}
                  </div>
                  {item.description ? (
                    <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{item.description}</p>
                  ) : null}
                </div>
                {Icon ? (
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100/80 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700">
                    <Icon className="h-5 w-5" />
                  </div>
                ) : null}
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
  icon,
  actions,
  breadcrumbs,
  stats,
  toolbar,
  children,
  className,
}: {
  title: string
  description?: string
  icon?: LucideIcon
  actions?: React.ReactNode
  breadcrumbs?: DashboardBreadcrumbItem[]
  stats?: DashboardStatItem[]
  toolbar?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  const defaultBreadcrumbs: DashboardBreadcrumbItem[] = breadcrumbs ?? [
    { label: 'Dashboard', href: '/dashboard' },
    { label: title },
  ]
  const chromeRef = React.useRef<HTMLDivElement>(null)
  const shellRef = React.useRef<HTMLDivElement>(null)

  React.useLayoutEffect(() => {
    const chrome = chromeRef.current
    const shell = shellRef.current
    if (!chrome || !shell) return
    const sync = () => {
      let scroller: HTMLElement | null = chrome.parentElement
      let top = chrome.getBoundingClientRect().bottom
      while (scroller) {
        const overflowY = window.getComputedStyle(scroller).overflowY
        if (overflowY === 'auto' || overflowY === 'scroll') {
          top = chrome.getBoundingClientRect().bottom - scroller.getBoundingClientRect().top
          break
        }
        scroller = scroller.parentElement
      }
      shell.style.setProperty('--dashboard-thead-top', `${Math.round(top)}px`)
    }
    sync()
    const observer = new ResizeObserver(sync)
    observer.observe(chrome)
    window.addEventListener('scroll', sync, { passive: true })
    window.addEventListener('resize', sync)
    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', sync)
      window.removeEventListener('resize', sync)
    }
  }, [title, toolbar])

  return (
    <div ref={shellRef} className={cn('flex min-h-full w-full flex-1 flex-col gap-3', className)}>
      <DashboardBreadcrumb items={defaultBreadcrumbs} />
      <div
        ref={chromeRef}
        data-slot="dashboard-page-chrome"
        className="sticky top-0 z-20 flex shrink-0 flex-col gap-3 bg-background pb-2"
      >
        <DashboardTitleCard compact title={title} description={description} icon={icon} actions={actions} />
        {toolbar}
      </div>
      {stats ? <DashboardStatsGrid items={stats} /> : null}
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
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
            {title ? <h2 className="text-sm font-semibold tracking-tight text-foreground">{title}</h2> : null}
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
    <Badge variant={variant} className="rounded-full">
      {children}
    </Badge>
  )
}

export function ListingActions({
  children,
  onPrint,
  onCsv,
  className,
}: {
  children?: React.ReactNode
  onPrint?: () => void
  onCsv?: () => void
  className?: string
}) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {onPrint ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl shadow-2xs h-9 px-3"
          onClick={onPrint}
          aria-label="Imprimir listado"
          title="Imprimir listado"
        >
          <Printer className="h-4 w-4" />
          <span className="hidden xl:inline ml-1.5 text-xs">Imprimir</span>
        </Button>
      ) : null}
      {onCsv ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl shadow-2xs h-9 px-3"
          onClick={onCsv}
          aria-label="Descargar CSV"
          title="Descargar CSV"
        >
          <Download className="h-4 w-4" />
          <span className="hidden xl:inline ml-1.5 text-xs">Descargar CSV</span>
        </Button>
      ) : null}
      {children}
    </div>
  )
}

export const ACADEMIC_LISTING_GRID_CLASS = 'grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'
export const ACADEMIC_ENTITY_META_CLASS = 'text-xs text-slate-500 font-medium'
export const AKADEMATE_ACADEMIC_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80'

export function AcademicEntityCard({
  title,
  subtitle,
  fallbackImage = AKADEMATE_ACADEMIC_FALLBACK_IMAGE,
  badge,
  listCells,
  tiles,
  variant = 'card',
  onClick,
  onCtaClick,
  className,
}: {
  title: string
  subtitle?: string
  fallbackImage?: string
  badge?: React.ReactNode
  listCells?: React.ReactNode[]
  tiles?: React.ReactNode[]
  variant?: 'card' | 'list'
  onClick?: () => void
  onCtaClick?: () => void
  className?: string
}) {
  if (variant === 'list') {
    return (
      <Card
        className={cn(
          'group cursor-pointer overflow-hidden border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-xs transition-all hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700',
          className
        )}
        onClick={onClick}
      >
        <CardContent className="flex items-center justify-between p-4 sm:p-5 gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <img
              src={fallbackImage}
              alt={title}
              className="h-12 w-12 rounded-full object-cover ring-2 ring-slate-100 dark:ring-slate-800 shrink-0"
            />
            <div className="min-w-0">
              <h3 className="truncate text-sm font-extrabold text-slate-950 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {title}
              </h3>
              {subtitle ? <p className="truncate text-xs font-semibold text-slate-500 dark:text-slate-400">{subtitle}</p> : null}
              {listCells ? (
                <div className="mt-1 flex flex-wrap gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                  {listCells.map((cell, idx) => (
                    <span key={idx} className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      {cell}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {badge}
            <Button
              size="sm"
              className="h-8 px-3 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
              onClick={(e) => {
                e.stopPropagation()
                onCtaClick ? onCtaClick() : onClick?.()
              }}
            >
              Ver ficha
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      className={cn(
        'group cursor-pointer overflow-hidden border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-xs transition-all hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 flex flex-col justify-between',
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-5 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <img
            src={fallbackImage}
            alt={title}
            className="h-14 w-14 rounded-2xl object-cover ring-2 ring-slate-100 dark:ring-slate-800 shadow-xs shrink-0"
          />
          {badge}
        </div>
        <div className="space-y-1 min-w-0">
          <h3 className="text-base font-extrabold text-slate-950 dark:text-white tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
            {title}
          </h3>
          {subtitle ? (
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 line-clamp-2">{subtitle}</p>
          ) : null}
        </div>
        {tiles && tiles.length > 0 ? (
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            {tiles.map((tile, i) => (
              <div key={i} className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300">
                {tile}
              </div>
            ))}
          </div>
        ) : null}
        <Button
          size="sm"
          className="mt-2 w-full h-9 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
          onClick={(e) => {
            e.stopPropagation()
            onCtaClick ? onCtaClick() : onClick?.()
          }}
        >
          Ver detalles
        </Button>
      </CardContent>
    </Card>
  )
}
