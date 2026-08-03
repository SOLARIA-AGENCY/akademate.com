'use client'

import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Alert, AlertDescription, Button, Field, FieldLabel, Input } from '@akademate/ui'

type PaymentMethod = 'card_or_wallet' | 'sepa_debit' | 'paypal'

const methodLabels: Record<PaymentMethod, string> = {
  card_or_wallet: 'Card or wallet',
  sepa_debit: 'SEPA Direct Debit',
  paypal: 'PayPal',
}

export function PublicOfferPaidRegistrationForm({
  shareSlug,
  privacyNoticeUrl,
  availableMethods,
  redirect = (url) => window.location.assign(url),
}: {
  shareSlug: string
  privacyNoticeUrl: string
  availableMethods: PaymentMethod[]
  redirect?: (url: string) => void
}) {
  const [state, setState] = useState<'idle' | 'submitting' | 'error'>('idle')
  const idempotencyKey = useRef<string | null>(null)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setState('submitting')
    idempotencyKey.current ??= crypto.randomUUID()
    const data = new FormData(event.currentTarget)
    const paymentMethod = String(data.get('paymentMethod') ?? '') as PaymentMethod
    const provider = paymentMethod === 'paypal' ? 'paypal' : 'stripe'
    try {
      const response = await fetch(`/api/next/public/offers/${encodeURIComponent(shareSlug)}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idempotencyKey: idempotencyKey.current,
          firstName: String(data.get('firstName') ?? ''),
          lastName: String(data.get('lastName') ?? ''),
          email: String(data.get('email') ?? ''),
          phone: String(data.get('phone') ?? ''),
          privacyAccepted: data.get('privacyAccepted') === 'on',
          marketingConsent: data.get('marketingConsent') === 'on',
          provider,
          paymentMethod,
          companyWebsite: String(data.get('companyWebsite') ?? ''),
        }),
      })
      const body = await response.json() as { checkoutUrl?: unknown }
      if (!response.ok || typeof body.checkoutUrl !== 'string') throw new Error('checkout_failed')
      const checkoutUrl = new URL(body.checkoutUrl)
      if (checkoutUrl.protocol !== 'https:') throw new Error('checkout_invalid')
      redirect(checkoutUrl.toString())
    } catch {
      setState('error')
    }
  }

  return (
    <form aria-label="Paid course registration" className="space-y-4" onSubmit={submit}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
        <Field><FieldLabel htmlFor="paid-first-name">First name</FieldLabel><Input id="paid-first-name" name="firstName" autoComplete="given-name" maxLength={80} required /></Field>
        <Field><FieldLabel htmlFor="paid-last-name">Last name</FieldLabel><Input id="paid-last-name" name="lastName" autoComplete="family-name" maxLength={120} required /></Field>
      </div>
      <Field><FieldLabel htmlFor="paid-email">Email</FieldLabel><Input id="paid-email" name="email" type="email" autoComplete="email" maxLength={254} required /></Field>
      <Field><FieldLabel htmlFor="paid-phone">Phone <span className="font-normal text-muted-foreground">Optional</span></FieldLabel><Input id="paid-phone" name="phone" type="tel" autoComplete="tel" maxLength={32} /></Field>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Payment method</legend>
        {availableMethods.map((method, index) => (
          <label key={method} className="flex items-center gap-3 rounded-lg border border-border p-3 text-sm">
            <input name="paymentMethod" type="radio" value={method} defaultChecked={index === 0} required />
            <span>{methodLabels[method]}</span>
          </label>
        ))}
      </fieldset>
      <div className="absolute -left-[10000px] top-auto size-px overflow-hidden" aria-hidden="true">
        <label htmlFor="paid-company-website">Company website</label>
        <input id="paid-company-website" name="companyWebsite" tabIndex={-1} autoComplete="off" />
      </div>
      <label className="flex items-start gap-3 text-sm leading-5">
        <input name="privacyAccepted" type="checkbox" className="mt-1 size-4" required />
        <span>I agree to the <a href={privacyNoticeUrl} target="_blank" rel="noopener noreferrer" className="font-medium underline underline-offset-4">privacy notice</a> for registration and payment.</span>
      </label>
      <label className="flex items-start gap-3 text-sm leading-5 text-muted-foreground">
        <input name="marketingConsent" type="checkbox" className="mt-1 size-4" />
        <span>I would also like to receive relevant academy updates.</span>
      </label>
      {state === 'error' ? <Alert variant="destructive"><AlertDescription>Checkout could not be started. Your card has not been charged. Please review the details or try again.</AlertDescription></Alert> : null}
      <Button type="submit" size="lg" className="w-full bg-[var(--offer-accent)] text-white hover:opacity-90" disabled={state === 'submitting' || availableMethods.length === 0}>
        {state === 'submitting' ? 'Opening secure checkout…' : 'Continue to secure payment'}
      </Button>
    </form>
  )
}
