'use client'

import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import {
  Alert,
  AlertDescription,
  Button,
  Field,
  FieldLabel,
  Input,
} from '@akademate/ui'

import type { NextPublicOffer } from '@/src/lib/offers/public-offer-query'

type ActionableMode = Extract<
  NextPublicOffer['conversionMode'],
  'interest_form' | 'approval_required' | 'free_registration'
>

const labels: Record<ActionableMode, { button: string; success: string }> = {
  interest_form: {
    button: 'Request information',
    success: 'Your enquiry has been received. The academy can now follow up with you.',
  },
  approval_required: {
    button: 'Send application',
    success: 'Your application has been received for review.',
  },
  free_registration: {
    button: 'Request enrolment',
    success: 'Your enrolment request has been received. The academy will confirm the next step.',
  },
}

export function PublicOfferSubmissionForm({
  mode,
  shareSlug,
  privacyNoticeUrl,
}: {
  mode: ActionableMode
  shareSlug: string
  privacyNoticeUrl: string
}) {
  const [state, setState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const idempotencyKey = useRef<string | null>(null)
  const copy = labels[mode]

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setState('submitting')
    idempotencyKey.current ??= crypto.randomUUID()
    const data = new FormData(event.currentTarget)
    const payload = {
      idempotencyKey: idempotencyKey.current,
      firstName: String(data.get('firstName') ?? ''),
      lastName: String(data.get('lastName') ?? ''),
      email: String(data.get('email') ?? ''),
      phone: String(data.get('phone') ?? ''),
      message: String(data.get('message') ?? ''),
      privacyAccepted: data.get('privacyAccepted') === 'on',
      marketingConsent: data.get('marketingConsent') === 'on',
      companyWebsite: String(data.get('companyWebsite') ?? ''),
    }

    try {
      const response = await fetch(`/api/next/public/offers/${encodeURIComponent(shareSlug)}/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!response.ok) throw new Error('submission_failed')
      setState('success')
    } catch {
      setState('error')
    }
  }

  if (state === 'success') {
    return <Alert><AlertDescription>{copy.success}</AlertDescription></Alert>
  }

  return (
    <form aria-label="Course request" className="space-y-4" onSubmit={submit} noValidate={false}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
        <Field>
          <FieldLabel htmlFor="offer-first-name">First name</FieldLabel>
          <Input id="offer-first-name" name="firstName" autoComplete="given-name" maxLength={80} required />
        </Field>
        <Field>
          <FieldLabel htmlFor="offer-last-name">Last name</FieldLabel>
          <Input id="offer-last-name" name="lastName" autoComplete="family-name" maxLength={120} required />
        </Field>
      </div>
      <Field>
        <FieldLabel htmlFor="offer-email">Email</FieldLabel>
        <Input id="offer-email" name="email" type="email" autoComplete="email" maxLength={254} required />
      </Field>
      <Field>
        <FieldLabel htmlFor="offer-phone">Phone <span className="font-normal text-muted-foreground">Optional</span></FieldLabel>
        <Input id="offer-phone" name="phone" type="tel" autoComplete="tel" maxLength={32} />
      </Field>
      <Field>
        <FieldLabel htmlFor="offer-message">Message <span className="font-normal text-muted-foreground">Optional</span></FieldLabel>
        <textarea
          id="offer-message"
          name="message"
          maxLength={1000}
          rows={4}
          className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </Field>
      <div className="absolute -left-[10000px] top-auto size-px overflow-hidden" aria-hidden="true">
        <label htmlFor="offer-company-website">Company website</label>
        <input id="offer-company-website" name="companyWebsite" tabIndex={-1} autoComplete="off" />
      </div>
      <label className="flex items-start gap-3 text-sm leading-5">
        <input name="privacyAccepted" type="checkbox" className="mt-1 size-4" required />
        <span>I agree to the <a href={privacyNoticeUrl} target="_blank" rel="noopener noreferrer" className="font-medium underline underline-offset-4">privacy notice</a> for this request.</span>
      </label>
      <label className="flex items-start gap-3 text-sm leading-5 text-muted-foreground">
        <input name="marketingConsent" type="checkbox" className="mt-1 size-4" />
        <span>I would also like to receive relevant academy updates.</span>
      </label>
      {state === 'error' ? (
        <Alert variant="destructive"><AlertDescription>Your request could not be sent. Please review the details or contact the academy.</AlertDescription></Alert>
      ) : null}
      <Button type="submit" size="lg" className="w-full bg-[var(--offer-accent)] text-white hover:opacity-90" disabled={state === 'submitting'}>
        {state === 'submitting' ? 'Sending…' : copy.button}
      </Button>
    </form>
  )
}
