'use client'

import { Badge } from '@payload-config/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@payload-config/components/ui/collapsible'
import { ChevronDown, ShoppingBag } from 'lucide-react'
import {
  accessKindLabel,
  payableAmount,
  type EnrollmentDraft,
} from './types'

function personLabel(draft: EnrollmentDraft): string {
  const name = `${draft.person.firstName} ${draft.person.lastName}`.trim()
  return name || draft.person.email || draft.searchQuery || 'Sin identificar'
}

export function EnrollmentCart({ draft }: { draft: EnrollmentDraft }) {
  const amount = payableAmount(draft)

  const body = (
    <div className="space-y-3 text-sm">
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Persona</p>
        <p className="font-medium">{personLabel(draft)}</p>
        {draft.person.email ? <p className="text-muted-foreground">{draft.person.email}</p> : null}
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Convocatoria</p>
        {draft.course ? (
          <div className="space-y-1">
            <p className="font-medium">{draft.course.name}</p>
            <p className="text-muted-foreground">{draft.course.campusName}</p>
            <Badge variant="outline">{accessKindLabel(draft.course.accessKind)}</Badge>
          </div>
        ) : (
          <p className="text-muted-foreground">Todavía no hay curso seleccionado</p>
        )}
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Importe estimado</p>
        <p className="text-2xl font-semibold">{amount.toLocaleString('es-ES')} €</p>
        {draft.discount > 0 ? (
          <p className="text-xs text-muted-foreground">Descuento {draft.discount.toLocaleString('es-ES')} €</p>
        ) : null}
      </div>
    </div>
  )

  return (
    <>
      <div className="lg:hidden">
        <Collapsible>
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border bg-card px-4 py-3 text-sm font-medium">
            <span className="inline-flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              Resumen de matrícula
            </span>
            <ChevronDown className="h-4 w-4" />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">{body}</CollapsibleContent>
        </Collapsible>
      </div>
      <Card className="hidden lg:block">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShoppingBag className="h-4 w-4" />
            Resumen
          </CardTitle>
        </CardHeader>
        <CardContent>{body}</CardContent>
      </Card>
    </>
  )
}
