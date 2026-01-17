'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Input } from '@payload-config/components/ui/input'
import { Label } from '@payload-config/components/ui/label'
import { Switch } from '@payload-config/components/ui/switch'
import { Alert, AlertDescription, AlertTitle } from '@payload-config/components/ui/alert'

const DEFAULT_CONSENTS = {
  marketing_email: false,
  marketing_sms: false,
  marketing_phone: false,
  analytics: false,
  third_party_sharing: false,
  profiling: false,
  newsletter: false,
}

const CONSENT_FIELDS = [
  { key: 'marketing_email', label: 'Emails de marketing', description: 'Comunicaciones comerciales por email.' },
  { key: 'marketing_sms', label: 'SMS de marketing', description: 'Comunicaciones comerciales por SMS.' },
  { key: 'marketing_phone', label: 'Llamadas comerciales', description: 'Contacto telefónico para campañas.' },
  { key: 'analytics', label: 'Analítica', description: 'Medición de uso y rendimiento del sitio.' },
  { key: 'third_party_sharing', label: 'Compartir con terceros', description: 'Uso de proveedores externos.' },
  { key: 'profiling', label: 'Perfilado', description: 'Personalización basada en actividad.' },
  { key: 'newsletter', label: 'Newsletter', description: 'Boletines periódicos informativos.' },
] as const

export default function GdprSettingsPage() {
  const [userId, setUserId] = useState('')
  const [consents, setConsents] = useState(DEFAULT_CONSENTS)
  const [status, setStatus] = useState<'idle' | 'loading' | 'saving' | 'error' | 'success'>('idle')
  const [message, setMessage] = useState('')

  const handleLoad = async () => {
    if (!userId) {
      setStatus('error')
      setMessage('Ingresa un userId válido.')
      return
    }

    setStatus('loading')
    setMessage('')

    try {
      const response = await fetch(`/api/gdpr/${userId}/consent`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || 'No se pudo cargar el consentimiento.')
      }

      setConsents({ ...DEFAULT_CONSENTS, ...data.data.consents })
      setStatus('success')
      setMessage('Consentimientos cargados correctamente.')
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'Error al cargar consentimientos.')
    }
  }

  const handleSave = async () => {
    if (!userId) {
      setStatus('error')
      setMessage('Ingresa un userId válido.')
      return
    }

    setStatus('saving')
    setMessage('')

    try {
      const response = await fetch(`/api/gdpr/${userId}/consent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consents }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || 'No se pudo actualizar el consentimiento.')
      }

      setConsents({ ...DEFAULT_CONSENTS, ...data.data.consents })
      setStatus('success')
      setMessage('Consentimientos actualizados correctamente.')
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'Error al actualizar consentimientos.')
    }
  }

  const handleExport = () => {
    if (!userId) {
      setStatus('error')
      setMessage('Ingresa un userId válido.')
      return
    }

    window.open(`/api/gdpr/${userId}/export`, '_blank')
  }

  const handleDelete = async () => {
    if (!userId) {
      setStatus('error')
      setMessage('Ingresa un userId válido.')
      return
    }

    const confirmed = window.confirm('¿Confirmas la anonimización de datos del usuario?')
    if (!confirmed) return

    setStatus('saving')
    setMessage('')

    try {
      const response = await fetch(`/api/gdpr/${userId}/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmDeletion: true, reason: 'User requested' }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || 'No se pudo completar la eliminación.')
      }

      setStatus('success')
      setMessage('Solicitud de eliminación completada correctamente.')
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'Error al eliminar datos.')
    }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">GDPR & Consentimientos</h1>
        <p className="text-muted-foreground">
          Gestiona el consentimiento del usuario, exportación y eliminación de datos personales.
        </p>
      </div>

      {status !== 'idle' && message && (
        <Alert variant={status === 'error' ? 'destructive' : 'default'}>
          <AlertTitle>{status === 'error' ? 'Error' : 'Estado'}</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Usuario objetivo</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[1fr_auto_auto]">
          <div className="space-y-2">
            <Label htmlFor="userId">User ID</Label>
            <Input
              id="userId"
              placeholder="UUID del usuario"
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button variant="secondary" onClick={handleLoad} disabled={status === 'loading'}>
              Cargar consentimiento
            </Button>
          </div>
          <div className="flex items-end">
            <Button onClick={handleSave} disabled={status === 'saving'}>
              Guardar cambios
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preferencias de consentimiento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {CONSENT_FIELDS.map((field) => (
            <div key={field.key} className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium">{field.label}</p>
                <p className="text-sm text-muted-foreground">{field.description}</p>
              </div>
              <Switch
                checked={consents[field.key]}
                onCheckedChange={(value) =>
                  setConsents((prev) => ({
                    ...prev,
                    [field.key]: value,
                  }))
                }
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Derechos del interesado</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={handleExport}>
            Exportar datos
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Solicitar eliminación
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
