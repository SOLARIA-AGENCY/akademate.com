'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Badge } from '@payload-config/components/ui/badge'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import {
  ArrowLeft, Calendar, MapPin, Users, GraduationCap, DollarSign,
  ExternalLink, Loader2, Clock, UserPlus, BookOpen, ChevronRight, Plus,
  Download, FileText, Pencil, Save, AlertCircle,
} from 'lucide-react'

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  draft: { label: 'Borrador', variant: 'secondary' },
  published: { label: 'Publicada', variant: 'outline' },
  enrollment_open: { label: 'Inscripcion abierta', variant: 'default' },
  in_progress: { label: 'En curso', variant: 'default' },
  completed: { label: 'Finalizada', variant: 'secondary' },
  cancelled: { label: 'Cancelada', variant: 'destructive' },
}

function formatCurrency(v: number | undefined): string {
  if (v == null) return '-'
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(v)
}

function resolveImageUrl(image: any): string | null {
  if (!image) return null
  if (typeof image === 'object' && image.url) return image.url
  if (typeof image === 'object' && image.filename) return `/api/media/file/${image.filename}`
  if (typeof image === 'string') return image
  return null
}

function getInstructorName(instructor: any): string {
  return instructor?.full_name || `${instructor?.first_name || ''} ${instructor?.last_name || ''}`.trim() || 'Docente asignado'
}

function formatDayLabel(day: string): string {
  const labels: Record<string, string> = {
    monday: 'LUN',
    tuesday: 'MAR',
    wednesday: 'MIE',
    thursday: 'JUE',
    friday: 'VIE',
    saturday: 'SAB',
    sunday: 'DOM',
  }
  return labels[day] ?? day.toUpperCase()
}

function formatRunSchedule(conv: any): string {
  const days = Array.isArray(conv.schedule_days) ? conv.schedule_days.map(formatDayLabel).join(', ') : ''
  const start = typeof conv.schedule_time_start === 'string' ? conv.schedule_time_start.slice(0, 5) : ''
  const end = typeof conv.schedule_time_end === 'string' ? conv.schedule_time_end.slice(0, 5) : ''
  const time = start && end ? `${start}-${end}` : start || end
  return [days, time].filter(Boolean).join(' · ') || 'Horario por definir'
}

function toDateInput(value?: string): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

function toTimeInput(value?: string): string {
  if (!value) return ''
  return value.slice(0, 5)
}

function relationId(value: any): string {
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (value && typeof value === 'object' && value.id != null) return String(value.id)
  return ''
}

function getFirstCertification(instructor: any): string | null {
  if (!Array.isArray(instructor?.certifications)) return null
  const first = instructor.certifications[0]
  return typeof first?.title === 'string' && first.title.trim() ? first.title : null
}

interface Props { params: Promise<{ id: string }> }

export default function ConvocatoriaDetailPage({ params }: Props) {
  const router = useRouter()
  const { id } = React.use(params)
  const [conv, setConv] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [campuses, setCampuses] = React.useState<any[]>([])
  const [classrooms, setClassrooms] = React.useState<any[]>([])
  const [editingDates, setEditingDates] = React.useState(false)
  const [editingPrice, setEditingPrice] = React.useState(false)
  const [editingLocation, setEditingLocation] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [saveMessage, setSaveMessage] = React.useState<string | null>(null)
  const [saveError, setSaveError] = React.useState<string | null>(null)
  const [dateForm, setDateForm] = React.useState({ start_date: '', end_date: '' })
  const [priceForm, setPriceForm] = React.useState({ price_override: '', enrollment_fee_snapshot: '' })
  const [locationForm, setLocationForm] = React.useState({
    campus: '',
    classroom: '',
    schedule_days: [] as string[],
    schedule_time_start: '',
    schedule_time_end: '',
    shift: 'morning',
  })

  React.useEffect(() => {
    let mounted = true
    fetch(`/api/course-runs/${id}?depth=2`, { cache: 'no-store' })
      .then(r => { if (!r.ok) throw new Error('No se pudo cargar'); return r.json() })
      .then(data => { if (mounted) setConv(data.doc ?? data) })
      .catch(err => { if (mounted) setError(err.message) })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [id])

  React.useEffect(() => {
    if (!conv) return
    setDateForm({
      start_date: toDateInput(conv.start_date),
      end_date: toDateInput(conv.end_date),
    })
    setPriceForm({
      price_override: conv.price_override != null ? String(conv.price_override) : '',
      enrollment_fee_snapshot: conv.enrollment_fee_snapshot != null ? String(conv.enrollment_fee_snapshot) : '',
    })
    setLocationForm({
      campus: relationId(conv.campus),
      classroom: relationId(conv.classroom),
      schedule_days: Array.isArray(conv.schedule_days) ? conv.schedule_days : [],
      schedule_time_start: toTimeInput(conv.schedule_time_start),
      schedule_time_end: toTimeInput(conv.schedule_time_end),
      shift: conv.shift || 'morning',
    })
  }, [conv])

  React.useEffect(() => {
    let mounted = true
    fetch('/api/campuses?limit=100&depth=0', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('No se pudieron cargar sedes'))))
      .then((data) => {
        if (!mounted) return
        setCampuses(Array.isArray(data.docs) ? data.docs : Array.isArray(data.data) ? data.data : [])
      })
      .catch(() => {
        if (mounted) setCampuses([])
      })
    return () => { mounted = false }
  }, [])

  React.useEffect(() => {
    if (!locationForm.campus) {
      setClassrooms([])
      return
    }
    let mounted = true
    fetch(`/api/aulas?campus_id=${encodeURIComponent(locationForm.campus)}&active=true`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('No se pudieron cargar aulas'))))
      .then((data) => {
        if (!mounted) return
        setClassrooms(Array.isArray(data.data) ? data.data : [])
      })
      .catch(() => {
        if (mounted) setClassrooms([])
      })
    return () => { mounted = false }
  }, [locationForm.campus])

  async function saveRunPatch(payload: Record<string, unknown>) {
    setSaving(true)
    setSaveError(null)
    setSaveMessage(null)
    try {
      const response = await fetch(`/api/course-runs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        const message = data.detail ? `${data.error} ${data.detail}` : data.error
        throw new Error(message || 'No se pudieron guardar los cambios')
      }
      setConv(data.doc)
      setSaveMessage(data.message || 'Cambios guardados')
      return true
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'No se pudieron guardar los cambios')
      return false
    } finally {
      setSaving(false)
    }
  }

  async function saveDates() {
    if (!dateForm.start_date) {
      setSaveError('La fecha de inicio es obligatoria.')
      return
    }
    if (!dateForm.end_date) {
      setSaveError('La fecha de finalización es obligatoria.')
      return
    }
    if (new Date(dateForm.end_date) < new Date(dateForm.start_date)) {
      setSaveError('La fecha de fin no puede ser anterior a la fecha de inicio.')
      return
    }
    if (await saveRunPatch(dateForm)) setEditingDates(false)
  }

  async function savePrice() {
    const price = priceForm.price_override.trim()
    const fee = priceForm.enrollment_fee_snapshot.trim()
    if ((price && Number(price) < 0) || (fee && Number(fee) < 0)) {
      setSaveError('Los importes no pueden ser negativos.')
      return
    }
    if (await saveRunPatch({
      price_override: price ? Number(price) : null,
      enrollment_fee_snapshot: fee ? Number(fee) : null,
    })) setEditingPrice(false)
  }

  async function saveLocation() {
    if (!locationForm.campus) {
      setSaveError('Selecciona una sede antes de guardar.')
      return
    }
    if (locationForm.schedule_time_start && locationForm.schedule_time_end && locationForm.schedule_time_end <= locationForm.schedule_time_start) {
      setSaveError('La hora de fin debe ser posterior a la hora de inicio.')
      return
    }
    if (await saveRunPatch({
      campus: Number(locationForm.campus),
      classroom: locationForm.classroom ? Number(locationForm.classroom) : null,
      schedule_days: locationForm.schedule_days,
      schedule_time_start: locationForm.schedule_time_start || null,
      schedule_time_end: locationForm.schedule_time_end || null,
      shift: locationForm.shift,
    })) setEditingLocation(false)
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  if (error || !conv) return (
    <div className="space-y-6">
      <PageHeader title="Convocatoria" icon={Calendar}
        actions={<Button variant="ghost" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" />Volver</Button>} />
      <Card><CardContent className="p-8 text-center text-muted-foreground">{error || 'No encontrada'}</CardContent></Card>
    </div>
  )

  const course = typeof conv.course === 'object' ? conv.course : null
  const cycle = typeof conv.cycle === 'object' ? conv.cycle : null
  const campus = typeof conv.campus === 'object' ? conv.campus : null
  const instructor = typeof conv.instructor === 'object' ? conv.instructor : null
  const status = STATUS_CONFIG[conv.status] || STATUS_CONFIG.draft
  const plazas = conv.max_students || 0
  const inscritos = conv.current_enrollments || 0
  const porcentaje = plazas > 0 ? Math.round((inscritos / plazas) * 100) : 0

  // Inherited image from cycle or course
  const cycleImage = cycle ? resolveImageUrl(cycle.image) : null
  const courseImage = course ? resolveImageUrl(course.featured_image) : null
  const heroImage = cycleImage || courseImage
  const instructorImage = instructor ? resolveImageUrl(instructor.photo) : null
  const instructorName = instructor ? getInstructorName(instructor) : ''
  const instructorTitle = instructor?.position || getFirstCertification(instructor) || 'Docente'
  const runSchedule = formatRunSchedule(conv)
  const dossierPdf = course ? resolveImageUrl(course.dossier_pdf) : null

  const title = cycle?.name || course?.name || course?.title || conv.codigo
  const publicRunPath = `/p/convocatorias/${conv.codigo ?? conv.id}`

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={title}
        description={`Convocatoria ${conv.codigo}`}
        icon={Calendar}
        badge={<Badge variant={status.variant}>{status.label}</Badge>}
        actions={<>
          <Button variant="ghost" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" />Volver</Button>
          <Button variant="outline" onClick={() => window.open(publicRunPath, '_blank', 'noopener,noreferrer')}>
            <ExternalLink className="mr-2 h-4 w-4" />Ver página pública
          </Button>
        </>}
      />

      {/* Hero image */}
      {heroImage && (
        <div className="rounded-lg overflow-hidden border h-48 sm:h-64">
          <img src={heroImage} alt={title} className="w-full h-full object-cover" />
        </div>
      )}

      {/* KPIs */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Plazas', value: `${inscritos}/${plazas}`, icon: Users },
          { label: 'Precio', value: formatCurrency(conv.price_override), icon: DollarSign },
          { label: 'Inicio', value: conv.start_date ? new Date(conv.start_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Por definir', icon: Calendar },
          { label: 'Ocupacion', value: `${porcentaje}%`, icon: GraduationCap },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{label}</span>
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <p className="mt-2 text-xl font-semibold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Plazas progress */}
      {plazas > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium">Ocupacion de plazas</span>
              <span>{inscritos} de {plazas} ({porcentaje}%)</span>
            </div>
            <div className="w-full bg-muted rounded-full h-3">
              <div className="bg-primary h-3 rounded-full transition-all" style={{ width: `${Math.min(porcentaje, 100)}%` }} />
            </div>
          </CardContent>
        </Card>
      )}

      {(saveMessage || saveError) && (
        <div className={`rounded-lg border px-4 py-3 text-sm ${saveError ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
          <div className="flex items-center gap-2">
            {saveError && <AlertCircle className="h-4 w-4" />}
            <span>{saveError || saveMessage}</span>
          </div>
        </div>
      )}

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Alumnos matriculados */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Alumnos matriculados
                <Badge variant="outline">{inscritos}</Badge>
              </CardTitle>
              <Button size="sm" variant="outline"><Plus className="mr-1.5 h-3.5 w-3.5" />Matricular</Button>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <p className="text-sm text-muted-foreground">No hay alumnos matriculados en esta convocatoria</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Los alumnos se matriculan desde la seccion de Matriculacion</p>
              </div>
            </CardContent>
          </Card>

          {/* Profesores asignados */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-primary" />
                Profesores asignados
              </CardTitle>
              <Button size="sm" variant="outline"><UserPlus className="mr-1.5 h-3.5 w-3.5" />Asignar</Button>
            </CardHeader>
            <CardContent>
              {instructor ? (
                <div className="rounded-lg border p-4">
                  <div className="flex items-start gap-4">
                    {instructorImage ? (
                      <img
                        src={instructorImage}
                        alt={instructorName}
                        className="h-16 w-16 shrink-0 rounded-full object-cover ring-2 ring-primary/15"
                      />
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/15">
                        <GraduationCap className="h-7 w-7 text-primary" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-base font-semibold">{instructorName}</p>
                          <p className="text-sm text-muted-foreground">{instructorTitle}</p>
                        </div>
                        <Badge variant="outline" className="shrink-0">Docente</Badge>
                      </div>
                      <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-primary" />
                          {runSchedule}
                        </span>
                        {conv.shift && (
                          <span className="inline-flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-primary" />
                            Turno: {conv.shift === 'morning' ? 'Mañana' : conv.shift === 'afternoon' ? 'Tarde' : 'Tercer turno'}
                          </span>
                        )}
                      </div>
                      {instructor.email && <p className="mt-2 text-xs text-muted-foreground">{instructor.email}</p>}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <p className="text-sm text-muted-foreground">No hay profesores asignados</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notas */}
          {conv.notes && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Notas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{conv.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Sede y aula */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base flex items-center gap-2"><MapPin className="h-4 w-4" />Sede</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setEditingLocation((value) => !value)}>
                <Pencil className="mr-1.5 h-3.5 w-3.5" />{campus ? 'Cambiar' : 'Asignar'}
              </Button>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {!editingLocation ? (
                <>
                  <p className="font-medium">{campus?.name ?? 'Sin sede asignada'}</p>
                  {campus?.address && <p className="text-muted-foreground">{campus.address}</p>}
                  {campus?.city && <p className="text-muted-foreground">{campus.city}{campus.postal_code ? `, ${campus.postal_code}` : ''}</p>}
                  {campus?.phone && <p className="text-muted-foreground">{campus.phone}</p>}
                  {conv.classroom && (
                    <p className="rounded-md bg-muted px-3 py-2 text-muted-foreground">
                      Aula: <span className="font-medium text-foreground">{typeof conv.classroom === 'object' ? (conv.classroom.name ?? conv.classroom.code) : conv.classroom}</span>
                    </p>
                  )}
                  {campus && (
                    <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => router.push(`/dashboard/sedes/${campus.id}`)}>
                      Ver sede <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  )}
                </>
              ) : (
                <div className="space-y-3">
                  <label className="block space-y-1">
                    <span className="text-xs font-medium text-muted-foreground">Sede</span>
                    <select
                      className="w-full rounded-md border bg-background px-3 py-2"
                      value={locationForm.campus}
                      onChange={(event) => setLocationForm((form) => ({ ...form, campus: event.target.value, classroom: '' }))}
                    >
                      <option value="">Seleccionar sede</option>
                      {campuses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </select>
                  </label>
                  <label className="block space-y-1">
                    <span className="text-xs font-medium text-muted-foreground">Aula</span>
                    <select
                      className="w-full rounded-md border bg-background px-3 py-2"
                      value={locationForm.classroom}
                      onChange={(event) => setLocationForm((form) => ({ ...form, classroom: event.target.value }))}
                      disabled={!locationForm.campus}
                    >
                      <option value="">Sin aula asignada</option>
                      {classrooms.map((item) => (
                        <option key={item.id} value={item.id}>{item.name} · {item.capacity} plazas</option>
                      ))}
                    </select>
                  </label>
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">Días</span>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {[
                        ['monday', 'Lunes'],
                        ['tuesday', 'Martes'],
                        ['wednesday', 'Miércoles'],
                        ['thursday', 'Jueves'],
                        ['friday', 'Viernes'],
                        ['saturday', 'Sábado'],
                        ['sunday', 'Domingo'],
                      ].map(([value, label]) => (
                        <label key={value} className="flex items-center gap-2 rounded-md border px-2 py-1.5 text-xs">
                          <input
                            type="checkbox"
                            checked={locationForm.schedule_days.includes(value)}
                            onChange={(event) => setLocationForm((form) => ({
                              ...form,
                              schedule_days: event.target.checked
                                ? [...form.schedule_days, value]
                                : form.schedule_days.filter((day) => day !== value),
                            }))}
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block space-y-1">
                      <span className="text-xs font-medium text-muted-foreground">Hora inicio</span>
                      <input className="w-full rounded-md border bg-background px-3 py-2" type="time" value={locationForm.schedule_time_start} onChange={(event) => setLocationForm((form) => ({ ...form, schedule_time_start: event.target.value }))} />
                    </label>
                    <label className="block space-y-1">
                      <span className="text-xs font-medium text-muted-foreground">Hora fin</span>
                      <input className="w-full rounded-md border bg-background px-3 py-2" type="time" value={locationForm.schedule_time_end} onChange={(event) => setLocationForm((form) => ({ ...form, schedule_time_end: event.target.value }))} />
                    </label>
                  </div>
                  <label className="block space-y-1">
                    <span className="text-xs font-medium text-muted-foreground">Turno</span>
                    <select className="w-full rounded-md border bg-background px-3 py-2" value={locationForm.shift} onChange={(event) => setLocationForm((form) => ({ ...form, shift: event.target.value }))}>
                      <option value="morning">Mañana</option>
                      <option value="afternoon">Tarde</option>
                      <option value="evening_extra">Tercer turno</option>
                    </select>
                  </label>
                  <Button className="w-full" disabled={saving} onClick={saveLocation}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Guardar sede y horario
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Fechas */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4" />Fechas</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setEditingDates((value) => !value)}>
                <Pencil className="mr-1.5 h-3.5 w-3.5" />Editar
              </Button>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {!editingDates ? (
                <>
                  <div className="flex justify-between"><span className="text-muted-foreground">Inicio</span><span className="font-medium">{conv.start_date ? new Date(conv.start_date).toLocaleDateString('es-ES') : 'Por definir'}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Fin</span><span className="font-medium">{conv.end_date ? new Date(conv.end_date).toLocaleDateString('es-ES') : 'Por definir'}</span></div>
                  {conv.enrollment_deadline && <div className="flex justify-between"><span className="text-muted-foreground">Limite inscripcion</span><span className="font-medium">{new Date(conv.enrollment_deadline).toLocaleDateString('es-ES')}</span></div>}
                </>
              ) : (
                <div className="space-y-3">
                  <label className="block space-y-1">
                    <span className="text-xs font-medium text-muted-foreground">Fecha inicio</span>
                    <input className="w-full rounded-md border bg-background px-3 py-2" type="date" value={dateForm.start_date} onChange={(event) => setDateForm((form) => ({ ...form, start_date: event.target.value }))} />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-xs font-medium text-muted-foreground">Fecha fin</span>
                    <input className="w-full rounded-md border bg-background px-3 py-2" type="date" value={dateForm.end_date} onChange={(event) => setDateForm((form) => ({ ...form, end_date: event.target.value }))} />
                  </label>
                  <Button className="w-full" disabled={saving} onClick={saveDates}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Guardar fechas
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Precios */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base flex items-center gap-2"><DollarSign className="h-4 w-4" />Precios</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setEditingPrice((value) => !value)}>
                <Pencil className="mr-1.5 h-3.5 w-3.5" />Editar
              </Button>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {!editingPrice ? (
                <>
                  <div className="flex justify-between"><span className="text-muted-foreground">Precio total</span><span className="text-lg font-bold text-primary">{formatCurrency(conv.price_override)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Matrícula / reserva</span><span className="font-medium">{formatCurrency(conv.enrollment_fee_snapshot)}</span></div>
                  {conv.financial_aid_available && <Badge variant="outline" className="text-xs">Financiacion disponible</Badge>}
                </>
              ) : (
                <div className="space-y-3">
                  <label className="block space-y-1">
                    <span className="text-xs font-medium text-muted-foreground">Precio total</span>
                    <input className="w-full rounded-md border bg-background px-3 py-2" type="number" min="0" step="0.01" placeholder="Consultar" value={priceForm.price_override} onChange={(event) => setPriceForm((form) => ({ ...form, price_override: event.target.value }))} />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-xs font-medium text-muted-foreground">Matrícula / reserva</span>
                    <input className="w-full rounded-md border bg-background px-3 py-2" type="number" min="0" step="0.01" placeholder="Consultar" value={priceForm.enrollment_fee_snapshot} onChange={(event) => setPriceForm((form) => ({ ...form, enrollment_fee_snapshot: event.target.value }))} />
                  </label>
                  <Button className="w-full" disabled={saving} onClick={savePrice}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Guardar precio
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ciclo / Curso */}
          {(cycle || course) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><BookOpen className="h-4 w-4" />Programa</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {cycle && (
                  <Button variant="outline" size="sm" className="w-full justify-between" onClick={() => router.push(`/dashboard/ciclos/${cycle.id}`)}>
                    <span className="flex items-center gap-2"><GraduationCap className="h-3 w-3" />{cycle.name}</span>
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                )}
                {course && (
                  <Button variant="outline" size="sm" className="h-auto w-full justify-between gap-2 py-2" onClick={() => router.push(`/dashboard/cursos/${course.id}`)}>
                    <span className="flex min-w-0 items-center gap-2">
                      <BookOpen className="h-3 w-3 shrink-0" />
                      <span className="truncate text-left">{course.name || course.title}</span>
                    </span>
                    <ChevronRight className="h-3 w-3 shrink-0" />
                  </Button>
                )}
                {dossierPdf && (
                  <a
                    href={dossierPdf}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 flex items-center gap-3 rounded-lg border border-red-100 bg-red-50 p-3 text-sm font-medium text-red-700 transition hover:bg-red-100"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white text-red-600 shadow-sm">
                      <FileText className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">Descargar programa en PDF</span>
                      <span className="block text-xs font-normal text-red-600/75">Dossier informativo del curso</span>
                    </span>
                    <Download className="h-4 w-4 shrink-0" />
                  </a>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
