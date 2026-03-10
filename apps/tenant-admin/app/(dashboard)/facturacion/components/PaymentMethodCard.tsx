'use client'

import { Card, CardContent } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Badge } from '@payload-config/components/ui/badge'
import { Building2, Trash2, Star } from 'lucide-react'

/**
 * Card details for payment method
 */
interface PaymentMethodCard {
  brand: string
  last4: string
  expMonth: number
  expYear: number
}

/**
 * SEPA Direct Debit details
 */
interface PaymentMethodSepaDebit {
  bankCode: string
  last4: string
  country: string
}

/**
 * Billing details for payment method
 */
interface PaymentMethodBillingDetails {
  name?: string | null
  email?: string | null
  phone?: string | null
  address?: {
    line1?: string | null
    line2?: string | null
    city?: string | null
    state?: string | null
    postalCode?: string | null
    country?: string | null
  } | null
}

/**
 * Payment method data structure
 */
interface PaymentMethodData {
  id: string
  tenantId: string
  stripePaymentMethodId: string
  type: 'card' | 'sepa_debit' | 'bank_transfer'
  isDefault: boolean
  card?: PaymentMethodCard | null
  sepaDebit?: PaymentMethodSepaDebit | null
  billingDetails?: PaymentMethodBillingDetails
  createdAt: Date
  updatedAt: Date
}

interface PaymentMethodCardProps {
  paymentMethod: PaymentMethodData
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
    return brandLogos[brand.toLowerCase()] ?? '💳'
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
    <Card data-oid="l_us33e">
      <CardContent className="p-6" data-oid="4m0ulow">
        <div className="flex items-start justify-between" data-oid="r6ywcdf">
          <div className="flex items-start gap-4" data-oid="ika92m7">
            {type === 'card' && card ? (
              <div
                className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-2xl"
                data-oid="s-j27.u"
              >
                {getCardBrandLogo(card.brand)}
              </div>
            ) : (
              <div
                className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-200"
                data-oid="57t8.pa"
              >
                <Building2 className="h-6 w-6 text-gray-600" data-oid="uwqb767" />
              </div>
            )}

            <div className="flex-1" data-oid="o7_.1.0">
              <div className="flex items-center gap-2" data-oid="2maepab">
                {type === 'card' && card ? (
                  <>
                    <p className="font-semibold capitalize" data-oid="pgcm2gk">
                      {card.brand}
                    </p>
                    <span className="text-muted-foreground" data-oid="7jk7.fh">
                      •••• {card.last4}
                    </span>
                  </>
                ) : sepaDebit ? (
                  <>
                    <p className="font-semibold" data-oid="7rl2rnh">
                      SEPA Débito Directo
                    </p>
                    <span className="text-muted-foreground" data-oid="z.2tc-q">
                      •••• {sepaDebit.last4}
                    </span>
                  </>
                ) : (
                  <p className="font-semibold capitalize" data-oid="4e:nmju">
                    {type}
                  </p>
                )}
                {isDefault && (
                  <Badge variant="secondary" className="gap-1" data-oid=".0qzpe.">
                    <Star className="h-3 w-3" data-oid="4ay1jw:" />
                    Predeterminado
                  </Badge>
                )}
              </div>

              <div
                className="mt-1 flex items-center gap-4 text-sm text-muted-foreground"
                data-oid="rqo-tlc"
              >
                {type === 'card' && card && (
                  <span
                    className={isExpired(card.expMonth, card.expYear) ? 'text-red-500' : ''}
                    data-oid="omyb7ef"
                  >
                    Expira: {formatExpiry(card.expMonth, card.expYear)}
                    {isExpired(card.expMonth, card.expYear) && ' (Expirada)'}
                  </span>
                )}
                {sepaDebit && <span data-oid="h3pwq.3">Banco: {sepaDebit.bankCode}</span>}
              </div>

              {paymentMethod.billingDetails?.name && (
                <p className="mt-1 text-sm text-muted-foreground" data-oid="fi-7yzm">
                  {paymentMethod.billingDetails.name}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2" data-oid="aun5azc">
            {!isDefault && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onSetDefault?.(paymentMethod.id)}
                data-oid="g4_9.0_"
              >
                Establecer Predeterminado
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete?.(paymentMethod.id)}
              className="text-destructive hover:bg-destructive/10"
              data-oid="hxt_vl-"
            >
              <Trash2 className="h-4 w-4" data-oid="q1852e." />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
