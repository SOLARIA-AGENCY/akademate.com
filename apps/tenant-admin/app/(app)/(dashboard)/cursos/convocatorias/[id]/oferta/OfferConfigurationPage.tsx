'use client'

import * as React from 'react'
import {
  ArrowUpRight,
  BadgeEuro,
  Check,
  ClipboardCheck,
  Eye,
  FileText,
  Link2,
  LoaderCircle,
  Send,
  TicketCheck,
} from 'lucide-react'
import {
  OfferPublicationSchema,
  type OfferPublication,
} from '@akademate/operations/offer-publication'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  Input,
  NativeSelect,
  Skeleton,
  cn,
} from '@akademate/ui'

type ConversionMode =
  | 'information_only'
  | 'interest_form'
  | 'free_registration'
  | 'approval_required'
  | 'paid_registration'
  | 'external_link'

type OfferRecord = {
  courseRunId: number
  courseId: number
  courseName: string
  code: string
  startsAt: string
  endsAt: string
  publicationAccess: 'private' | 'public' | 'unlisted'
  conversionMode: ConversionMode
  shareSlug: string | null
  formTemplateKey: string | null
  externalActionUrl: string | null
  paymentPlan: 'full_amount' | 'deposit' | null
  priceAmount: number | null
  depositAmount: number | null
  ctaLabel: string | null
  capacityPolicy: 'limited' | 'waitlist' | 'unlimited'
}

type FormState = {
  publicationAccess: OfferRecord['publicationAccess']
  conversionMode: ConversionMode
  shareSlug: string
  formTemplateKey: string
  externalActionUrl: string
  paymentPlan: 'full_amount' | 'deposit'
  priceAmount: string
  depositAmount: string
  ctaLabel: string
  capacityPolicy: OfferRecord['capacityPolicy']
}

const modes = [
  {
    value: 'information_only',
    title: 'Página informativa',
    description: 'Publica la convocatoria sin formulario, inscripción ni pago.',
    outcome: 'Sin conversión',
    icon: FileText,
  },
  {
    value: 'interest_form',
    title: 'Solo formulario',
    description: 'Recoge una consulta para que el equipo del centro haga seguimiento.',
    outcome: 'Recibe contactos',
    icon: Send,
  },
  {
    value: 'free_registration',
    title: 'Inscripción sin pago',
    description: 'Recibe los datos de inscripción sin iniciar ningún cobro.',
    outcome: 'Solicita una plaza',
    icon: TicketCheck,
  },
  {
    value: 'approval_required',
    title: 'Solicitud con aprobación',
    description: 'Revisa la solicitud antes de confirmar la admisión o la plaza.',
    outcome: 'Requiere revisión',
    icon: ClipboardCheck,
  },
  {
    value: 'paid_registration',
    title: 'Inscripción con pago',
    description: 'Cobra el importe completo o un depósito antes de confirmar.',
    outcome: 'Inicia checkout',
    icon: BadgeEuro,
  },
  {
    value: 'external_link',
    title: 'Enlace externo · Luma y otros',
    description: 'Continúa en Luma, Eventbrite, un formulario o una web externa.',
    outcome: 'Abre otro servicio',
    icon: Link2,
  },
] as const

const modeByValue = new Map(modes.map((mode) => [mode.value, mode]))
const modeGroups = [
  {
    title: 'Publicar o captar',
    description: 'Comparte la convocatoria sin abrir todavía una inscripción.',
    values: ['information_only', 'interest_form'],
  },
  {
    title: 'Gestionar inscripciones',
    description: 'Recibe solicitudes de plaza, con revisión o con pago.',
    values: ['free_registration', 'approval_required', 'paid_registration'],
  },
  {
    title: 'Conectar un servicio externo',
    description: 'Mantén la página en Akademate y continúa el proceso en otra plataforma.',
    values: ['external_link'],
  },
] as const satisfies ReadonlyArray<{
  title: string
  description: string
  values: readonly ConversionMode[]
}>

function initialState(record: OfferRecord): FormState {
  return {
    publicationAccess: record.publicationAccess,
    conversionMode: record.conversionMode,
    shareSlug: record.shareSlug ?? '',
    formTemplateKey: record.formTemplateKey ?? '',
    externalActionUrl: record.externalActionUrl ?? '',
    paymentPlan: record.paymentPlan ?? 'full_amount',
    priceAmount: record.priceAmount?.toString() ?? '',
    depositAmount: record.depositAmount?.toString() ?? '',
    ctaLabel: record.ctaLabel ?? '',
    capacityPolicy: record.capacityPolicy,
  }
}

function payloadFrom(state: FormState) {
  const usesForm = state.conversionMode === 'interest_form'
    || state.conversionMode === 'approval_required'
  const isPaid = state.conversionMode === 'paid_registration'
  return {
    publicationAccess: state.publicationAccess,
    conversionMode: state.conversionMode,
    shareSlug: state.publicationAccess === 'private' || !state.shareSlug.trim()
      ? undefined
      : state.shareSlug.trim(),
    formTemplateKey: usesForm && state.formTemplateKey.trim()
      ? state.formTemplateKey.trim()
      : undefined,
    externalActionUrl: state.conversionMode === 'external_link' && state.externalActionUrl.trim()
      ? state.externalActionUrl.trim()
      : undefined,
    paymentPlan: isPaid ? state.paymentPlan : undefined,
    priceAmount: isPaid && state.priceAmount ? Number(state.priceAmount) : undefined,
    depositAmount: isPaid && state.paymentPlan === 'deposit' && state.depositAmount
      ? Number(state.depositAmount)
      : undefined,
    ctaLabel: state.ctaLabel.trim() || undefined,
    capacityPolicy: state.capacityPolicy,
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function modeCta(state: FormState) {
  if (state.ctaLabel.trim()) return state.ctaLabel.trim()
  switch (state.conversionMode) {
    case 'information_only': return 'Contactar con la academia'
    case 'interest_form': return 'Solicitar información'
    case 'free_registration': return 'Inscribirme'
    case 'approval_required': return 'Enviar solicitud'
    case 'paid_registration': return state.paymentPlan === 'deposit' ? 'Reservar plaza' : 'Inscribirme y pagar'
    case 'external_link': return 'Continuar'
  }
}

export function OfferConfigurationForm({
  record,
  onSave,
}: {
  record: OfferRecord
  onSave: (payload: OfferPublication) => Promise<OfferRecord>
}) {
  const [state, setState] = React.useState(() => initialState(record))
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [saved, setSaved] = React.useState(false)
  const selectedMode = modeByValue.get(state.conversionMode) ?? modes[0]
  const parsed = OfferPublicationSchema.safeParse(payloadFrom(state))

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setSaved(false)
    setError(null)
    setState((current) => ({ ...current, [key]: value }))
  }

  const selectMode = (conversionMode: ConversionMode) => {
    setSaved(false)
    setError(null)
    setState((current) => ({
      ...current,
      conversionMode,
      formTemplateKey: conversionMode === 'interest_form'
        ? 'lead-standard'
        : conversionMode === 'approval_required'
          ? 'application-standard'
          : current.formTemplateKey,
    }))
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Revisa la configuración de la oferta.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const updated = await onSave(parsed.data)
      setState(initialState(updated))
      setSaved(true)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar la configuración.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
      <Card>
        <CardHeader>
          <CardTitle>Publicación e inscripción</CardTitle>
          <CardDescription>
            Decide cómo se comparte la convocatoria y qué podrá hacer cada visitante.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="offer-publication-access">Visibilidad</FieldLabel>
              <NativeSelect
                id="offer-publication-access"
                value={state.publicationAccess}
                onChange={(event) => update('publicationAccess', event.target.value as FormState['publicationAccess'])}
              >
                <option value="private">Privada · solo equipo</option>
                <option value="unlisted">No listada · acceso con enlace</option>
                <option value="public">Pública · visible en el catálogo</option>
              </NativeSelect>
              <FieldDescription>
                La visibilidad es independiente del formulario, la inscripción o el pago.
              </FieldDescription>
            </Field>

            {state.publicationAccess !== 'private' ? (
              <Field data-invalid={Boolean(!state.shareSlug.trim())}>
                <FieldLabel htmlFor="offer-share-slug">URL compartible</FieldLabel>
                <Input
                  id="offer-share-slug"
                  value={state.shareSlug}
                  onChange={(event) => update('shareSlug', event.target.value.toLowerCase())}
                  placeholder="creative-leadership-weekend"
                  aria-invalid={!state.shareSlug.trim()}
                />
                <FieldDescription>Usa letras minúsculas, números y guiones.</FieldDescription>
              </Field>
            ) : null}

            <FieldSet>
              <FieldLegend>¿Qué debe poder hacer el visitante?</FieldLegend>
              <FieldDescription>
                Elige un único resultado. Akademate mostrará solamente los campos y acciones de ese recorrido.
              </FieldDescription>
              <div className="grid gap-5">
                {modeGroups.map((group) => (
                  <section key={group.title} aria-labelledby={`offer-mode-${group.values[0]}`}>
                    <div className="mb-3">
                      <h3 id={`offer-mode-${group.values[0]}`} className="text-sm font-semibold text-foreground">
                        {group.title}
                      </h3>
                      <p className="mt-1 text-sm leading-5 text-muted-foreground">{group.description}</p>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      {group.values.map((value) => {
                        const mode = modeByValue.get(value)!
                        const Icon = mode.icon
                        const selected = state.conversionMode === mode.value
                        return (
                          <FieldLabel
                            key={mode.value}
                            className={cn(
                              'items-start rounded-xl border border-border bg-card p-4 shadow-sm transition-all duration-200 ease-in-out hover:border-primary/60 hover:shadow-md',
                              selected && 'border-primary ring-2 ring-primary/15',
                            )}
                          >
                            <input
                              type="radio"
                              name="conversion-mode"
                              value={mode.value}
                              checked={selected}
                              onChange={() => selectMode(mode.value)}
                              className="mt-1 size-4 accent-primary"
                            />
                            <span className="flex min-w-0 flex-1 gap-3">
                              <Icon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                              <span className="flex min-w-0 flex-col gap-1">
                                <span className="flex flex-wrap items-center gap-2">
                                  <span className="text-sm font-semibold">{mode.title}</span>
                                  <Badge variant="secondary" className="font-normal">{mode.outcome}</Badge>
                                </span>
                                <span className="text-sm font-normal leading-5 text-muted-foreground">
                                  {mode.description}
                                </span>
                              </span>
                            </span>
                          </FieldLabel>
                        )
                      })}
                    </div>
                  </section>
                ))}
              </div>
            </FieldSet>

            {(state.conversionMode === 'interest_form'
              || state.conversionMode === 'approval_required'
              || state.conversionMode === 'free_registration') ? (
              <Alert>
                <ClipboardCheck aria-hidden="true" />
                <AlertTitle>
                  {state.conversionMode === 'approval_required'
                    ? 'Formulario estándar de solicitud'
                    : state.conversionMode === 'free_registration'
                      ? 'Formulario estándar de inscripción'
                      : 'Formulario estándar de contacto'}
                </AlertTitle>
                <AlertDescription>
                  <span className="block font-medium text-foreground">
                    Nombre y apellidos · Email · Teléfono · Mensaje
                  </span>
                  <span className="mt-1 block">
                    Incluye aceptación de privacidad y consentimiento de marketing separado. El constructor de campos personalizados se añadirá como una capacidad independiente.
                  </span>
                </AlertDescription>
              </Alert>
            ) : null}

            {state.conversionMode === 'external_link' ? (
              <Field data-invalid={Boolean(state.externalActionUrl && !state.externalActionUrl.startsWith('https://'))}>
                <FieldLabel htmlFor="offer-external-url">Destino HTTPS</FieldLabel>
                <Input
                  id="offer-external-url"
                  type="url"
                  value={state.externalActionUrl}
                  onChange={(event) => update('externalActionUrl', event.target.value)}
                  placeholder="https://lu.ma/tu-convocatoria"
                  aria-invalid={Boolean(state.externalActionUrl && !state.externalActionUrl.startsWith('https://'))}
                />
                <FieldDescription>
                  Puedes enlazar Luma, Eventbrite, un formulario propio u otro servicio con HTTPS.
                </FieldDescription>
              </Field>
            ) : null}

            {state.conversionMode === 'paid_registration' ? (
              <FieldSet>
                <FieldLegend variant="label">Pago</FieldLegend>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="offer-payment-plan">Modalidad</FieldLabel>
                    <NativeSelect
                      id="offer-payment-plan"
                      value={state.paymentPlan}
                      onChange={(event) => update('paymentPlan', event.target.value as FormState['paymentPlan'])}
                    >
                      <option value="full_amount">Importe completo</option>
                      <option value="deposit">Depósito de reserva</option>
                    </NativeSelect>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="offer-price">Precio total</FieldLabel>
                    <Input
                      id="offer-price"
                      type="number"
                      min="0.01"
                      step="0.01"
                      inputMode="decimal"
                      value={state.priceAmount}
                      onChange={(event) => update('priceAmount', event.target.value)}
                    />
                  </Field>
                  {state.paymentPlan === 'deposit' ? (
                    <Field>
                      <FieldLabel htmlFor="offer-deposit">Depósito</FieldLabel>
                      <Input
                        id="offer-deposit"
                        type="number"
                        min="0.01"
                        step="0.01"
                        inputMode="decimal"
                        value={state.depositAmount}
                        onChange={(event) => update('depositAmount', event.target.value)}
                      />
                    </Field>
                  ) : null}
                </div>
              </FieldSet>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              {(state.conversionMode === 'free_registration'
                || state.conversionMode === 'approval_required'
                || state.conversionMode === 'paid_registration') ? (
                <Field>
                  <FieldLabel htmlFor="offer-capacity">Gestión de plazas</FieldLabel>
                  <NativeSelect
                    id="offer-capacity"
                    value={state.capacityPolicy}
                    onChange={(event) => update('capacityPolicy', event.target.value as FormState['capacityPolicy'])}
                  >
                    <option value="limited">Plazas limitadas</option>
                    <option value="waitlist">Lista de espera</option>
                    <option value="unlimited">Sin límite</option>
                  </NativeSelect>
                </Field>
              ) : null}
              <Field>
                <FieldLabel htmlFor="offer-cta">Texto del botón</FieldLabel>
                <Input
                  id="offer-cta"
                  maxLength={80}
                  value={state.ctaLabel}
                  onChange={(event) => update('ctaLabel', event.target.value)}
                  placeholder={modeCta({ ...state, ctaLabel: '' })}
                />
              </Field>
            </div>

            <Alert>
              <Link2 aria-hidden="true" />
              <AlertTitle>La página compartible es independiente</AlertTitle>
              <AlertDescription>
                Cualquier modo público o no listado puede tener una página tipo Luma. El modo elegido decide si esa página informa, recoge datos, solicita una plaza, cobra o deriva a otro servicio.
              </AlertDescription>
            </Alert>

            {error ? <FieldError>{error}</FieldError> : null}
            {saved ? (
              <Alert>
                <Check aria-hidden="true" />
                <AlertTitle>Configuración guardada</AlertTitle>
                <AlertDescription>La convocatoria conserva este recorrido como nueva fuente de verdad.</AlertDescription>
              </Alert>
            ) : null}
          </FieldGroup>
        </CardContent>
        <CardFooter className="justify-end gap-3">
          <Button type="submit" disabled={saving || !parsed.success}>
            {saving ? <LoaderCircle className="animate-spin" data-icon="inline-start" aria-hidden="true" /> : null}
            {saving ? 'Guardando…' : 'Guardar recorrido'}
          </Button>
        </CardFooter>
      </Card>

      <div className="xl:sticky xl:top-20 xl:self-start">
        <Card className="min-h-[520px] overflow-hidden">
          <CardHeader className="border-b border-border bg-muted/35">
            <div className="flex items-center justify-between gap-3">
              <Badge variant="outline">Previsualización</Badge>
              <Eye className="size-5 text-muted-foreground" aria-hidden="true" />
            </div>
            <CardTitle>{record.courseName}</CardTitle>
            <CardDescription>{record.code}</CardDescription>
          </CardHeader>
          <CardContent className="flex min-h-[350px] flex-col gap-6 pt-6">
            <div className="flex flex-wrap gap-2">
              <Badge>{state.publicationAccess === 'public' ? 'Pública' : state.publicationAccess === 'unlisted' ? 'Con enlace' : 'Privada'}</Badge>
              <Badge variant="secondary">{selectedMode.title}</Badge>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-foreground">
                {formatDate(record.startsAt)} — {formatDate(record.endsAt)}
              </p>
              <p className="text-sm leading-6 text-muted-foreground">
                Una página clara para descubrir la convocatoria y completar el siguiente paso elegido por la academia.
              </p>
            </div>
            {state.publicationAccess !== 'private' && state.shareSlug ? (
              <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
                akademate.com/o/{state.shareSlug}
              </div>
            ) : null}
            <div className="mt-auto flex flex-col gap-3">
              {state.conversionMode === 'paid_registration' && state.priceAmount ? (
                <p className="text-2xl font-semibold text-foreground">
                  {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(Number(state.priceAmount))}
                </p>
              ) : null}
              <Button type="button" className="w-full" disabled={state.publicationAccess === 'private'}>
                {modeCta(state)}
                {state.conversionMode === 'external_link' ? <ArrowUpRight data-icon="inline-end" aria-hidden="true" /> : null}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Vista operativa; la publicación pública se activa en una fase separada.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </form>
  )
}

export function OfferConfigurationPage({ courseRunId }: { courseRunId: string }) {
  const [record, setRecord] = React.useState<OfferRecord | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      try {
        const response = await fetch(`/api/next/course-runs/${encodeURIComponent(courseRunId)}/offer`, {
          credentials: 'include',
          cache: 'no-store',
          signal: controller.signal,
        })
        const body = await response.json() as { record?: OfferRecord; error?: string }
        if (!response.ok || !body.record) throw new Error(body.error ?? 'No se pudo cargar la convocatoria.')
        setRecord(body.record)
      } catch (cause) {
        if (controller.signal.aborted) return
        setError(cause instanceof Error ? cause.message : 'No se pudo cargar la convocatoria.')
      }
    }
    void load()
    return () => controller.abort()
  }, [courseRunId])

  const save = async (input: OfferPublication) => {
    const response = await fetch(`/api/next/course-runs/${encodeURIComponent(courseRunId)}/offer`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(input),
    })
    const body = await response.json() as { record?: OfferRecord; error?: string }
    if (!response.ok || !body.record) throw new Error(body.error ?? 'No se pudo guardar la configuración.')
    setRecord(body.record)
    return body.record
  }

  if (error) {
    return (
      <Alert>
        <AlertTitle>Configuración no disponible</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!record) {
    return (
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]" aria-label="Cargando configuración de la convocatoria">
        <Skeleton className="h-[680px] w-full rounded-xl" />
        <Skeleton className="h-[520px] w-full rounded-xl" />
      </div>
    )
  }

  return <OfferConfigurationForm record={record} onSave={save} />
}
