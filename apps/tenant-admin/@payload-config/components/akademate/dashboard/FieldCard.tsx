'use client'

import * as React from 'react'
import { Edit3 } from 'lucide-react'
import { Button } from '@payload-config/components/ui/button'
import { Card, CardContent } from '@payload-config/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@payload-config/components/ui/tooltip'
import { cn } from '@payload-config/lib/utils'

export interface FieldCardProps {
  label: string
  value: React.ReactNode
  helper?: React.ReactNode
  editable?: boolean
  onEdit?: () => void
  className?: string
}

export function FieldCard({ label, value, helper, editable, onEdit, className }: FieldCardProps) {
  return (
    <Card className={cn('shadow-sm transition-shadow hover:shadow-md', className)}>
      <CardContent className="flex min-h-28 flex-col justify-between p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
              {label}
            </span>
            <span className="min-w-0 text-lg font-semibold leading-tight text-foreground">{value}</span>
          </div>
          {editable ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" variant="outline" aria-label={`Editar ${label}`} onClick={onEdit}>
                    <Edit3 data-icon="inline-start" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Campo editable</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : null}
        </div>
        {helper ? <p className="text-xs leading-relaxed text-muted-foreground">{helper}</p> : null}
      </CardContent>
    </Card>
  )
}
