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

// ============================================================================
// Local Type Definitions
// These mirror the types from @payload-config/types/billing to avoid
// ESLint type resolution issues with path aliases and re-exports
// ============================================================================

/** Plan tier options */
type PlanTier = 'starter' | 'pro' | 'enterprise'

/** Subscription status values */
type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'unpaid'

/** Invoice status values */
type InvoiceStatus = 'draft' | 'open' | 'paid' | 'void' | 'uncollectible'

/** Payment status values */
type PaymentStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled' | 'refunded'

/** Subscription data structure */
interface Subscription {
  id: string
  tenantId: string
  plan: PlanTier
  status: SubscriptionStatus
  stripeSubscriptionId: string | null
  stripeCustomerId: string | null
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
  canceledAt?: Date | null
  trialStart?: Date | null
  trialEnd?: Date | null
  metadata: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

/** Invoice line item */
interface InvoiceLineItem {
  description: string
  quantity: number
  unitAmount: number
  amount: number
}

/** Invoice data structure */
interface Invoice {
  id: string
  tenantId: string
  subscriptionId: string | null
  stripeInvoiceId: string | null
  number: string
  status: InvoiceStatus
  currency: string
  subtotal: number
  tax: number
  total: number
  amountPaid: number
  amountDue: number
  dueDate: Date | null
  paidAt: Date | null
  hostedInvoiceUrl: string | null
  invoicePdfUrl: string | null
  lineItems: InvoiceLineItem[]
  metadata: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

/** Card payment details */
interface CardDetails {
  brand: string
  last4: string
  expMonth: number
  expYear: number
}

/** SEPA debit details */
interface SepaDebitDetails {
  bankCode: string
  last4: string
  country: string
}

/** Billing address */
interface BillingAddress {
  line1: string | null
  line2: string | null
  city: string | null
  state: string | null
  postalCode: string | null
  country: string | null
}

/** Billing details */
interface BillingDetails {
  name: string | null
  email: string | null
  phone: string | null
  address: BillingAddress | null
}

/** Payment method type */
type PaymentMethodType = 'card' | 'sepa_debit' | 'bank_transfer'

/** Payment method data structure */
interface PaymentMethod {
  id: string
  tenantId: string
  stripePaymentMethodId: string
  type: PaymentMethodType
  isDefault: boolean
  card: CardDetails | null
  sepaDebit: SepaDebitDetails | null
  billingDetails?: BillingDetails
  createdAt: Date
  updatedAt: Date
}

/** Payment transaction data structure */
interface PaymentTransaction {
  id: string
  tenantId: string
  invoiceId: string | null
  stripePaymentIntentId: string | null
  stripeChargeId: string | null
  amount: number
  currency: string
  status: PaymentStatus
  paymentMethodType: string
  description: string | null
  failureCode: string | null
  failureMessage: string | null
  metadata: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

// ============================================================================
// Hook Return Types
// ============================================================================

/** Return type for useBillingData hook */
interface BillingDataResult {
  subscription: Subscription | null
  subscriptionLoading: boolean
  invoices: Invoice[]
  invoicesLoading: boolean
  paymentMethods: PaymentMethod[]
  paymentMethodsLoading: boolean
  transactions: PaymentTransaction[]
  transactionsLoading: boolean
  mutate: () => void
}

/** Return type for useSubscription hook */
interface SubscriptionActions {
  changePlan: (planTier: PlanTier, interval: 'month' | 'year') => Promise<void>
  cancelSubscription: (reason?: string, immediately?: boolean) => Promise<void>
  resumeSubscription: () => Promise<void>
  openBillingPortal: () => Promise<void>
}

/** Toast options */
interface ToastOptions {
  title: string
  description?: string
  variant?: 'default' | 'destructive'
}

/** Toast function signature */
type ToastFunction = (options: ToastOptions) => void

/** Toast hook result */
interface ToastHookResult {
  toast: ToastFunction
}

// ============================================================================
// Page Component
// ============================================================================

export default function FacturacionPage() {
  const tenantId = '123e4567-e89b-12d3-a456-426614174001'
  const isDev = process.env.NODE_ENV === 'development'
  const effectiveTenantId = isDev ? undefined : tenantId
  const [activeTab, setActiveTab] = useState('subscription')
  const [showPlanComparison, setShowPlanComparison] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
   
  const toastHook = useToast() as unknown as ToastHookResult
  const toast = toastHook.toast

   
  const billingData = useBillingData({ tenantId: effectiveTenantId }) as unknown as BillingDataResult
  const subscription = billingData.subscription
  const subscriptionLoading = billingData.subscriptionLoading
  const invoices = billingData.invoices
  const invoicesLoading = billingData.invoicesLoading
  const paymentMethods = billingData.paymentMethods
  const paymentMethodsLoading = billingData.paymentMethodsLoading
  const transactions = billingData.transactions
  const transactionsLoading = billingData.transactionsLoading
  const mutate = billingData.mutate

  const subscriptionId = subscription?.stripeSubscriptionId ?? undefined
  const stripeCustomerId = subscription?.stripeCustomerId ?? undefined

   
  const subscriptionActions = useSubscription({
    tenantId: effectiveTenantId,
    subscriptionId,
    stripeCustomerId,
  }) as unknown as SubscriptionActions
  const changePlan = subscriptionActions.changePlan
  const cancelSubscription = subscriptionActions.cancelSubscription
  const resumeSubscription = subscriptionActions.resumeSubscription
  const openBillingPortal = subscriptionActions.openBillingPortal

  // Check for success/canceled params from Stripe redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('success') === 'true') {
      toast({
        title: 'Pago completado',
        description: 'Tu suscripcion ha sido actualizada correctamente',
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
        title: 'Suscripcion cancelada',
        description: immediately
          ? 'Tu suscripcion ha sido cancelada inmediatamente'
          : 'Tu suscripcion se cancelara al final del periodo actual',
      })
      mutate()
    } catch {
      toast({
        title: 'Error',
        description: 'No se pudo cancelar la suscripcion. Intentalo de nuevo.',
        variant: 'destructive',
      })
    }
  }

  const handleResumeSubscription = async () => {
    try {
      await resumeSubscription()
      toast({
        title: 'Suscripcion reanudada',
        description: 'Tu suscripcion ha sido reanudada correctamente',
      })
      mutate()
    } catch {
      toast({
        title: 'Error',
        description: 'No se pudo reanudar la suscripcion. Intentalo de nuevo.',
        variant: 'destructive',
      })
    }
  }

  const handleManageBilling = async () => {
    try {
      await openBillingPortal()
    } catch {
      toast({
        title: 'Error',
        description: 'No se pudo abrir el portal de facturacion. Intentalo de nuevo.',
        variant: 'destructive',
      })
    }
  }

  const handleSelectPlan = async (tier: PlanTier, interval: 'month' | 'year') => {
    try {
      await changePlan(tier, interval)
      // Will redirect to Stripe Checkout
    } catch {
      toast({
        title: 'Error',
        description: 'No se pudo iniciar el proceso de pago. Intentalo de nuevo.',
        variant: 'destructive',
      })
    }
  }

  const handleAddPaymentMethod = async () => {
    try {
      await openBillingPortal()
    } catch {
      toast({
        title: 'Error',
        description: 'No se pudo abrir el portal de facturacion. Intentalo de nuevo.',
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
        title: 'Metodo actualizado',
        description: 'Metodo de pago actualizado correctamente',
      })
      mutate()
    } catch {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el metodo de pago',
        variant: 'destructive',
      })
    }
  }

  const handleDeletePaymentMethod = (_id: string) => {
    // TODO: Implement when API is ready
    toast({
      title: 'Funcionalidad en desarrollo',
      description: 'Esta funcion estara disponible proximamente',
    })
  }

  const currentPlan = subscription?.plan
  const currentPeriodEnd = subscription?.currentPeriodEnd

  return (
    <div className="space-y-6">
      <MockDataIndicator />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Facturacion y Suscripciones</h1>
        <p className="text-muted-foreground">
          Gestiona tu suscripcion, facturas y metodos de pago
        </p>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="subscription">Suscripcion</TabsTrigger>
          <TabsTrigger value="invoices">Facturas</TabsTrigger>
          <TabsTrigger value="payment-methods">Metodos de Pago</TabsTrigger>
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
                  currentPlan={currentPlan}
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
            loading={transactionsLoading ?? subscriptionLoading}
          />
        </TabsContent>
      </Tabs>

      {/* Cancel Subscription Dialog */}
      <CancelSubscriptionDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        onConfirm={handleConfirmCancel}
        currentPeriodEnd={currentPeriodEnd}
      />
    </div>
  )
}
