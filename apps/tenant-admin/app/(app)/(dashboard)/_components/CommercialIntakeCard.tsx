import Link from 'next/link'
import type { ReactNode } from 'react'
import { Card, CardContent } from '@payload-config/components/ui/card'
import { Badge } from '@payload-config/components/ui/badge'
import { Button } from '@payload-config/components/ui/button'
import { Mail, Phone, ArrowUpRight } from 'lucide-react'

interface VisualBadge {
  label: string
  className?: string
}

interface CommercialIntakeCardProps {
  className?: string
  fullName: string
  statusLabel: string
  statusClassName: string
  programLabel: string
  email?: string | null
  phone?: string | null
  provenanceLabel?: string
  timeLabel?: string
  badges?: VisualBadge[]
  footerLeft?: ReactNode
  viewHref: string
  viewLabel?: string
}

function mergeClassNames(...values: Array<string | undefined>): string {
  return values.filter((value) => typeof value === 'string' && value.trim().length > 0).join(' ')
}

export function CommercialIntakeCard({
  className,
  fullName,
  statusLabel,
  statusClassName,
  programLabel,
  email,
  phone,
  provenanceLabel,
  timeLabel,
  badges,
  footerLeft,
  viewHref,
  viewLabel = 'Ver ficha',
}: CommercialIntakeCardProps) {
  return (
    <Card className={mergeClassNames('transition-shadow hover:shadow-md', className)}>
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-semibold text-foreground">{fullName}</h3>
            <p className="mt-1 truncate text-sm text-muted-foreground">{programLabel}</p>
          </div>
          <Badge variant="outline" className={mergeClassNames('text-xs', statusClassName)}>
            {statusLabel}
          </Badge>
        </div>

        <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <span className="inline-flex min-w-0 items-center gap-1">
              <Mail className="h-3.5 w-3.5" />
              <span className="truncate">{email || 'Sin email'}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <Phone className="h-3.5 w-3.5" />
              <span>{phone || 'Sin teléfono'}</span>
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            {provenanceLabel ? <span>{provenanceLabel}</span> : null}
            {timeLabel ? <span>{timeLabel}</span> : null}
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {Array.isArray(badges)
              ? badges.map((badge) => (
                  <Badge key={`${badge.label}-${badge.className || 'default'}`} variant="outline" className={mergeClassNames('text-[11px]', badge.className)}>
                    {badge.label}
                  </Badge>
                ))
              : null}
            {footerLeft}
          </div>

          <Button asChild size="sm" className="whitespace-nowrap">
            <Link href={viewHref}>
              {viewLabel}
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
