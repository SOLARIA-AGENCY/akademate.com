'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { DashboardPageShell } from '@payload-config/components/akademate/dashboard'
import { Eye } from 'lucide-react'

type AnalyticsPayload = {
  traffic?: Array<{ label?: string; date?: string; value?: number; sessions?: number }>
  top_pages?: Array<{ path?: string; page?: string; views?: number; value?: number }>
}

export default function VisitantesPage() {
  const [data, setData] = useState<AnalyticsPayload | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch('/api/analytics/dashboard?range=30d', { cache: 'no-store' })
        if (!response.ok) throw new Error('No se pudo cargar el tráfico')
        setData((await response.json()) as AnalyticsPayload)
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'No se pudo cargar el tráfico')
      }
    }
    void load()
  }, [])

  const traffic = data?.traffic ?? []
  const pages = data?.top_pages ?? []

  return (
    <DashboardPageShell
      title="Visitantes"
      icon={Eye}
      actions={
        <Button asChild variant="outline" size="sm">
          <Link href="/analiticas">Ver Analíticas</Link>
        </Button>
      }
    >
      {errorMessage ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errorMessage}
        </div>
      ) : null}
      <Card>
        <CardContent className="space-y-2 p-6">
          <p className="text-sm font-medium">Tráfico reciente</p>
          {traffic.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin series de tráfico. Conecta GA4 en Configuración.</p>
          ) : (
            traffic.slice(0, 8).map((row, index) => (
              <p key={`${row.label ?? row.date ?? index}`} className="text-sm text-muted-foreground">
                {row.label ?? row.date}: {row.value ?? row.sessions ?? 0}
              </p>
            ))
          )}
        </CardContent>
      </Card>
      <Card>
        <CardContent className="space-y-2 p-6">
          <p className="text-sm font-medium">Páginas más vistas</p>
          {pages.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin páginas. El ingest `/api/track` aún no tiene volumen.</p>
          ) : (
            pages.slice(0, 8).map((row, index) => (
              <p key={`${row.path ?? row.page ?? index}`} className="text-sm text-muted-foreground">
                {row.path ?? row.page}: {row.views ?? row.value ?? 0}
              </p>
            ))
          )}
        </CardContent>
      </Card>
    </DashboardPageShell>
  )
}
