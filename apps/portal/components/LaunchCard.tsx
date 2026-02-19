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
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">
              <span className="mr-2">{icon}</span>
              {title}
            </CardTitle>
            <CardDescription>{subtitle}</CardDescription>
          </div>
          <Badge variant="default">{port}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-slate-300">{description}</p>
        {hasAutoLogin ? <Badge variant="warning">AUTO-LOGIN DEV</Badge> : null}
        {credentials?.length ? (
          <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3 text-xs text-slate-300">
            {credentials.map((credential) => (
              <div key={credential.label} className="flex justify-between gap-3">
                <span className="text-slate-400">{credential.label}</span>
                <code className="text-slate-200">{credential.value}</code>
              </div>
            ))}
          </div>
        ) : null}
        <Button onClick={onOpen} className="w-full">
          ABRIR
          <ArrowUpRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  )
}
