'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Badge } from '@payload-config/components/ui/badge'
import { CheckCircle, XCircle, Clock, RefreshCw, type LucideIcon } from 'lucide-react'
import type { PaymentTransaction } from '@payload-config/types/billing'

type PaymentStatusValue = 'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled' | 'refunded'

interface StatusConfig {
  label: string
  icon: LucideIcon
  variant: 'default' | 'destructive' | 'secondary'
  color: string
}

interface TransactionData {
  id: string
  status: PaymentStatusValue
  description: string | null
  createdAt: Date
  failureMessage: string | null
  paymentMethodType: string
  stripeChargeId: string | null
  amount: number
  currency: string
}

interface TransactionHistoryProps {
  transactions: PaymentTransaction[]
  loading?: boolean
}

export function TransactionHistory({ transactions, loading }: TransactionHistoryProps) {
  const statusConfig: Record<PaymentStatusValue, StatusConfig> = {
    succeeded: {
      label: 'Exitoso',
      icon: CheckCircle,
      variant: 'default' as const,
      color: 'text-green-500',
    },
    failed: {
      label: 'Fallido',
      icon: XCircle,
      variant: 'destructive' as const,
      color: 'text-red-500',
    },
    pending: {
      label: 'Pendiente',
      icon: Clock,
      variant: 'secondary' as const,
      color: 'text-blue-500',
    },
    processing: {
      label: 'Procesando',
      icon: RefreshCw,
      variant: 'secondary' as const,
      color: 'text-orange-500',
    },
    canceled: {
      label: 'Cancelado',
      icon: XCircle,
      variant: 'secondary' as const,
      color: 'text-gray-500',
    },
    refunded: {
      label: 'Reembolsado',
      icon: RefreshCw,
      variant: 'secondary' as const,
      color: 'text-purple-500',
    },
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency,
    }).format(amount / 100)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historial de Transacciones</CardTitle>
          <CardDescription>Registro de pagos y transacciones</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historial de Transacciones</CardTitle>
          <CardDescription>Registro de pagos y transacciones</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">Sin transacciones</h3>
            <p className="text-sm text-muted-foreground mt-2">
              No hay transacciones registradas aún
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial de Transacciones</CardTitle>
        <CardDescription>
          Registro de pagos y transacciones ({transactions.length})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {(transactions as TransactionData[]).map((transaction: TransactionData) => {
            const status: StatusConfig = statusConfig[transaction.status]
            const StatusIcon: LucideIcon = status.icon

            return (
              <div
                key={transaction.id}
                className="flex items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50"
              >
                <div className={`mt-1 ${status.color}`}>
                  <StatusIcon className="h-5 w-5" />
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">
                      {transaction.description ?? 'Pago de suscripción'}
                    </p>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    {formatDate(transaction.createdAt)}
                  </p>

                  {transaction.failureMessage && (
                    <p className="text-sm text-red-600">
                      Error: {transaction.failureMessage}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Método: {transaction.paymentMethodType}</span>
                    {transaction.stripeChargeId && (
                      <span className="font-mono text-xs">
                        ID: {transaction.stripeChargeId.slice(-8)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-lg font-semibold">
                    {formatAmount(transaction.amount, transaction.currency)}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
