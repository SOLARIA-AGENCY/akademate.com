'use client'

export const dynamic = 'force-dynamic'

import * as React from 'react'
import { useSearchParams } from 'next/navigation'
import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from 'date-fns'
import { es } from 'date-fns/locale'
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  Phone,
  Plus,
  RefreshCw,
  UserRound,
  XCircle,
} from 'lucide-react'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Input } from '@payload-config/components/ui/input'
import { Label } from '@payload-config/components/ui/label'
import { Textarea } from '@payload-config/components/ui/textarea'
import { Badge } from '@payload-config/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@payload-config/components/ui/dialog'

type ViewMode = 'month' | 'week' | 'day'

interface LeadOption {
  id: string | number
  first_name?: string | null
  last_name?: string | null
  email?: string | null
  phone?: string | null
}

interface UserOption {
  id: string | number
  name?: string | null
  email?: string | null
  role?: string | null
}

interface Appointment {
  id: number
  lead_id: number
  title: string
  appointment_type: string
  reason: string
  status: string
  starts_at: string
  ends_at: string
  duration_minutes: number
  notes?: string | null
  outcome_notes?: string | null
  lead?: LeadOption & { status?: string | null }
  assigned_to?: UserOption
  created_by?: UserOption
}

const TYPE_LABELS: Record<string, string> = {
  call: 'Llamada',
  whatsapp: 'WhatsApp',
  video: 'Videollamada',
  presential: 'Presencial',
  email_followup: 'Email',
}

const REASON_LABELS: Record<string, string> = {
  follow_up: 'Seguimiento',
  info_meeting: 'Reunión informativa',
  lead_recovery: 'Recuperación',
  send_information: 'Enviar información',
  enrollment_close: 'Cierre de matrícula',
  other: 'Otro',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  completed: 'Completada',
  no_show: 'No atendida',
  rescheduled: 'Reprogramada',
  cancelled: 'Cancelada',
}

const STATUS_CLASS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
  completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  no_show: 'bg-orange-100 text-orange-800 border-orange-200',
  rescheduled: 'bg-violet-100 text-violet-800 border-violet-200',
  cancelled: 'bg-slate-100 text-slate-700 border-slate-200',
}

function leadName(lead?: LeadOption | null) {
  if (!lead) return 'Lead sin datos'
  return [lead.first_name, lead.last_name].filter(Boolean).join(' ').trim() || lead.email || lead.phone || `Lead #${lead.id}`
}

function userName(user?: UserOption | null) {
  return user?.name || user?.email || 'Sin asesor'
}

function toDateTimeLocal(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function rangeForView(viewMode: ViewMode, cursor: Date) {
  if (viewMode === 'month') {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 })
    const end = addDays(endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 }), 1)
    return { from: start, to: end }
  }
  if (viewMode === 'week') {
    const start = startOfWeek(cursor, { weekStartsOn: 1 })
    return { from: start, to: addDays(start, 7) }
  }
  const start = startOfDay(cursor)
  return { from: start, to: addDays(start, 1) }
}

function AppointmentDialog({
  open,
  onOpenChange,
  leads,
  users,
  selectedDate,
  appointment,
  preselectedLeadId,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  leads: LeadOption[]
  users: UserOption[]
  selectedDate: Date
  appointment: Appointment | null
  preselectedLeadId?: string | null
  onSaved: () => void
}) {
  const defaultStart = React.useMemo(() => {
    const date = new Date(selectedDate)
    date.setHours(10, 0, 0, 0)
    return date
  }, [selectedDate])
  const [leadQuery, setLeadQuery] = React.useState('')
  const [leadId, setLeadId] = React.useState('')
  const [startsAt, setStartsAt] = React.useState(toDateTimeLocal(defaultStart))
  const [duration, setDuration] = React.useState('30')
  const [type, setType] = React.useState('call')
  const [reason, setReason] = React.useState('follow_up')
  const [status, setStatus] = React.useState('pending')
  const [assignedTo, setAssignedTo] = React.useState('')
  const [notes, setNotes] = React.useState('')
  const [outcomeNotes, setOutcomeNotes] = React.useState('')
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!open) return
    if (appointment) {
      setLeadId(String(appointment.lead_id))
      setStartsAt(toDateTimeLocal(new Date(appointment.starts_at)))
      setDuration(String(appointment.duration_minutes || 30))
      setType(appointment.appointment_type || 'call')
      setReason(appointment.reason || 'follow_up')
      setStatus(appointment.status || 'pending')
      setAssignedTo(String(appointment.assigned_to?.id || ''))
      setNotes(appointment.notes || '')
      setOutcomeNotes(appointment.outcome_notes || '')
      setLeadQuery('')
      setError(null)
      return
    }
    setLeadId(preselectedLeadId || '')
    setStartsAt(toDateTimeLocal(defaultStart))
    setDuration('30')
    setType('call')
    setReason('follow_up')
    setStatus('pending')
    setAssignedTo(users[0]?.id ? String(users[0].id) : '')
    setNotes('')
    setOutcomeNotes('')
    setLeadQuery('')
    setError(null)
  }, [appointment, defaultStart, open, preselectedLeadId, users])

  const filteredLeads = React.useMemo(() => {
    const q = leadQuery.trim().toLowerCase()
    if (!q) return leads.slice(0, 60)
    return leads.filter((lead) => `${leadName(lead)} ${lead.email || ''} ${lead.phone || ''}`.toLowerCase().includes(q)).slice(0, 60)
  }, [leadQuery, leads])

  async function save() {
    setSaving(true)
    setError(null)
    try {
      const payload = {
        lead_id: Number(leadId),
        starts_at: new Date(startsAt).toISOString(),
        duration_minutes: Number(duration),
        appointment_type: type,
        reason,
        status,
        assigned_to_user_id: assignedTo ? Number(assignedTo) : undefined,
        notes,
        outcome_notes: outcomeNotes,
      }
      const response = await fetch(appointment ? `/api/lead-appointments/${appointment.id}` : '/api/lead-appointments', {
        method: appointment ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data?.error || 'No se pudo guardar la cita')
      }
      onOpenChange(false)
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error guardando cita')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{appointment ? 'Editar cita' : 'Nueva cita'}</DialogTitle>
          <DialogDescription>Agenda llamadas, reuniones o seguimientos asociados a un lead.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2 md:grid-cols-2">
          <div className="md:col-span-2 space-y-2">
            <Label>Lead</Label>
            <Input value={leadQuery} onChange={(event) => setLeadQuery(event.target.value)} placeholder="Buscar por nombre, email o teléfono" />
            <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={leadId} onChange={(event) => setLeadId(event.target.value)} disabled={Boolean(appointment)}>
              <option value="">Selecciona un lead</option>
              {filteredLeads.map((lead) => (
                <option key={lead.id} value={lead.id}>{leadName(lead)} · {lead.email || lead.phone || 'sin contacto'}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Fecha y hora</Label>
            <Input type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Duración</Label>
            <Input type="number" min={5} max={480} value={duration} onChange={(event) => setDuration(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Tipo</Label>
            <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={type} onChange={(event) => setType(event.target.value)}>
              {Object.entries(TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Motivo</Label>
            <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={reason} onChange={(event) => setReason(event.target.value)}>
              {Object.entries(REASON_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Estado</Label>
            <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={status} onChange={(event) => setStatus(event.target.value)}>
              {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Asesor asignado</Label>
            <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={assignedTo} onChange={(event) => setAssignedTo(event.target.value)}>
              {users.map((user) => <option key={user.id} value={user.id}>{userName(user)}</option>)}
            </select>
          </div>
          <div className="md:col-span-2 space-y-2">
            <Label>Notas</Label>
            <Textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Motivo, contexto y puntos a tratar" />
          </div>
          <div className="md:col-span-2 space-y-2">
            <Label>Resultado</Label>
            <Textarea rows={2} value={outcomeNotes} onChange={(event) => setOutcomeNotes(event.target.value)} placeholder="Resumen posterior a la llamada o reunión" />
          </div>
          {error && <p className="md:col-span-2 text-sm font-medium text-red-600">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={save} disabled={saving || !leadId || !startsAt} className="bg-red-600 text-white hover:bg-red-700">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Guardar cita
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function LeadAppointmentsPage() {
  const searchParams = useSearchParams()
  const preselectedLeadId = searchParams.get('leadId')
  const [viewMode, setViewMode] = React.useState<ViewMode>('month')
  const [cursor, setCursor] = React.useState(new Date())
  const [selectedDate, setSelectedDate] = React.useState(new Date())
  const [appointments, setAppointments] = React.useState<Appointment[]>([])
  const [users, setUsers] = React.useState<UserOption[]>([])
  const [leads, setLeads] = React.useState<LeadOption[]>([])
  const [selectedAppointment, setSelectedAppointment] = React.useState<Appointment | null>(null)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const range = React.useMemo(() => rangeForView(viewMode, cursor), [cursor, viewMode])

  const loadAppointments = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        from: range.from.toISOString(),
        to: range.to.toISOString(),
        includeUsers: '1',
      })
      const response = await fetch(`/api/lead-appointments?${params.toString()}`, { cache: 'no-store' })
      if (!response.ok) throw new Error('No se pudo cargar el calendario')
      const data = await response.json()
      setAppointments(data.appointments ?? [])
      setUsers(data.users ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando calendario')
    } finally {
      setLoading(false)
    }
  }, [range.from, range.to])

  React.useEffect(() => {
    void loadAppointments()
  }, [loadAppointments])

  React.useEffect(() => {
    const loadLeads = async () => {
      try {
        const response = await fetch('/api/leads?limit=500', { cache: 'no-store' })
        if (!response.ok) return
        const data = await response.json()
        setLeads(data.docs ?? data.leads ?? [])
      } catch {
        setLeads([])
      }
    }
    void loadLeads()
  }, [])

  React.useEffect(() => {
    if (preselectedLeadId && leads.length > 0) {
      setDialogOpen(true)
    }
  }, [leads.length, preselectedLeadId])

  const selectedDayAppointments = React.useMemo(
    () => appointments.filter((appointment) => isSameDay(new Date(appointment.starts_at), selectedDate)),
    [appointments, selectedDate],
  )
  const todayCount = appointments.filter((appointment) => isSameDay(new Date(appointment.starts_at), new Date())).length
  const pendingCount = appointments.filter((appointment) => appointment.status === 'pending').length
  const confirmedCount = appointments.filter((appointment) => appointment.status === 'confirmed').length
  const overdueCount = appointments.filter((appointment) => ['pending', 'confirmed'].includes(appointment.status) && new Date(appointment.starts_at).getTime() < Date.now()).length

  const days = React.useMemo(() => {
    if (viewMode === 'month') return eachDayOfInterval({ start: range.from, end: addDays(range.to, -1) })
    if (viewMode === 'week') return eachDayOfInterval({ start: range.from, end: addDays(range.to, -1) })
    return [cursor]
  }, [cursor, range.from, range.to, viewMode])

  function move(direction: -1 | 1) {
    if (viewMode === 'month') setCursor((date) => direction > 0 ? addMonths(date, 1) : subMonths(date, 1))
    else if (viewMode === 'week') setCursor((date) => direction > 0 ? addWeeks(date, 1) : subWeeks(date, 1))
    else setCursor((date) => addDays(date, direction))
  }

  async function updateStatus(appointment: Appointment, status: string) {
    await fetch(`/api/lead-appointments/${appointment.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    await loadAppointments()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendario citas"
        description="Agenda comercial de llamadas, reuniones y seguimientos asociados a leads."
        actions={(
          <Button className="bg-red-600 text-white hover:bg-red-700" onClick={() => { setSelectedAppointment(null); setDialogOpen(true) }}>
            <Plus className="h-4 w-4" />
            Nueva cita
          </Button>
        )}
      />

      <div className="grid gap-4 md:grid-cols-4">
        {[['Citas hoy', todayCount, CalendarDays], ['Pendientes', pendingCount, Clock], ['Confirmadas', confirmedCount, CheckCircle2], ['Vencidas', overdueCount, XCircle]].map(([label, value, Icon]) => (
          <Card key={String(label)}>
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-muted-foreground">{String(label)}</p>
                <p className="text-3xl font-bold">{String(value)}</p>
              </div>
              {React.createElement(Icon as any, { className: 'h-6 w-6 text-red-600' })}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div>
              <CardTitle className="capitalize">{format(cursor, viewMode === 'month' ? 'MMMM yyyy' : "d 'de' MMMM yyyy", { locale: es })}</CardTitle>
              <p className="text-sm text-muted-foreground">Vista {viewMode === 'month' ? 'mensual' : viewMode === 'week' ? 'semanal' : 'diaria'}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => move(-1)}><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="outline" onClick={() => { setCursor(new Date()); setSelectedDate(new Date()) }}>Hoy</Button>
              <Button variant="outline" size="icon" onClick={() => move(1)}><ChevronRight className="h-4 w-4" /></Button>
              {(['month', 'week', 'day'] as ViewMode[]).map((mode) => (
                <Button key={mode} variant={viewMode === mode ? 'default' : 'outline'} onClick={() => setViewMode(mode)}>
                  {mode === 'month' ? 'Mes' : mode === 'week' ? 'Semana' : 'Día'}
                </Button>
              ))}
              <Button variant="outline" size="icon" onClick={() => void loadAppointments()}><RefreshCw className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            {error && <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
            {loading ? (
              <div className="flex h-80 items-center justify-center text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Cargando calendario</div>
            ) : viewMode === 'day' ? (
              <div className="space-y-2">
                {Array.from({ length: 14 }, (_, index) => index + 8).map((hour) => {
                  const hourAppointments = appointments.filter((appointment) => isSameDay(new Date(appointment.starts_at), cursor) && new Date(appointment.starts_at).getHours() === hour)
                  return (
                    <div key={hour} className="grid min-h-20 grid-cols-[70px_1fr] rounded-lg border">
                      <div className="border-r p-3 text-sm font-semibold text-muted-foreground">{String(hour).padStart(2, '0')}:00</div>
                      <div className="space-y-2 p-3">
                        {hourAppointments.map((appointment) => <AppointmentPill key={appointment.id} appointment={appointment} onClick={() => setSelectedAppointment(appointment)} />)}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : viewMode === 'week' ? (
              <div className="overflow-x-auto">
                <div className="min-w-[920px]">
                  <div className="grid grid-cols-[74px_repeat(7,minmax(112px,1fr))] border-b">
                    <div className="p-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Hora</div>
                    {days.map((day) => (
                      <button
                        key={day.toISOString()}
                        type="button"
                        onClick={() => setSelectedDate(day)}
                        className={`border-l p-2 text-left ${isSameDay(day, selectedDate) ? 'bg-red-50 text-red-700' : ''}`}
                      >
                        <span className="block text-xs font-semibold uppercase">{format(day, 'EEE', { locale: es })}</span>
                        <span className="block text-lg font-bold">{format(day, 'd', { locale: es })}</span>
                      </button>
                    ))}
                  </div>
                  <div className="rounded-b-xl border border-t-0">
                    {Array.from({ length: 14 }, (_, index) => index + 8).map((hour) => (
                      <div key={hour} className="grid min-h-24 grid-cols-[74px_repeat(7,minmax(112px,1fr))] border-t first:border-t-0">
                        <div className="border-r bg-muted/30 p-2 text-xs font-semibold text-muted-foreground">
                          {String(hour).padStart(2, '0')}:00
                        </div>
                        {days.map((day) => {
                          const hourAppointments = appointments.filter((appointment) => {
                            const start = new Date(appointment.starts_at)
                            return isSameDay(start, day) && start.getHours() === hour
                          })
                          return (
                            <button
                              key={`${day.toISOString()}-${hour}`}
                              type="button"
                              onClick={() => setSelectedDate(day)}
                              className={`space-y-1 border-r p-2 text-left last:border-r-0 ${isSameDay(day, selectedDate) ? 'bg-red-50/40' : 'hover:bg-muted/40'}`}
                            >
                              {hourAppointments.map((appointment) => (
                                <AppointmentPill
                                  key={appointment.id}
                                  appointment={appointment}
                                  compact
                                  onClick={(event) => { event.stopPropagation(); setSelectedAppointment(appointment); setSelectedDate(day) }}
                                />
                              ))}
                            </button>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-2">
                {days.map((day) => {
                  const dayAppointments = appointments.filter((appointment) => isSameDay(new Date(appointment.starts_at), day))
                  const active = isSameDay(day, selectedDate)
                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      onClick={() => setSelectedDate(day)}
                      className={`min-h-32 rounded-xl border p-3 text-left transition-colors ${active ? 'border-red-500 bg-red-50' : 'hover:border-red-200'} ${viewMode === 'month' && !isSameMonth(day, cursor) ? 'opacity-40' : ''}`}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-bold">{format(day, 'd', { locale: es })}</span>
                        {dayAppointments.length > 0 && <Badge className="bg-red-600 text-white">{dayAppointments.length}</Badge>}
                      </div>
                      <div className="space-y-1">
                        {dayAppointments.slice(0, 3).map((appointment) => (
                          <AppointmentPill key={appointment.id} appointment={appointment} compact onClick={(event) => { event.stopPropagation(); setSelectedAppointment(appointment) }} />
                        ))}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <aside className="space-y-4">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>{format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}</CardTitle>
              <p className="text-sm text-muted-foreground">{selectedDayAppointments.length} citas programadas</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedDayAppointments.length === 0 && <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">No hay citas para el día seleccionado.</p>}
              {selectedDayAppointments.map((appointment) => (
                <button key={appointment.id} className="w-full rounded-xl border p-3 text-left hover:border-red-300" onClick={() => setSelectedAppointment(appointment)}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">{format(new Date(appointment.starts_at), 'HH:mm')} · {appointment.title}</span>
                    <Badge className={STATUS_CLASS[appointment.status]}>{STATUS_LABELS[appointment.status] || appointment.status}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{leadName(appointment.lead)} · {userName(appointment.assigned_to)}</p>
                </button>
              ))}
              {selectedAppointment && (
                <div className="rounded-xl border bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-red-600">Detalle</p>
                  <h3 className="mt-1 font-bold">{selectedAppointment.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{TYPE_LABELS[selectedAppointment.appointment_type]} · {REASON_LABELS[selectedAppointment.reason]}</p>
                  <p className="mt-1 text-sm"><UserRound className="mr-1 inline h-4 w-4" />{leadName(selectedAppointment.lead)}</p>
                  {selectedAppointment.lead?.phone && <p className="text-sm"><Phone className="mr-1 inline h-4 w-4" />{selectedAppointment.lead.phone}</p>}
                  {selectedAppointment.notes && <p className="mt-3 rounded-md bg-white p-3 text-sm">{selectedAppointment.notes}</p>}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => { setDialogOpen(true) }}>Editar</Button>
                    <Button size="sm" variant="outline" onClick={() => void updateStatus(selectedAppointment, 'completed')}>Completar</Button>
                    <Button size="sm" variant="outline" onClick={() => void updateStatus(selectedAppointment, 'no_show')}>No atendida</Button>
                    <Button size="sm" variant="outline" className="text-red-600" onClick={() => void updateStatus(selectedAppointment, 'cancelled')}>Cancelar</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>

      <AppointmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        leads={leads}
        users={users}
        selectedDate={selectedDate}
        appointment={selectedAppointment}
        preselectedLeadId={preselectedLeadId}
        onSaved={() => { setSelectedAppointment(null); void loadAppointments() }}
      />
    </div>
  )
}

function AppointmentPill({
  appointment,
  compact = false,
  onClick,
}: {
  appointment: Appointment
  compact?: boolean
  onClick: React.MouseEventHandler<HTMLDivElement>
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      className={`rounded-md border border-red-100 bg-white px-2 py-1 text-xs shadow-sm hover:border-red-300 ${compact ? 'truncate' : ''}`}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') onClick(event as any)
      }}
    >
      <span className="font-bold text-red-700">{format(new Date(appointment.starts_at), 'HH:mm')}</span>
      <span className="ml-1 font-medium">{appointment.title}</span>
    </div>
  )
}
