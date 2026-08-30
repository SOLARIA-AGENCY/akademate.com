'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Input } from '@payload-config/components/ui/input'
import { Label } from '@payload-config/components/ui/label'
import { Badge } from '@payload-config/components/ui/badge'
import { CreditCard, Loader2 } from 'lucide-react'

type Connection = {
  connected?: boolean
  status?: string
  publishableKey?: string
  secretLast4?: string
  hasWebhookSecret?: boolean
  connectAccountId?: string
  webhookPath?: string
  livemode?: boolean
}

export function LearnerStripeSettingsCard() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [connection, setConnection] = useState<Connection>({ connected: false })
  const [publishableKey, setPublishableKey] = useState('')
  const [secretKey, setSecretKey] = useState('')
  const [webhookSecret, setWebhookSecret] = useState('')
  const [connectAccountId, setConnectAccountId] = useState('')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/tenant-payments/stripe', { cache: 'no-store' })
        const payload = await res.json()
        if (payload.data) {
          setConnection(payload.data)
          setPublishableKey(payload.data.publishableKey || '')
          setConnectAccountId(payload.data.connectAccountId || '')
        }
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  async function save() {
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const res = await fetch('/api/tenant-payments/stripe', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publishableKey, secretKey, webhookSecret, connectAccountId }),
      })
      const payload = await res.json()
      if (!res.ok) {
        setError(payload.error || 'No se pudo guardar Stripe')
        return
      }
      setConnection(payload.data)
      setSecretKey('')
      setWebhookSecret('')
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  async function disconnect() {
    setSaving(true)
    try {
      const res = await fetch('/api/tenant-payments/stripe', { method: 'DELETE' })
      const payload = await res.json()
      setConnection(payload.data)
      setPublishableKey('')
      setConnectAccountId('')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card data-testid="learner-stripe-settings">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <CreditCard className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Stripe (pagos de alumnos)</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Cuenta Stripe de esta academia. No es la facturacion SaaS de Akademate.
            </p>
          </div>
        </div>
        <Badge variant={connection.connected ? 'default' : 'outline'}>
          {connection.connected ? 'Conectado' : 'Desconectado'}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="learner-pk">Publishable key</Label>
            <Input
              id="learner-pk"
              value={publishableKey}
              onChange={(event) => setPublishableKey(event.target.value)}
              placeholder="pk_test_..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="learner-rk">Restricted key</Label>
            <Input
              id="learner-rk"
              type="password"
              value={secretKey}
              onChange={(event) => setSecretKey(event.target.value)}
              placeholder={connection.secretLast4 ? `•••• ${connection.secretLast4}` : 'rk_test_...'}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="learner-whsec">Webhook secret</Label>
            <Input
              id="learner-whsec"
              type="password"
              value={webhookSecret}
              onChange={(event) => setWebhookSecret(event.target.value)}
              placeholder={connection.hasWebhookSecret ? 'Configurado' : 'whsec_...'}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="learner-acct">Stripe Connect (opcional)</Label>
            <Input
              id="learner-acct"
              value={connectAccountId}
              onChange={(event) => setConnectAccountId(event.target.value)}
              placeholder="acct_..."
            />
          </div>
        </div>
        {connection.webhookPath ? (
          <p className="text-xs text-muted-foreground">
            Endpoint webhook: <code>{connection.webhookPath}</code>
          </p>
        ) : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {saved ? <p className="text-sm text-emerald-700">Conexion guardada. El secreto no se vuelve a mostrar.</p> : null}
        <div className="flex gap-2">
          <Button size="sm" onClick={() => void save()} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Guardar conexion
          </Button>
          {connection.connected ? (
            <Button size="sm" variant="outline" onClick={() => void disconnect()} disabled={saving}>
              Desconectar
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
