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

  // Always show the monthly equivalent price
  const monthlyPrice = interval === 'year' ? price / 12 : price
  const displayPrice = (monthlyPrice / 100).toFixed(0)
  const annualTotal = interval === 'year' ? (price / 100).toFixed(0) : null

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange} data-oid="ay6e:ze">
      <AlertDialogContent className="max-w-md" data-oid="e9a56o1">
        <AlertDialogHeader data-oid="0_j609v">
          <AlertDialogTitle className="flex items-center gap-2" data-oid="z3-a3r8">
            <CreditCard className="h-5 w-5" data-oid="r2-vi1z" />
            Confirmar Cambio de Plan
          </AlertDialogTitle>
          <AlertDialogDescription data-oid="2mvdj9-">
            Serás redirigido a Stripe para completar el pago de forma segura.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4" data-oid="rjt7y4o">
          {/* Plan Summary */}
          <div className="rounded-lg border p-4" data-oid="ohme_fy">
            <div className="flex items-start justify-between" data-oid="l:v_cwj">
              <div data-oid="n1morhs">
                <h3 className="font-semibold text-lg" data-oid="y:5w1_r">
                  Plan {planName}
                </h3>
                <p className="text-sm text-muted-foreground" data-oid="chjg-r_">
                  Facturación {interval === 'month' ? 'mensual' : 'anual'}
                </p>
              </div>
              <Badge data-oid=":_2jhlu">{planTier.toUpperCase()}</Badge>
            </div>

            <div className="mt-4" data-oid="ubd89zw">
              <div className="flex items-baseline gap-1" data-oid="-lrc6ul">
                <span className="text-3xl font-bold" data-oid="pvbqrq7">
                  {'\u20AC'}{displayPrice}
                </span>
                <span className="text-muted-foreground" data-oid="duqrjta">
                  /mes
                </span>
              </div>
              {annualTotal && (
                <p className="mt-1 text-sm text-muted-foreground" data-oid="mvuit0s">
                  {'\u20AC'}{annualTotal}/año facturado anualmente (17% dto.)
                </p>
              )}
            </div>
          </div>

          {/* Features */}
          <div data-oid="h28_l-c">
            <p className="mb-2 text-sm font-medium" data-oid="ze4mq:1">
              Incluye:
            </p>
            <ul className="space-y-2" data-oid="p4:i_1l">
              {features.slice(0, 4).map((feature, index) => (
                <li key={index} className="flex items-start gap-2 text-sm" data-oid="vrjj__i">
                  <Check className="h-4 w-4 shrink-0 text-green-500 mt-0.5" data-oid="vbr.wg0" />
                  <span data-oid="wqdwh48">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3" data-oid="kbcmd07">
            <p className="text-sm text-blue-800" data-oid="iaedlhr">
              <strong data-oid="bm9-10u">Nota:</strong> El pago se procesará de forma segura a
              través de Stripe. Puedes cancelar en cualquier momento.
            </p>
          </div>
        </div>

        <AlertDialogFooter data-oid="5p090:o">
          <AlertDialogCancel disabled={isLoading} data-oid="8q3rg-9">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            style={{ backgroundColor: '#F2014B' }}
            data-oid="ynj9_ta"
          >
            {isLoading ? 'Redirigiendo...' : 'Continuar al Pago'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
