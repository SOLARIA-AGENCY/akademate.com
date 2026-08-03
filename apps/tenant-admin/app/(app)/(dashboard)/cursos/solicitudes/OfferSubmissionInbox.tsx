'use client'

import * as React from 'react'
import Link from 'next/link'
import { CalendarDays, Inbox, Search, UsersRound } from 'lucide-react'
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
} from '@akademate/ui'

type InboxItem = {
  id: number
  courseRunId: number
  courseName: string
  courseRunCode: string
  kind: 'interest' | 'application' | 'registration_request'
  status: 'new' | 'pending_review' | 'pending_registration'
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
  page: number
  pageSize: number
  total: number
  totalPages: number
}

const STATUS_LABELS: Record<InboxItem['status'], string> = {
  new: 'Nueva consulta',
  pending_review: 'Pendiente de revisión',
  pending_registration: 'Inscripción pendiente',
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

function SubmissionCard({ item }: { item: InboxItem }) {
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
          <Button asChild size="sm" variant="outline">
            <Link href={`/cursos/convocatorias/${item.courseRunId}/oferta`}>Ver convocatoria</Link>
          </Button>
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
  }, [kind, page, search, status])

  function updateStatus(value: string) {
    setPage(1)
    setStatus(value)
  }

  function updateKind(value: string) {
    setPage(1)
    setKind(value)
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <MetricCard label="Solicitudes encontradas" value={data?.total ?? '—'} hint="Según los filtros activos" icon={<UsersRound className="h-5 w-5" />} />
        <MetricCard label="Estado operativo" value="Pendientes" hint="Una solicitud todavía no confirma matrícula ni plaza" icon={<Inbox className="h-5 w-5" />} />
      </div>

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
            {data.items.map((item) => <SubmissionCard key={item.id} item={item} />)}
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
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/cursos/convocatorias/${item.courseRunId}/oferta`}>Ver convocatoria</Link>
                      </Button>
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
