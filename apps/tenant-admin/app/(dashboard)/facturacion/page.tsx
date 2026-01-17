'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@payload-config/components/ui/tabs'
import { MockDataIndicator } from '@payload-config/components/ui/MockDataIndicator'
import { useToast } from '@payload-config/hooks/use-toast'
import { useBillingData } from '@payload-config/hooks/useBillingData'
import { useSubscription } from '@payload-config/hooks/useSubscription'
import { SubscriptionCard } from './components/SubscriptionCard'
import { PlanComparison } from './components/PlanComparison'
import { InvoicesTable } from './components/InvoicesTable'
import { PaymentMethodsList } from './components/PaymentMethodsList'
import { TransactionHistory } from './components/TransactionHistory'
import { CancelSubscriptionDialog } from './components/CancelSubscriptionDialog'
import type { PlanTier } from '@payload-config/types/billing'

export default function FacturacionPage() {
  const tenantId = '123e4567-e89b-12d3-a456-426614174001'
  const isDev = process.env.NODE_ENV === 'development'
  const effectiveTenantId = isDev ? undefined : tenantId
  const [activeTab, setActiveTab] = useState('subscription')
  const [showPlanComparison, setShowPlanComparison] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const { toast } = useToast()

  const {
    subscription,
    subscriptionLoading,
    invoices,
    invoicesLoading,
    paymentMethods,
    paymentMethodsLoading,
    transactions,
    transactionsLoading,
    mutate,
  } = useBillingData({ tenantId: effectiveTenantId })

  const subscriptionId = subscription?.stripeSubscriptionId ?? undefined
  const stripeCustomerId = subscription?.stripeCustomerId ?? undefined

  const {
    changePlan,
    cancelSubscription,
    resumeSubscription,
    openBillingPortal,
  } = useSubscription({ tenantId: effectiveTenantId, subscriptionId, stripeCustomerId })

  // Check for success/canceled params from Stripe redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('success') === 'true') {
      toast({
        title: 'Pago completado',
        description: 'Tu suscripción ha sido actualizada correctamente',
      })
      // Clean URL
      window.history.replaceState({}, '', '/facturacion')
      mutate()
    } else if (params.get('canceled') === 'true') {
      toast({
        title: 'Pago cancelado',
        description: 'El proceso de pago fue cancelado',
        variant: 'destructive',
      })
      // Clean URL
      window.history.replaceState({}, '', '/facturacion')
    }
  }, [toast, mutate])

  const handleUpgrade = () => {
    setShowPlanComparison(true)
  }

  const handleCancelSubscription = () => {
    setCancelDialogOpen(true)
  }

  const handleConfirmCancel = async (reason?: string, immediately?: boolean) => {
    try {
      await cancelSubscription(reason, immediately)
      toast({
        title: 'Suscripción cancelada',
        description: immediately
          ? 'Tu suscripción ha sido cancelada inmediatamente'
          : 'Tu suscripción se cancelará al final del periodo actual',
      })
      mutate()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo cancelar la suscripción. Inténtalo de nuevo.',
        variant: 'destructive',
      })
    }
  }

  const handleResumeSubscription = async () => {
    try {
      await resumeSubscription()
      toast({
        title: 'Suscripción reanudada',
        description: 'Tu suscripción ha sido reanudada correctamente',
      })
      mutate()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo reanudar la suscripción. Inténtalo de nuevo.',
        variant: 'destructive',
      })
    }
  }

  const handleManageBilling = async () => {
    try {
      await openBillingPortal()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo abrir el portal de facturación. Inténtalo de nuevo.',
        variant: 'destructive',
      })
    }
  }

  const handleSelectPlan = async (tier: PlanTier, interval: 'month' | 'year') => {
    try {
      await changePlan(tier, interval)
      // Will redirect to Stripe Checkout
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo iniciar el proceso de pago. Inténtalo de nuevo.',
        variant: 'destructive',
      })
    }
  }

  const handleAddPaymentMethod = async () => {
    try {
      await openBillingPortal()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo abrir el portal de facturación. Inténtalo de nuevo.',
        variant: 'destructive',
      })
    }
  }

  const handleSetDefaultPaymentMethod = async (id: string) => {
    if (!stripeCustomerId) {
      toast({
        title: 'Error',
        description: 'No hay cliente de Stripe asociado',
        variant: 'destructive',
      })
      return
    }

    try {
      const res = await fetch('/api/billing/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: stripeCustomerId,
          paymentMethodId: id,
          setAsDefault: true,
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to set default payment method')
      }

      toast({
        title: 'Método actualizado',
        description: 'Método de pago actualizado correctamente',
      })
      mutate()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el método de pago',
        variant: 'destructive',
      })
    }
  }

  const handleDeletePaymentMethod = async (id: string) => {
    // TODO: Implement when API is ready
    toast({
      title: 'Funcionalidad en desarrollo',
      description: 'Esta función estará disponible próximamente',
    })
  }

  return (
    <div className="space-y-6">
      <MockDataIndicator />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Facturación y Suscripciones</h1>
        <p className="text-muted-foreground">
          Gestiona tu suscripción, facturas y métodos de pago
        </p>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="subscription">Suscripción</TabsTrigger>
          <TabsTrigger value="invoices">Facturas</TabsTrigger>
          <TabsTrigger value="payment-methods">Métodos de Pago</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
        </TabsList>

        {/* Subscription Tab */}
        <TabsContent value="subscription" className="space-y-6">
          {subscriptionLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <>
              <SubscriptionCard
                subscription={subscription}
                onUpgrade={handleUpgrade}
                onCancel={handleCancelSubscription}
                onResume={handleResumeSubscription}
                onManage={handleManageBilling}
              />

              {showPlanComparison && (
                <PlanComparison
                  currentPlan={subscription?.plan}
                  onSelectPlan={handleSelectPlan}
                />
              )}
            </>
          )}
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices">
          <InvoicesTable invoices={invoices} loading={invoicesLoading} />
        </TabsContent>

        {/* Payment Methods Tab */}
        <TabsContent value="payment-methods">
          <PaymentMethodsList
            paymentMethods={paymentMethods}
            loading={paymentMethodsLoading}
            onAddMethod={handleAddPaymentMethod}
            onSetDefault={handleSetDefaultPaymentMethod}
            onDelete={handleDeletePaymentMethod}
          />
        </TabsContent>

        {/* Transaction History Tab */}
        <TabsContent value="history">
          <TransactionHistory
            transactions={transactions}
            loading={transactionsLoading || subscriptionLoading}
          />
        </TabsContent>
      </Tabs>

      {/* Cancel Subscription Dialog */}
      <CancelSubscriptionDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        onConfirm={handleConfirmCancel}
        currentPeriodEnd={subscription?.currentPeriodEnd}
      />
    </div>
  )
}
