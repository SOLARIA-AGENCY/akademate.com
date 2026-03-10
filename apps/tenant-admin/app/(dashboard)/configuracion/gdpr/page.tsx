'use client'

import { useState, type ChangeEvent } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Input } from '@payload-config/components/ui/input'
import { Label } from '@payload-config/components/ui/label'
import { Switch } from '@payload-config/components/ui/switch'
import { Alert, AlertDescription, AlertTitle } from '@payload-config/components/ui/alert'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { ShieldCheck } from 'lucide-react'

interface ConsentPreferences {
  marketing_email: boolean
  marketing_sms: boolean
  marketing_phone: boolean
  analytics: boolean
  third_party_sharing: boolean
  profiling: boolean
  newsletter: boolean
}

interface ConsentApiResponse {
  data: {
    consents: Partial<ConsentPreferences>
  }
  error?: string
}

interface DeleteApiResponse {
  success?: boolean
  error?: string
}

const DEFAULT_CONSENTS: ConsentPreferences = {
  marketing_email: false,
  marketing_sms: false,
  marketing_phone: false,
  analytics: false,
  third_party_sharing: false,
  profiling: false,
  newsletter: false,
}

const CONSENT_FIELDS = [
  {
    key: 'marketing_email',
    label: 'Emails de marketing',
    description: 'Comunicaciones comerciales por email.',
  },
  {
    key: 'marketing_sms',
    label: 'SMS de marketing',
    description: 'Comunicaciones comerciales por SMS.',
  },
  {
    key: 'marketing_phone',
    label: 'Llamadas comerciales',
    description: 'Contacto telefónico para campañas.',
  },
  { key: 'analytics', label: 'Analítica', description: 'Medición de uso y rendimiento del sitio.' },
  {
    key: 'third_party_sharing',
    label: 'Compartir con terceros',
    description: 'Uso de proveedores externos.',
  },
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
      const data = (await response.json()) as ConsentApiResponse

      if (!response.ok) {
        throw new Error(data.error ?? 'No se pudo cargar el consentimiento.')
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
      const data = (await response.json()) as ConsentApiResponse

      if (!response.ok) {
        throw new Error(data.error ?? 'No se pudo actualizar el consentimiento.')
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
      const data = (await response.json()) as DeleteApiResponse

      if (!response.ok) {
        throw new Error(data.error ?? 'No se pudo completar la eliminación.')
      }

      setStatus('success')
      setMessage('Solicitud de eliminación completada correctamente.')
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'Error al eliminar datos.')
    }
  }

  return (
    <div className="space-y-6 max-w-5xl" data-oid="7aqfkpb">
      <PageHeader
        title="GDPR & Consentimientos"
        description="Gestiona el consentimiento del usuario, exportación y eliminación de datos personales."
        icon={ShieldCheck}
        data-oid=":58zaom"
      />

      {status !== 'idle' && message && (
        <Alert variant={status === 'error' ? 'destructive' : 'default'} data-oid="66d.bnr">
          <AlertTitle data-oid="518cudf">{status === 'error' ? 'Error' : 'Estado'}</AlertTitle>
          <AlertDescription data-oid="t4ct0fj">{message}</AlertDescription>
        </Alert>
      )}

      <Card data-oid="8k:er85">
        <CardHeader data-oid="i5rsqf5">
          <CardTitle data-oid="xezaox3">Usuario objetivo</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[1fr_auto_auto]" data-oid="zj2y3cq">
          <div className="space-y-2" data-oid="-o3abw.">
            <Label htmlFor="userId" data-oid="4lh0daf">
              User ID
            </Label>
            <Input
              id="userId"
              placeholder="UUID del usuario"
              value={userId}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setUserId(event.target.value)}
              data-oid="d5yjh0u"
            />
          </div>
          <div className="flex items-end" data-oid="fgb.iv-">
            <Button
              variant="secondary"
              onClick={handleLoad}
              disabled={status === 'loading'}
              data-oid="sworg56"
            >
              Cargar consentimiento
            </Button>
          </div>
          <div className="flex items-end" data-oid="tl.2n3g">
            <Button onClick={handleSave} disabled={status === 'saving'} data-oid="qf1bc1k">
              Guardar cambios
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card data-oid="btivzxl">
        <CardHeader data-oid="c7sjm-1">
          <CardTitle data-oid="-xo_0-t">Preferencias de consentimiento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4" data-oid="p50xlix">
          {CONSENT_FIELDS.map((field) => (
            <div
              key={field.key}
              className="flex items-start justify-between gap-4"
              data-oid="ab0dt6m"
            >
              <div data-oid="t0.el40">
                <p className="font-medium" data-oid="dhebu4k">
                  {field.label}
                </p>
                <p className="text-sm text-muted-foreground" data-oid="s-t3:u5">
                  {field.description}
                </p>
              </div>
              <Switch
                checked={consents[field.key]}
                onCheckedChange={(value: boolean) =>
                  setConsents((prev) => ({
                    ...prev,
                    [field.key]: value,
                  }))
                }
                data-oid="53hxvq6"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card data-oid="dv:mab_">
        <CardHeader data-oid="exjd1kk">
          <CardTitle data-oid="ok2x4t9">Derechos del interesado</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3" data-oid="hcvxfq9">
          <Button variant="outline" onClick={handleExport} data-oid="253jkn2">
            Exportar datos
          </Button>
          <Button variant="destructive" onClick={handleDelete} data-oid="srwv1fa">
            Solicitar eliminación
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
