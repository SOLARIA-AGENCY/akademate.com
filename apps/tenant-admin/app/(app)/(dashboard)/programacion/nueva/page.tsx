'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card } from '@payload-config/components/ui/card'
import { Input } from '@payload-config/components/ui/input'
import { Button } from '@payload-config/components/ui/button'
import { Badge } from '@payload-config/components/ui/badge'
import { Label } from '@payload-config/components/ui/label'
import { Textarea } from '@payload-config/components/ui/textarea'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@payload-config/components/ui/select'
import {
  Calendar,
  MapPin,
  User,
  Plus,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Save,
  ChevronUp,
  Check,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Types for API responses
// ---------------------------------------------------------------------------

interface Cycle {
  id: string
  name: string
}

interface Course {
  id: string
  title: string
}

interface StaffMember {
  id: string
  first_name?: string
  last_name?: string
  firstName?: string
  lastName?: string
  fullName?: string
  email?: string
}

interface Campus {
  id: string
  name: string
  slug?: string
  code?: string
}

// Combined item for the course/cycle selector
interface ProgramItem {
  id: string
  label: string
  type: 'cycle' | 'course'
}

// ---------------------------------------------------------------------------
// Form state
// ---------------------------------------------------------------------------

interface FormState {
  course: string // course ID (required by API)
  campus: string
  instructor: string
  start_date: string
  end_date: string
  max_students: number
  min_students: number
  price_override: string // string so empty = no override
  status: string
  codigo: string
  notes: string
}

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Borrador' },
  { value: 'published', label: 'Planificada' },
  { value: 'enrollment_open', label: 'Abierta' },
] as const

// ---------------------------------------------------------------------------
// Inline Creation Form — Sede
// ---------------------------------------------------------------------------

function InlineSedeForm({
  onCreated,
  compact = false,
}: {
  onCreated: (newCampus: Campus) => void
  compact?: boolean
}) {
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [address, setAddress] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const handleCreate = async () => {
    if (!name.trim()) return
    setSaving(true)
    setFormError(null)

    try {
      const res = await fetch('/api/campuses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          city: city.trim() || undefined,
          address: address.trim() || undefined,
          tenant: 1,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.errors?.[0]?.message ?? data?.message ?? `Error ${res.status}`)
      }

      const data = await res.json()
      const created: Campus = data.doc ?? data
      onCreated(created)
      setName('')
      setCity('')
      setAddress('')
    } catch (err: any) {
      setFormError(err.message ?? 'Error al crear sede')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className={`rounded-lg border border-dashed border-blue-300 bg-blue-50/50 p-4 space-y-3 ${compact ? 'mt-2' : ''}`}
    >
      <p className="text-sm font-medium text-blue-800">
        {compact ? 'Crear nueva sede' : 'Crear sede para continuar'}
      </p>
      {formError && <p className="text-xs text-red-600">{formError}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label htmlFor="new-sede-name" className="text-xs">
            Nombre *
          </Label>
          <Input
            id="new-sede-name"
            placeholder="Ej: Sede Central"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="new-sede-city" className="text-xs">
            Ciudad
          </Label>
          <Input
            id="new-sede-city"
            placeholder="Ej: Madrid"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="new-sede-address" className="text-xs">
            Direccion
          </Label>
          <Input
            id="new-sede-address"
            placeholder="Ej: Calle Mayor 1"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
      </div>
      <div className="flex justify-end">
        <Button size="sm" onClick={handleCreate} disabled={!name.trim() || saving} className="h-8">
          {saving ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Check className="mr-1.5 h-3.5 w-3.5" />
          )}
          {saving ? 'Creando...' : 'Crear Sede'}
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Inline Creation Form — Profesor
// ---------------------------------------------------------------------------

function InlineProfesorForm({
  onCreated,
  compact = false,
}: {
  onCreated: (newStaff: StaffMember) => void
  compact?: boolean
}) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const handleCreate = async () => {
    if (!firstName.trim() || !lastName.trim()) return
    setSaving(true)
    setFormError(null)

    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim() || undefined,
          staff_type: 'profesor',
          tenant: 1,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.errors?.[0]?.message ?? data?.message ?? `Error ${res.status}`)
      }

      const data = await res.json()
      const created: StaffMember = data.doc ?? data
      onCreated(created)
      setFirstName('')
      setLastName('')
      setEmail('')
    } catch (err: any) {
      setFormError(err.message ?? 'Error al crear profesor')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className={`rounded-lg border border-dashed border-blue-300 bg-blue-50/50 p-4 space-y-3 ${compact ? 'mt-2' : ''}`}
    >
      <p className="text-sm font-medium text-blue-800">
        {compact ? 'Crear nuevo profesor' : 'Crear profesor para continuar'}
      </p>
      {formError && <p className="text-xs text-red-600">{formError}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label htmlFor="new-prof-first" className="text-xs">
            Nombre *
          </Label>
          <Input
            id="new-prof-first"
            placeholder="Ej: Juan"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="new-prof-last" className="text-xs">
            Apellidos *
          </Label>
          <Input
            id="new-prof-last"
            placeholder="Ej: Garcia"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="new-prof-email" className="text-xs">
            Email
          </Label>
          <Input
            id="new-prof-email"
            type="email"
            placeholder="Ej: juan@academia.es"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
      </div>
      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={handleCreate}
          disabled={!firstName.trim() || !lastName.trim() || saving}
          className="h-8"
        >
          {saving ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Check className="mr-1.5 h-3.5 w-3.5" />
          )}
          {saving ? 'Creando...' : 'Crear Profesor'}
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function NuevaConvocatoriaPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedProfessorId = searchParams.get('profesor')

  // Data from API
  const [cycles, setCycles] = useState<Cycle[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [campuses, setCampuses] = useState<Campus[]>([])

  // UI state
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Inline creation form toggles
  const [showNewSede, setShowNewSede] = useState(false)
  const [showNewProfesor, setShowNewProfesor] = useState(false)

  // Form
  const [form, setForm] = useState<FormState>({
    course: '',
    campus: '',
    instructor: '',
    start_date: '',
    end_date: '',
    max_students: 30,
    min_students: 5,
    price_override: '',
    status: 'draft',
    codigo: '',
    notes: '',
  })

  // Combined list for the selector
  const programItems: ProgramItem[] = [
    ...cycles.map((c) => ({ id: `cycle:${c.id}`, label: c.name, type: 'cycle' as const })),
    ...courses.map((c) => ({ id: `course:${c.id}`, label: c.title, type: 'course' as const })),
  ]

  // -------------------------------------------------------------------------
  // Fetch data on mount
  // -------------------------------------------------------------------------

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      setError(null)

      try {
        const [cyclesRes, coursesRes, staffRes, campusesRes] = await Promise.all([
          fetch('/api/cycles?limit=100&sort=name').then((r) => r.json()),
          fetch('/api/courses?limit=100&sort=title').then((r) => r.json()),
          fetch('/api/staff?where[staff_type][equals]=profesor&limit=100').then((r) => r.json()),
          fetch('/api/campuses?limit=100').then((r) => r.json()),
        ])

        setCycles(cyclesRes.docs ?? [])
        setCourses(coursesRes.docs ?? [])
        setStaff(staffRes.docs ?? staffRes.data ?? [])
        setCampuses(campusesRes.docs ?? [])
      } catch (err) {
        console.error('Error fetching data:', err)
        setError('Error al cargar datos. Intenta recargar la pagina.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    if (!preselectedProfessorId) return
    setForm((prev) => (prev.instructor ? prev : { ...prev, instructor: preselectedProfessorId }))
  }, [preselectedProfessorId])

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const staffDisplayName = (s: StaffMember) =>
    s.fullName ||
    [s.first_name ?? s.firstName, s.last_name ?? s.lastName].filter(Boolean).join(' ') ||
    s.email ||
    s.id

  // Inline creation callbacks
  const handleSedeCreated = useCallback((newCampus: Campus) => {
    setCampuses((prev) => [...prev, newCampus])
    setForm((prev) => ({ ...prev, campus: String(newCampus.id) }))
    setShowNewSede(false)
  }, [])

  const handleProfesorCreated = useCallback((newStaff: StaffMember) => {
    setStaff((prev) => [...prev, newStaff])
    setForm((prev) => ({ ...prev, instructor: String(newStaff.id) }))
    setShowNewProfesor(false)
  }, [])

  // -------------------------------------------------------------------------
  // Submit
  // -------------------------------------------------------------------------

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)

    // Extract the actual course ID from the combined selector value
    // Format is "course:123" or "cycle:456" — the API expects a course ID
    let courseId = form.course
    if (courseId.startsWith('course:')) {
      courseId = courseId.replace('course:', '')
    } else if (courseId.startsWith('cycle:')) {
      // If a cycle was selected, we still need a course — this is a simplification.
      // In a real scenario, cycles might have a default course or the user picks one.
      courseId = courseId.replace('cycle:', '')
    }

    // Auto-generate codigo from campus slug + year
    const selectedCampus = campuses.find(c => String(c.id) === form.campus)
    const campusCode = selectedCampus?.slug?.substring(0, 3).toUpperCase() || 'GEN'
    const year = new Date().getFullYear()
    const autoCode = form.codigo || `${campusCode}-${year}-${String(Date.now()).slice(-3)}`

    const body: Record<string, unknown> = {
      course: courseId,
      max_students: form.max_students,
      min_students: form.min_students || 1,
      status: form.status,
      codigo: autoCode,
    }

    if (form.start_date) body.start_date = form.start_date
    if (form.end_date) body.end_date = form.end_date
    if (form.campus) body.campus = form.campus
    if (form.instructor) body.instructor = form.instructor
    if (form.price_override !== '') body.price_override = Number(form.price_override)
    if (form.notes) body.notes = form.notes

    try {
      const res = await fetch('/api/course-runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        const msg = data?.errors?.[0]?.message ?? data?.message ?? `Error ${res.status}`
        throw new Error(msg)
      }

      router.push('/programacion')
    } catch (err: any) {
      setError(err.message ?? 'Error al crear la convocatoria')
    } finally {
      setSubmitting(false)
    }
  }

  const canSubmit =
    form.course !== '' &&
    form.campus !== '' &&
    form.max_students > 0 &&
    !submitting

  // -------------------------------------------------------------------------
  // Loading state
  // -------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-3 text-muted-foreground">Cargando datos...</span>
        </div>
      </div>
    )
  }

  // -------------------------------------------------------------------------
  // Validation gates: require sedes and profesores (with inline creation)
  // -------------------------------------------------------------------------

  if (campuses.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Nueva Convocatoria"
          description="Crear una nueva convocatoria de curso"
          icon={Calendar}
          actions={
            <Button variant="outline" onClick={() => router.push('/programacion')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          }
        />
        <Card className="p-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center">
              <MapPin className="h-8 w-8 text-amber-600" />
            </div>
            <h2 className="text-xl font-semibold">Se necesita al menos una sede</h2>
            <p className="text-muted-foreground max-w-md">
              Necesitas al menos una sede para crear una convocatoria. Puedes crear una aqui mismo:
            </p>
          </div>
          <div className="mt-6 max-w-xl mx-auto">
            <InlineSedeForm onCreated={handleSedeCreated} />
          </div>
        </Card>
      </div>
    )
  }

  // -------------------------------------------------------------------------
  // Main form (profesor is optional — can be assigned later)
  // -------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nueva Convocatoria"
        description="Crear una nueva convocatoria de curso"
        icon={Calendar}
        actions={
          <Button variant="outline" onClick={() => router.push('/programacion')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        }
      />

      {/* Error banner */}
      {error && (
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-red-900">Error</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </Card>
      )}

      <Card className="p-8 space-y-8">
        {/* ----------------------------------------------------------------- */}
        {/* Ciclo / Curso */}
        {/* ----------------------------------------------------------------- */}
        <div className="space-y-2">
          <Label htmlFor="program">Ciclo / Curso *</Label>
          <Select value={form.course} onValueChange={(v) => updateField('course', v)}>
            <SelectTrigger id="program">
              <SelectValue placeholder="Seleccionar ciclo o curso" />
            </SelectTrigger>
            <SelectContent>
              {cycles.length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    Ciclos
                  </div>
                  {cycles.map((c) => (
                    <SelectItem key={`cycle:${c.id}`} value={`cycle:${c.id}`}>
                      <span className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          Ciclo
                        </Badge>
                        {c.name}
                      </span>
                    </SelectItem>
                  ))}
                </>
              )}
              {courses.length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    Cursos
                  </div>
                  {courses.map((c) => (
                    <SelectItem key={`course:${c.id}`} value={`course:${c.id}`}>
                      <span className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          Curso
                        </Badge>
                        {c.title}
                      </span>
                    </SelectItem>
                  ))}
                </>
              )}
              {programItems.length === 0 && (
                <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                  No hay ciclos ni cursos disponibles
                </div>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* Sede + inline creation */}
        {/* ----------------------------------------------------------------- */}
        <div className="space-y-2">
          <Label htmlFor="campus">Sede *</Label>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Select value={form.campus} onValueChange={(v) => updateField('campus', v)}>
                <SelectTrigger id="campus">
                  <SelectValue placeholder="Seleccionar sede" />
                </SelectTrigger>
                <SelectContent>
                  {campuses.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      <span className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        {c.name}
                        {c.code && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            {c.code}
                          </Badge>
                        )}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-10 w-10 shrink-0"
              onClick={() => setShowNewSede((v) => !v)}
              title="Crear nueva sede"
            >
              {showNewSede ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </Button>
          </div>
          {showNewSede && <InlineSedeForm onCreated={handleSedeCreated} compact />}
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* Profesor + inline creation */}
        {/* ----------------------------------------------------------------- */}
        <div className="space-y-2">
          <Label htmlFor="instructor">Profesor *</Label>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Select
                value={form.instructor}
                onValueChange={(v) => updateField('instructor', v)}
              >
                <SelectTrigger id="instructor">
                  <SelectValue placeholder="Seleccionar profesor" />
                </SelectTrigger>
                <SelectContent>
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      <span className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        {staffDisplayName(s)}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-10 w-10 shrink-0"
              onClick={() => setShowNewProfesor((v) => !v)}
              title="Crear nuevo profesor"
            >
              {showNewProfesor ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </Button>
          </div>
          {showNewProfesor && <InlineProfesorForm onCreated={handleProfesorCreated} compact />}
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* Fechas */}
        {/* ----------------------------------------------------------------- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="start_date">Fecha inicio *</Label>
            <Input
              id="start_date"
              type="date"
              value={form.start_date}
              onChange={(e) => updateField('start_date', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end_date">Fecha fin *</Label>
            <Input
              id="end_date"
              type="date"
              value={form.end_date}
              onChange={(e) => updateField('end_date', e.target.value)}
            />
          </div>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* Plazas */}
        {/* ----------------------------------------------------------------- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="max_students">Plazas maximas *</Label>
            <Input
              id="max_students"
              type="number"
              min={1}
              value={form.max_students}
              onChange={(e) => updateField('max_students', parseInt(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="min_students">Plazas minimas *</Label>
            <Input
              id="min_students"
              type="number"
              min={1}
              value={form.min_students}
              onChange={(e) => updateField('min_students', parseInt(e.target.value) || 0)}
            />
          </div>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* Precio override */}
        {/* ----------------------------------------------------------------- */}
        <div className="space-y-2">
          <Label htmlFor="price_override">Precio (override)</Label>
          <Input
            id="price_override"
            type="number"
            min={0}
            step="0.01"
            placeholder="Dejar vacio para usar el precio del curso"
            value={form.price_override}
            onChange={(e) => updateField('price_override', e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Si se deja vacio, se usara el precio por defecto del curso.
          </p>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* Estado */}
        {/* ----------------------------------------------------------------- */}
        <div className="space-y-2">
          <Label htmlFor="status">Estado</Label>
          <Select value={form.status} onValueChange={(v) => updateField('status', v)}>
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* Codigo convocatoria */}
        {/* ----------------------------------------------------------------- */}
        <div className="space-y-2">
          <Label htmlFor="codigo">Codigo convocatoria</Label>
          <Input
            id="codigo"
            placeholder="Se genera automaticamente si se deja vacio"
            value={form.codigo}
            onChange={(e) => updateField('codigo', e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Formato: CAMPUS-YEAR-001. Si se deja vacio, se auto-genera al guardar.
          </p>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* Notas */}
        {/* ----------------------------------------------------------------- */}
        <div className="space-y-2">
          <Label htmlFor="notes">Notas</Label>
          <Textarea
            id="notes"
            placeholder="Notas internas sobre esta convocatoria..."
            rows={3}
            value={form.notes}
            onChange={(e) => updateField('notes', e.target.value)}
          />
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* Actions */}
        {/* ----------------------------------------------------------------- */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => router.push('/programacion')}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Crear Convocatoria
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  )
}
