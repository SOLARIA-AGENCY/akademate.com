'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@payload-config/components/ui/card'
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
      <Card>
        <CardHeader>
          <CardTitle>Métodos de Pago</CardTitle>
          <CardDescription>Gestiona tus métodos de pago</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (paymentMethods.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Métodos de Pago</CardTitle>
          <CardDescription>Gestiona tus métodos de pago</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">Sin métodos de pago</h3>
            <p className="text-sm text-muted-foreground mt-2 mb-4">
              Agrega un método de pago para gestionar tu suscripción
            </p>
            <Button onClick={onAddMethod} style={{ backgroundColor: '#F2014B' }}>
              <Plus className="mr-2 h-4 w-4" />
              Agregar Método de Pago
            </Button>
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
            <CardTitle>Métodos de Pago</CardTitle>
            <CardDescription>
              Gestiona tus métodos de pago ({paymentMethods.length})
            </CardDescription>
          </div>
          <Button onClick={onAddMethod} variant="outline" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Agregar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {paymentMethods.map((method) => (
            <PaymentMethodCard
              key={method.id}
              paymentMethod={method}
              isDefault={method.isDefault}
              onSetDefault={onSetDefault}
              onDelete={onDelete}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
