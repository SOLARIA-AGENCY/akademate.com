'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Infinity as InfinityIcon } from 'lucide-react'
import { Button } from '@payload-config/components/ui/button'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { ListingKpiStrip } from '@payload-config/components/ui/listing-kpi'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@payload-config/components/ui/empty'
import {
  computeContinuousTrainingKpis,
  type ContinuousTrainingListingRow,
} from '@/src/domain/continuous-training'

export default function FormacionContinuaPage() {
  const router = useRouter()
  const [rows, setRows] = useState<ContinuousTrainingListingRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch('/api/continuous-trainings', { cache: 'no-store' })
        const payload = (await response.json()) as { docs?: ContinuousTrainingListingRow[] }
        setRows(Array.isArray(payload.docs) ? payload.docs : [])
      } catch {
        setRows([])
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const kpis = useMemo(
    () =>
      computeContinuousTrainingKpis(rows).map((item) => ({
        label: item.label,
        value: item.value,
      })),
    [rows],
  )

  return (
    <div className="space-y-4">
      <PageHeader
        title="Formación continua"
        description="Acceso permanente, sin convocatoria con fechas fijas."
        icon={InfinityIcon}
        showAddButton
        addButtonText="Nueva formación continua"
        onAdd={() => router.push('/dashboard/formacion-continua/nueva')}
      />
      <ListingKpiStrip items={kpis} />
      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : rows.length === 0 ? (
        <Empty className="min-h-[16rem]" data-slot="continuous-training-empty">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <InfinityIcon />
            </EmptyMedia>
            <EmptyTitle>Aún no hay formaciones continuas</EmptyTitle>
            <EmptyDescription>
              Catálogo de acceso permanente, sin convocatoria con fechas fijas.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button type="button" size="sm" onClick={() => router.push('/dashboard/formacion-continua/nueva')}>
              Crear primera formación continua
            </Button>
          </EmptyContent>
        </Empty>
      ) : null}
    </div>
  )
}
