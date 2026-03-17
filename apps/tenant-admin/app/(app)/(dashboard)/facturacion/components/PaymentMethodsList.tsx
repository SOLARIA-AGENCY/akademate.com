'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Plus, CreditCard } from 'lucide-react'
import { PaymentMethodCard } from './PaymentMethodCard'
import type { PaymentMethod } from '@payload-config/types/billing'

interface PaymentMethodsListProps {
  paymentMethods: PaymentMethod[]
  loading?: boolean
  onAddMethod?: () => void
  onSetDefault?: (id: string) => void
  onDelete?: (id: string) => void
}

export function PaymentMethodsList({
  paymentMethods,
  loading,
  onAddMethod,
  onSetDefault,
  onDelete,
}: PaymentMethodsListProps) {
  if (loading) {
    return (
      <Card data-oid="yd4h804">
        <CardHeader data-oid="djsdhyq">
          <CardTitle data-oid="xi164aj">Métodos de Pago</CardTitle>
          <CardDescription data-oid="ypp5xgh">Gestiona tus métodos de pago</CardDescription>
        </CardHeader>
        <CardContent data-oid="cwz7s9c">
          <div className="flex items-center justify-center py-8" data-oid="713oz3:">
            <div
              className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"
              data-oid="i8_6cv8"
            />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (paymentMethods.length === 0) {
    return (
      <Card data-oid="k.ltz9b">
        <CardHeader data-oid="cq.o18u">
          <CardTitle data-oid="bui2pi0">Métodos de Pago</CardTitle>
          <CardDescription data-oid="4n-li4d">Gestiona tus métodos de pago</CardDescription>
        </CardHeader>
        <CardContent data-oid="gft6j3j">
          <div
            className="flex flex-col items-center justify-center py-12 text-center"
            data-oid=":fu15ip"
          >
            <CreditCard className="h-12 w-12 text-muted-foreground mb-4" data-oid="-cctpbm" />
            <h3 className="text-lg font-semibold" data-oid="-ddof6r">
              Sin métodos de pago
            </h3>
            <p className="text-sm text-muted-foreground mt-2 mb-4" data-oid="h93w13k">
              Agrega un método de pago para gestionar tu suscripción
            </p>
            <Button onClick={onAddMethod} style={{ backgroundColor: '#F2014B' }} data-oid="wdtmbky">
              <Plus className="mr-2 h-4 w-4" data-oid="r.:_s4r" />
              Agregar Método de Pago
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card data-oid="243:48n">
      <CardHeader data-oid="z7osrj1">
        <div className="flex items-center justify-between" data-oid="c5zt-xw">
          <div data-oid="ax82:pt">
            <CardTitle data-oid="y2hh_.w">Métodos de Pago</CardTitle>
            <CardDescription data-oid="808czsd">
              Gestiona tus métodos de pago ({paymentMethods.length})
            </CardDescription>
          </div>
          <Button onClick={onAddMethod} variant="outline" size="sm" data-oid="a.7-lqz">
            <Plus className="mr-2 h-4 w-4" data-oid="vh38ao8" />
            Agregar
          </Button>
        </div>
      </CardHeader>
      <CardContent data-oid="p260h92">
        <div className="space-y-4" data-oid="50wlbmj">
          {paymentMethods.map((method) => (
            <PaymentMethodCard
              key={method.id}
              paymentMethod={method}
              isDefault={method.isDefault}
              onSetDefault={onSetDefault}
              onDelete={onDelete}
              data-oid="lz6c19e"
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
