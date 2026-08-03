'use client'

import * as React from 'react'
import { AlertTriangle, UserRoundX } from 'lucide-react'
import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  NativeSelect,
  Textarea,
} from '@akademate/ui'

export type EnrollmentCancellationResponse = {
  enrollmentId: number
  status: 'cancelled' | 'withdrawn'
  promotedEnrollmentId: number | null
  replayed: boolean
  capacityReleased: boolean
  financialFollowUpRequired: boolean
}

export function EnrollmentCancellationPanel({
  enrollmentId,
  status,
  onCompleted,
}: {
  enrollmentId: string | number
  status?: string
  onCompleted: (result: EnrollmentCancellationResponse) => void
}) {
  const [nextAvailable, setNextAvailable] = React.useState(false)
  const [confirming, setConfirming] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [cancellationType, setCancellationType] = React.useState<'cancelled' | 'withdrawn'>('withdrawn')
  const [reason, setReason] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)
  const [result, setResult] = React.useState<EnrollmentCancellationResponse | null>(null)

  React.useEffect(() => {
    let active = true
    void fetch('/api/next/session', { cache: 'no-store' })
      .then((response) => {
        if (active) setNextAvailable(response.ok)
      })
      .catch(() => {
        if (active) setNextAvailable(false)
      })
    return () => { active = false }
  }, [])

  if (!nextAvailable) return null

  async function submit() {
    setSubmitting(true)
    setError(null)
    try {
      const response = await fetch(`/api/next/enrollments/${String(enrollmentId)}/cancel`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ cancellationType, reason: reason.trim() }),
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(body?.error === 'capacity_inconsistent'
          ? 'El aforo necesita revisión antes de completar la baja.'
          : 'No se pudo completar la baja de forma segura.')
      }
      const completed = body as EnrollmentCancellationResponse
      setResult(completed)
      setConfirming(false)
      onCompleted(completed)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo completar la baja.')
    } finally {
      setSubmitting(false)
    }
  }

  if (result) {
    return (
      <Alert>
        <UserRoundX className="h-4 w-4" />
        <AlertDescription className="space-y-1">
          <p>La matrícula se ha actualizado como {result.status === 'withdrawn' ? 'baja voluntaria' : 'cancelada'}.</p>
          {result.promotedEnrollmentId ? <p>La primera persona en lista de espera ha recibido la plaza.</p> : null}
          {result.financialFollowUpRequired ? (
            <p className="font-medium">Existe un importe registrado: revisa el seguimiento financiero por separado.</p>
          ) : null}
        </AlertDescription>
      </Alert>
    )
  }

  if (!['pending', 'confirmed', 'waitlisted'].includes(status ?? '')) return null

  if (!confirming) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserRoundX className="h-4 w-4" />
            Ciclo de la matrícula
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          <p className="max-w-2xl text-sm text-muted-foreground">
            Registra una baja y reconcilia el aforo y la lista de espera en una sola operación auditada.
          </p>
          <Button variant="outline" onClick={() => setConfirming(true)}>Gestionar baja</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="h-4 w-4" />
          Confirmar baja de matrícula
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Si la matrícula ocupa plaza, Akademate actualizará el aforo y promoverá la primera solicitud en espera. Los pagos no se modificarán.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm font-medium">
            Tipo de baja
            <NativeSelect
              aria-label="Tipo de baja"
              value={cancellationType}
              onChange={(event) => setCancellationType(event.target.value as 'cancelled' | 'withdrawn')}
            >
              <option value="withdrawn">Baja solicitada por el alumno</option>
              <option value="cancelled">Cancelación administrativa</option>
            </NativeSelect>
          </label>
          <label className="space-y-2 text-sm font-medium">
            Motivo auditado
            <Textarea
              aria-label="Motivo auditado"
              value={reason}
              maxLength={500}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Describe brevemente el motivo"
            />
          </label>
        </div>
        {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
        <div className="flex justify-end gap-2">
          <Button variant="outline" disabled={submitting} onClick={() => setConfirming(false)}>Volver</Button>
          <Button disabled={submitting || reason.trim().length < 3} onClick={() => void submit()}>
            {submitting ? 'Procesando…' : 'Confirmar baja'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
