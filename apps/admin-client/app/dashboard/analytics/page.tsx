'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, Users, DollarSign, Clock } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { KPICard } from '@/components/ui/kpi-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { MetricsBarChart, type MetricDataPoint } from '@/components/charts'

interface AnalyticsData {
  total_active: number
  total_mrr_eur: number
  avg_mrr_per_tenant_eur: number
  avg_tenure_months: number
  ltv_estimate_eur: number
  monthly_trend: {
    month: string
    new_tenants: number
    churned: number
    net_new: number
  }[]
}

function formatEur(n: number): string {
  if (n >= 1000) return `€${(n / 1000).toFixed(1)}K`
  return `€${n.toLocaleString('es-ES')}`
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/ops/analytics')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData(d) })
      .finally(() => setLoading(false))
  }, [])

  const newTenantsChart: MetricDataPoint[] = (data?.monthly_trend ?? []).map((m) => ({
    name: new Date(m.month).toLocaleDateString('es-ES', { month: 'short' }),
    value: m.new_tenants,
    color: 'hsl(142 76% 36%)',
  }))

  const netNewChart: MetricDataPoint[] = (data?.monthly_trend ?? []).map((m) => ({
    name: new Date(m.month).toLocaleDateString('es-ES', { month: 'short' }),
    value: m.net_new,
    color: m.net_new >= 0 ? 'hsl(142 76% 36%)' : 'hsl(0 72% 51%)',
  }))

  return (
    <div className="space-y-8">
      <PageHeader
        title="Analytics — Crecimiento"
        description="Tendencias de MRR, nuevos clientes, retención y valor de vida"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
        ) : (
          <>
            <KPICard
              label="Tenants activos"
              value={data?.total_active ?? 0}
              icon={<Users className="h-5 w-5 text-primary" />}
            />
            <KPICard
              label="MRR total"
              value={data ? formatEur(data.total_mrr_eur) : '—'}
              icon={<DollarSign className="h-5 w-5 text-success" />}
              variant="success"
            />
            <KPICard
              label="MRR promedio/tenant"
              value={data ? formatEur(data.avg_mrr_per_tenant_eur) : '—'}
              icon={<TrendingUp className="h-5 w-5 text-primary" />}
            />
            <KPICard
              label="LTV estimado"
              value={data ? formatEur(data.ltv_estimate_eur) : '—'}
              icon={<Clock className="h-5 w-5 text-warning" />}
              variant="warning"
            />
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Nuevos Tenants por Mes</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <MetricsBarChart data={newTenantsChart} height={180} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Crecimiento Neto (Nuevos − Churned)</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <MetricsBarChart data={netNewChart} height={180} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tenure & LTV summary */}
      {data && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Métricas de Valor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              <div>
                <p className="text-2xl font-bold">{data.avg_tenure_months}m</p>
                <p className="text-xs text-muted-foreground mt-1">Tenencia media</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{formatEur(data.avg_mrr_per_tenant_eur)}</p>
                <p className="text-xs text-muted-foreground mt-1">ARPU mensual</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{formatEur(data.ltv_estimate_eur)}</p>
                <p className="text-xs text-muted-foreground mt-1">LTV estimado</p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">ARPU × tenencia media</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{formatEur(data.total_mrr_eur * 12)}</p>
                <p className="text-xs text-muted-foreground mt-1">ARR proyectado</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
