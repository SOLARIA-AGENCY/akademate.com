'use client'

import { Badge } from '@payload-config/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@payload-config/components/ui/collapsible'
import { Separator } from '@payload-config/components/ui/separator'
import { Skeleton } from '@payload-config/components/ui/skeleton'
import { ChevronDown } from 'lucide-react'
import {
  accessKindLabel,
  payableAmount,
  type EnrollmentDraft,
} from './types'

function euros(value: number): string {
  return `${value.toLocaleString('es-ES')} €`
}

export function EnrollmentCart({ draft }: { draft: EnrollmentDraft }) {
  const amount = payableAmount(draft)
  const course = draft.course
  const body = course ? (
    <div className="space-y-3 text-sm">
      <div className="space-y-1">
        <p className="font-semibold leading-snug">{course.name}</p>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{accessKindLabel(course.accessKind)}</Badge>
          <span className="text-muted-foreground">{course.campusName}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          {course.startDate || 'Sin fecha de inicio'}
          {course.endDate ? ` · ${course.endDate}` : ''}
        </p>
      </div>
      <Separator />
      <dl className="space-y-1.5">
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Reserva</dt>
          <dd>{euros(course.enrollmentFee)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Docencia</dt>
          <dd>{euros(course.price)}</dd>
        </div>
        {draft.discount > 0 ? (
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Descuento</dt>
            <dd>−{euros(draft.discount)}</dd>
          </div>
        ) : null}
        <div className="flex justify-between gap-3 font-semibold">
          <dt>Total</dt>
          <dd>{euros(amount)}</dd>
        </div>
      </dl>
    </div>
  ) : (
    <div className="space-y-2">
      <Skeleton className="h-5 w-3/4" />
      <p className="text-sm text-muted-foreground">Selecciona una convocatoria</p>
    </div>
  )

  return (
    <>
      <div className="lg:hidden">
        <Collapsible>
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border bg-card px-4 py-3 text-sm font-medium">
            <span>Ticket de matrícula</span>
            <ChevronDown className="h-4 w-4" />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">{body}</CollapsibleContent>
        </Collapsible>
      </div>
      <Card className="hidden lg:block" data-slot="enrollment-cart">
        <CardHeader>
          <CardTitle className="text-base">Ticket</CardTitle>
        </CardHeader>
        <CardContent>{body}</CardContent>
      </Card>
    </>
  )
}
