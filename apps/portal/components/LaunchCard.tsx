'use client'

import { ArrowUpRight } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface LaunchCardProps {
  icon: string
  title: string
  subtitle: string
  port: string
  description: string
  hasAutoLogin?: boolean
  credentials?: Array<{ label: string; value: string }>
  onOpen: () => void
  className?: string
}

export function LaunchCard({
  icon,
  title,
  subtitle,
  port,
  description,
  hasAutoLogin = false,
  credentials,
  onOpen,
  className,
}: LaunchCardProps) {
  return (
    <Card className={`h-full border-border bg-card/95 shadow-sm ${className ?? ''}`}>
      <CardHeader className="p-6 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg md:text-xl">
              <span className="mr-2">{icon}</span>
              {title}
            </CardTitle>
            <CardDescription className="mt-1">{subtitle}</CardDescription>
          </div>
          <Badge variant="default">{port}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex h-full flex-col gap-4 p-6 pt-0">
        <p className="text-sm text-muted-foreground">{description}</p>
        {hasAutoLogin ? <Badge variant="warning">AUTO-LOGIN DEV</Badge> : null}
        {credentials?.length ? (
          <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs text-foreground">
            {credentials.map((credential) => (
              <div key={credential.label} className="flex justify-between gap-3">
                <span className="text-muted-foreground">{credential.label}</span>
                <code className="text-foreground">{credential.value}</code>
              </div>
            ))}
          </div>
        ) : null}
        <Button onClick={onOpen} className="mt-auto w-full">
          ABRIR
          <ArrowUpRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  )
}
