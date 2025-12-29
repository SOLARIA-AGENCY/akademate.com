'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Badge } from '@payload-config/components/ui/badge'
import { Check, Zap } from 'lucide-react'
import type { PlanTier } from '@payload-config/types/billing'

interface PlanCardProps {
  tier: PlanTier
  name: string
  description: string
  priceMonthly: number
  priceYearly: number
  features: string[]
  interval: 'month' | 'year'
  isCurrentPlan?: boolean
  isPopular?: boolean
  onSelect: (tier: PlanTier, interval: 'month' | 'year') => void
}

export function PlanCard({
  tier,
  name,
  description,
  priceMonthly,
  priceYearly,
  features,
  interval,
  isCurrentPlan,
  isPopular,
  onSelect,
}: PlanCardProps) {
  const price = interval === 'month' ? priceMonthly : priceYearly
  const displayPrice = (price / 100).toFixed(2)
  const monthlyEquivalent = interval === 'year' ? (price / 12 / 100).toFixed(2) : null

  return (
    <Card className={`relative ${isPopular ? 'border-2 border-[#F2014B]' : ''}`}>
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge style={{ backgroundColor: '#F2014B' }} className="gap-1">
            <Zap className="h-3 w-3" />
            Más Popular
          </Badge>
        </div>
      )}

      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-2xl">{name}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {isCurrentPlan && (
            <Badge variant="secondary">Plan Actual</Badge>
          )}
        </div>

        <div className="mt-4">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold">€{displayPrice}</span>
            <span className="text-muted-foreground">/{interval === 'month' ? 'mes' : 'año'}</span>
          </div>
          {monthlyEquivalent && (
            <p className="mt-1 text-sm text-muted-foreground">
              €{monthlyEquivalent}/mes facturado anualmente
            </p>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Features */}
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
              <Check className="h-5 w-5 shrink-0 text-green-500" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <Button
          onClick={() => onSelect(tier, interval)}
          disabled={isCurrentPlan}
          className="w-full"
          style={isPopular && !isCurrentPlan ? { backgroundColor: '#F2014B' } : undefined}
          variant={isPopular && !isCurrentPlan ? 'default' : 'outline'}
        >
          {isCurrentPlan ? 'Plan Actual' : 'Seleccionar Plan'}
        </Button>
      </CardContent>
    </Card>
  )
}
