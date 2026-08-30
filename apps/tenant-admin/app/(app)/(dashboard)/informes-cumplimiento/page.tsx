'use client'

import { useEffect, useState } from 'react'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'

type AuditRow = {
  groupCode: string
  title: string
  hours: number
  passPercent: number
  absencePercent: number
}

export default function ComplianceReportsPage() {
  const [rows, setRows] = useState<AuditRow[]>([])
  const [note, setNote] = useState('')

  useEffect(() => {
    void fetch('/api/compliance/reports')
      .then((response) => response.json())
      .then((payload) => {
        if (payload.success) {
          setRows(payload.data.courseAudit ?? [])
          setNote(payload.data.note ?? '')
        }
      })
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Informes de cumplimiento"
        description="Plantilla auditora genérica. El pack de zona define columnas extra cuando se active."
      />
      {note ? <p className="text-sm text-muted-foreground">{note}</p> : null}
      <Card>
        <CardHeader>
          <CardTitle>Datos de cursos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin convocatorias en la academia de verificación.</p>
          ) : (
            rows.map((row) => (
              <div key={row.groupCode} className="flex justify-between text-sm">
                <span>{row.groupCode} · {row.title}</span>
                <span>{row.hours} h · aprobado {row.passPercent}%</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
