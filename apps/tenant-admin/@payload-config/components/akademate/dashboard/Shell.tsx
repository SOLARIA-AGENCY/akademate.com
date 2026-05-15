'use client'

import * as React from 'react'
import { ArrowLeft, type LucideIcon } from 'lucide-react'
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
  description,
  eyebrow,
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
        <div className="min-w-0">
          {eyebrow ? (
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-primary">{eyebrow}</p>
          ) : null}
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground md:text-3xl">{title}</h1>
          {description ? (
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground md:text-base">
              {description}
            </p>
          ) : null}
          {meta ? <div className="mt-3 flex flex-wrap items-center gap-2">{meta}</div> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
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
