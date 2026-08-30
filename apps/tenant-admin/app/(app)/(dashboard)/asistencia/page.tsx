'use client'

import { useEffect, useState } from 'react'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { Badge } from '@payload-config/components/ui/badge'
import { Button } from '@payload-config/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'

type Mark = { enrollmentId: string; date: string; code: string; scheduledHours: number }
type EventRow = { type: string; enrollmentId: number | string | null; value: number; atDate: string }

export default function AttendanceRosterPage() {
  const [packId, setPackId] = useState('global-empty')
  const [marks, setMarks] = useState<Mark[]>([])
  const [events, setEvents] = useState<EventRow[]>([])
  const [codes, setCodes] = useState<string[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    void (async () => {
      const policy = await fetch('/api/compliance/policy').then((response) => response.json())
      if (!policy.success) {
        setError('Staff only. Learners cannot see this roster.')
        return
      }
      setPackId(policy.data.packId)
      setCodes((policy.data.policy.attendanceCodes ?? []).map((code: { code: string }) => code.code))
      const roster = await fetch('/api/compliance/attendance?courseRunId=verify-run').then((response) => response.json())
      if (roster.success) {
        setMarks(roster.data.marks ?? [])
        setEvents(roster.data.events ?? [])
      }
    })()
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Asistencia interna"
        description="Rejilla staff-only. Los códigos vienen del pack de zona activo, no del núcleo."
      />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div className="flex flex-wrap items-center gap-2">
        <Badge>Pack {packId}</Badge>
        {codes.map((code) => (
          <Badge key={code} variant="outline">{code}</Badge>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Marcas del grupo sintético</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {marks.length === 0 ? (
            <p className="text-sm text-muted-foreground">Todavía no hay marcas. Siembra el grupo de verificación y registra A / F / FJ.</p>
          ) : (
            marks.map((mark) => (
              <div key={`${mark.enrollmentId}-${mark.date}`} className="flex justify-between text-sm">
                <span>{mark.date}</span>
                <span>Matrícula {mark.enrollmentId}</span>
                <strong>{mark.code}</strong>
              </div>
            ))
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Alertas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin umbrales cruzados.</p>
          ) : (
            events.map((event, index) => (
              <p key={`${event.type}-${index}`} className="text-sm">
                {event.type} · {event.value} · {event.atDate}
              </p>
            ))
          )}
          <Button variant="outline" onClick={() => { window.location.href = '/informes-cumplimiento' }}>
            Ver informes
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
