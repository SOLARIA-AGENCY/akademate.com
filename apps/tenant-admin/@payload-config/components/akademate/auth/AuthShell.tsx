'use client'

import * as React from 'react'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription } from '@payload-config/components/ui/alert'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@payload-config/components/ui/card'
import { Separator } from '@payload-config/components/ui/separator'
import { cn } from '@payload-config/lib/utils'

export interface AuthShellProps {
  academyName: string
  logoUrl?: string | null
  loading?: boolean
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
}

export function AuthShell({
  academyName,
  logoUrl,
  loading,
  title,
  description,
  children,
  footer,
  className,
}: AuthShellProps) {
  return (
    <main className={cn('flex min-h-screen items-center justify-center bg-background px-4 py-8', className)}>
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className={cn('flex size-20 items-center justify-center overflow-hidden rounded-full border bg-card shadow-sm transition-opacity', loading && 'opacity-0')}>
            {logoUrl ? <img src={logoUrl} alt={academyName} className="size-14 object-contain" /> : null}
          </div>
          <div className={cn('transition-opacity', loading && 'opacity-0')}>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{academyName}</h1>
            <p className="mt-1 text-sm text-muted-foreground">Panel de Administración</p>
          </div>
        </div>

        <Card className="border shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{title}</CardTitle>
            {description ? <CardDescription>{description}</CardDescription> : null}
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>

        {footer ? <div className="mt-6">{footer}</div> : null}
      </div>
    </main>
  )
}

export function AuthError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <Alert variant="destructive">
      <AlertTriangle data-icon="inline-start" />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}

export function AuthDivider({ label = 'O continúa con' }: { label?: string }) {
  return (
    <div className="flex items-center gap-3">
      <Separator className="flex-1" />
      <span className="text-xs font-medium uppercase tracking-[0.04em] text-muted-foreground">{label}</span>
      <Separator className="flex-1" />
    </div>
  )
}

export function AuthLegalFooter({ academyName }: { academyName: string }) {
  return (
    <div className="text-center text-sm text-muted-foreground">
      <p>© {new Date().getFullYear()} {academyName}. Todos los derechos reservados.</p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <Link href="/legal/privacidad" className="transition-colors hover:text-foreground">
          Privacidad
        </Link>
        <span>·</span>
        <Link href="/legal/terminos" className="transition-colors hover:text-foreground">
          Términos
        </Link>
        <span>·</span>
        <Link href="/legal/cookies" className="transition-colors hover:text-foreground">
          Cookies
        </Link>
      </div>
    </div>
  )
}
