'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CircleDollarSign, ShieldCheck } from 'lucide-react'
import { Button } from '@payload-config/components/ui/button'
import { Card, CardContent } from '@payload-config/components/ui/card'
import { DashboardPageShell } from '@payload-config/components/akademate/dashboard'

export function FinanceEmptySubpage({ title }: { title: string; description?: string }) {
  const [connections, setConnections] = useState<number | null>(null)
  const [dataAvailable, setDataAvailable] = useState<boolean | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const [scaffoldRes, connectionsRes] = await Promise.all([
          fetch('/api/finance/scaffold', { cache: 'no-store' }),
          fetch('/api/finance/connections', { cache: 'no-store' }),
        ])
        if (scaffoldRes.ok) {
          const scaffold = (await scaffoldRes.json()) as { dataAvailable?: boolean }
          setDataAvailable(Boolean(scaffold.dataAvailable))
        }
        if (connectionsRes.ok) {
          const payload = (await connectionsRes.json()) as { docs?: unknown[]; totalDocs?: number }
          setConnections(payload.totalDocs ?? payload.docs?.length ?? 0)
        } else if (scaffoldRes.status === 401 || connectionsRes.status === 401) {
          setErrorMessage('Sin permiso para leer finanzas.')
        }
      } catch {
        setErrorMessage('No se pudo leer el scaffold financiero.')
      }
    }
    void load()
  }, [])

  return (
    <DashboardPageShell
      title={title}
      icon={CircleDollarSign}
      actions={
        <Button asChild variant="outline" size="sm">
          <Link href="/finanzas">
            <ArrowLeft /> Finanzas
          </Link>
        </Button>
      }
    >
      <Card className="border-dashed" data-testid="finance-empty-subpage">
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <CircleDollarSign className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="text-sm font-semibold text-foreground">
            {dataAvailable ? 'Scaffold financiero disponible' : 'Sin datos financieros sincronizados'}
          </p>
          <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            Conexiones: {connections === null ? '…' : connections}. No hay proveedor live (Holded/A3).
          </p>
          {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
        </CardContent>
      </Card>
    </DashboardPageShell>
  )
}
