'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useLocale } from '@/components/i18n/locale-provider'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { localizedHref } from '@/lib/i18n/routing'

const validSubjects = [
  'demo',
  'pricing',
  'support',
  'partnership',
  'privacy',
  'trial',
  'other',
] as const

export function ContactForm() {
  const locale = useLocale()
  const copy = getDictionary(locale).contact
  const searchParams = useSearchParams()
  const requestedSubject = searchParams.get('asunto')
  const vertical = searchParams.get('vertical') ?? ''
  const initialSubject = validSubjects.includes(requestedSubject as (typeof validSubjects)[number])
    ? (requestedSubject ?? '')
    : vertical
      ? 'trial'
      : ''
  const initialMessage = vertical
    ? `I want to start a free trial for ${vertical.replace(/-/g, ' ')}.`
    : ''
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: initialSubject,
    message: initialMessage,
    website: '',
    privacyAccepted: false,
  })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [feedback, setFeedback] = useState('')

  const utm = useMemo(
    () => ({
      source: searchParams.get('utm_source') ?? '',
      medium: searchParams.get('utm_medium') ?? '',
      campaign: searchParams.get('utm_campaign') ?? '',
      term: searchParams.get('utm_term') ?? '',
      content: searchParams.get('utm_content') ?? '',
    }),
    [searchParams]
  )

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFeedback('')
    if (!form.privacyAccepted) {
      setStatus('error')
      setFeedback(copy.privacyRequired)
      return
    }
    setStatus('loading')
    const [firstName, ...lastNameParts] = form.name.trim().split(/\s+/)
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastNameParts.join(' '),
          email: form.email,
          phone: form.phone,
          subject: form.subject,
          message: form.message,
          website: form.website,
          privacy_policy_accepted: form.privacyAccepted,
          marketing_consent: false,
          utm,
        }),
      })
      await response.json().catch(() => ({}))
      if (!response.ok) throw new Error()
      setStatus('success')
      setFeedback(copy.success)
      setForm({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
        website: '',
        privacyAccepted: false,
      })
    } catch (error) {
      setStatus('error')
      setFeedback(copy.requestFailed)
    }
  }

  const fieldClass =
    'mt-1 w-full rounded-md border bg-background px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

  return (
    <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
      {feedback ? (
        <p
          role={status === 'error' ? 'alert' : 'status'}
          className={`rounded-lg border p-3 text-sm ${status === 'error' ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}
        >
          {feedback}
        </p>
      ) : null}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={copy.name} id="name" required>
          <input
            id="name"
            required
            maxLength={200}
            autoComplete="name"
            className={fieldClass}
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
        </Field>
        <Field label={copy.email} id="email" required>
          <input
            id="email"
            required
            type="email"
            maxLength={254}
            autoComplete="email"
            className={fieldClass}
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
          />
        </Field>
      </div>
      <Field label={`${copy.phone} (${copy.phoneOptional})`} id="phone">
        <input
          id="phone"
          type="tel"
          maxLength={40}
          autoComplete="tel"
          className={fieldClass}
          value={form.phone}
          onChange={(event) => setForm({ ...form, phone: event.target.value })}
        />
      </Field>
      <Field label={copy.subject} id="subject" required>
        <select
          id="subject"
          required
          className={fieldClass}
          value={form.subject}
          onChange={(event) => setForm({ ...form, subject: event.target.value })}
        >
          <option value="">{copy.subjectPlaceholder}</option>
          {validSubjects.map((subject) => (
            <option key={subject} value={subject}>
              {copy.subjects[subject]}
            </option>
          ))}
        </select>
      </Field>
      <Field label={copy.message} id="message" required>
        <textarea
          id="message"
          required
          minLength={10}
          maxLength={4000}
          rows={6}
          className={fieldClass}
          value={form.message}
          onChange={(event) => setForm({ ...form, message: event.target.value })}
        />
      </Field>
      <div
        className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden"
        aria-hidden="true"
      >
        <label htmlFor="website">{copy.website}</label>
        <input
          id="website"
          tabIndex={-1}
          autoComplete="off"
          value={form.website}
          onChange={(event) => setForm({ ...form, website: event.target.value })}
        />
      </div>
      <label className="flex items-start gap-3 text-sm leading-6 text-muted-foreground">
        <input
          type="checkbox"
          required
          checked={form.privacyAccepted}
          onChange={(event) => setForm({ ...form, privacyAccepted: event.target.checked })}
          className="mt-1 h-4 w-4"
        />
        <span>
          {copy.privacyPrefix}{' '}
          <Link
            href={localizedHref('/legal/privacidad', locale)}
            className="font-medium text-primary hover:underline"
          >
            {copy.privacyLink}
          </Link>{' '}
          {copy.privacySuffix} {copy.marketingNotice}
        </span>
      </label>
      <button
        type="submit"
        disabled={status === 'loading'}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-primary px-5 py-3 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
      >
        {status === 'loading' ? copy.sending : copy.submit}
      </button>
    </form>
  )
}

function Field({
  label,
  id,
  required = false,
  children,
}: {
  label: string
  id: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
        {required ? ' *' : ''}
      </label>
      {children}
    </div>
  )
}
