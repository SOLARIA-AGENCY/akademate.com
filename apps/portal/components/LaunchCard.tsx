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
    <Card className={`border-white/10 bg-white/[0.03] shadow-2xl backdrop-blur-sm ${className ?? ''}`}>
      <CardHeader className="p-6 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg md:text-xl">
              <span className="mr-2">{icon}</span>
              {title}
            </CardTitle>
            <CardDescription className="mt-1">{subtitle}</CardDescription>
          </div>
          <Badge variant="default" className="bg-white/10 text-white">
            {port}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-6 pt-0">
        <p className="text-sm text-muted-foreground/90">{description}</p>
        {hasAutoLogin ? (
          <Badge variant="warning" className="w-fit bg-amber-400 text-black">
            AUTO-LOGIN DEV
          </Badge>
        ) : null}
        {credentials?.length ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-foreground">
            {credentials.map((credential) => (
              <div key={credential.label} className="flex justify-between gap-3">
                <span className="text-white/60">{credential.label}</span>
                <code className="text-white">{credential.value}</code>
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
