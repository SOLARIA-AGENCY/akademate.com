'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Label } from '@payload-config/components/ui/label'
import { Switch } from '@payload-config/components/ui/switch'
import { PlanCard } from './PlanCard'
import { CheckoutDialog } from './CheckoutDialog'
import type { PlanTier } from '@payload-config/types/billing'

interface PlanComparisonProps {
  currentPlan?: PlanTier
  onSelectPlan: (tier: PlanTier, interval: 'month' | 'year') => Promise<void>
}

const PLAN_FEATURES = {
  starter: [
    'Hasta 100 usuarios',
    '10 GB de almacenamiento',
    '50,000 llamadas API/mes',
    'Soporte por email',
    'Acceso a documentación',
  ],
  pro: [
    'Hasta 500 usuarios',
    '100 GB de almacenamiento',
    '500,000 llamadas API/mes',
    'Soporte prioritario',
    'Acceso a API avanzada',
    'Integraciones personalizadas',
    'Análisis avanzado',
  ],
  enterprise: [
    'Usuarios ilimitados',
    'Almacenamiento ilimitado',
    'Llamadas API ilimitadas',
    'Soporte 24/7 dedicado',
    'Gestor de cuenta',
    'SLA personalizado',
    'Infraestructura dedicada',
    'Personalización completa',
  ],
}

const PLAN_PRICING = {
  starter: { monthly: 19900, yearly: 199000 }, // €199/mo, €1990/yr
  pro: { monthly: 29900, yearly: 299000 }, // €299/mo, €2990/yr
  enterprise: { monthly: 59900, yearly: 599000 }, // €599/mo, €5990/yr
}

export function PlanComparison({ currentPlan, onSelectPlan }: PlanComparisonProps) {
  const [interval, setInterval] = useState<'month' | 'year'>('month')
  const [selectedPlan, setSelectedPlan] = useState<{
    tier: PlanTier
    interval: 'month' | 'year'
  } | null>(null)

  const handleSelectPlan = (tier: PlanTier, interval: 'month' | 'year') => {
    setSelectedPlan({ tier, interval })
  }

  const handleConfirmCheckout = async () => {
    if (selectedPlan) {
      await onSelectPlan(selectedPlan.tier, selectedPlan.interval)
    }
  }

  const getSelectedPlanDetails = () => {
    if (!selectedPlan) return null

    const planNames = {
      starter: 'Starter',
      pro: 'Pro',
      enterprise: 'Enterprise',
    }

    return {
      planTier: selectedPlan.tier,
      planName: planNames[selectedPlan.tier],
      price: PLAN_PRICING[selectedPlan.tier][selectedPlan.interval === 'month' ? 'monthly' : 'yearly'],
      interval: selectedPlan.interval,
      features: PLAN_FEATURES[selectedPlan.tier],
    }
  }

  const selectedDetails = getSelectedPlanDetails()

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Planes Disponibles</CardTitle>
              <CardDescription>
                Elige el plan que mejor se adapte a tus necesidades
              </CardDescription>
            </div>

            {/* Interval Toggle */}
            <div className="flex items-center gap-3">
              <Label htmlFor="interval" className={interval === 'month' ? 'font-semibold' : ''}>
                Mensual
              </Label>
              <Switch
                id="interval"
                checked={interval === 'year'}
                onCheckedChange={(checked) => setInterval(checked ? 'year' : 'month')}
              />
              <div className="flex items-center gap-2">
                <Label htmlFor="interval" className={interval === 'year' ? 'font-semibold' : ''}>
                  Anual
                </Label>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                  Ahorra 17%
                </span>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <PlanCard
              tier="starter"
              name="Starter"
              description="Para proyectos pequeños y startups"
              priceMonthly={PLAN_PRICING.starter.monthly}
              priceYearly={PLAN_PRICING.starter.yearly}
              features={PLAN_FEATURES.starter}
              interval={interval}
              isCurrentPlan={currentPlan === 'starter'}
              onSelect={handleSelectPlan}
            />

            <PlanCard
              tier="pro"
              name="Pro"
              description="Para equipos en crecimiento"
              priceMonthly={PLAN_PRICING.pro.monthly}
              priceYearly={PLAN_PRICING.pro.yearly}
              features={PLAN_FEATURES.pro}
              interval={interval}
              isCurrentPlan={currentPlan === 'pro'}
              isPopular={true}
              onSelect={handleSelectPlan}
            />

            <PlanCard
              tier="enterprise"
              name="Enterprise"
              description="Para grandes organizaciones"
              priceMonthly={PLAN_PRICING.enterprise.monthly}
              priceYearly={PLAN_PRICING.enterprise.yearly}
              features={PLAN_FEATURES.enterprise}
              interval={interval}
              isCurrentPlan={currentPlan === 'enterprise'}
              onSelect={handleSelectPlan}
            />
          </div>
        </CardContent>
      </Card>

      {/* Checkout Dialog */}
      {selectedDetails && (
        <CheckoutDialog
          open={!!selectedPlan}
          onOpenChange={(open) => !open && setSelectedPlan(null)}
          onConfirm={handleConfirmCheckout}
          {...selectedDetails}
        />
      )}
    </>
  )
}
