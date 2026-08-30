'use client'

import { useState } from 'react'
import { Button } from '@payload-config/components/ui/button'
import { Checkbox } from '@payload-config/components/ui/checkbox'
import { Input } from '@payload-config/components/ui/input'

type Props = {
  offerId: string | number
  soldOut: boolean
  waitlistEnabled: boolean
  checkoutEnabled: boolean
}

export function OfferCheckoutForm({ offerId, soldOut, waitlistEnabled, checkoutEnabled }: Props) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [privacy, setPrivacy] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [waitlisted, setWaitlisted] = useState(false)

  const handleCheckout = async () => {
    if (!email || !privacy) {
      setError('Introduce tu email y acepta la privacidad.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(`/api/offers/${offerId}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, gdprConsent: true }),
      })
      const payload = await res.json().catch(() => ({} as { error?: string; code?: string; data?: { url?: string } }))
      if (res.ok && payload.data?.url) {
        window.location.href = payload.data.url
        return
      }
      if (payload.code === 'sold_out' && waitlistEnabled) {
        const waitlistRes = await fetch(`/api/offers/${offerId}/waitlist`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, name, phone, gdprConsent: true }),
        })
        if (waitlistRes.ok) {
          setWaitlisted(true)
          return
        }
      }
      setError(payload.error || 'No se pudo iniciar el pago.')
    } catch {
      setError('Error de conexion.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleWaitlist = async () => {
    if (!email || !privacy) {
      setError('Introduce tu email y acepta la privacidad.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(`/api/offers/${offerId}/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, phone, gdprConsent: true }),
      })
      if (res.ok) {
        setWaitlisted(true)
        return
      }
      const payload = await res.json().catch(() => ({} as { error?: string }))
      setError(payload.error || 'No se pudo apuntar a la lista de espera.')
    } catch {
      setError('Error de conexion.')
    } finally {
      setSubmitting(false)
    }
  }

  if (waitlisted) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-800">
        Te hemos apuntado a la lista de espera. Te avisamos si se libera una plaza.
      </div>
    )
  }

  if (!checkoutEnabled) {
    return (
      <p className="text-sm text-neutral-500">Esta landing de pago no esta publicada.</p>
    )
  }

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault()
        void (soldOut ? handleWaitlist() : handleCheckout())
      }}
    >
      <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nombre" />
      <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" required />
      {soldOut ? (
        <Input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Telefono" />
      ) : null}
      <label className="flex items-start gap-2 text-sm text-neutral-600">
        <Checkbox checked={privacy} onCheckedChange={(value) => setPrivacy(value === true)} />
        <span>Acepto la politica de privacidad y el tratamiento de mis datos para esta reserva.</span>
      </label>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? 'Procesando...' : soldOut ? 'Apuntarme a la lista de espera' : 'Continuar al pago'}
      </Button>
    </form>
  )
}
