'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@payload-config/components/ui/card'
import { Badge } from '@payload-config/components/ui/badge'
import { CheckCircle, XCircle, Clock, RefreshCw, type LucideIcon } from 'lucide-react'
import type { PaymentTransaction } from '@payload-config/types/billing'

type PaymentStatusValue =
  | 'pending'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'canceled'
  | 'refunded'

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
      <Card data-oid="xs0lilg">
        <CardHeader data-oid="ujs0skh">
          <CardTitle data-oid="2-og615">Historial de Transacciones</CardTitle>
          <CardDescription data-oid="dh-q..-">Registro de pagos y transacciones</CardDescription>
        </CardHeader>
        <CardContent data-oid="fomed1s">
          <div className="flex items-center justify-center py-8" data-oid="v83iarv">
            <div
              className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"
              data-oid="4putv_n"
            />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (transactions.length === 0) {
    return (
      <Card data-oid="4c_bql1">
        <CardHeader data-oid=".sg3ty9">
          <CardTitle data-oid="pt_yv0f">Historial de Transacciones</CardTitle>
          <CardDescription data-oid="ou0w42:">Registro de pagos y transacciones</CardDescription>
        </CardHeader>
        <CardContent data-oid="-yy7mkn">
          <div
            className="flex flex-col items-center justify-center py-12 text-center"
            data-oid="_lxx4a2"
          >
            <Clock className="h-12 w-12 text-muted-foreground mb-4" data-oid="t9h4fqh" />
            <h3 className="text-lg font-semibold" data-oid="9k:6-7y">
              Sin transacciones
            </h3>
            <p className="text-sm text-muted-foreground mt-2" data-oid="we_y1-8">
              No hay transacciones registradas aún
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card data-oid="qrgedik">
      <CardHeader data-oid="2tee95s">
        <CardTitle data-oid="56uact3">Historial de Transacciones</CardTitle>
        <CardDescription data-oid="2q_jld4">
          Registro de pagos y transacciones ({transactions.length})
        </CardDescription>
      </CardHeader>
      <CardContent data-oid="v3y6-g9">
        <div className="space-y-4" data-oid="o1dwr6t">
          {(transactions as TransactionData[]).map((transaction: TransactionData) => {
            const status: StatusConfig = statusConfig[transaction.status]
            const StatusIcon: LucideIcon = status.icon

            return (
              <div
                key={transaction.id}
                className="flex items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50"
                data-oid="ns9_oo0"
              >
                <div className={`mt-1 ${status.color}`} data-oid="4aglunj">
                  <StatusIcon className="h-5 w-5" data-oid="2vcmljc" />
                </div>

                <div className="flex-1 space-y-1" data-oid="pmghiey">
                  <div className="flex items-center justify-between" data-oid="belx60-">
                    <p className="font-medium" data-oid="rk54oxc">
                      {transaction.description ?? 'Pago de suscripción'}
                    </p>
                    <Badge variant={status.variant} data-oid="4adi-0z">
                      {status.label}
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground" data-oid="of4q4sk">
                    {formatDate(transaction.createdAt)}
                  </p>

                  {transaction.failureMessage && (
                    <p className="text-sm text-red-600" data-oid="f8hfnji">
                      Error: {transaction.failureMessage}
                    </p>
                  )}

                  <div
                    className="flex items-center gap-4 text-sm text-muted-foreground"
                    data-oid="mpz5fa0"
                  >
                    <span data-oid="jbolinl">Método: {transaction.paymentMethodType}</span>
                    {transaction.stripeChargeId && (
                      <span className="font-mono text-xs" data-oid="_4:-3z:">
                        ID: {transaction.stripeChargeId.slice(-8)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right" data-oid="41g.8ei">
                  <p className="text-lg font-semibold" data-oid="r8793:-">
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
