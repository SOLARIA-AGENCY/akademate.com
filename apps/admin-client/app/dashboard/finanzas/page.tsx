'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { DollarSign, TrendingUp, TrendingDown, Receipt, Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { KPICard } from '@/components/ui/kpi-card'
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

interface PLData {
  current_month: {
    revenue_eur: number
    expenses_eur: number
    margin_eur: number
    margin_pct: number | null
    expenses_by_category: Record<string, number>
  }
  period_start: string
}

interface Expense {
  id: number
  category: string
  vendor: string
  amount_eur: string
  description: string | null
  period_month: string
}

const categoryLabels: Record<string, string> = {
  infrastructure: 'Infraestructura',
  software: 'Software',
  marketing: 'Marketing',
  other: 'Otros',
}

const categoryColors: Record<string, string> = {
  infrastructure: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  software: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  marketing: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  other: 'bg-muted text-muted-foreground',
}

function formatEur(n: number): string {
  return `€${n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function FinanzasPage() {
  const [pl, setPl] = useState<PLData | null>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    vendor: '',
    amount_eur: '',
    category: 'infrastructure',
    description: '',
    period_month: new Date().toISOString().slice(0, 7) + '-01',
  })

  async function loadData() {
    setLoading(true)
    const [plRes, expRes] = await Promise.all([
      fetch('/api/ops/finanzas/pl'),
      fetch('/api/ops/finanzas/gastos?limit=50'),
    ])
    if (plRes.ok) setPl(await plRes.json())
    if (expRes.ok) setExpenses((await expRes.json()).docs ?? [])
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  async function handleAddExpense(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/ops/finanzas/gastos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        amount_eur: parseFloat(form.amount_eur),
      }),
    })
    if (res.ok) {
      setShowForm(false)
      setForm({ vendor: '', amount_eur: '', category: 'infrastructure', description: '', period_month: new Date().toISOString().slice(0, 7) + '-01' })
      loadData()
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('¿Eliminar este gasto?')) return
    await fetch(`/api/ops/finanzas/gastos/${id}`, { method: 'DELETE' })
    loadData()
  }

  const current = pl?.current_month

  return (
    <div className="space-y-8">
      <PageHeader
        title="Finanzas — P&L"
        description="Ingresos, gastos operativos y margen bruto del mes actual"
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
        ) : (
          <>
            <Link href="/dashboard/finanzas/ingresos">
              <KPICard
                label="Ingresos MRR"
                value={current ? formatEur(current.revenue_eur) : '—'}
                icon={<DollarSign className="h-5 w-5 text-primary" />}
                variant="success"
                className="cursor-pointer hover:scale-[1.02] transition-transform"
              />
            </Link>
            <Link href="/dashboard/finanzas/gastos">
              <KPICard
                label="Gastos Totales"
                value={current ? formatEur(current.expenses_eur) : '—'}
                icon={<Receipt className="h-5 w-5 text-warning" />}
                variant="warning"
                className="cursor-pointer hover:scale-[1.02] transition-transform"
              />
            </Link>
            <KPICard
              label="Margen Bruto"
              value={current?.margin_pct !== null && current?.margin_pct !== undefined ? `${current.margin_pct}%` : '—'}
              icon={current && current.margin_eur >= 0 ? <TrendingUp className="h-5 w-5 text-success" /> : <TrendingDown className="h-5 w-5 text-destructive" />}
              variant={current ? (current.margin_eur >= 0 ? 'success' : 'danger') : 'default'}
            />
          </>
        )}
      </div>

      {/* Expenses Table */}
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 sm:px-6 py-4">
          <div>
            <CardTitle className="text-lg">Gastos Operativos</CardTitle>
            <p className="text-muted-foreground text-sm mt-1">Registro de gastos por categoría y mes</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Registrar gasto
          </button>
        </CardHeader>

        {showForm && (
          <form onSubmit={handleAddExpense} className="border-b border-border px-6 py-4 bg-muted/30">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Proveedor *</label>
                <input
                  required
                  value={form.vendor}
                  onChange={e => setForm(f => ({ ...f, vendor: e.target.value }))}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  placeholder="Hetzner, Vercel..."
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Importe (€) *</label>
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.amount_eur}
                  onChange={e => setForm(f => ({ ...f, amount_eur: e.target.value }))}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  placeholder="49.99"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Categoría</label>
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                >
                  {Object.entries(categoryLabels).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Mes *</label>
                <input
                  required
                  type="month"
                  value={form.period_month.slice(0, 7)}
                  onChange={e => setForm(f => ({ ...f, period_month: e.target.value + '-01' }))}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-medium text-muted-foreground">Descripción</label>
                <input
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  placeholder="Servidor CAX21 Falkenstein"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-4">
              <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                Guardar
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted/50">
                Cancelar
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <DataTable>
              <DataTableHeader>
                <DataTableRow>
                  <DataTableHead>Proveedor</DataTableHead>
                  <DataTableHead>Categoría</DataTableHead>
                  <DataTableHead>Mes</DataTableHead>
                  <DataTableHead align="right">Importe</DataTableHead>
                  <DataTableHead align="right">Acciones</DataTableHead>
                </DataTableRow>
              </DataTableHeader>
              <DataTableBody>
                {expenses.length === 0 ? (
                  <DataTableEmpty
                    colSpan={5}
                    title="Sin gastos registrados"
                    description="Usa el botón 'Registrar gasto' para añadir gastos operativos"
                  />
                ) : (
                  expenses.map((exp) => (
                    <DataTableRow key={exp.id}>
                      <DataTableCell>
                        <div>
                          <p className="font-medium">{exp.vendor}</p>
                          {exp.description && (
                            <p className="text-xs text-muted-foreground">{exp.description}</p>
                          )}
                        </div>
                      </DataTableCell>
                      <DataTableCell>
                        <Badge className={categoryColors[exp.category] ?? categoryColors.other}>
                          {categoryLabels[exp.category] ?? exp.category}
                        </Badge>
                      </DataTableCell>
                      <DataTableCell>
                        {new Date(exp.period_month).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                      </DataTableCell>
                      <DataTableCell align="right" numeric>
                        {formatEur(parseFloat(exp.amount_eur))}
                      </DataTableCell>
                      <DataTableCell align="right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleDelete(exp.id)}
                            className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </DataTableCell>
                    </DataTableRow>
                  ))
                )}
              </DataTableBody>
            </DataTable>
          </div>
        )}

        {/* Category breakdown */}
        {current && Object.keys(current.expenses_by_category).length > 0 && (
          <div className="border-t border-border px-6 py-4">
            <p className="text-sm font-medium text-muted-foreground mb-3">Desglose por categoría (mes actual)</p>
            <div className="flex flex-wrap gap-3">
              {Object.entries(current.expenses_by_category).map(([cat, amt]) => (
                <div key={cat} className="flex items-center gap-2">
                  <Badge className={categoryColors[cat] ?? categoryColors.other}>
                    {categoryLabels[cat] ?? cat}
                  </Badge>
                  <span className="text-sm font-medium">{formatEur(amt)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
