'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, DollarSign } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { KPICard } from '@/components/ui/kpi-card'
import { Skeleton } from '@/components/ui/skeleton'

interface MrrData {
  mrr_eur: number
  arr_eur: number
  mrr_growth_pct: number | null
  active_tenants: number
  plan_breakdown: Record<string, { count: number; mrr: number }>
}

function formatEur(n: number): string {
  return `€${n.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`
}

export default function IngresosPage() {
  const [data, setData] = useState<MrrData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/ops/mrr')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData(d) })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/finanzas" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <PageHeader
          title="Ingresos"
          description="MRR, ARR y desglose por plan"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
        ) : (
          <>
            <KPICard label="MRR" value={data ? formatEur(data.mrr_eur) : '—'} icon={<DollarSign className="h-5 w-5 text-primary" />} variant="success" />
            <KPICard label="ARR" value={data ? formatEur(data.arr_eur) : '—'} icon={<DollarSign className="h-5 w-5 text-primary" />} />
            <KPICard label="Tenants activos" value={data?.active_tenants ?? 0} icon={<DollarSign className="h-5 w-5 text-primary" />} />
            <KPICard
              label="MRR Growth"
              value={data?.mrr_growth_pct !== null && data?.mrr_growth_pct !== undefined ? `${data.mrr_growth_pct > 0 ? '+' : ''}${data.mrr_growth_pct}%` : '—'}
              icon={<DollarSign className="h-5 w-5 text-success" />}
              variant={data?.mrr_growth_pct !== null && data?.mrr_growth_pct !== undefined && data.mrr_growth_pct >= 0 ? 'success' : 'danger'}
            />
          </>
        )}
      </div>

      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Object.entries(data.plan_breakdown).map(([plan, info]) => (
            <div key={plan} className="rounded-xl border border-border p-4 bg-card">
              <p className="text-sm font-medium capitalize text-muted-foreground">{plan}</p>
              <p className="text-2xl font-bold mt-1">{info.count} tenants</p>
              <p className="text-sm text-muted-foreground mt-1">{formatEur(info.mrr)} MRR</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
