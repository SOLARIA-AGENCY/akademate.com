'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@payload-config/components/ui/card'
import { Badge } from '@payload-config/components/ui/badge'
import { Button } from '@payload-config/components/ui/button'
import { Calendar, CreditCard, TrendingUp, AlertCircle } from 'lucide-react'

// Local type definitions for type safety
type SubscriptionStatusType =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'unpaid'

type PlanTierType = 'starter' | 'pro' | 'enterprise'

interface SubscriptionData {
  id: string
  tenantId: string
  plan: PlanTierType
  status: SubscriptionStatusType
  stripeSubscriptionId: string | null
  stripeCustomerId: string | null
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
  canceledAt?: Date | null
  trialStart?: Date | null
  trialEnd?: Date | null
  metadata: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

interface StatusConfigItem {
  label: string
  variant: 'default' | 'secondary' | 'destructive'
  color: string
}

interface SubscriptionCardProps {
  subscription: SubscriptionData | null
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
      <Card data-oid="a0_qlv2">
        <CardHeader data-oid="1kvcx-r">
          <CardTitle data-oid="5-ny3ie">Sin Suscripción Activa</CardTitle>
          <CardDescription data-oid="t95:2i7">
            No tienes una suscripción activa. Selecciona un plan para comenzar.
          </CardDescription>
        </CardHeader>
        <CardContent data-oid="i-1_7ia">
          <Button onClick={onUpgrade} style={{ backgroundColor: '#F2014B' }} data-oid="qd2u88t">
            Ver Planes Disponibles
          </Button>
        </CardContent>
      </Card>
    )
  }

  const statusConfig: Record<SubscriptionStatusType, StatusConfigItem> = {
    active: { label: 'Activa', variant: 'default', color: 'bg-green-500' },
    trialing: { label: 'Prueba', variant: 'secondary', color: 'bg-blue-500' },
    past_due: { label: 'Pago Pendiente', variant: 'destructive', color: 'bg-orange-500' },
    canceled: { label: 'Cancelada', variant: 'secondary', color: 'bg-gray-500' },
    incomplete: { label: 'Incompleta', variant: 'destructive', color: 'bg-red-500' },
    incomplete_expired: { label: 'Expirada', variant: 'destructive', color: 'bg-red-500' },
    unpaid: { label: 'Sin Pagar', variant: 'destructive', color: 'bg-red-500' },
  }

  const status: StatusConfigItem = statusConfig[subscription.status] ?? statusConfig.active

  const planNames: Record<PlanTierType, string> = {
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
    (new Date(subscription.currentPeriodEnd).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24)
  )

  return (
    <Card data-oid="ef1tw:2">
      <CardHeader data-oid="u7-ji36">
        <div className="flex items-start justify-between" data-oid="yoqstx-">
          <div data-oid="z8yfkai">
            <CardTitle className="text-2xl" data-oid=".1uh6t4">
              Plan {planNames[subscription.plan]}
            </CardTitle>
            <CardDescription data-oid="0_.7laf">
              Tu suscripción actual y detalles de facturación
            </CardDescription>
          </div>
          <Badge variant={status.variant} data-oid="pyp.v:r">
            {status.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6" data-oid="3ag5p44">
        {/* Status Alert */}
        {subscription.status === 'past_due' && (
          <div
            className="flex items-start gap-3 rounded-lg border border-orange-200 bg-orange-50 p-4"
            data-oid="9hj96:j"
          >
            <AlertCircle className="h-5 w-5 text-orange-500" data-oid="ww_nh14" />
            <div className="flex-1" data-oid=".6rkh2w">
              <p className="font-medium text-orange-800" data-oid="m89oq36">
                Pago Pendiente
              </p>
              <p className="text-sm text-orange-600" data-oid="15240o8">
                Actualiza tu método de pago para evitar la suspensión del servicio.
              </p>
            </div>
          </div>
        )}

        {subscription.cancelAtPeriodEnd && (
          <div
            className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4"
            data-oid="9kxx3su"
          >
            <AlertCircle className="h-5 w-5 text-blue-500" data-oid="1v-i1oj" />
            <div className="flex-1" data-oid="w_j:91x">
              <p className="font-medium text-blue-800" data-oid="jiygbhe">
                Cancelación Programada
              </p>
              <p className="text-sm text-blue-600" data-oid="f_gm:p.">
                Tu suscripción se cancelará el {formatDate(subscription.currentPeriodEnd)}
              </p>
            </div>
          </div>
        )}

        {/* Subscription Details */}
        <div className="grid gap-4 md:grid-cols-2" data-oid="70.e6k4">
          <div className="flex items-start gap-3" data-oid="z:is0fc">
            <Calendar className="h-5 w-5 text-muted-foreground" data-oid="k2ozzcd" />
            <div data-oid="w09_-nk">
              <p className="text-sm font-medium" data-oid="vaagt86">
                Próxima Renovación
              </p>
              <p className="text-sm text-muted-foreground" data-oid="_e4gkkn">
                {formatDate(subscription.currentPeriodEnd)}
              </p>
              <p className="text-xs text-muted-foreground" data-oid="qpsmi70">
                En {daysUntilRenewal} días
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3" data-oid="olk4fjg">
            <CreditCard className="h-5 w-5 text-muted-foreground" data-oid="fy.0aw3" />
            <div data-oid="25f0y6w">
              <p className="text-sm font-medium" data-oid="624eaj4">
                Facturación
              </p>
              <p className="text-sm text-muted-foreground" data-oid="1uwf6-g">
                Ciclo mensual
              </p>
            </div>
          </div>

          {subscription.trialEnd && new Date(subscription.trialEnd) > new Date() && (
            <div className="flex items-start gap-3" data-oid="q6j0lei">
              <TrendingUp className="h-5 w-5 text-muted-foreground" data-oid="8k3fb51" />
              <div data-oid="9enwijm">
                <p className="text-sm font-medium" data-oid="onp:4k8">
                  Periodo de Prueba
                </p>
                <p className="text-sm text-muted-foreground" data-oid="d6k7gj9">
                  Finaliza el {formatDate(subscription.trialEnd)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3" data-oid="tghf4bp">
          {subscription.cancelAtPeriodEnd ? (
            <Button onClick={onResume} variant="default" data-oid="eoyhalq">
              Reanudar Suscripción
            </Button>
          ) : (
            <>
              <Button onClick={onUpgrade} style={{ backgroundColor: '#F2014B' }} data-oid="pxd5g38">
                Cambiar Plan
              </Button>
              <Button onClick={onManage} variant="outline" data-oid="7rk7pnf">
                Portal de Facturación
              </Button>
              {subscription.status !== 'canceled' && (
                <Button onClick={onCancel} variant="outline" data-oid="cj3ue2n">
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
