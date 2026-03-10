'use client'

import { useState, useMemo } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@payload-config/components/ui/card'
import { FileText } from 'lucide-react'
import { InvoiceRow } from './InvoiceRow'

type InvoiceStatus = 'draft' | 'open' | 'paid' | 'void' | 'uncollectible'

interface Invoice {
  id: string
  number: string
  status: InvoiceStatus
  currency: string
  total: number
  createdAt: Date
  hostedInvoiceUrl: string | null
  invoicePdfUrl: string | null
}

interface InvoicesTableProps {
  invoices: Invoice[]
  loading?: boolean
}

export function InvoicesTable({ invoices, loading }: InvoicesTableProps) {
  const [statusFilter, _setStatusFilter] = useState<string>('all')

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
      <Card data-oid="w:uih4j">
        <CardHeader data-oid="521mv7h">
          <CardTitle data-oid="ba9t:9p">Facturas</CardTitle>
          <CardDescription data-oid="parl4qv">Historial de facturas y pagos</CardDescription>
        </CardHeader>
        <CardContent data-oid="apj6n.i">
          <div className="flex items-center justify-center py-8" data-oid="-ebomh9">
            <div
              className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"
              data-oid="k_w3nw6"
            />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (invoices.length === 0) {
    return (
      <Card data-oid="x72rv7z">
        <CardHeader data-oid="73jyn55">
          <CardTitle data-oid="ediudcb">Facturas</CardTitle>
          <CardDescription data-oid="ko.-upw">Historial de facturas y pagos</CardDescription>
        </CardHeader>
        <CardContent data-oid="r5jc8ma">
          <div
            className="flex flex-col items-center justify-center py-12 text-center"
            data-oid="by:2a2x"
          >
            <FileText className="h-12 w-12 text-muted-foreground mb-4" data-oid="yg.az1w" />
            <h3 className="text-lg font-semibold" data-oid="28kb9qp">
              Sin facturas
            </h3>
            <p className="text-sm text-muted-foreground mt-2" data-oid="h_g7jcj">
              Aún no tienes facturas emitidas
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card data-oid="q10vaeo">
      <CardHeader data-oid="06izy21">
        <div className="flex items-center justify-between" data-oid="780zfbw">
          <div data-oid="j4ul20w">
            <CardTitle data-oid="mqz-wq4">Facturas</CardTitle>
            <CardDescription data-oid="yywe2dp">
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
      <CardContent data-oid="l_zppr.">
        <div className="overflow-x-auto" data-oid=":l69y:u">
          <table className="w-full" data-oid="xt5d-c0">
            <thead data-oid="z.43kgj">
              <tr className="border-b bg-muted/50" data-oid="m4a0_uo">
                <th className="p-4 text-left font-medium" data-oid="ber-h9n">
                  Número
                </th>
                <th className="p-4 text-left font-medium" data-oid=".l-pjd3">
                  Fecha
                </th>
                <th className="p-4 text-left font-medium" data-oid="dfqyykk">
                  Estado
                </th>
                <th className="p-4 text-left font-medium" data-oid="2pt8dmj">
                  Monto
                </th>
                <th className="p-4 text-left font-medium" data-oid="4xpuu2h">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody data-oid="sqginyg">
              {filteredInvoices.map((invoice) => (
                <InvoiceRow
                  key={invoice.id}
                  invoice={invoice}
                  onDownload={handleDownload}
                  onView={handleView}
                  data-oid="de:04di"
                />
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
