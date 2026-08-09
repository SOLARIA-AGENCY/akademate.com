'use client'

import * as React from 'react'
import { Plus, Save, Trash2 } from 'lucide-react'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Field,
  FieldDescription,
  FieldLabel,
  Input,
  NativeSelect,
} from '@akademate/ui'

type TicketKind = 'free' | 'paid' | 'deposit'

type TicketRecord = {
  id: number
  courseRunId: number
  slug: string
  name: string
  description: string | null
  ticketKind: TicketKind
  priceAmount: number
  depositAmount: number | null
  capacity: number | null
  maxPerRegistration: number
  salesStart: string | null
  salesEnd: string | null
  sortOrder: number
  isActive: boolean
}

type TicketDraft = Omit<
  TicketRecord,
  'id' | 'courseRunId' | 'priceAmount' | 'depositAmount' | 'capacity'
> & {
  id?: number
  priceAmount: string
  depositAmount: string
  capacity: string
}

function draft(record?: TicketRecord): TicketDraft {
  return {
    id: record?.id,
    slug: record?.slug ?? '',
    name: record?.name ?? '',
    description: record?.description ?? '',
    ticketKind: record?.ticketKind ?? 'free',
    priceAmount: record?.priceAmount?.toString() ?? '0',
    depositAmount: record?.depositAmount?.toString() ?? '',
    capacity: record?.capacity?.toString() ?? '',
    maxPerRegistration: record?.maxPerRegistration ?? 1,
    salesStart: record?.salesStart ? record.salesStart.slice(0, 16) : '',
    salesEnd: record?.salesEnd ? record.salesEnd.slice(0, 16) : '',
    sortOrder: record?.sortOrder ?? 0,
    isActive: record?.isActive ?? true,
  }
}

function toPayload(value: TicketDraft) {
  return {
    ...(value.id ? { id: value.id } : {}),
    slug: value.slug.trim().toLowerCase(),
    name: value.name.trim(),
    description: value.description.trim() || undefined,
    ticketKind: value.ticketKind,
    priceAmount: value.ticketKind === 'free' ? 0 : Number(value.priceAmount),
    depositAmount:
      value.ticketKind === 'deposit' && value.depositAmount
        ? Number(value.depositAmount)
        : undefined,
    capacity: value.capacity ? Number(value.capacity) : null,
    maxPerRegistration: Number(value.maxPerRegistration),
    salesStart: value.salesStart ? new Date(value.salesStart).toISOString() : null,
    salesEnd: value.salesEnd ? new Date(value.salesEnd).toISOString() : null,
    sortOrder: Number(value.sortOrder),
    isActive: value.isActive,
  }
}

export function EventTicketTypesEditor({ courseRunId }: { courseRunId: string }) {
  const [tickets, setTickets] = React.useState<TicketDraft[]>([])
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState<number | 'new' | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [notice, setNotice] = React.useState<string | null>(null)

  const load = React.useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true)
      try {
        const response = await fetch(
          `/api/next/course-runs/${encodeURIComponent(courseRunId)}/ticket-types`,
          {
            credentials: 'include',
            cache: 'no-store',
            signal,
          }
        )
        const body = (await response.json()) as { items?: TicketRecord[]; error?: string }
        if (!response.ok || !body.items)
          throw new Error(body.error ?? 'No se pudieron cargar los tipos de entrada.')
        setTickets(body.items.map((item) => draft(item)))
        setError(null)
      } catch (cause) {
        if (signal?.aborted) return
        setError(
          cause instanceof Error ? cause.message : 'No se pudieron cargar los tipos de entrada.'
        )
      } finally {
        if (!signal?.aborted) setLoading(false)
      }
    },
    [courseRunId]
  )

  React.useEffect(() => {
    const controller = new AbortController()
    void load(controller.signal)
    return () => controller.abort()
  }, [load])

  const update = (index: number, key: keyof TicketDraft, value: string | number | boolean) => {
    setNotice(null)
    setTickets((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? { ...item, [key]: value } : item))
    )
  }

  const add = () => {
    setNotice(null)
    setTickets((current) => [...current, draft()])
  }

  const save = async (index: number) => {
    const value = tickets[index]
    if (!value) return
    setSaving(value.id ?? 'new')
    setNotice(null)
    setError(null)
    try {
      const response = await fetch(
        `/api/next/course-runs/${encodeURIComponent(courseRunId)}/ticket-types`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(toPayload(value)),
        }
      )
      const body = (await response.json()) as { record?: TicketRecord; error?: string }
      if (!response.ok || !body.record)
        throw new Error(body.error ?? 'No se pudo guardar el tipo de entrada.')
      setTickets((current) =>
        current.map((item, itemIndex) => (itemIndex === index ? draft(body.record) : item))
      )
      setNotice('Tipo de entrada guardado.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar el tipo de entrada.')
    } finally {
      setSaving(null)
    }
  }

  const remove = async (index: number) => {
    const value = tickets[index]
    if (!value) return
    if (!value.id) {
      setTickets((current) => current.filter((_, itemIndex) => itemIndex !== index))
      return
    }
    setSaving(value.id)
    setNotice(null)
    try {
      const response = await fetch(
        `/api/next/course-runs/${encodeURIComponent(courseRunId)}/ticket-types/${value.id}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      )
      if (!response.ok) {
        const body = (await response.json()) as { error?: string }
        throw new Error(body.error ?? 'No se pudo eliminar el tipo de entrada.')
      }
      setTickets((current) => current.filter((_, itemIndex) => itemIndex !== index))
      setNotice('Tipo de entrada eliminado.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo eliminar el tipo de entrada.')
    } finally {
      setSaving(null)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Tipos de entrada</CardTitle>
          <CardDescription>
            Define variantes de acceso para la futura inscripción nativa de Akademate. El enlace
            externo sigue siendo opcional.
          </CardDescription>
        </div>
        <Button type="button" variant="outline" onClick={add} disabled={loading || saving !== null}>
          <Plus data-icon="inline-start" aria-hidden="true" /> Añadir tipo
        </Button>
      </CardHeader>
      <CardContent className="space-y-5">
        {loading ? (
          <p className="text-sm text-muted-foreground">Cargando tipos de entrada…</p>
        ) : null}
        {!loading && tickets.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 p-5 text-sm text-muted-foreground">
            Aún no hay variantes. Puedes empezar con una entrada gratuita, una entrada de pago o un
            depósito.
          </div>
        ) : null}
        {tickets.map((ticket, index) => (
          <article
            key={ticket.id ?? `new-${index}`}
            className="rounded-xl border border-border bg-card p-4 shadow-sm"
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Field>
                <FieldLabel htmlFor={`ticket-name-${index}`}>Nombre</FieldLabel>
                <Input
                  id={`ticket-name-${index}`}
                  value={ticket.name}
                  onChange={(event) => update(index, 'name', event.target.value)}
                  placeholder="Entrada estándar"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor={`ticket-slug-${index}`}>Slug</FieldLabel>
                <Input
                  id={`ticket-slug-${index}`}
                  value={ticket.slug}
                  onChange={(event) => update(index, 'slug', event.target.value.toLowerCase())}
                  placeholder="standard-entry"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor={`ticket-kind-${index}`}>Modalidad</FieldLabel>
                <NativeSelect
                  id={`ticket-kind-${index}`}
                  value={ticket.ticketKind}
                  onChange={(event) =>
                    update(index, 'ticketKind', event.target.value as TicketKind)
                  }
                >
                  <option value="free">Gratuita</option>
                  <option value="paid">Pago completo</option>
                  <option value="deposit">Depósito</option>
                </NativeSelect>
              </Field>
              <Field>
                <FieldLabel htmlFor={`ticket-price-${index}`}>Precio total</FieldLabel>
                <Input
                  id={`ticket-price-${index}`}
                  type="number"
                  min="0"
                  step="0.01"
                  value={ticket.priceAmount}
                  disabled={ticket.ticketKind === 'free'}
                  onChange={(event) => update(index, 'priceAmount', event.target.value)}
                />
              </Field>
              {ticket.ticketKind === 'deposit' ? (
                <Field>
                  <FieldLabel htmlFor={`ticket-deposit-${index}`}>Depósito</FieldLabel>
                  <Input
                    id={`ticket-deposit-${index}`}
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={ticket.depositAmount}
                    onChange={(event) => update(index, 'depositAmount', event.target.value)}
                  />
                </Field>
              ) : null}
              <Field>
                <FieldLabel htmlFor={`ticket-capacity-${index}`}>Cupo propio</FieldLabel>
                <Input
                  id={`ticket-capacity-${index}`}
                  type="number"
                  min="1"
                  step="1"
                  value={ticket.capacity}
                  onChange={(event) => update(index, 'capacity', event.target.value)}
                  placeholder="Sin límite"
                />
                <FieldDescription>Vacío usa el cupo global de la convocatoria.</FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor={`ticket-max-${index}`}>Máximo por registro</FieldLabel>
                <Input
                  id={`ticket-max-${index}`}
                  type="number"
                  min="1"
                  max="20"
                  step="1"
                  value={ticket.maxPerRegistration}
                  onChange={(event) =>
                    update(index, 'maxPerRegistration', Number(event.target.value))
                  }
                />
              </Field>
              <Field>
                <FieldLabel htmlFor={`ticket-order-${index}`}>Orden</FieldLabel>
                <Input
                  id={`ticket-order-${index}`}
                  type="number"
                  min="0"
                  step="1"
                  value={ticket.sortOrder}
                  onChange={(event) => update(index, 'sortOrder', Number(event.target.value))}
                />
              </Field>
              <Field className="md:col-span-2 xl:col-span-4">
                <FieldLabel htmlFor={`ticket-description-${index}`}>Descripción</FieldLabel>
                <Input
                  id={`ticket-description-${index}`}
                  value={ticket.description}
                  onChange={(event) => update(index, 'description', event.target.value)}
                  placeholder="Incluye el acceso al taller y los materiales."
                />
              </Field>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={ticket.isActive}
                  onChange={(event) => update(index, 'isActive', event.target.checked)}
                />
                Visible para la inscripción nativa
              </label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => void remove(index)}
                  disabled={saving === ticket.id}
                >
                  <Trash2 data-icon="inline-start" aria-hidden="true" /> Eliminar
                </Button>
                <Button type="button" onClick={() => void save(index)} disabled={saving !== null}>
                  <Save data-icon="inline-start" aria-hidden="true" />{' '}
                  {saving === (ticket.id ?? 'new') ? 'Guardando…' : 'Guardar tipo'}
                </Button>
              </div>
            </div>
          </article>
        ))}
        {error ? (
          <Alert variant="destructive">
            <AlertTitle>No se pudo actualizar la configuración</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        {notice ? (
          <Alert>
            <AlertDescription>{notice}</AlertDescription>
          </Alert>
        ) : null}
      </CardContent>
    </Card>
  )
}
