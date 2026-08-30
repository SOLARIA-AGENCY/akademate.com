'use client'

import { useCallback, useEffect, useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@payload-config/components/ui/alert'
import { Badge } from '@payload-config/components/ui/badge'
import { Button } from '@payload-config/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@payload-config/components/ui/table'
import { useToast } from '@payload-config/hooks/use-toast'
import { AlertCircle, IdCard, Mail, QrCode, Smartphone, UserRound } from 'lucide-react'

type AccessKind = 'fisico' | 'virtual' | 'hibrido'
type AccessPass = 'credential' | 'temporary' | 'visitor' | 'magic_link'

interface AccessEvent {
  id: string
  personName: string
  campusName: string
  kind: AccessKind
  pass: AccessPass
  channel: string
  at: string
  note: string
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return null
}

function passLabel(pass: AccessPass): string {
  switch (pass) {
    case 'credential':
      return 'Credencial QR'
    case 'temporary':
      return 'Temporal'
    case 'visitor':
      return 'Visitante'
    case 'magic_link':
      return 'Magic link'
    default: {
      const _exhaustive: never = pass
      return _exhaustive
    }
  }
}

export default function PasesAccesosPage() {
  const { toast } = useToast()
  const [events, setEvents] = useState<AccessEvent[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [personName, setPersonName] = useState('')
  const [kind, setKind] = useState<AccessKind>('fisico')
  const [pass, setPass] = useState<AccessPass>('credential')
  const [channel, setChannel] = useState<'email' | 'sms' | 'qr' | 'manual'>('qr')
  const [campusName, setCampusName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadEvents = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/accesos', { credentials: 'include', cache: 'no-store' })
      if (!response.ok) throw new Error('No se pudieron cargar los pases')
      const payload = await response.json()
      const root = asRecord(payload)
      const rows = Array.isArray(root?.data) ? root.data : []
      setEvents(rows.map((item) => item as AccessEvent))
    } catch (err) {
      setEvents([])
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los pases')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadEvents()
  }, [loadEvents])

  const createPass = useCallback(async () => {
    if (!personName.trim()) return
    setSubmitting(true)
    try {
      const response = await fetch('/api/accesos', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personName: personName.trim(),
          campusName,
          kind,
          pass,
          channel: kind === 'virtual' ? channel : pass === 'credential' ? 'qr' : channel,
          direction: 'in',
          note: `Pase ${passLabel(pass)}`,
        }),
      })
      const payload = asRecord(await response.json().catch(() => ({})))
      if (!response.ok) {
        throw new Error(String(payload?.error ?? 'No se pudo emitir el pase'))
      }
      toast({ title: 'Pase emitido', description: personName })
      setPersonName('')
      await loadEvents()
    } catch (err) {
      toast({
        title: 'No se pudo emitir el pase',
        description: err instanceof Error ? err.message : 'Error desconocido',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }, [campusName, channel, kind, loadEvents, pass, personName, toast])

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title="Pases"
        description="Credencial QR, temporal, visitante y magic link por email o SMS."
        icon={IdCard}
      />

      {error ? (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>No se pudieron cargar los pases</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-3">
            <span>{error}</span>
            <Button size="sm" variant="outline" onClick={() => void loadEvents()}>
              Reintentar
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Emitir pase</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="person">Persona</Label>
            <Input
              id="person"
              value={personName}
              onChange={(event) => setPersonName(event.target.value)}
              placeholder="Nombre y apellidos"
            />
          </div>
          <div className="space-y-1">
            <Label>Tipo</Label>
            <Select
              value={kind}
              onValueChange={(value) => {
                const next = value as AccessKind
                setKind(next)
                if (next === 'virtual') {
                  setPass('magic_link')
                  setChannel('email')
                } else if (pass === 'magic_link') {
                  setPass('credential')
                  setChannel('qr')
                }
              }}
            >
              <SelectTrigger className="w-full">
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
            <Label>Pase</Label>
            <Select value={pass} onValueChange={(value) => setPass(value as AccessPass)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="credential">Credencial QR</SelectItem>
                <SelectItem value="temporary">Temporal</SelectItem>
                <SelectItem value="visitor">Visitante</SelectItem>
                <SelectItem value="magic_link">Magic link</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="campus">Sede</Label>
            <Input id="campus" value={campusName} onChange={(event) => setCampusName(event.target.value)} />
          </div>
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <Button
              variant={channel === 'qr' ? 'default' : 'outline'}
              onClick={() => {
                setPass('credential')
                setChannel('qr')
              }}
            >
              <QrCode className="h-4 w-4" />
              Credencial QR
            </Button>
            <Button variant={pass === 'temporary' ? 'default' : 'outline'} onClick={() => setPass('temporary')}>
              Temporal
            </Button>
            <Button variant={pass === 'visitor' ? 'default' : 'outline'} onClick={() => setPass('visitor')}>
              <UserRound className="h-4 w-4" />
              Visitante
            </Button>
            <Button
              variant={channel === 'email' ? 'default' : 'outline'}
              onClick={() => {
                setPass('magic_link')
                setChannel('email')
                setKind((current) => (current === 'fisico' ? 'virtual' : current))
              }}
            >
              <Mail className="h-4 w-4" />
              Magic link email
            </Button>
            <Button
              variant={channel === 'sms' ? 'default' : 'outline'}
              onClick={() => {
                setPass('magic_link')
                setChannel('sms')
                setKind((current) => (current === 'fisico' ? 'virtual' : current))
              }}
            >
              <Smartphone className="h-4 w-4" />
              Magic link SMS
            </Button>
          </div>
          {kind === 'hibrido' ? (
            <p className="text-sm text-muted-foreground sm:col-span-2">
              En híbrido se puede emitir credencial física y magic link para la misma persona.
            </p>
          ) : null}
          <Button className="sm:col-span-2" disabled={!personName.trim() || submitting} onClick={() => void createPass()}>
            Emitir pase
          </Button>
        </CardContent>
      </Card>

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando pases...</p>
      ) : events.length === 0 ? (
        <EmptyState
          icon={IdCard}
          title="Sin pases emitidos"
          description="Todavía no hay credenciales ni pases temporales en este centro."
        />
      ) : (
        <div className="min-w-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Persona</TableHead>
                <TableHead>Pase</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Canal</TableHead>
                <TableHead>Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="font-medium">{event.personName}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{passLabel(event.pass)}</Badge>
                  </TableCell>
                  <TableCell>{event.kind}</TableCell>
                  <TableCell>{event.channel}</TableCell>
                  <TableCell>{new Date(event.at).toLocaleString('es-ES')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
