'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@payload-config/components/ui/alert'
import { Badge } from '@payload-config/components/ui/badge'
import { Button } from '@payload-config/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
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
import { useToast } from '@payload-config/hooks/use-toast'
import { AlertCircle, Camera, LogIn, LogOut, ScanLine } from 'lucide-react'
import { mapLeadToPerson } from '../matriculas/wizard/steps'
import type { EnrollmentPerson } from '../matriculas/wizard/types'

type AccessKind = 'fisico' | 'virtual' | 'hibrido'
type AccessPass = 'credential' | 'temporary' | 'visitor' | 'magic_link'
type AccessDirection = 'in' | 'out'

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return null
}

export default function RecepcionAccesosPage() {
  const { toast } = useToast()
  const [query, setQuery] = useState('')
  const [people, setPeople] = useState<EnrollmentPerson[]>([])
  const [selected, setSelected] = useState<EnrollmentPerson | null>(null)
  const [kind, setKind] = useState<AccessKind>('fisico')
  const [pass, setPass] = useState<AccessPass>('credential')
  const [campusName, setCampusName] = useState('')
  const [note, setNote] = useState('')
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [photo, setPhoto] = useState<string | null>(null)
  const [loadingPeople, setLoadingPeople] = useState(false)
  const [peopleError, setPeopleError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const loadPeople = useCallback(async (value: string) => {
    setLoadingPeople(true)
    setPeopleError(null)
    try {
      const params = new URLSearchParams({ limit: '20' })
      if (value.trim()) params.set('q', value.trim())
      const response = await fetch(`/api/leads?${params.toString()}`, {
        credentials: 'include',
        cache: 'no-store',
      })
      if (!response.ok) throw new Error('No se pudieron buscar personas')
      const payload = await response.json()
      const root = asRecord(payload)
      const docs = Array.isArray(root?.docs) ? root.docs : []
      setPeople(docs.map((item) => mapLeadToPerson(asRecord(item) ?? {})))
    } catch (error) {
      setPeople([])
      setPeopleError(error instanceof Error ? error.message : 'No se pudieron buscar personas')
    } finally {
      setLoadingPeople(false)
    }
  }, [])

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void loadPeople(query)
    }, 250)
    return () => window.clearTimeout(handle)
  }, [loadPeople, query])

  const capturePhoto = useCallback(async () => {
    setCameraError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      const video = document.createElement('video')
      video.srcObject = stream
      video.muted = true
      await video.play()
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth || 640
      canvas.height = video.videoHeight || 480
      canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height)
      setPhoto(canvas.toDataURL('image/jpeg'))
      stream.getTracks().forEach((track) => track.stop())
    } catch {
      setCameraError('No se pudo conectar la webcam. Usa un pase temporal.')
      setPass('temporary')
    }
  }, [])

  const personName = useMemo(() => {
    if (!selected) return ''
    return `${selected.firstName} ${selected.lastName}`.trim() || selected.email
  }, [selected])

  const register = useCallback(
    async (direction: AccessDirection) => {
      if (!personName) return
      setSubmitting(true)
      try {
        const response = await fetch('/api/accesos', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            personName,
            personId: selected?.id ?? null,
            campusName,
            kind,
            pass,
            channel: photo ? 'webcam' : pass === 'credential' ? 'qr' : 'manual',
            direction,
            note,
          }),
        })
        const payload = asRecord(await response.json().catch(() => ({})))
        if (!response.ok) {
          throw new Error(String(payload?.error ?? 'No se pudo registrar el acceso'))
        }
        toast({
          title: direction === 'in' ? 'Entrada registrada' : 'Salida registrada',
          description: personName,
        })
      } catch (error) {
        toast({
          title: 'No se pudo registrar el acceso',
          description: error instanceof Error ? error.message : 'Error desconocido',
          variant: 'destructive',
        })
      } finally {
        setSubmitting(false)
      }
    },
    [campusName, kind, note, pass, personName, photo, selected?.id, toast],
  )

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title="Recepción"
        description="Identifica a la persona y registra entrada o salida."
        icon={ScanLine}
      />

      {peopleError ? (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>No se pudo buscar</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-3">
            <span>{peopleError}</span>
            <Button size="sm" variant="outline" onClick={() => void loadPeople(query)}>
              Reintentar
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      {cameraError ? (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>Webcam no disponible</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-3">
            <span>{cameraError}</span>
            <Button size="sm" variant="outline" onClick={() => void capturePhoto()}>
              Reintentar
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Persona</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nombre, email o teléfono"
            />
            <div className="max-h-72 min-w-0 space-y-1 overflow-y-auto">
              {loadingPeople ? (
                <p className="text-sm text-muted-foreground">Buscando...</p>
              ) : (
                people.map((person) => {
                  const name = `${person.firstName} ${person.lastName}`.trim() || person.email
                  const active = selected?.id === person.id
                  return (
                    <button
                      key={person.id ?? name}
                      type="button"
                      onClick={() => setSelected(person)}
                      className={`flex w-full min-w-0 items-center justify-between rounded-md border px-3 py-2 text-left text-sm ${
                        active ? 'border-primary bg-primary/5' : 'bg-card'
                      }`}
                    >
                      <span className="min-w-0 truncate font-medium">{name}</span>
                      <span className="truncate text-xs text-muted-foreground">{person.email}</span>
                    </button>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Registro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label>Tipo de acceso</Label>
              <Select value={kind} onValueChange={(value) => setKind(value as AccessKind)}>
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
            <div className="space-y-1">
              <Label htmlFor="campus">Sede</Label>
              <Input id="campus" value={campusName} onChange={(event) => setCampusName(event.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="note">Nota</Label>
              <Input id="note" value={note} onChange={(event) => setNote(event.target.value)} />
            </div>
            {photo ? (
              <img src={photo} alt="Foto de recepción" className="h-24 rounded-md object-cover" />
            ) : (
              <Button variant="outline" onClick={() => void capturePhoto()}>
                <Camera className="h-4 w-4" />
                Webcam
              </Button>
            )}
            {kind === 'hibrido' ? (
              <Badge variant="outline">Híbrido: credencial física y envío virtual</Badge>
            ) : null}
            <div className="flex gap-2">
              <Button className="flex-1" disabled={!personName || submitting} onClick={() => void register('in')}>
                <LogIn className="h-4 w-4" />
                Entrada
              </Button>
              <Button
                className="flex-1"
                variant="outline"
                disabled={!personName || submitting}
                onClick={() => void register('out')}
              >
                <LogOut className="h-4 w-4" />
                Salida
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
