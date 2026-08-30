'use client'

import { useEffect, useState } from 'react'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { Badge } from '@payload-config/components/ui/badge'
import { Card, CardContent } from '@payload-config/components/ui/card'

type Row = {
  id: number | string
  displayName: string
  stage: string
  captureChannel?: string
  sourceLabel?: string
}

export default function SelectionBoardPage() {
  const [rows, setRows] = useState<Row[]>([])

  useEffect(() => {
    void fetch('/api/compliance/selection')
      .then((response) => response.json())
      .then((payload) => {
        if (payload.success) setRows(payload.data)
      })
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tablero de selección"
        description="Vista de pájaro por convocatoria. Solo registros sintéticos en este ciclo."
      />
      <div className="grid gap-3">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay candidaturas sintéticas todavía.</p>
        ) : (
          rows.map((row) => (
            <Card key={String(row.id)}>
              <CardContent className="flex items-center justify-between gap-4 py-4">
                <div>
                  <p className="font-medium">{row.displayName}</p>
                  <p className="text-xs text-muted-foreground">{row.sourceLabel ?? 'synthetic'}</p>
                </div>
                <div className="flex gap-2">
                  <Badge>{row.stage}</Badge>
                  {row.captureChannel ? <Badge variant="outline">{row.captureChannel}</Badge> : null}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
