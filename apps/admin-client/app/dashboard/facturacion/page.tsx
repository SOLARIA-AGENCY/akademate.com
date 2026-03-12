'use client'

import { useState } from 'react'
import { DollarSign, Clock, AlertCircle, CreditCard, Download } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { KPICard } from '@/components/ui/kpi-card'
import { Badge } from '@/components/ui/badge'

interface Invoice {
  id: string
  tenantName: string
  number: string
  amount: number
  status: 'paid' | 'pending' | 'overdue' | 'failed'
  dueDate: string
  paidDate: string | null
  plan: string
  period: string
}

const mockInvoices: Invoice[] = [
  { id: '1', tenantName: 'CEP Formación', number: 'INV-2025-0012', amount: 299, status: 'paid', dueDate: '2025-12-01', paidDate: '2025-11-28', plan: 'Professional', period: 'Diciembre 2025' },
  { id: '2', tenantName: 'Instituto Barcelona', number: 'INV-2025-0013', amount: 599, status: 'paid', dueDate: '2025-12-01', paidDate: '2025-12-01', plan: 'Enterprise', period: 'Diciembre 2025' },
  { id: '3', tenantName: 'Centro Formativo Valencia', number: 'INV-2025-0014', amount: 299, status: 'overdue', dueDate: '2025-11-15', paidDate: null, plan: 'Professional', period: 'Noviembre 2025' },
  { id: '4', tenantName: 'CEP Formación', number: 'INV-2025-0011', amount: 299, status: 'paid', dueDate: '2025-11-01', paidDate: '2025-10-30', plan: 'Professional', period: 'Noviembre 2025' },
  { id: '5', tenantName: 'Instituto Barcelona', number: 'INV-2025-0010', amount: 599, status: 'paid', dueDate: '2025-11-01', paidDate: '2025-11-01', plan: 'Enterprise', period: 'Noviembre 2025' },
]

const statusConfig = {
  paid: { label: 'Pagado', className: 'bg-success/10 text-success' },
  pending: { label: 'Pendiente', className: 'bg-warning/10 text-warning' },
  overdue: { label: 'Vencido', className: 'bg-destructive/10 text-destructive' },
  failed: { label: 'Fallido', className: 'bg-destructive/10 text-destructive' },
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default function FacturacionPage() {
  const [statusFilter, setStatusFilter] = useState('all')

  const totalRevenue = mockInvoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.amount, 0)
  const pendingAmount = mockInvoices.filter((i) => i.status === 'pending' || i.status === 'overdue').reduce((s, i) => s + i.amount, 0)
  const overdueCount = mockInvoices.filter((i) => i.status === 'overdue').length

  const filtered = mockInvoices.filter((i) => statusFilter === 'all' || i.status === statusFilter)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Facturación"
        description="Gestiona facturas y suscripciones de los tenants"
      >
        <Badge variant="outline">Demo data</Badge>
      </PageHeader>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard
          label="Ingresos del Mes"
          value={`€${totalRevenue.toLocaleString()}`}
          icon={<DollarSign className="h-5 w-5 text-success" />}
          variant="success"
        />
        <KPICard
          label="Pendiente Cobro"
          value={`€${pendingAmount.toLocaleString()}`}
          icon={<Clock className="h-5 w-5 text-warning" />}
          variant="warning"
        />
        <KPICard
          label="Facturas Vencidas"
          value={overdueCount}
          icon={<AlertCircle className="h-5 w-5 text-destructive" />}
          variant="danger"
        />
      </section>

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border px-4 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <CardTitle className="text-base">Facturas</CardTitle>
            <div className="flex items-center gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 bg-muted/50 border border-border rounded-md text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="all">Todos los estados</option>
                <option value="paid">Pagados</option>
                <option value="pending">Pendientes</option>
                <option value="overdue">Vencidos</option>
                <option value="failed">Fallidos</option>
              </select>
              <button className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted/50 border border-border rounded-md text-sm hover:bg-muted transition-colors">
                <Download className="h-3.5 w-3.5" />
                CSV
              </button>
            </div>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Factura</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Tenant</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Plan</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Importe</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Estado</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Vencimiento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    No hay facturas con ese filtro
                  </td>
                </tr>
              ) : (
                filtered.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{invoice.number}</p>
                      <p className="text-xs text-muted-foreground">{invoice.period}</p>
                    </td>
                    <td className="px-4 py-3 text-foreground">{invoice.tenantName}</td>
                    <td className="px-4 py-3 text-foreground">{invoice.plan}</td>
                    <td className="px-4 py-3 text-right font-medium text-foreground">€{invoice.amount}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-medium ${statusConfig[invoice.status].className}`}>
                        {statusConfig[invoice.status].label}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <p className="text-foreground">{formatDate(invoice.dueDate)}</p>
                      {invoice.paidDate && (
                        <p className="text-xs text-success">Pagado: {formatDate(invoice.paidDate)}</p>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Integración Stripe</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          La integración completa con Stripe (webhooks, portal de cliente, metering) está planificada para
          la próxima fase de desarrollo. Los datos mostrados son de demostración.
        </CardContent>
      </Card>
    </div>
  )
}
