'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@payload-config/components/ui/alert'
import { Badge } from '@payload-config/components/ui/badge'
import { Button } from '@payload-config/components/ui/button'
import { EmptyState } from '@payload-config/components/ui/EmptyState'
import { Input } from '@payload-config/components/ui/input'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@payload-config/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@payload-config/components/ui/table'
import { AlertCircle, ClipboardList } from 'lucide-react'

type AccessKind = 'fisico' | 'virtual' | 'hibrido'

interface AccessEvent {
  id: string
  personName: string
  campusName: string
  kind: AccessKind
  pass: string
  channel: string
  direction: 'in' | 'out'
  at: string
  note: string
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return null
}

export default function HistoricoAccesosPage() {
  const [events, setEvents] = useState<AccessEvent[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [kind, setKind] = useState<string>('todos')
  const [campus, setCampus] = useState('todas')
  const [query, setQuery] = useState('')

  const loadEvents = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (kind !== 'todos') params.set('kind', kind)
      if (query.trim()) params.set('q', query.trim())
      const response = await fetch(`/api/accesos?${params.toString()}`, {
        credentials: 'include',
        cache: 'no-store',
      })
      if (!response.ok) throw new Error('No se pudo cargar el histórico')
      const payload = await response.json()
      const root = asRecord(payload)
      const rows = Array.isArray(root?.data) ? root.data : []
      setEvents(rows.map((item) => item as AccessEvent))
    } catch (err) {
      setEvents([])
      setError(err instanceof Error ? err.message : 'No se pudo cargar el histórico')
    } finally {
      setLoading(false)
    }
  }, [kind, query])

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void loadEvents()
    }, 200)
    return () => window.clearTimeout(handle)
  }, [loadEvents])

  const campuses = useMemo(
    () => Array.from(new Set(events.map((event) => event.campusName).filter(Boolean))).sort(),
    [events],
  )

  const filtered = events.filter((event) => campus === 'todas' || event.campusName === campus)

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title="Histórico de accesos"
        description="Entradas y salidas por tipo de sede, con filtros y tabla truncada."
        icon={ClipboardList}
      />

      {error ? (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>No se pudo cargar el histórico</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-3">
            <span>{error}</span>
            <Button size="sm" variant="outline" onClick={() => void loadEvents()}>
              Reintentar
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="flex min-w-0 flex-wrap gap-2">
        <Input
          className="min-w-0 flex-1"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar persona, sede o nota"
        />
        <Select value={kind} onValueChange={setKind}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="fisico">Físico</SelectItem>
            <SelectItem value="virtual">Virtual</SelectItem>
            <SelectItem value="hibrido">Híbrido</SelectItem>
          </SelectContent>
        </Select>
        <Select value={campus} onValueChange={setCampus}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Sede" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas las sedes</SelectItem>
            {campuses.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando histórico...</p>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Sin eventos"
          description="No hay accesos registrados con los filtros actuales."
        />
      ) : (
        <div className="min-w-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Persona</TableHead>
                <TableHead>Sede</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Pase</TableHead>
                <TableHead>Dirección</TableHead>
                <TableHead>Nota</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="whitespace-nowrap">{new Date(event.at).toLocaleString('es-ES')}</TableCell>
                  <TableCell className="max-w-[180px] truncate font-medium">{event.personName}</TableCell>
                  <TableCell className="max-w-[140px] truncate">{event.campusName || '-'}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{event.kind}</Badge>
                  </TableCell>
                  <TableCell>{event.pass}</TableCell>
                  <TableCell>{event.direction === 'in' ? 'Entrada' : 'Salida'}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-muted-foreground">{event.note || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
