'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, MapPin } from 'lucide-react'

import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { Alert, AlertDescription, AlertTitle } from '@payload-config/components/ui/alert'
import { Button } from '@payload-config/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Input } from '@payload-config/components/ui/input'
import { Label } from '@payload-config/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@payload-config/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@payload-config/components/ui/select'
import { Textarea } from '@payload-config/components/ui/textarea'
import { resolveCampusOperatingFork } from '@/src/domain/campus-operating-model'
import { ADDITIONAL_ENTITY_PRODUCT_NAME } from '@/src/domain/organization-account'

type Option = { id: number; label: string }

function relationDocs(payload: unknown): Array<Record<string, unknown>> {
  if (!payload || typeof payload !== 'object') return []
  const docs = (payload as { docs?: unknown }).docs
  return Array.isArray(docs) ? docs.filter((doc): doc is Record<string, unknown> => Boolean(doc) && typeof doc === 'object') : []
}

export default function NuevaSedePage() {
  const router = useRouter()
  const [sameLegalEntity, setSameLegalEntity] = useState(true)
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [legalEntityId, setLegalEntityId] = useState('')
  const [legalName, setLegalName] = useState('')
  const [taxId, setTaxId] = useState('')
  const [registeredAddress, setRegisteredAddress] = useState('')
  const [administrativeAddress, setAdministrativeAddress] = useState('')
  const [locationId, setLocationId] = useState('')
  const [locationName, setLocationName] = useState('')
  const [locationAddress, setLocationAddress] = useState('')
  const [legalEntities, setLegalEntities] = useState<Option[]>([])
  const [locations, setLocations] = useState<Option[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fork = resolveCampusOperatingFork(sameLegalEntity)

  useEffect(() => {
    void Promise.all([
      fetch('/api/legal-entities?limit=100&sort=legal_name', { cache: 'no-cache' }),
      fetch('/api/locations?limit=100&sort=name', { cache: 'no-cache' }),
    ]).then(async ([legalRes, locationRes]) => {
      if (legalRes.ok) {
        setLegalEntities(
          relationDocs(await legalRes.json()).map((doc) => ({
            id: Number(doc.id),
            label: String(doc.legal_name ?? doc.code ?? doc.id),
          })),
        )
      }
      if (locationRes.ok) {
        setLocations(
          relationDocs(await locationRes.json()).map((doc) => ({
            id: Number(doc.id),
            label: String(doc.name ?? doc.code ?? doc.id),
          })),
        )
      }
    })
  }, [])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!name.trim() || !city.trim()) {
      setError('Nombre y ciudad son obligatorios.')
      return
    }
    if (sameLegalEntity && !legalEntityId && legalEntities.length > 0) {
      setError('Elige la entidad jurídica existente o cambia a nueva entidad.')
      return
    }
    if (!sameLegalEntity && (!legalName.trim() || !taxId.trim())) {
      setError('Razón social y CIF son obligatorios para una entidad nueva.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      let nextLegalEntityId = legalEntityId ? Number(legalEntityId) : null
      let nextLocationId = locationId ? Number(locationId) : null

      if (!sameLegalEntity) {
        const legalRes = await fetch('/api/legal-entities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: `LE-${taxId.trim() || Date.now()}`,
            legal_name: legalName.trim(),
            tax_id: taxId.trim(),
            tax_id_type: 'cif',
            registered_address: registeredAddress.trim() || undefined,
            administrative_address: administrativeAddress.trim() || undefined,
            status: 'ACTIVE',
            country: 'ES',
          }),
        })
        if (!legalRes.ok) {
          const body = (await legalRes.json().catch(() => ({}))) as { errors?: Array<{ message?: string }> }
          throw new Error(body.errors?.[0]?.message ?? `No se pudo crear la ${ADDITIONAL_ENTITY_PRODUCT_NAME.toLowerCase()}`)
        }
        const created = (await legalRes.json()) as { id?: number; doc?: { id?: number } }
        nextLegalEntityId = created.doc?.id ?? created.id ?? null
        if (!nextLegalEntityId) {
          throw new Error('No se crea a medias: la entidad jurídica no devolvió id.')
        }
      }

      if (!nextLocationId && locationName.trim()) {
        const locationRes = await fetch('/api/locations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: `LOC-${Date.now()}`,
            name: locationName.trim(),
            address_line_1: locationAddress.trim() || undefined,
            city: city.trim(),
            country: 'ES',
            timezone: 'Europe/Madrid',
            active: true,
          }),
        })
        if (!locationRes.ok) {
          const body = (await locationRes.json().catch(() => ({}))) as { errors?: Array<{ message?: string }> }
          throw new Error(body.errors?.[0]?.message ?? 'No se pudo crear la ubicación')
        }
        const created = (await locationRes.json()) as { id?: number; doc?: { id?: number } }
        nextLocationId = created.doc?.id ?? created.id ?? null
      }

      if (!nextLocationId && locations.length === 0 && !locationName.trim()) {
        throw new Error('Elige una ubicación existente o crea una dirección nueva.')
      }

      const campusRes = await fetch('/api/campuses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          city: city.trim(),
          campus_kind: 'physical',
          legal_entity: nextLegalEntityId || undefined,
          primary_location: nextLocationId || undefined,
          service_locations: nextLocationId ? [nextLocationId] : undefined,
          verification_status: 'VERIFIED',
          active: true,
        }),
      })
      if (!campusRes.ok) {
        const body = (await campusRes.json().catch(() => ({}))) as { errors?: Array<{ message?: string }> }
        throw new Error(body.errors?.[0]?.message ?? 'No se pudo crear el campus')
      }
      const campus = (await campusRes.json()) as { id?: number; doc?: { id?: number } }
      const campusId = campus.doc?.id ?? campus.id
      router.push(campusId ? `/dashboard/sedes/${campusId}/editar` : '/dashboard/sedes')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la sede')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-x-hidden overflow-y-auto overscroll-contain">
      <PageHeader
        title="Nueva sede"
        icon={MapPin}
        actions={
          <Button type="button" variant="outline" onClick={() => router.push('/dashboard/sedes')}>
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {error ? (
          <Alert variant="destructive">
            <AlertTitle>No se pudo guardar</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Identidad del campus</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="campus-name">Nombre</Label>
              <Input id="campus-name" value={name} onChange={(event) => setName(event.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="campus-city">Ciudad</Label>
              <Input id="campus-city" value={city} onChange={(event) => setCity(event.target.value)} required />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Entidad jurídica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup
              value={sameLegalEntity ? 'same' : 'new'}
              onValueChange={(value) => setSameLegalEntity(value === 'same')}
            >
              <label className="flex items-start gap-3 rounded-md border border-border p-3">
                <RadioGroupItem value="same" />
                <span>
                  <span className="block text-sm font-medium">Misma entidad jurídica</span>
                  <span className="text-sm text-muted-foreground">
                    Otra dirección, misma facturación. No se abre un asiento nuevo.
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-3 rounded-md border border-border p-3">
                <RadioGroupItem value="new" />
                <span>
                  <span className="block text-sm font-medium">Nueva entidad jurídica</span>
                  <span className="text-sm text-muted-foreground">
                    CIF distinto. Producto {ADDITIONAL_ENTITY_PRODUCT_NAME}. Un Postgres aparte sigue default-off.
                  </span>
                </span>
              </label>
            </RadioGroup>

            {fork.kind === 'same_legal_entity' ? (
              <div className="space-y-2">
                <Label>Entidad existente</Label>
                <Select value={legalEntityId} onValueChange={setLegalEntityId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Elegir entidad" />
                  </SelectTrigger>
                  <SelectContent>
                    {legalEntities.map((entity) => (
                      <SelectItem key={entity.id} value={String(entity.id)}>
                        {entity.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="legal-name">Razón social</Label>
                  <Input id="legal-name" value={legalName} onChange={(event) => setLegalName(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tax-id">CIF</Label>
                  <Input id="tax-id" value={taxId} onChange={(event) => setTaxId(event.target.value)} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="registered-address">Domicilio registral</Label>
                  <Textarea
                    id="registered-address"
                    value={registeredAddress}
                    onChange={(event) => setRegisteredAddress(event.target.value)}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="administrative-address">Dirección administrativa</Label>
                  <Textarea
                    id="administrative-address"
                    value={administrativeAddress}
                    onChange={(event) => setAdministrativeAddress(event.target.value)}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ubicación física</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Location existente</Label>
              <Select value={locationId} onValueChange={setLocationId}>
                <SelectTrigger>
                  <SelectValue placeholder="Reutilizar una dirección" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={String(location.id)}>
                      {location.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="location-name">O crear location</Label>
                <Input
                  id="location-name"
                  value={locationName}
                  onChange={(event) => setLocationName(event.target.value)}
                  placeholder="Nombre del sitio"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location-address">Dirección efectiva</Label>
                <Input
                  id="location-address"
                  value={locationAddress}
                  onChange={(event) => setLocationAddress(event.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Crear campus
        </Button>
      </form>
    </div>
  )
}
