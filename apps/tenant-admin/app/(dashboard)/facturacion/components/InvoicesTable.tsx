'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Select } from '@payload-config/components/ui/select'
import { FileText, Download } from 'lucide-react'
import { InvoiceRow } from './InvoiceRow'
import type { Invoice } from '@payload-config/types/billing'

interface InvoicesTableProps {
  invoices: Invoice[]
  loading?: boolean
}

export function InvoicesTable({ invoices, loading }: InvoicesTableProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filteredInvoices = useMemo(() => {
    if (statusFilter === 'all') return invoices
    return invoices.filter((invoice) => invoice.status === statusFilter)
  }, [invoices, statusFilter])

  const handleDownload = (invoice: Invoice) => {
    if (invoice.invoicePdfUrl) {
      window.open(invoice.invoicePdfUrl, '_blank')
    }
  }

  const handleView = (invoice: Invoice) => {
    if (invoice.hostedInvoiceUrl) {
      window.open(invoice.hostedInvoiceUrl, '_blank')
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Facturas</CardTitle>
          <CardDescription>Historial de facturas y pagos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (invoices.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Facturas</CardTitle>
          <CardDescription>Historial de facturas y pagos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">Sin facturas</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Aún no tienes facturas emitidas
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Facturas</CardTitle>
            <CardDescription>
              Historial de facturas y pagos ({filteredInvoices.length})
            </CardDescription>
          </div>

          {/* Filter - Commented out for now, can be implemented later */}
          {/* <Select value={statusFilter} onValueChange={setStatusFilter}>
            <option value="all">Todas</option>
            <option value="paid">Pagadas</option>
            <option value="open">Pendientes</option>
            <option value="void">Anuladas</option>
          </Select> */}
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-4 text-left font-medium">Número</th>
                <th className="p-4 text-left font-medium">Fecha</th>
                <th className="p-4 text-left font-medium">Estado</th>
                <th className="p-4 text-left font-medium">Monto</th>
                <th className="p-4 text-left font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((invoice) => (
                <InvoiceRow
                  key={invoice.id}
                  invoice={invoice}
                  onDownload={handleDownload}
                  onView={handleView}
                />
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
