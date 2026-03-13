'use client'

import { useState, useEffect } from 'react'
import { Target, TrendingDown } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { KPICard } from '@/components/ui/kpi-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTableRow,
  DataTableHead,
  DataTableCell,
  DataTableEmpty,
} from '@/components/ui/data-table'
import { Badge } from '@/components/ui/badge'

interface RetentionData {
  cohorts: {
    cohort_month: string
    initial_count: number
    retained_count: number
    retention_rate_pct: number
  }[]
  churn_history: {
    month: string
    churned: number
    churn_rate_pct: number
  }[]
  target_churn_pct: number
}

export default function RetencionPage() {
  const [data, setData] = useState<RetentionData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/ops/analytics/retencion')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData(d) })
      .finally(() => setLoading(false))
  }, [])

  const avgChurn =
    data && data.churn_history.length > 0
      ? Math.round(
          (data.churn_history.reduce((s, r) => s + r.churn_rate_pct, 0) / data.churn_history.length) * 10
        ) / 10
      : null

  const avgRetention =
    data && data.cohorts.length > 0
      ? Math.round(
          data.cohorts.reduce((s, c) => s + c.retention_rate_pct, 0) / data.cohorts.length
        )
      : null

  return (
    <div className="space-y-8">
      <PageHeader
        title="Retención & Churn"
        description="Análisis de cohortes, tasa de churn mensual y objetivo de retención"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
        ) : (
          <>
            <KPICard
              label="Churn Rate (media)"
              value={avgChurn !== null ? `${avgChurn}%` : '—'}
              icon={<TrendingDown className="h-5 w-5 text-destructive" />}
              variant={avgChurn !== null && avgChurn <= (data?.target_churn_pct ?? 3) ? 'success' : 'danger'}
              trend={
                data
                  ? {
                      value: -(data.target_churn_pct ?? 3),
                      direction: avgChurn !== null && avgChurn <= data.target_churn_pct ? 'up' : 'down',
                      label: `objetivo < ${data.target_churn_pct}%`,
                    }
                  : undefined
              }
            />
            <KPICard
              label="Retención media"
              value={avgRetention !== null ? `${avgRetention}%` : '—'}
              icon={<Target className="h-5 w-5 text-success" />}
              variant={avgRetention !== null && avgRetention >= 90 ? 'success' : avgRetention !== null && avgRetention >= 70 ? 'warning' : 'danger'}
            />
            <KPICard
              label="Objetivo churn"
              value={`< ${data?.target_churn_pct ?? 3}%`}
              icon={<Target className="h-5 w-5 text-primary" />}
            />
          </>
        )}
      </div>

      {/* Cohort table */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border px-4 sm:px-6 py-4">
          <CardTitle className="text-base">Retención por Cohorte (últimos 6 meses)</CardTitle>
        </CardHeader>
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <DataTable>
              <DataTableHeader>
                <DataTableRow>
                  <DataTableHead>Cohorte</DataTableHead>
                  <DataTableHead align="right">Inicial</DataTableHead>
                  <DataTableHead align="right">Retenidos</DataTableHead>
                  <DataTableHead align="right">Tasa retención</DataTableHead>
                  <DataTableHead>Visual</DataTableHead>
                </DataTableRow>
              </DataTableHeader>
              <DataTableBody>
                {!data || data.cohorts.length === 0 ? (
                  <DataTableEmpty colSpan={5} title="Sin datos de cohortes" description="Necesitas tenants creados en los últimos 6 meses" />
                ) : (
                  data.cohorts.map((c) => (
                    <DataTableRow key={c.cohort_month}>
                      <DataTableCell>
                        {new Date(c.cohort_month).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                      </DataTableCell>
                      <DataTableCell align="right" numeric>{c.initial_count}</DataTableCell>
                      <DataTableCell align="right" numeric>{c.retained_count}</DataTableCell>
                      <DataTableCell align="right">
                        <Badge
                          className={
                            c.retention_rate_pct >= 90
                              ? 'bg-success/10 text-success'
                              : c.retention_rate_pct >= 70
                              ? 'bg-warning/10 text-warning'
                              : 'bg-destructive/10 text-destructive'
                          }
                        >
                          {c.retention_rate_pct}%
                        </Badge>
                      </DataTableCell>
                      <DataTableCell>
                        <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${c.retention_rate_pct >= 90 ? 'bg-success' : c.retention_rate_pct >= 70 ? 'bg-warning' : 'bg-destructive'}`}
                            style={{ width: `${c.retention_rate_pct}%` }}
                          />
                        </div>
                      </DataTableCell>
                    </DataTableRow>
                  ))
                )}
              </DataTableBody>
            </DataTable>
          </div>
        )}
      </Card>

      {/* Churn history */}
      {data && data.churn_history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Historial de Churn Mensual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.churn_history.map((r) => (
                <div key={r.month} className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground w-28">
                    {new Date(r.month).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}
                  </span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${r.churn_rate_pct <= data.target_churn_pct ? 'bg-success' : r.churn_rate_pct <= 10 ? 'bg-warning' : 'bg-destructive'}`}
                      style={{ width: `${Math.min(r.churn_rate_pct * 5, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-12 text-right">{r.churn_rate_pct}%</span>
                  <span className="text-xs text-muted-foreground w-16">{r.churned} bajas</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
