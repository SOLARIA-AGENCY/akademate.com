'use client'

import { Badge } from '@payload-config/components/ui/badge'
import { Button } from '@payload-config/components/ui/button'
import { Download, ExternalLink } from 'lucide-react'

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

interface StatusConfig {
  label: string
  variant: 'default' | 'secondary' | 'destructive'
  color: string
}

interface InvoiceRowProps {
  invoice: Invoice
  onDownload?: (invoice: Invoice) => void
  onView?: (invoice: Invoice) => void
}

export function InvoiceRow({ invoice, onDownload, onView }: InvoiceRowProps) {
  const statusConfig: Record<InvoiceStatus, StatusConfig> = {
    paid: { label: 'Pagada', variant: 'default', color: 'bg-green-500' },
    open: { label: 'Pendiente', variant: 'secondary', color: 'bg-blue-500' },
    void: { label: 'Anulada', variant: 'secondary', color: 'bg-gray-500' },
    draft: { label: 'Borrador', variant: 'secondary', color: 'bg-gray-400' },
    uncollectible: { label: 'Incobrable', variant: 'destructive', color: 'bg-red-500' },
  }

  const status: StatusConfig = statusConfig[invoice.status] ?? statusConfig.open

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
    <tr className="border-b transition-colors hover:bg-muted/50" data-oid="rhhwl:7">
      <td className="p-4 font-medium" data-oid="zak95c9">
        {invoice.number}
      </td>
      <td className="p-4" data-oid="70ybk00">
        {formatDate(invoice.createdAt)}
      </td>
      <td className="p-4" data-oid="9afoq5n">
        <Badge variant={status.variant} data-oid="tlzxgqe">
          {status.label}
        </Badge>
      </td>
      <td className="p-4 font-semibold" data-oid="kyt-yzz">
        {formatAmount(invoice.total)}
      </td>
      <td className="p-4" data-oid="mu_cddn">
        <div className="flex items-center gap-2" data-oid="lwdp7sv">
          {invoice.invoicePdfUrl && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDownload?.(invoice)}
              className="gap-2"
              data-oid="44.ios."
            >
              <Download className="h-4 w-4" data-oid="gzn833f" />
              PDF
            </Button>
          )}
          {invoice.hostedInvoiceUrl && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onView?.(invoice)}
              className="gap-2"
              data-oid="zk3xe3r"
            >
              <ExternalLink className="h-4 w-4" data-oid="nyl5ld:" />
              Ver
            </Button>
          )}
        </div>
      </td>
    </tr>
  )
}
