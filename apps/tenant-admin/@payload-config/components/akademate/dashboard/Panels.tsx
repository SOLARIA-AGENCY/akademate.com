'use client'

import * as React from 'react'
import { AlertCircle, Inbox, Loader2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@payload-config/components/ui/alert'
import { Button } from '@payload-config/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { cn } from '@payload-config/lib/utils'

export function FormSection({
  title,
  description,
  children,
  actions,
  className,
}: {
  title: string
  description?: string
  children: React.ReactNode
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
          {description ? <CardDescription className="mt-1">{description}</CardDescription> : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

export function EmptyPanel({
  title = 'Sin datos',
  description,
  action,
  className,
}: {
  title?: string
  description?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center', className)}>
      <Inbox className="size-8 text-muted-foreground" />
      <p className="mt-3 font-semibold text-foreground">{title}</p>
      {description ? <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}

export function LoadingPanel({ label = 'Cargando datos...' }: { label?: string }) {
  return (
    <div className="flex min-h-48 items-center justify-center rounded-xl border bg-card text-muted-foreground">
      <Loader2 className="mr-2 size-5 animate-spin" />
      {label}
    </div>
  )
}

export function ErrorPanel({
  title = 'No se pudo cargar la información',
  description,
  retry,
}: {
  title?: string
  description?: string
  retry?: () => void
}) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="size-4" />
      <AlertTitle>{title}</AlertTitle>
      {description ? <AlertDescription>{description}</AlertDescription> : null}
      {retry ? (
        <div className="mt-4">
          <Button type="button" variant="outline" onClick={retry}>
            Reintentar
          </Button>
        </div>
      ) : null}
    </Alert>
  )
}
