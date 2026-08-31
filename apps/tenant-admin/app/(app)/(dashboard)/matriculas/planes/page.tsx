'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Alert, AlertDescription, AlertTitle } from '@payload-config/components/ui/alert'
import { Badge } from '@payload-config/components/ui/badge'
import { Button } from '@payload-config/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import {
  ListingSearch,
  PremiumDirectoryShell,
} from '@payload-config/components/directory/PremiumDirectoryShell'
import { EmptyState } from '@payload-config/components/ui/EmptyState'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { Skeleton } from '@payload-config/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@payload-config/components/ui/tabs
import { AlertCircle, Building2, CreditCard, GraduationCap, Users } from 'lucide-react'
import { accessKindFromModality, accessKindLabel, type AccessKind } from '../wizard/types'

interface PlanRow {
  id: string
  name: string
  campusName: string
  modality: string
  accessKind: AccessKind
  price: number
  enrollmentFee: number
  seatsUsed: number
  seatsMax: number
  startDate: string
  status: string
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return null
}

function mapPlan(row: Record<string, unknown>): PlanRow {
  const modality = String(row.modalidad ?? 'presencial')
  return {
    id: String(row.id ?? ''),
    name: String(row.cursoNombre ?? 'Curso'),
    campusName: String(row.campusNombre ?? 'Sin sede'),
    modality,
    accessKind: accessKindFromModality(modality),
    price: Number(row.precio ?? 0),
    enrollmentFee: Number(row.matricula ?? 0),
    seatsUsed: Number(row.plazasOcupadas ?? 0),
    seatsMax: Number(row.plazasTotales ?? 0),
    startDate: String(row.fechaInicio ?? '').slice(0, 10),
    status: String(row.estado ?? ''),
  }
}

export default function PlanesMatriculaPage() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [kind, setKind] = useState<'all' | AccessKind>('all')
  const [plans, setPlans] = useState<PlanRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadPlans = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/convocatorias', {
        credentials: 'include',
        cache: 'no-store',
      })
      if (!response.ok) throw new Error('No se pudieron cargar los planes')
      const payload = await response.json()
      const root = asRecord(payload)
      const rows = Array.isArray(root?.data) ? root.data : []
      setPlans(rows.map((item) => mapPlan(asRecord(item) ?? {})).filter((plan) => plan.id))
    } catch (err) {
      setPlans([])
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los planes')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadPlans()
  }, [loadPlans])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return plans.filter((plan) => {
      if (kind !== 'all' && plan.accessKind !== kind) return false
      if (!needle) return true
      return [plan.name, plan.campusName, plan.modality, accessKindLabel(plan.accessKind)]
        .join(' ')
        .toLowerCase()
        .includes(needle)
    })
  }, [kind, plans, query])

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title="Planes y tarifas"
        icon={CreditCard}
        actions={
          <>
            <Button variant="outline" onClick={() => router.push('/matriculas/portal')}>
              Volver
            </Button>
            <Button onClick={() => router.push('/matriculas/nueva')}>
              Nueva matrícula
            </Button>
          </>
        }
      />

      {error ? (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>No se pudieron cargar los planes</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-3">
            <span>{error}</span>
            <Button size="sm" variant="outline" onClick={() => void loadPlans()}>
              Reintentar
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      <Tabs value={kind} onValueChange={(value) => setKind(value as 'all' | AccessKind)}>
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="fisico">Físico</TabsTrigger>
          <TabsTrigger value="virtual">Virtual</TabsTrigger>
          <TabsTrigger value="hibrido">Híbrido</TabsTrigger>
        </TabsList>
      </Tabs>

      <PremiumDirectoryShell
        search={
          <ListingSearch
            value={query}
            onChange={setQuery}
            placeholder="Buscar por curso, sede o modalidad"
          />
        }
      >
        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="Sin planes disponibles"
            description="No hay convocatorias con tarifa para mostrar."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((plan) => {
              const occupancy = plan.seatsMax > 0 ? Math.round((plan.seatsUsed / plan.seatsMax) * 100) : 0
              return (
                <Card key={plan.id} className="min-w-0">
                  <CardHeader className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base">{plan.name}</CardTitle>
                      <Badge variant="outline">{accessKindLabel(plan.accessKind)}</Badge>
                    </div>
                    <p className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Building2 className="h-3.5 w-3.5" />
                      {plan.campusName}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span>Precio</span>
                      <span className="font-medium">{plan.price.toLocaleString('es-ES')} €</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Matrícula</span>
                      <span className="font-medium">{plan.enrollmentFee.toLocaleString('es-ES')} €</span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {plan.seatsUsed}/{plan.seatsMax || '-'} plazas
                      </span>
                      <span>{plan.startDate || 'Sin fecha'}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${Math.min(occupancy, 100)}%` }}
                      />
                    </div>
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => router.push('/matriculas/nueva')}
                    >
                      Matricular en este plan
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </PremiumDirectoryShell>
    </div>
  )
}
