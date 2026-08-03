'use client'

import * as React from 'react'
import Link from 'next/link'
import { Archive, CalendarDays, CheckCircle2, History as HistoryIcon, Inbox, RotateCcw, Search, UsersRound, XCircle } from 'lucide-react'
import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  Input,
  MetricCard,
  NativeSelect,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
} from '@akademate/ui'

type SubmissionStatus = 'new' | 'pending_review' | 'pending_registration' | 'approved' | 'rejected' | 'archived'
type DecisionStatus = 'pending_review' | 'approved' | 'rejected' | 'archived'

type InboxItem = {
  id: number
  courseRunId: number
  courseName: string
  courseRunCode: string
  kind: 'interest' | 'application' | 'registration_request'
  status: SubmissionStatus
  firstName: string
  lastName: string
  email: string
  phone: string | null
  message: string | null
  privacyNoticeVersion: string
  marketingConsent: boolean
  sourceHost: string
  sourceSlug: string
  createdAt: string
}

type InboxResponse = {
  items: InboxItem[]
  canReview: boolean
  page: number
  pageSize: number
  total: number
  totalPages: number
}

type HistoryResponse = {
  submissionId: number
  status: SubmissionStatus
  receivedAt: string
  events: Array<{
    id: number
    actorUserId: number
    actorName: string
    fromStatus: SubmissionStatus
    toStatus: DecisionStatus
    note: string | null
    createdAt: string
  }>
  truncated: boolean
}

const STATUS_LABELS: Record<InboxItem['status'], string> = {
  new: 'Nueva consulta',
  pending_review: 'Pendiente de revisión',
  pending_registration: 'Inscripción pendiente',
  approved: 'Aprobada',
  rejected: 'Rechazada',
  archived: 'Archivada',
}

const KIND_LABELS: Record<InboxItem['kind'], string> = {
  interest: 'Interés',
  application: 'Solicitud',
  registration_request: 'Inscripción solicitada',
}

function formatDate(value: string) {
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return 'Fecha no disponible'
  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function buildQuery(filters: { status: string; kind: string; page: number; search: string }) {
  const params = new URLSearchParams()
  if (filters.status !== 'all') params.set('status', filters.status)
  if (filters.kind !== 'all') params.set('kind', filters.kind)
  if (filters.page > 1) params.set('page', String(filters.page))
  if (filters.search) params.set('search', filters.search)
  const query = params.toString()
  return `/api/next/offer-submissions${query ? `?${query}` : ''}`
}

function DecisionButtons({
  item,
  canReview,
  onSelect,
}: {
  item: InboxItem
  canReview: boolean
  onSelect: (status: DecisionStatus) => void
}) {
  if (!canReview) return null
  if (['approved', 'rejected', 'archived'].includes(item.status)) {
    return (
      <Button type="button" size="sm" variant="outline" onClick={() => onSelect('pending_review')}>
        <RotateCcw className="h-4 w-4" aria-hidden="true" /> Reabrir
      </Button>
    )
  }
  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" size="sm" onClick={() => onSelect('approved')}>
        <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Aprobar
      </Button>
      <Button type="button" size="sm" variant="outline" onClick={() => onSelect('rejected')}>
        <XCircle className="h-4 w-4" aria-hidden="true" /> Rechazar
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={() => onSelect('archived')}>
        <Archive className="h-4 w-4" aria-hidden="true" /> Archivar
      </Button>
    </div>
  )
}

function SubmissionCard({
  item,
  canReview,
  onDecision,
  onHistory,
}: {
  item: InboxItem
  canReview: boolean
  onDecision: (item: InboxItem, status: DecisionStatus) => void
  onHistory: (item: InboxItem) => void
}) {
  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-semibold">{item.firstName} {item.lastName}</p>
            <a className="text-sm text-primary underline-offset-4 hover:underline" href={`mailto:${item.email}`}>
              {item.email}
            </a>
          </div>
          <Badge variant="secondary">{STATUS_LABELS[item.status]}</Badge>
        </div>
        <div className="space-y-1 text-sm">
          <p className="font-medium">{item.courseName}</p>
          <p className="text-muted-foreground">{item.courseRunCode} · {KIND_LABELS[item.kind]}</p>
          <p className="text-muted-foreground">{formatDate(item.createdAt)}</p>
        </div>
        {item.message ? <p className="rounded-lg bg-muted p-3 text-sm">{item.message}</p> : null}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-xs text-muted-foreground">
          <span>Privacidad: {item.privacyNoticeVersion} · Marketing: {item.marketingConsent ? 'Sí' : 'No'}</span>
          <div className="flex flex-wrap gap-2">
            <DecisionButtons item={item} canReview={canReview} onSelect={(status) => onDecision(item, status)} />
            {canReview ? (
              <Button type="button" size="sm" variant="outline" onClick={() => onHistory(item)}>
                <HistoryIcon className="h-4 w-4" aria-hidden="true" /> Historial
              </Button>
            ) : null}
            <Button asChild size="sm" variant="outline">
              <Link href={`/cursos/convocatorias/${item.courseRunId}/oferta`}>Ver convocatoria</Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function OfferSubmissionInbox() {
  const [status, setStatus] = React.useState('all')
  const [kind, setKind] = React.useState('all')
  const [searchDraft, setSearchDraft] = React.useState('')
  const [search, setSearch] = React.useState('')
  const [page, setPage] = React.useState(1)
  const [data, setData] = React.useState<InboxResponse | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(false)
  const [reloadToken, setReloadToken] = React.useState(0)
  const [decision, setDecision] = React.useState<{ item: InboxItem; status: DecisionStatus } | null>(null)
  const [decisionNote, setDecisionNote] = React.useState('')
  const [decisionPending, setDecisionPending] = React.useState(false)
  const [decisionError, setDecisionError] = React.useState(false)
  const [decisionNotice, setDecisionNotice] = React.useState('')
  const [historyItem, setHistoryItem] = React.useState<InboxItem | null>(null)
  const [history, setHistory] = React.useState<HistoryResponse | null>(null)
  const [historyLoading, setHistoryLoading] = React.useState(false)
  const [historyError, setHistoryError] = React.useState(false)

  React.useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(false)
    setData(null)
    void fetch(buildQuery({ status, kind, page, search }), {
      cache: 'no-store',
      credentials: 'same-origin',
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('submission_inbox_unavailable')
        return response.json() as Promise<InboxResponse>
      })
      .then((result) => setData(result))
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === 'AbortError') return
        setError(true)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [kind, page, reloadToken, search, status])

  function updateStatus(value: string) {
    setPage(1)
    setStatus(value)
  }

  function updateKind(value: string) {
    setPage(1)
    setKind(value)
  }

  function selectDecision(item: InboxItem, nextStatus: DecisionStatus) {
    setDecision({ item, status: nextStatus })
    setDecisionNote('')
    setDecisionError(false)
    setDecisionNotice('')
    setHistoryItem(null)
    setHistory(null)
  }

  async function loadHistory(item: InboxItem) {
    setDecision(null)
    setHistoryItem(item)
    setHistory(null)
    setHistoryLoading(true)
    setHistoryError(false)
    try {
      const response = await fetch(`/api/next/offer-submissions/${item.id}/reviews`, {
        cache: 'no-store',
        credentials: 'same-origin',
      })
      if (!response.ok) throw new Error('submission_history_unavailable')
      setHistory(await response.json() as HistoryResponse)
    } catch {
      setHistoryError(true)
    } finally {
      setHistoryLoading(false)
    }
  }

  async function submitDecision() {
    if (!decision || (decision.status === 'rejected' && !decisionNote.trim())) return
    setDecisionPending(true)
    setDecisionError(false)
    try {
      const response = await fetch(`/api/next/offer-submissions/${decision.item.id}/decision`, {
        method: 'PATCH',
        credentials: 'same-origin',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: decision.status, note: decisionNote.trim() || null }),
      })
      if (!response.ok) throw new Error('submission_decision_unavailable')
      const label = STATUS_LABELS[decision.status]
      setDecisionNotice(`Solicitud actualizada: ${label.toLocaleLowerCase('es-ES')}.`)
      setDecision(null)
      setDecisionNote('')
      setReloadToken((current) => current + 1)
    } catch {
      setDecisionError(true)
    } finally {
      setDecisionPending(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <MetricCard label="Solicitudes encontradas" value={data?.total ?? '—'} hint="Según los filtros activos" icon={<UsersRound className="h-5 w-5" />} />
        <MetricCard label="Flujo operativo" value="Revisión auditada" hint="Cada decisión conserva actor e historial" icon={<Inbox className="h-5 w-5" />} />
      </div>

      {decisionNotice ? (
        <Alert><AlertDescription>{decisionNotice}</AlertDescription></Alert>
      ) : null}

      {decision ? (
        <Card>
          <CardContent className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.8fr)] lg:items-end">
            <div className="space-y-2">
              <p className="text-sm font-semibold">Revisar solicitud de {decision.item.firstName} {decision.item.lastName}</p>
              <p className="text-sm text-muted-foreground">
                Nuevo estado: {STATUS_LABELS[decision.status]}. Esta decisión no crea matrícula, plaza ni cobro.
              </p>
              <label className="grid gap-2 text-sm font-medium">
                Nota interna {decision.status === 'rejected' ? '(obligatoria)' : '(opcional)'}
                <Textarea
                  value={decisionNote}
                  onChange={(event) => setDecisionNote(event.target.value)}
                  maxLength={500}
                  placeholder="Contexto para el equipo de la academia"
                />
              </label>
            </div>
            <div className="space-y-3">
              {decisionError ? <Alert variant="destructive"><AlertDescription>No se pudo guardar la decisión</AlertDescription></Alert> : null}
              <div className="flex flex-wrap justify-end gap-2">
                <Button type="button" variant="outline" disabled={decisionPending} onClick={() => setDecision(null)}>Cancelar</Button>
                <Button
                  type="button"
                  disabled={decisionPending || (decision.status === 'rejected' && !decisionNote.trim())}
                  onClick={() => void submitDecision()}
                >
                  {decisionPending ? 'Guardando…' : `Confirmar: ${STATUS_LABELS[decision.status]}`}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {historyItem ? (
        <Card>
          <CardContent className="space-y-5 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">Historial de {historyItem.firstName} {historyItem.lastName}</p>
                <p className="text-sm text-muted-foreground">Decisiones internas registradas para esta solicitud.</p>
              </div>
              <Button type="button" size="sm" variant="outline" onClick={() => { setHistoryItem(null); setHistory(null) }}>
                Cerrar historial
              </Button>
            </div>
            {historyLoading ? <p className="text-sm text-muted-foreground">Cargando historial…</p> : null}
            {historyError ? <Alert variant="destructive"><AlertDescription>No se pudo cargar el historial</AlertDescription></Alert> : null}
            {history ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Estado actual</span>
                  <Badge variant="secondary">{STATUS_LABELS[history.status]}</Badge>
                </div>
                {history.events.length ? (
                  <ol className="space-y-3 border-l border-border pl-5">
                    {history.events.map((event) => (
                      <li key={event.id} className="relative rounded-lg border border-border bg-background p-4">
                        <span className="absolute -left-[1.62rem] top-5 h-3 w-3 rounded-full border-2 border-background bg-primary" aria-hidden="true" />
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-medium">{STATUS_LABELS[event.fromStatus]} → {STATUS_LABELS[event.toStatus]}</p>
                          <time className="text-xs text-muted-foreground" dateTime={event.createdAt}>{formatDate(event.createdAt)}</time>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{event.actorName} · actor #{event.actorUserId}</p>
                        {event.note ? <p className="mt-3 rounded-md bg-muted p-3 text-sm">{event.note}</p> : null}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">Aún no se han registrado decisiones internas.</p>
                )}
                <div className="rounded-lg bg-muted p-4 text-sm">
                  <p className="font-medium">Solicitud recibida</p>
                  <p className="text-muted-foreground">{formatDate(history.receivedAt)}</p>
                </div>
                {history.truncated ? <Alert><AlertDescription>Se muestran las 100 decisiones más recientes.</AlertDescription></Alert> : null}
                <p className="text-xs text-muted-foreground">El identificador del actor queda registrado; el nombre mostrado corresponde a su perfil actual.</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="grid gap-4 p-4 md:grid-cols-[minmax(0,1fr)_12rem_13rem_auto] md:items-end">
          <label className="grid gap-2 text-sm font-medium">
            Buscar
            <Input
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder="Nombre, correo, curso o código"
              maxLength={80}
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Estado
            <NativeSelect aria-label="Estado" value={status} onChange={(event) => updateStatus(event.target.value)}>
              <option value="all">Todos</option>
              <option value="new">Nueva consulta</option>
              <option value="pending_review">Pendiente de revisión</option>
              <option value="pending_registration">Inscripción pendiente</option>
              <option value="approved">Aprobada</option>
              <option value="rejected">Rechazada</option>
              <option value="archived">Archivada</option>
            </NativeSelect>
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Tipo
            <NativeSelect aria-label="Tipo" value={kind} onChange={(event) => updateKind(event.target.value)}>
              <option value="all">Todos</option>
              <option value="interest">Interés</option>
              <option value="application">Solicitud</option>
              <option value="registration_request">Inscripción solicitada</option>
            </NativeSelect>
          </label>
          <Button
            type="button"
            onClick={() => {
              setPage(1)
              setSearch(searchDraft.trim())
            }}
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            Buscar
          </Button>
        </CardContent>
      </Card>

      {loading ? <p className="py-10 text-center text-sm text-muted-foreground">Cargando solicitudes…</p> : null}
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>No se pudieron cargar las solicitudes</AlertDescription>
        </Alert>
      ) : null}
      {!loading && !error && data?.items.length === 0 ? (
        <EmptyState
          title="No hay solicitudes con estos filtros"
          description="Cuando una persona complete un formulario público compatible, aparecerá aquí para su revisión."
          icon={<CalendarDays className="h-5 w-5" />}
        />
      ) : null}

      {!loading && !error && data?.items.length ? (
        <>
          <div className="grid gap-4 md:hidden">
            {data.items.map((item) => (
              <SubmissionCard
                key={item.id}
                item={item}
                canReview={data.canReview}
                onDecision={selectDecision}
                onHistory={(item) => void loadHistory(item)}
              />
            ))}
          </div>
          <Card className="hidden overflow-hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Persona</TableHead>
                  <TableHead>Curso y convocatoria</TableHead>
                  <TableHead>Solicitud</TableHead>
                  <TableHead>Recibida</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <p className="font-medium">{item.firstName} {item.lastName}</p>
                      <a className="text-xs text-primary underline-offset-4 hover:underline" href={`mailto:${item.email}`}>{item.email}</a>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{item.courseName}</p>
                      <p className="text-xs text-muted-foreground">{item.courseRunCode}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{STATUS_LABELS[item.status]}</Badge>
                      <p className="mt-1 text-xs text-muted-foreground">{KIND_LABELS[item.kind]}</p>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(item.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <DecisionButtons item={item} canReview={data.canReview} onSelect={(status) => selectDecision(item, status)} />
                        {data.canReview ? (
                          <Button type="button" size="sm" variant="outline" onClick={() => void loadHistory(item)}>
                            <HistoryIcon className="h-4 w-4" aria-hidden="true" /> Historial
                          </Button>
                        ) : null}
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/cursos/convocatorias/${item.courseRunId}/oferta`}>Ver convocatoria</Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">Página {data.page} de {Math.max(data.totalPages, 1)}</p>
            <div className="flex gap-2">
              <Button type="button" variant="outline" disabled={data.page <= 1} onClick={() => setPage((current) => current - 1)}>Anterior</Button>
              <Button type="button" variant="outline" disabled={data.page >= data.totalPages} onClick={() => setPage((current) => current + 1)}>Siguiente</Button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
