'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Badge } from '@payload-config/components/ui/badge'
import { Button } from '@payload-config/components/ui/button'
import { Calendar, CreditCard, TrendingUp, AlertCircle } from 'lucide-react'
import type { Subscription } from '@payload-config/types/billing'

interface SubscriptionCardProps {
  subscription: Subscription | null
  onUpgrade?: () => void
  onCancel?: () => void
  onResume?: () => void
  onManage?: () => void
}

export function SubscriptionCard({
  subscription,
  onUpgrade,
  onCancel,
  onResume,
  onManage,
}: SubscriptionCardProps) {
  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sin Suscripción Activa</CardTitle>
          <CardDescription>
            No tienes una suscripción activa. Selecciona un plan para comenzar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onUpgrade} style={{ backgroundColor: '#F2014B' }}>
            Ver Planes Disponibles
          </Button>
        </CardContent>
      </Card>
    )
  }

  const statusConfig = {
    active: { label: 'Activa', variant: 'default' as const, color: 'bg-green-500' },
    trialing: { label: 'Prueba', variant: 'secondary' as const, color: 'bg-blue-500' },
    past_due: { label: 'Pago Pendiente', variant: 'destructive' as const, color: 'bg-orange-500' },
    canceled: { label: 'Cancelada', variant: 'secondary' as const, color: 'bg-gray-500' },
    incomplete: { label: 'Incompleta', variant: 'destructive' as const, color: 'bg-red-500' },
    incomplete_expired: { label: 'Expirada', variant: 'destructive' as const, color: 'bg-red-500' },
    unpaid: { label: 'Sin Pagar', variant: 'destructive' as const, color: 'bg-red-500' },
  }

  const status = statusConfig[subscription.status] || statusConfig.active

  const planNames = {
    starter: 'Starter',
    pro: 'Pro',
    enterprise: 'Enterprise',
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const daysUntilRenewal = Math.ceil(
    (new Date(subscription.currentPeriodEnd).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-2xl">
              Plan {planNames[subscription.plan]}
            </CardTitle>
            <CardDescription>
              Tu suscripción actual y detalles de facturación
            </CardDescription>
          </div>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Alert */}
        {subscription.status === 'past_due' && (
          <div className="flex items-start gap-3 rounded-lg border border-orange-200 bg-orange-50 p-4">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            <div className="flex-1">
              <p className="font-medium text-orange-800">Pago Pendiente</p>
              <p className="text-sm text-orange-600">
                Actualiza tu método de pago para evitar la suspensión del servicio.
              </p>
            </div>
          </div>
        )}

        {subscription.cancelAtPeriodEnd && (
          <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <AlertCircle className="h-5 w-5 text-blue-500" />
            <div className="flex-1">
              <p className="font-medium text-blue-800">Cancelación Programada</p>
              <p className="text-sm text-blue-600">
                Tu suscripción se cancelará el {formatDate(subscription.currentPeriodEnd)}
              </p>
            </div>
          </div>
        )}

        {/* Subscription Details */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Próxima Renovación</p>
              <p className="text-sm text-muted-foreground">
                {formatDate(subscription.currentPeriodEnd)}
              </p>
              <p className="text-xs text-muted-foreground">
                En {daysUntilRenewal} días
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CreditCard className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Facturación</p>
              <p className="text-sm text-muted-foreground">
                Ciclo mensual
              </p>
            </div>
          </div>

          {subscription.trialEnd && new Date(subscription.trialEnd) > new Date() && (
            <div className="flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Periodo de Prueba</p>
                <p className="text-sm text-muted-foreground">
                  Finaliza el {formatDate(subscription.trialEnd)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          {subscription.cancelAtPeriodEnd ? (
            <Button onClick={onResume} variant="default">
              Reanudar Suscripción
            </Button>
          ) : (
            <>
              <Button onClick={onUpgrade} style={{ backgroundColor: '#F2014B' }}>
                Cambiar Plan
              </Button>
              <Button onClick={onManage} variant="outline">
                Portal de Facturación
              </Button>
              {subscription.status !== 'canceled' && (
                <Button onClick={onCancel} variant="outline">
                  Cancelar Suscripción
                </Button>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
