'use client'

import * as React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Badge } from '@payload-config/components/ui/badge'
import { CreditCard, Copy, ExternalLink, Loader2 } from 'lucide-react'

type OfferPayload = {
  id?: number | string
  title?: string
  publicSlug?: string
  publicPath?: string
  checkoutEnabled?: boolean
  amountCents?: number
}

type StripePayload = {
  connected?: boolean
  status?: string
}

export function OfferPaymentCard({ courseRunId }: { courseRunId: string | number }) {
  const [loading, setLoading] = React.useState(true)
  const [working, setWorking] = React.useState(false)
  const [error, setError] = React.useState('')
  const [copied, setCopied] = React.useState(false)
  const [offer, setOffer] = React.useState<OfferPayload | null>(null)
  const [stripe, setStripe] = React.useState<StripePayload>({ connected: false })

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/offers?courseRunId=${courseRunId}`, { cache: 'no-store' })
      const payload = await res.json()
      setOffer(payload.data?.offer ?? null)
      setStripe(payload.data?.stripe ?? { connected: false })
    } catch {
      setError('No se pudo cargar la landing de pago')
    } finally {
      setLoading(false)
    }
  }, [courseRunId])

  React.useEffect(() => {
    void load()
  }, [load])

  const publicPath = offer?.publicPath || (offer?.publicSlug ? `/p/ofertas/${offer.publicSlug}` : '')

  async function generate() {
    setWorking(true)
    setError('')
    try {
      const res = await fetch('/api/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseRunId }),
      })
      const payload = await res.json()
      if (!res.ok) {
        setError(payload.error || 'No se pudo generar la landing')
        return
      }
      setOffer(payload.data?.offer ?? null)
    } finally {
      setWorking(false)
    }
  }

  async function toggle(checkoutEnabled: boolean) {
    if (!offer?.id) return
    setWorking(true)
    setError('')
    try {
      const res = await fetch(`/api/offers/${offer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkoutEnabled }),
      })
      const payload = await res.json()
      if (!res.ok) {
        setError(payload.error || 'No se pudo actualizar la landing')
        return
      }
      setOffer(payload.data?.offer ?? offer)
    } finally {
      setWorking(false)
    }
  }

  async function copyLink() {
    if (!publicPath) return
    await navigator.clipboard.writeText(`${window.location.origin}${publicPath}`)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  const status = !stripe.connected ? 'Sin Stripe' : !offer ? 'Sin landing' : offer.checkoutEnabled ? 'Publicada' : 'Borrador'

  return (
    <Card data-testid="offer-payment-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base">Landing de pago</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Opcional. La ficha publica de la convocatoria no cambia.
          </p>
        </div>
        <Badge variant={status === 'Publicada' ? 'default' : 'outline'}>{status}</Badge>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-2">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {!loading && !offer ? (
          <Button size="sm" onClick={() => void generate()} disabled={working}>
            <CreditCard className="mr-2 h-4 w-4" />
            Generar landing de pago
          </Button>
        ) : null}
        {offer && !offer.checkoutEnabled ? (
          stripe.connected ? (
            <Button size="sm" onClick={() => void toggle(true)} disabled={working}>
              Publicar landing
            </Button>
          ) : (
            <Button size="sm" asChild>
              <Link href="/configuracion#integraciones">Conectar Stripe en Ajustes</Link>
            </Button>
          )
        ) : null}
        {offer?.checkoutEnabled ? (
          <Button size="sm" variant="outline" onClick={() => void toggle(false)} disabled={working}>
            Desactivar
          </Button>
        ) : null}
        {publicPath ? (
          <>
            <Button size="sm" variant="outline" onClick={() => void copyLink()}>
              <Copy className="mr-2 h-4 w-4" />
              {copied ? 'Copiado' : 'Copiar URL'}
            </Button>
            <Button size="sm" variant="outline" asChild>
              <a href={publicPath} target="_blank" rel="noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Preview
              </a>
            </Button>
          </>
        ) : null}
        {error ? <p className="w-full text-sm text-red-600">{error}</p> : null}
      </CardContent>
    </Card>
  )
}
