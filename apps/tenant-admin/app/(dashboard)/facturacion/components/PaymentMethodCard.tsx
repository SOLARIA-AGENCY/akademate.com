'use client'

import { Card, CardContent } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Badge } from '@payload-config/components/ui/badge'
import { CreditCard, Building2, Trash2, Star } from 'lucide-react'
import type { PaymentMethod } from '@payload-config/types/billing'

interface PaymentMethodCardProps {
  paymentMethod: PaymentMethod
  isDefault: boolean
  onSetDefault?: (id: string) => void
  onDelete?: (id: string) => void
}

export function PaymentMethodCard({
  paymentMethod,
  isDefault,
  onSetDefault,
  onDelete,
}: PaymentMethodCardProps) {
  const { type, card, sepaDebit } = paymentMethod

  const getCardBrandLogo = (brand: string) => {
    const brandLogos: Record<string, string> = {
      visa: '💳',
      mastercard: '💳',
      amex: '💳',
      discover: '💳',
    }
    return brandLogos[brand.toLowerCase()] || '💳'
  }

  const formatExpiry = (month: number, year: number) => {
    return `${month.toString().padStart(2, '0')}/${year.toString().slice(-2)}`
  }

  const isExpired = (month: number, year: number) => {
    const now = new Date()
    const expiry = new Date(year, month - 1)
    return expiry < now
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            {type === 'card' && card ? (
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-2xl">
                {getCardBrandLogo(card.brand)}
              </div>
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-200">
                <Building2 className="h-6 w-6 text-gray-600" />
              </div>
            )}

            <div className="flex-1">
              <div className="flex items-center gap-2">
                {type === 'card' && card ? (
                  <>
                    <p className="font-semibold capitalize">
                      {card.brand}
                    </p>
                    <span className="text-muted-foreground">
                      •••• {card.last4}
                    </span>
                  </>
                ) : sepaDebit ? (
                  <>
                    <p className="font-semibold">SEPA Débito Directo</p>
                    <span className="text-muted-foreground">
                      •••• {sepaDebit.last4}
                    </span>
                  </>
                ) : (
                  <p className="font-semibold capitalize">{type}</p>
                )}
                {isDefault && (
                  <Badge variant="secondary" className="gap-1">
                    <Star className="h-3 w-3" />
                    Predeterminado
                  </Badge>
                )}
              </div>

              <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                {type === 'card' && card && (
                  <span className={isExpired(card.expMonth, card.expYear) ? 'text-red-500' : ''}>
                    Expira: {formatExpiry(card.expMonth, card.expYear)}
                    {isExpired(card.expMonth, card.expYear) && ' (Expirada)'}
                  </span>
                )}
                {sepaDebit && (
                  <span>Banco: {sepaDebit.bankCode}</span>
                )}
              </div>

              {paymentMethod.billingDetails?.name && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {paymentMethod.billingDetails.name}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isDefault && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onSetDefault?.(paymentMethod.id)}
              >
                Establecer Predeterminado
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete?.(paymentMethod.id)}
              className="text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
