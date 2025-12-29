'use client'

import { Badge } from '@payload-config/components/ui/badge'
import { Button } from '@payload-config/components/ui/button'
import { Download, ExternalLink } from 'lucide-react'
import type { Invoice } from '@payload-config/types/billing'

interface InvoiceRowProps {
  invoice: Invoice
  onDownload?: (invoice: Invoice) => void
  onView?: (invoice: Invoice) => void
}

export function InvoiceRow({ invoice, onDownload, onView }: InvoiceRowProps) {
  const statusConfig = {
    paid: { label: 'Pagada', variant: 'default' as const, color: 'bg-green-500' },
    open: { label: 'Pendiente', variant: 'secondary' as const, color: 'bg-blue-500' },
    void: { label: 'Anulada', variant: 'secondary' as const, color: 'bg-gray-500' },
    draft: { label: 'Borrador', variant: 'secondary' as const, color: 'bg-gray-400' },
    uncollectible: { label: 'Incobrable', variant: 'destructive' as const, color: 'bg-red-500' },
  }

  const status = statusConfig[invoice.status] || statusConfig.open

  const formatDate = (date: Date | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: invoice.currency,
    }).format(amount / 100)
  }

  return (
    <tr className="border-b transition-colors hover:bg-muted/50">
      <td className="p-4 font-medium">{invoice.number}</td>
      <td className="p-4">{formatDate(invoice.createdAt)}</td>
      <td className="p-4">
        <Badge variant={status.variant}>{status.label}</Badge>
      </td>
      <td className="p-4 font-semibold">{formatAmount(invoice.total)}</td>
      <td className="p-4">
        <div className="flex items-center gap-2">
          {invoice.invoicePdfUrl && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDownload?.(invoice)}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              PDF
            </Button>
          )}
          {invoice.hostedInvoiceUrl && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onView?.(invoice)}
              className="gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Ver
            </Button>
          )}
        </div>
      </td>
    </tr>
  )
}
