'use client'

import * as React from 'react'
import Link from 'next/link'
import { CheckCircle2, Circle, Plus, type LucideIcon } from 'lucide-react'
import { Badge, type BadgeTone } from '@payload-config/components/ui/badge'
import { Button } from '@payload-config/components/ui/button'
import { Card, CardContent } from '@payload-config/components/ui/card'
import { cn } from '@payload-config/lib/utils'

export function MetricCard({
  label,
  value,
  delta,
  deltaTone = 'neutral',
  comparison,
  icon: Icon,
  href,
  className,
}: {
  label: string
  value: React.ReactNode
  delta?: React.ReactNode
  deltaTone?: BadgeTone
  comparison?: React.ReactNode
  icon?: LucideIcon
  href?: string
  className?: string
}) {
  const inner = (
    <Card className={cn('border-border/80 shadow-none', className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm text-muted-foreground">{label}</p>
          {Icon ? <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" /> : null}
        </div>
        <div className="mt-2 text-3xl font-semibold tabular-nums leading-none text-foreground">{value}</div>
        {delta ? (
          <div className="mt-2">
            <Badge tone={deltaTone}>{delta}</Badge>
          </div>
        ) : null}
        {comparison ? <p className="mt-2 text-xs text-muted-foreground">{comparison}</p> : null}
      </CardContent>
    </Card>
  )

  if (!href) return inner
  return (
    <Link href={href} className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      {inner}
    </Link>
  )
}

export function MetricGrid({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={cn('grid gap-4 sm:grid-cols-2 xl:grid-cols-4', className)}>{children}</div>
}

export function SectionCard({
  title,
  href,
  hrefLabel = 'Ver todo',
  icon: Icon,
  children,
  className,
}: {
  title: string
  href?: string
  hrefLabel?: string
  icon?: LucideIcon
  children: React.ReactNode
  className?: string
}) {
  return (
    <Card className={cn('border-border/80 shadow-none', className)}>
      <CardContent className="p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            {Icon ? <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" /> : null}
            <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          </div>
          {href ? (
            <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs">
              <Link href={href}>{hrefLabel}</Link>
            </Button>
          ) : null}
        </div>
        {children}
      </CardContent>
    </Card>
  )
}

export function IntegrationCard({
  name,
  status,
  statusTone = 'success',
  meta,
  href,
  actionLabel = 'Abrir',
  className,
}: {
  name: string
  status: string
  statusTone?: BadgeTone
  meta?: React.ReactNode
  href?: string
  actionLabel?: string
  className?: string
}) {
  return (
    <Card className={cn('border-border/80 shadow-none', className)}>
      <CardContent className="flex h-full flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-semibold text-foreground">{name}</p>
          <Badge tone={statusTone}>{status}</Badge>
        </div>
        {meta ? <p className="text-xs text-muted-foreground">{meta}</p> : null}
        {href ? (
          <Button asChild variant="outline" size="sm" className="mt-auto w-fit">
            <Link href={href}>{actionLabel}</Link>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}

export function AddCard({
  label,
  href,
  className,
}: {
  label: string
  href?: string
  className?: string
}) {
  const content = (
    <div
      className={cn(
        'flex min-h-36 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border p-5 text-center',
        className
      )}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Plus className="h-4 w-4" aria-hidden="true" />
      </span>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
    </div>
  )

  if (!href) return content
  return (
    <Link href={href} className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      {content}
    </Link>
  )
}

export function ChecklistPanel({
  title,
  href,
  hrefLabel = 'Ver',
  steps,
  className,
}: {
  title: string
  href?: string
  hrefLabel?: string
  steps: Array<{ label: string; description?: string; status: 'done' | 'current' | 'pending' }>
  className?: string
}) {
  return (
    <SectionCard title={title} href={href} hrefLabel={hrefLabel} className={className}>
      <ol className="space-y-3">
        {steps.map((step) => {
          const done = step.status === 'done'
          const current = step.status === 'current'
          return (
            <li key={step.label} className="flex items-start gap-3">
              {done ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
              ) : (
                <Circle
                  className={cn(
                    'mt-0.5 h-4 w-4 shrink-0',
                    current ? 'text-primary' : 'text-muted-foreground'
                  )}
                  aria-hidden="true"
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">{step.label}</p>
                  <Badge tone={done ? 'success' : current ? 'info' : 'neutral'}>
                    {done ? 'Completo' : current ? 'En curso' : 'Pendiente'}
                  </Badge>
                </div>
                {step.description ? (
                  <p className="mt-0.5 text-xs text-muted-foreground">{step.description}</p>
                ) : null}
              </div>
            </li>
          )
        })}
      </ol>
    </SectionCard>
  )
}

export function SummaryList({
  items,
  className,
}: {
  items: Array<{ label: string; value: React.ReactNode; tone?: BadgeTone; percent?: number }>
  className?: string
}) {
  return (
    <ul className={cn('space-y-3', className)}>
      {items.map((item) => (
        <li key={item.label} className="space-y-1.5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-foreground">{item.label}</span>
            {item.tone ? <Badge tone={item.tone}>{item.value}</Badge> : <span className="text-sm tabular-nums">{item.value}</span>}
          </div>
          {typeof item.percent === 'number' ? (
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${Math.max(0, Math.min(100, item.percent))}%` }}
              />
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  )
}
