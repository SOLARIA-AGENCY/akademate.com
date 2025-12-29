'use client'

import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@payload-config/components/ui/alert-dialog'
import { Badge } from '@payload-config/components/ui/badge'
import { Check, CreditCard } from 'lucide-react'
import type { PlanTier } from '@payload-config/types/billing'

interface CheckoutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
  planTier: PlanTier
  planName: string
  price: number
  interval: 'month' | 'year'
  features: string[]
}

export function CheckoutDialog({
  open,
  onOpenChange,
  onConfirm,
  planTier,
  planName,
  price,
  interval,
  features,
}: CheckoutDialogProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      await onConfirm()
      // Dialog will close when redirected to Stripe
    } catch (error) {
      console.error('Failed to start checkout:', error)
      setIsLoading(false)
    }
  }

  const displayPrice = (price / 100).toFixed(2)
  const monthlyEquivalent = interval === 'year' ? (price / 12 / 100).toFixed(2) : null

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Confirmar Cambio de Plan
          </AlertDialogTitle>
          <AlertDialogDescription>
            Serás redirigido a Stripe para completar el pago de forma segura.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          {/* Plan Summary */}
          <div className="rounded-lg border p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg">Plan {planName}</h3>
                <p className="text-sm text-muted-foreground">
                  Facturación {interval === 'month' ? 'mensual' : 'anual'}
                </p>
              </div>
              <Badge>{planTier.toUpperCase()}</Badge>
            </div>

            <div className="mt-4">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">€{displayPrice}</span>
                <span className="text-muted-foreground">/{interval === 'month' ? 'mes' : 'año'}</span>
              </div>
              {monthlyEquivalent && (
                <p className="mt-1 text-sm text-muted-foreground">
                  €{monthlyEquivalent}/mes facturado anualmente
                </p>
              )}
            </div>
          </div>

          {/* Features */}
          <div>
            <p className="mb-2 text-sm font-medium">Incluye:</p>
            <ul className="space-y-2">
              {features.slice(0, 4).map((feature, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 shrink-0 text-green-500 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
            <p className="text-sm text-blue-800">
              <strong>Nota:</strong> El pago se procesará de forma segura a través de Stripe.
              Puedes cancelar en cualquier momento.
            </p>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            style={{ backgroundColor: '#F2014B' }}
          >
            {isLoading ? 'Redirigiendo...' : 'Continuar al Pago'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
