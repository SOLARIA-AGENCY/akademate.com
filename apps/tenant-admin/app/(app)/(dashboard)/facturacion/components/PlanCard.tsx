'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@payload-config/components/ui/card'
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
    <Card className={`relative ${isPopular ? 'border-2 border-[#F2014B]' : ''}`} data-oid="5066gyq">
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2" data-oid="srmloxx">
          <Badge style={{ backgroundColor: '#F2014B' }} className="gap-1" data-oid="lhk57rs">
            <Zap className="h-3 w-3" data-oid="k3n6pwa" />
            Más Popular
          </Badge>
        </div>
      )}

      <CardHeader data-oid="efwsc7_">
        <div className="flex items-start justify-between" data-oid="9te7s1f">
          <div data-oid="tmc63ft">
            <CardTitle className="text-2xl" data-oid="uhgkdn7">
              {name}
            </CardTitle>
            <CardDescription data-oid="k4qb08o">{description}</CardDescription>
          </div>
          {isCurrentPlan && (
            <Badge variant="secondary" data-oid="0c3a95z">
              Plan Actual
            </Badge>
          )}
        </div>

        <div className="mt-4" data-oid="bezs2jz">
          <div className="flex items-baseline gap-1" data-oid="db-klh4">
            <span className="text-4xl font-bold" data-oid="u.htull">
              €{displayPrice}
            </span>
            <span className="text-muted-foreground" data-oid="ek6ivjt">
              /{interval === 'month' ? 'mes' : 'año'}
            </span>
          </div>
          {monthlyEquivalent && (
            <p className="mt-1 text-sm text-muted-foreground" data-oid=":qp3f34">
              €{monthlyEquivalent}/mes facturado anualmente
            </p>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6" data-oid="xlf1csn">
        {/* Features */}
        <ul className="space-y-3" data-oid="ar9scd8">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2" data-oid="nsqze7y">
              <Check className="h-5 w-5 shrink-0 text-green-500" data-oid="_pwf8.:" />
              <span className="text-sm" data-oid="d7g3rr1">
                {feature}
              </span>
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
          data-oid="pqm1swr"
        >
          {isCurrentPlan ? 'Plan Actual' : 'Seleccionar Plan'}
        </Button>
      </CardContent>
    </Card>
  )
}
