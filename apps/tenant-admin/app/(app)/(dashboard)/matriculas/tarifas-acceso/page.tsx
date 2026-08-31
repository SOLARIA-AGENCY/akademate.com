'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, Plus, Wallet } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@payload-config/components/ui/alert'
import { Badge } from '@payload-config/components/ui/badge'
import { Button } from '@payload-config/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@payload-config/components/ui/dialog'
import { EmptyState } from '@payload-config/components/ui/EmptyState'
import { Input } from '@payload-config/components/ui/input'
import { Label } from '@payload-config/components/ui/label'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@payload-config/components/ui/select'
import { Switch } from '@payload-config/components/ui/switch'
import { Tabs, TabsList, TabsTrigger } from '@payload-config/components/ui/tabs'
import { accessKindLabel, type AccessKind } from '../wizard/types'

type TariffPeriod = 'unico' | 'mensual' | 'curso'
type KindFilter = 'all' | AccessKind

interface AccessTariff {
  id: string
  name: string
  kind: AccessKind
  period: TariffPeriod
  price: number
  campusName: string
  active: boolean
}

const EMPTY_FORM: Omit<AccessTariff, 'id'> = {
  name: '',
  kind: 'fisico',
  period: 'unico',
  price: 0,
  campusName: '',
  active: true,
}

const PERIOD_LABEL: Record<TariffPeriod, string> = {
  unico: 'Único',
  mensual: 'Mensual',
  curso: 'Por curso',
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return null
}

function mapTariff(row: Record<string, unknown>): AccessTariff | null {
  const kind = row.kind
  const period = row.period
  if (kind !== 'fisico' && kind !== 'virtual' && kind !== 'hibrido') return null
  if (period !== 'unico' && period !== 'mensual' && period !== 'curso') return null
  const id = String(row.id ?? '')
  const name = String(row.name ?? '').trim()
  if (!id || !name) return null
  return {
    id,
    name,
    kind,
    period,
    price: Number(row.price ?? 0),
    campusName: String(row.campusName ?? ''),
    active: row.active !== false,
  }
}

export default function TarifasAccesoPage() {
  const router = useRouter()
  const [kind, setKind] = useState<KindFilter>('all')
  const [rows, setRows] = useState<AccessTariff[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const loadTariffs = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/matriculas/tarifas-acceso', {
        credentials: 'include',
        cache: 'no-store',
      })
      if (!response.ok) throw new Error('No se pudieron cargar las tarifas')
      const payload = await response.json()
      const root = asRecord(payload)
      const data = Array.isArray(root?.data) ? root.data : []
      setRows(
        data
          .map((item) => mapTariff(asRecord(item) ?? {}))
          .filter((item): item is AccessTariff => item !== null),
      )
    } catch (err) {
      setRows([])
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las tarifas')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadTariffs()
  }, [loadTariffs])

  const visible = useMemo(
    () => (kind === 'all' ? rows : rows.filter((row) => row.kind === kind)),
    [kind, rows],
  )

  function openCreate() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setOpen(true)
  }

  function openEdit(row: AccessTariff) {
    setEditingId(row.id)
    setForm({
      name: row.name,
      kind: row.kind,
      period: row.period,
      price: row.price,
      campusName: row.campusName,
      active: row.active,
    })
    setOpen(true)
  }

  async function saveTariff() {
    setSaving(true)
    setError(null)
    try {
      const response = await fetch('/api/matriculas/tarifas-acceso', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, id: editingId ?? undefined }),
      })
      if (!response.ok) throw new Error('No se pudo guardar la tarifa')
      setOpen(false)
      await loadTariffs()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la tarifa')
    } finally {
      setSaving(false)
    }
  }

  async function removeTariff(id: string) {
    setError(null)
    try {
      const response = await fetch(`/api/matriculas/tarifas-acceso?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!response.ok) throw new Error('No se pudo eliminar la tarifa')
      await loadTariffs()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar la tarifa')
    }
  }

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title="Tarifas de acceso"
        icon={Wallet}
        actions={
          <>
            <Button variant="outline" onClick={() => router.push('/matriculas/portal')}>
              Volver
            </Button>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Nueva tarifa
            </Button>
          </>
        }
      />

      {error ? (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>No se pudieron cargar las tarifas</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-3">
            <span>{error}</span>
            <Button size="sm" variant="outline" onClick={() => void loadTariffs()}>
              Reintentar
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      <Tabs value={kind} onValueChange={(value) => setKind(value as KindFilter)}>
        <TabsList>
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="fisico">Físico</TabsTrigger>
          <TabsTrigger value="virtual">Virtual</TabsTrigger>
          <TabsTrigger value="hibrido">Híbrido</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando tarifas...</p>
      ) : visible.length === 0 ? (
        <EmptyState icon={Wallet} title="Sin tarifas" description="Crea la primera tarifa de acceso." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((row) => (
            <Card key={row.id} className="min-w-0">
              <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
                <CardTitle className="text-base">{row.name}</CardTitle>
                <Badge variant={row.active ? 'success' : 'outline'}>
                  {row.active ? 'Activa' : 'Inactiva'}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Acceso</span>
                  <span className="font-medium">{accessKindLabel(row.kind)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Periodo</span>
                  <span className="font-medium">{PERIOD_LABEL[row.period]}</span>
                </div>
                <div className="flex justify-between">
                  <span>Precio</span>
                  <span className="font-medium">{row.price.toLocaleString('es-ES')} €</span>
                </div>
                <p className="text-muted-foreground">{row.campusName || 'Todas las sedes'}</p>
                <div className="flex gap-2">
                  <Button className="flex-1" variant="outline" onClick={() => openEdit(row)}>
                    Editar
                  </Button>
                  <Button className="flex-1" variant="outline" onClick={() => void removeTariff(row.id)}>
                    Eliminar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar tarifa' : 'Nueva tarifa'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-1">
              <Label htmlFor="tariff-name">Nombre</Label>
              <Input
                id="tariff-name"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>Tipo de acceso</Label>
                <Select
                  value={form.kind}
                  onValueChange={(value) => setForm((current) => ({ ...current, kind: value as AccessKind }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fisico">Físico</SelectItem>
                    <SelectItem value="virtual">Virtual</SelectItem>
                    <SelectItem value="hibrido">Híbrido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Periodo</Label>
                <Select
                  value={form.period}
                  onValueChange={(value) =>
                    setForm((current) => ({ ...current, period: value as TariffPeriod }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unico">Único</SelectItem>
                    <SelectItem value="mensual">Mensual</SelectItem>
                    <SelectItem value="curso">Por curso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="tariff-price">Precio</Label>
                <Input
                  id="tariff-price"
                  type="number"
                  min={0}
                  value={form.price}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, price: Number(event.target.value) }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="tariff-campus">Sede</Label>
                <Input
                  id="tariff-campus"
                  value={form.campusName}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, campusName: event.target.value }))
                  }
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <Label htmlFor="tariff-active">Activa</Label>
              <Switch
                id="tariff-active"
                checked={form.active}
                onCheckedChange={(checked) => setForm((current) => ({ ...current, active: checked }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => void saveTariff()} disabled={saving || !form.name.trim()}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
