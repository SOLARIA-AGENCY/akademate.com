'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
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
  Clock,
  MapPin,
  User,
  Plus,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Save,
  ChevronUp,
  Check,
  Lock,
  XCircle,
} from 'lucide-react'
import { getInstructorAvailability, type InstructorTimeConflict } from '@/app/lib/planning/instructor-availability'

// ---------------------------------------------------------------------------
// Types for API responses
// ---------------------------------------------------------------------------

interface Cycle {
  id: string | number
  name: string
  image?: MediaRef
  duration?: {
    modality?: string
    totalHours?: number
    practiceHours?: number
  }
  capacity?: number
}

interface Course {
  id: string | number
  title?: string
  name?: string
  short_description?: string
  featured_image?: MediaRef
  modality?: string
  course_type?: string
  area?: string
  area_formativa?: RelationRef
  duration_hours?: number | null
  base_price?: number | null
}

interface AreaOption {
  id: string
  name: string
  color?: string | null
}

interface StaffMember {
  id: string | number
  first_name?: string
  last_name?: string
  firstName?: string
  lastName?: string
  fullName?: string
  email?: string
  qualifiedAreas?: Array<{ id: string | number; nombre?: string; name?: string }>
  qualified_areas?: RelationRef[]
}

interface Campus {
  id: string
  name: string
  slug?: string
  code?: string
}

interface Classroom {
  id: string | number
  code?: string
  name?: string
  nombre?: string
  capacity?: number
  capacidad?: number
  usage_policy?: string
  enabled_shifts?: string[]
}

interface AvailabilityMessage {
  type: string
  severity: 'blocker' | 'warning'
  message: string
}

interface AvailabilityState {
  blockers: AvailabilityMessage[]
  warnings: AvailabilityMessage[]
  unavailableInstructorIds?: Array<string | number>
  unavailableInstructors?: InstructorTimeConflict[]
}

// Combined item for the course/cycle selector
interface ProgramItem {
  id: string
  label: string
  type: 'cycle' | 'course'
  description?: string
  imageUrl?: string | null
  meta: Array<{ label: string; value: string }>
}

type MediaRef =
  | number
  | string
  | { url?: string | null; filename?: string | null; alt?: string | null }
  | null
  | undefined
type RelationRef =
  | number
  | string
  | { id?: string | number | null; nombre?: string | null; name?: string | null }
  | null
  | undefined

// ---------------------------------------------------------------------------
// Form state
// ---------------------------------------------------------------------------

interface FormState {
  trainingType: string
  areaId: string
  course: string // course ID (required by API)
  campus: string
  instructor: string
  classroom: string
  start_date: string
  end_date: string
  schedule_days: string[]
  schedule_time_start: string
  schedule_time_end: string
  shift: string
  max_students: number
  min_students: number
  price_override: string // string so empty = no override
  status: string
  enrollment_status: string
  codigo: string
  notes: string
}

const WEEKDAY_OPTIONS = [
  { value: 'monday', label: 'Lunes' },
  { value: 'tuesday', label: 'Martes' },
  { value: 'wednesday', label: 'Miércoles' },
  { value: 'thursday', label: 'Jueves' },
  { value: 'friday', label: 'Viernes' },
  { value: 'saturday', label: 'Sábado' },
  { value: 'sunday', label: 'Domingo' },
] as const

const SHIFT_OPTIONS = [
  { value: 'morning', label: 'Mañana' },
  { value: 'afternoon', label: 'Tarde' },
  { value: 'evening_extra', label: 'Tercer turno' },
] as const

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Sin publicar' },
  { value: 'published', label: 'Planificada' },
  { value: 'enrollment_open', label: 'Abierta' },
] as const

const ENROLLMENT_STATUS_OPTIONS = [
  { value: 'open', label: 'Matrícula abierta' },
  { value: 'closed', label: 'Matrícula cerrada' },
  { value: 'scheduled', label: 'Apertura programada' },
  { value: 'always_open', label: 'Matrícula permanente' },
] as const

const TRAINING_TYPE_OPTIONS = [
  { value: 'privados', label: 'Curso privado' },
  { value: 'ocupados', label: 'Curso para ocupados' },
  { value: 'desempleados', label: 'Curso para desempleados' },
  { value: 'teleformacion', label: 'Teleformación' },
  { value: 'ciclo', label: 'Ciclo' },
] as const

function resolveMediaUrl(media: MediaRef): string | null {
  if (!media) return null
  if (typeof media === 'number') return null
  if (typeof media === 'string') return media
  if (media.url) return media.url
  if (media.filename) return `/api/media/file/${media.filename}`
  return null
}

function relationId(value: RelationRef): string | null {
  if (typeof value === 'number' || typeof value === 'string') return String(value)
  if (value && typeof value === 'object' && value.id != null) return String(value.id)
  return null
}

function relationName(value: RelationRef): string | null {
  if (value && typeof value === 'object') return value.nombre ?? value.name ?? null
  return null
}

function formatCurrency(value?: number | null): string {
  if (value == null || value <= 0) return 'Consultar'
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value)
}

function normalizeTimeForApi(value: string): string | undefined {
  if (!value.trim()) return undefined
  if (/^\d{2}:\d{2}$/.test(value)) return `${value}:00`
  if (/^\d{2}:\d{2}:\d{2}$/.test(value)) return value
  return undefined
}

function courseLabel(course: Course): string {
  return course.name || course.title || `Curso ${course.id}`
}

function normalizeCourseTrainingType(course?: Course | null): string {
  const raw = `${course?.course_type ?? ''} ${course?.modality ?? ''}`.toLowerCase()
  if (raw.includes('teleformacion') || raw.includes('online')) return 'teleformacion'
  if (raw.includes('ocupado')) return 'ocupados'
  if (raw.includes('desempleado') || raw.includes('fped')) return 'desempleados'
  if (raw.includes('privado') || raw.includes('private')) return 'privados'
  return 'privados'
}

function getCourseTrainingPayloadType(trainingType: string): string {
  if (trainingType === 'ciclo') return 'cycle'
  if (trainingType === 'privados') return 'private'
  return trainingType || 'private'
}

function normalizeAreaLabel(value?: string | null): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

// ---------------------------------------------------------------------------
// Inline Creation Form — Sede
// ---------------------------------------------------------------------------

function InlineSedeForm({
  compact = false,
}: {
  onCreated: (newCampus: Campus) => void
  compact?: boolean
}) {
  return (
    <div
      className={`rounded-lg border border-dashed border-muted-foreground/30 bg-muted/40 p-4 ${compact ? 'mt-2' : ''}`}
    >
      <p className="text-sm font-medium text-foreground">
        Creación de sedes restringida
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Las sedes solo pueden ser creadas por el equipo interno. Selecciona una sede existente o
        solicita el alta fuera de este flujo.
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Inline Creation Form — Profesor
// ---------------------------------------------------------------------------

function InlineProfesorForm({
  onCreated,
  qualifiedAreaId,
  qualifiedAreaName,
  compact = false,
}: {
  onCreated: (newStaff: StaffMember) => void
  qualifiedAreaId?: string | null
  qualifiedAreaName?: string | null
  compact?: boolean
}) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const handleCreate = async () => {
    if (!firstName.trim() || !lastName.trim()) return
    if (!qualifiedAreaId) {
      setFormError(
        'Selecciona primero un curso con área formativa para asignar el área habilitada del docente.'
      )
      return
    }
    setSaving(true)
    setFormError(null)

    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffType: 'profesor',
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim() || undefined,
          position: 'Docente',
          employmentStatus: 'active',
          contractType: 'autonomo',
          qualifiedAreas: [qualifiedAreaId],
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.errors?.[0]?.message ?? data?.message ?? `Error ${res.status}`)
      }

      const data = await res.json()
      const created: StaffMember = data.data ?? data.doc ?? data
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
      className={`rounded-lg border border-dashed border-primary/30 bg-primary/10 p-4 space-y-3 ${compact ? 'mt-2' : ''}`}
    >
      <p className="text-sm font-medium text-primary">
        {compact ? 'Crear nuevo profesor' : 'Crear profesor para continuar'}
      </p>
      {qualifiedAreaId ? (
        <p className="text-xs text-muted-foreground">
          Se creará habilitado para el área{' '}
          {qualifiedAreaName ? <strong>{qualifiedAreaName}</strong> : `#${qualifiedAreaId}`}.
        </p>
      ) : (
        <p className="text-xs text-amber-700">
          Selecciona un curso con área formativa antes de crear un docente desde esta pantalla.
        </p>
      )}
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
          disabled={!firstName.trim() || !lastName.trim() || !qualifiedAreaId || saving}
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
  const preselectedCourseId = searchParams.get('courseId') || searchParams.get('curso')
  const preselectedCycleId = searchParams.get('cycleId') || searchParams.get('ciclo')
  const lockedProgramValue = preselectedCourseId
    ? `course:${preselectedCourseId}`
    : preselectedCycleId
      ? `cycle:${preselectedCycleId}`
      : ''

  // Data from API
  const [cycles, setCycles] = useState<Cycle[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [areas, setAreas] = useState<AreaOption[]>([])
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [campuses, setCampuses] = useState<Campus[]>([])
  const [classrooms, setClassrooms] = useState<Classroom[]>([])

  // UI state
  const [loading, setLoading] = useState(true)
  const [classroomsLoading, setClassroomsLoading] = useState(false)
  const [availabilityLoading, setAvailabilityLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [availability, setAvailability] = useState<AvailabilityState | null>(null)

  // Inline creation form toggles
  const [showNewSede, setShowNewSede] = useState(false)
  const [showNewProfesor, setShowNewProfesor] = useState(false)

  // Form
  const [form, setForm] = useState<FormState>({
    trainingType: '',
    areaId: '',
    course: '',
    campus: '',
    instructor: '',
    classroom: '',
    start_date: '',
    end_date: '',
    schedule_days: [],
    schedule_time_start: '',
    schedule_time_end: '',
    shift: 'morning',
    max_students: 30,
    min_students: 5,
    price_override: '',
    status: 'draft',
    enrollment_status: 'open',
    codigo: '',
    notes: '',
  })

  const courseAreaId = useCallback(
    (course?: Course | null) => {
      const relatedId = relationId(course?.area_formativa)
      if (relatedId) return relatedId

      const areaName = normalizeAreaLabel(course?.area)
      if (!areaName) return null

      return (
        areas.find((area) => normalizeAreaLabel(area.name) === areaName)?.id ??
        null
      )
    },
    [areas]
  )
  const courseAreaName = useCallback(
    (course?: Course | null) => {
      const relatedName = relationName(course?.area_formativa)
      if (relatedName) return relatedName
      const relatedId = courseAreaId(course)
      const matchedArea = relatedId ? areas.find((area) => area.id === relatedId) : undefined
      return matchedArea?.name ?? course?.area ?? null
    },
    [areas, courseAreaId]
  )

  const derivedAreas = useMemo(() => {
    if (areas.length) return areas
    const byId = new Map<string, AreaOption>()
    courses.forEach((course) => {
      const id = courseAreaId(course)
      if (!id) return
      byId.set(id, { id, name: courseAreaName(course) ?? `Área ${id}` })
    })
    return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name, 'es'))
  }, [areas, courseAreaId, courseAreaName, courses])

  // Combined list for the course/cycle selector, filtered by type and area.
  const programItems: ProgramItem[] = [
    ...cycles.map((c) => ({
      id: `cycle:${c.id}`,
      label: c.name,
      type: 'cycle' as const,
      imageUrl: resolveMediaUrl(c.image),
      description: 'Ciclo formativo oficial',
      meta: [
        { label: 'Tipo', value: 'Ciclo' },
        { label: 'Modalidad', value: c.duration?.modality || 'Por definir' },
        {
          label: 'Horas',
          value: c.duration?.totalHours ? `${c.duration.totalHours} h` : 'Por definir',
        },
        { label: 'Plazas', value: c.capacity ? `${c.capacity}` : 'Por definir' },
      ],
    })),
    ...courses
      .filter((c) => {
        const matchesType = form.trainingType
          ? normalizeCourseTrainingType(c) === form.trainingType
          : true
        const matchesArea = form.areaId ? courseAreaId(c) === form.areaId : true
        return matchesType && matchesArea
      })
      .map((c) => ({
        id: `course:${c.id}`,
        label: courseLabel(c),
        type: 'course' as const,
        imageUrl: resolveMediaUrl(c.featured_image),
        description: c.short_description || 'Curso de formación profesional',
        meta: [
          { label: 'Tipo', value: c.course_type || 'Curso' },
          { label: 'Área', value: courseAreaName(c) ?? 'Sin área' },
          { label: 'Modalidad', value: c.modality || 'Por definir' },
          { label: 'Horas', value: c.duration_hours ? `${c.duration_hours} h` : 'Por definir' },
          { label: 'Precio', value: formatCurrency(c.base_price) },
        ],
      })),
  ].filter((item) => {
    if (!form.trainingType) return true
    if (form.trainingType === 'ciclo') return item.type === 'cycle'
    return item.type === 'course'
  })
  const selectedProgram = programItems.find((item) => item.id === form.course)
  const selectedCourse = form.course.startsWith('course:')
    ? courses.find((course) => String(course.id) === form.course.replace(/^course:/, ''))
    : null
  const selectedCourseAreaId = relationId(selectedCourse?.area_formativa)
  const selectedCourseAreaName =
    courseAreaName(selectedCourse) ?? selectedCourse?.area ?? null
  const effectiveAreaId = selectedCourseAreaId || form.areaId || null
  const effectiveAreaName =
    selectedCourseAreaName ?? areas.find((area) => area.id === effectiveAreaId)?.name ?? null

  // -------------------------------------------------------------------------
  // Fetch data on mount
  // -------------------------------------------------------------------------

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      setError(null)

      try {
        const [cyclesRes, coursesRes, areasRes, campusesRes] = await Promise.all([
          fetch('/api/cycles?limit=100&sort=name&depth=1').then((r) => r.json()),
          fetch('/api/courses?limit=100&sort=name&depth=1').then((r) => r.json()),
          fetch('/api/areas-formativas', { cache: 'no-cache' }).then((r) => r.json()),
          fetch('/api/campuses?limit=100').then((r) => r.json()),
        ])

        setCycles(cyclesRes.docs ?? [])
        setCourses(coursesRes.docs ?? [])
        const areaDocs = Array.isArray(areasRes.data)
          ? areasRes.data
          : Array.isArray(areasRes.docs)
            ? areasRes.docs
            : []
        setAreas(
          areaDocs
            .filter((area: any) => area.active !== false && area.activo !== false)
            .map((area: any) => ({
              id: String(area.id),
              name: (area.nombre as string) || (area.name as string) || 'Área',
              color: (area.color as string) || null,
            }))
        )
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
    let mounted = true
    const params = new URLSearchParams({
      type: 'profesor',
      status: 'active',
      limit: '100',
    })
    fetch(`/api/staff?${params.toString()}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('No se pudieron cargar docentes'))))
      .then((data) => {
        if (!mounted) return
        setStaff(data.data ?? data.docs ?? [])
      })
      .catch((err) => {
        console.error('Error fetching staff:', err)
        if (mounted) setStaff([])
      })

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (!preselectedProfessorId) return
    setForm((prev) => (prev.instructor ? prev : { ...prev, instructor: preselectedProfessorId }))
  }, [preselectedProfessorId])

  useEffect(() => {
    if (!lockedProgramValue) return
    setForm((prev) => (prev.course ? prev : { ...prev, course: lockedProgramValue }))
  }, [lockedProgramValue])

  useEffect(() => {
    if (!form.course) return

    setForm((prev) => {
      if (!prev.course) return prev

      if (prev.course.startsWith('cycle:')) {
        if (prev.trainingType === 'ciclo' && prev.areaId === '') return prev
        return { ...prev, trainingType: 'ciclo', areaId: '' }
      }

      const course = courses.find((item) => String(item.id) === prev.course.replace(/^course:/, ''))
      if (!course) return prev

      const nextTrainingType = normalizeCourseTrainingType(course)
      const nextAreaId = courseAreaId(course) ?? prev.areaId
      if (prev.trainingType === nextTrainingType && prev.areaId === nextAreaId) return prev

      return {
        ...prev,
        trainingType: nextTrainingType,
        areaId: nextAreaId,
      }
    })
  }, [courseAreaId, courses, form.course])

  useEffect(() => {
    if (!form.campus) {
      setClassrooms([])
      setForm((prev) => (prev.classroom ? { ...prev, classroom: '' } : prev))
      return
    }

    let mounted = true
    setClassroomsLoading(true)
    fetch(`/api/aulas?campus_id=${encodeURIComponent(form.campus)}&active=true`, {
      cache: 'no-store',
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('No se pudieron cargar aulas'))))
      .then((data) => {
        if (!mounted) return
        setClassrooms(data.data ?? [])
      })
      .catch((err) => {
        console.error('Error loading classrooms:', err)
        if (mounted) setClassrooms([])
      })
      .finally(() => {
        if (mounted) setClassroomsLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [form.campus])

  useEffect(() => {
    const hasPlanningSlot = Boolean(
      form.course &&
      form.campus &&
      form.start_date &&
      form.end_date &&
      form.schedule_days.length &&
      form.schedule_time_start &&
      form.schedule_time_end
    )

    if (!hasPlanningSlot) {
      setAvailability(null)
      return
    }

    const params = new URLSearchParams()
    const selectedType = form.course.startsWith('cycle:') ? 'cycle' : 'course'
    const selectedId = form.course.replace(/^course:/, '').replace(/^cycle:/, '')
    params.set(selectedType, selectedId)
    params.set('campus', form.campus)
    if (form.classroom) params.set('classroom', form.classroom)
    if (form.instructor) params.set('instructor', form.instructor)
    params.set('start_date', form.start_date)
    params.set('end_date', form.end_date)
    params.set('shift', form.shift)
    params.set(
      'schedule_time_start',
      normalizeTimeForApi(form.schedule_time_start) ?? form.schedule_time_start
    )
    params.set(
      'schedule_time_end',
      normalizeTimeForApi(form.schedule_time_end) ?? form.schedule_time_end
    )
    params.set('max_students', String(form.max_students || 0))
    params.set(
      'training_type',
      selectedType === 'cycle' ? 'cycle' : getCourseTrainingPayloadType(form.trainingType)
    )
    for (const day of form.schedule_days) params.append('schedule_days', day)

    let mounted = true
    setAvailabilityLoading(true)
    fetch(`/api/course-runs/availability?${params.toString()}`, { cache: 'no-store' })
      .then((r) =>
        r.ok ? r.json() : Promise.reject(new Error('No se pudo validar disponibilidad'))
      )
      .then((data) => {
        if (mounted) setAvailability(data.availability ?? null)
      })
      .catch((err) => {
        console.error('Error validating new course run availability:', err)
        if (mounted) {
          setAvailability({
            blockers: [
              {
                type: 'availability_error',
                severity: 'blocker',
                message:
                  'No se pudo validar disponibilidad. Revisa conexión y vuelve a intentarlo.',
              },
            ],
            warnings: [],
          })
        }
      })
      .finally(() => {
        if (mounted) setAvailabilityLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [
    form.campus,
    form.classroom,
    form.course,
    form.end_date,
    form.instructor,
    form.max_students,
    form.schedule_days,
    form.schedule_time_end,
    form.schedule_time_start,
    form.shift,
    form.start_date,
  ])

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const toggleScheduleDay = (day: string) => {
    setForm((prev) => ({
      ...prev,
      schedule_days: prev.schedule_days.includes(day)
        ? prev.schedule_days.filter((item) => item !== day)
        : [...prev.schedule_days, day],
    }))
  }

  const staffDisplayName = (s: StaffMember) =>
    s.fullName ||
    [s.first_name ?? s.firstName, s.last_name ?? s.lastName].filter(Boolean).join(' ') ||
    s.email ||
    s.id

  // Inline creation callbacks
  const handleSedeCreated = useCallback((newCampus: Campus) => {
    setCampuses((prev) => [...prev, newCampus])
    setForm((prev) => ({ ...prev, campus: String(newCampus.id), classroom: '' }))
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

    const selectedType = form.course.startsWith('cycle:') ? 'cycle' : 'course'
    const selectedId = form.course.replace(/^course:/, '').replace(/^cycle:/, '')

    // Auto-generate codigo from campus slug + year
    const selectedCampus = campuses.find((c) => String(c.id) === form.campus)
    const campusCode = selectedCampus?.slug?.substring(0, 3).toUpperCase() || 'GEN'
    const year = new Date().getFullYear()
    const autoCode = form.codigo || `${campusCode}-${year}-${String(Date.now()).slice(-3)}`

    const body: Record<string, unknown> = {
      max_students: form.max_students,
      min_students: form.min_students || 1,
      status: form.status,
      codigo: autoCode,
    }

    if (selectedType === 'cycle') {
      body.cycle = selectedId
      body.training_type = 'cycle'
    } else {
      body.course = selectedId
      body.training_type = getCourseTrainingPayloadType(form.trainingType)
    }

    if (form.start_date) body.start_date = form.start_date
    if (form.end_date) body.end_date = form.end_date
    if (form.campus) body.campus = form.campus
    if (form.classroom) body.classroom = form.classroom
    if (form.instructor) body.instructor = form.instructor
    if (form.schedule_days.length > 0) body.schedule_days = form.schedule_days
    if (form.schedule_time_start)
      body.schedule_time_start = normalizeTimeForApi(form.schedule_time_start)
    if (form.schedule_time_end) body.schedule_time_end = normalizeTimeForApi(form.schedule_time_end)
    if (form.shift) body.shift = form.shift
    if (form.price_override !== '') body.price_override = Number(form.price_override)
    if (form.enrollment_status) body.enrollment_status = form.enrollment_status
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

      const data = await res.json().catch(() => null)
      const createdId = data?.doc?.id ?? data?.id
      router.push(createdId ? `/dashboard/programacion/${createdId}` : '/dashboard/programacion')
    } catch (err: any) {
      setError(err.message ?? 'Error al crear la convocatoria')
    } finally {
      setSubmitting(false)
    }
  }

  const canSubmit =
    form.trainingType !== '' &&
    (form.trainingType === 'ciclo' || form.areaId !== '') &&
    form.course !== '' &&
    form.campus !== '' &&
    (!form.start_date || !form.end_date || new Date(form.end_date) >= new Date(form.start_date)) &&
    (!form.schedule_time_start ||
      !form.schedule_time_end ||
      form.schedule_time_end > form.schedule_time_start) &&
    form.max_students > 0 &&
    !availabilityLoading &&
    (availability?.blockers.length ?? 0) === 0 &&
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
            <Button variant="outline" onClick={() => router.push('/dashboard/programacion')}>
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
              Necesitas al menos una sede para crear una convocatoria. La creación de sedes está
              restringida al equipo interno.
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
          <Button variant="outline" onClick={() => router.push('/dashboard/programacion')}>
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
        {/* Tipo, área y programa */}
        {/* ----------------------------------------------------------------- */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_280px_1fr]">
          <div className="space-y-2">
            <Label htmlFor="trainingType">Tipo de formación *</Label>
            <Select
              value={form.trainingType}
              onValueChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  trainingType: value,
                  areaId: '',
                  course: '',
                  instructor: '',
                }))
              }
              disabled={Boolean(lockedProgramValue)}
            >
              <SelectTrigger
                id="trainingType"
                className={lockedProgramValue ? 'bg-muted/60' : undefined}
              >
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                {TRAINING_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="area">Área</Label>
            <Select
              value={form.areaId}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, areaId: value, course: '', instructor: '' }))
              }
              disabled={!form.trainingType || form.trainingType === 'ciclo' || Boolean(lockedProgramValue)}
            >
              <SelectTrigger
                id="area"
                className={lockedProgramValue || form.trainingType === 'ciclo' ? 'bg-muted/60' : undefined}
              >
                <SelectValue
                  placeholder={
                    form.trainingType === 'ciclo'
                      ? 'No aplica a ciclos'
                      : form.trainingType
                        ? 'Seleccionar área'
                        : 'Selecciona tipo'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {derivedAreas.map((area) => (
                  <SelectItem key={area.id} value={area.id}>
                    <span className="flex items-center gap-2">
                      {area.color ? (
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: area.color }}
                        />
                      ) : null}
                      {area.name}
                    </span>
                  </SelectItem>
                ))}
                {derivedAreas.length === 0 && (
                  <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                    No hay áreas activas disponibles
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="program">Curso / ciclo *</Label>
            <Select
              value={form.course}
              onValueChange={(v) => updateField('course', v)}
              disabled={
                Boolean(lockedProgramValue) ||
                !form.trainingType ||
                (form.trainingType !== 'ciclo' && !form.areaId)
              }
            >
              <SelectTrigger
                id="program"
                className={lockedProgramValue ? 'bg-muted/60' : undefined}
              >
                <SelectValue
                  placeholder={
                    !form.trainingType
                      ? 'Selecciona tipo'
                      : form.trainingType !== 'ciclo' && !form.areaId
                        ? 'Selecciona área'
                        : 'Seleccionar curso/ciclo'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {programItems.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    <span className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {item.type === 'cycle' ? 'Ciclo' : 'Curso'}
                      </Badge>
                      {item.label}
                    </span>
                  </SelectItem>
                ))}
                {programItems.length === 0 && (
                  <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                    No hay programas disponibles para el filtro seleccionado
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>
          {lockedProgramValue && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground lg:col-span-3">
              <Lock className="h-3.5 w-3.5" />
              Convocatoria bloqueada al programa desde el que se ha iniciado la creación.
            </p>
          )}
          {selectedProgram && (
            <div className="overflow-hidden rounded-xl border bg-muted/25 lg:col-span-3">
              <div className="grid gap-0 md:grid-cols-[180px_1fr]">
                {selectedProgram.imageUrl ? (
                  <img
                    src={selectedProgram.imageUrl}
                    alt={selectedProgram.label}
                    className="h-40 w-full object-cover md:h-full"
                  />
                ) : (
                  <div className="flex h-40 items-center justify-center bg-muted text-muted-foreground md:h-full">
                    <Calendar className="h-8 w-8" />
                  </div>
                )}
                <div className="space-y-4 p-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">
                        {selectedProgram.type === 'cycle' ? 'Ciclo' : 'Curso'}
                      </Badge>
                      {lockedProgramValue && (
                        <Badge
                          variant="outline"
                          className="border-primary/30 bg-primary/10 text-primary"
                        >
                          Preseleccionado
                        </Badge>
                      )}
                    </div>
                    <h3 className="mt-2 text-lg font-semibold leading-tight">
                      {selectedProgram.label}
                    </h3>
                    {selectedProgram.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {selectedProgram.description}
                      </p>
                    )}
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    {selectedProgram.meta.map((item) => (
                      <div key={item.label} className="rounded-lg border bg-background px-3 py-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          {item.label}
                        </p>
                        <p className="mt-1 truncate text-sm font-medium">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* Sede + inline creation */}
        {/* ----------------------------------------------------------------- */}
        <div className="space-y-2">
          <Label htmlFor="campus">Sede *</Label>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Select
                value={form.campus}
                onValueChange={(v) => setForm((prev) => ({ ...prev, campus: v, classroom: '' }))}
              >
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
              disabled
              aria-disabled="true"
              title="La creación de sedes está restringida al equipo interno."
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {showNewSede && <InlineSedeForm onCreated={handleSedeCreated} compact />}
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* Fechas, turno y horario */}
        {/* ----------------------------------------------------------------- */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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
          <div className="space-y-2">
            <Label htmlFor="shift">Turno</Label>
            <Select value={form.shift} onValueChange={(v) => updateField('shift', v)}>
              <SelectTrigger id="shift">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SHIFT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-3">
          <Label>Días de clase</Label>
          <div className="flex flex-wrap gap-2">
            {WEEKDAY_OPTIONS.map((day) => {
              const selected = form.schedule_days.includes(day.value)
              return (
                <Button
                  key={day.value}
                  type="button"
                  variant="outline"
                  size="sm"
                  className={
                    selected
                      ? 'border-primary/30 bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary'
                      : ''
                  }
                  onClick={() => toggleScheduleDay(day.value)}
                >
                  {day.label}
                </Button>
              )
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            Selecciona los días reales de clase. Se usarán para validar aula y docente.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="schedule_time_start">Hora inicio</Label>
            <Input
              id="schedule_time_start"
              type="time"
              value={form.schedule_time_start}
              onChange={(e) => updateField('schedule_time_start', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="schedule_time_end">Hora fin</Label>
            <Input
              id="schedule_time_end"
              type="time"
              value={form.schedule_time_end}
              onChange={(e) => updateField('schedule_time_end', e.target.value)}
            />
          </div>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* Aula */}
        {/* ----------------------------------------------------------------- */}
        <div className="space-y-2">
          <Label htmlFor="classroom">Aula</Label>
          <Select
            value={form.classroom || '_none'}
            onValueChange={(v) => updateField('classroom', v === '_none' ? '' : v)}
            disabled={!form.campus || classroomsLoading}
          >
            <SelectTrigger id="classroom">
              <SelectValue
                placeholder={classroomsLoading ? 'Cargando aulas...' : 'Seleccionar aula'}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_none">Sin aula asignada</SelectItem>
              {classrooms.map((classroom) => {
                const capacity = classroom.capacity ?? classroom.capacidad
                return (
                  <SelectItem key={classroom.id} value={String(classroom.id)}>
                    <span className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      {classroom.name ??
                        classroom.nombre ??
                        classroom.code ??
                        `Aula ${classroom.id}`}
                      {capacity ? (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {capacity} plazas
                        </Badge>
                      ) : null}
                    </span>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
          {!form.campus && (
            <p className="text-xs text-muted-foreground">Selecciona una sede para ver sus aulas.</p>
          )}
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* Profesor + inline creation */}
        {/* ----------------------------------------------------------------- */}
        <div className="space-y-2">
          <Label htmlFor="instructor">Profesor</Label>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Select
                value={form.instructor || '_none'}
                onValueChange={(v) => updateField('instructor', v === '_none' ? '' : v)}
              >
                <SelectTrigger id="instructor">
                  <SelectValue placeholder="Seleccionar profesor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Sin profesor asignado</SelectItem>
                  {staff.map((s) => {
                    const instructorAvailability = getInstructorAvailability({
                      instructor: s,
                      requiredAreaId: effectiveAreaId,
                      requiredAreaName: effectiveAreaName,
                      timeConflicts: availability?.unavailableInstructors ?? [],
                    })
                    return (
                      <SelectItem key={s.id} value={String(s.id)} disabled={instructorAvailability.disabled}>
                        <span className="flex items-start gap-2">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="min-w-0">
                            <span className="block">{staffDisplayName(s)}</span>
                            {instructorAvailability.reasons.map((reason) => (
                              <span key={reason} className="block text-xs text-red-600">{reason}</span>
                            ))}
                          </span>
                        </span>
                      </SelectItem>
                    )
                  })}
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
              {showNewProfesor ? <ChevronUp className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            </Button>
          </div>
          {showNewProfesor && (
            <InlineProfesorForm
              onCreated={handleProfesorCreated}
              qualifiedAreaId={selectedCourseAreaId}
              qualifiedAreaName={selectedCourseAreaName}
              compact
            />
          )}
          <p className="text-xs text-muted-foreground">
            Los docentes no seleccionables muestran el motivo: área pendiente, área no compatible o
            convocatoria que ocupa la misma franja.
          </p>
        </div>

        {availabilityLoading || availability?.blockers.length || availability?.warnings.length ? (
          <div className="space-y-2 rounded-xl border bg-muted/30 p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              {availabilityLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : availability?.blockers.length ? (
                <XCircle className="h-4 w-4 text-red-600" />
              ) : (
                <Check className="h-4 w-4 text-emerald-600" />
              )}
              Validación de disponibilidad
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {form.schedule_days.length
                ? `${form.schedule_days.length} día(s)`
                : 'Sin días'} · {form.schedule_time_start || '--:--'} -{' '}
              {form.schedule_time_end || '--:--'}
            </div>
            {availabilityLoading && (
              <p className="text-sm text-muted-foreground">Validando aula, horario y docente...</p>
            )}
            {availability?.blockers.map((item, index) => (
              <p key={`blocker-${index}`} className="text-sm text-red-700">
                <span className="font-medium">No disponible: </span>{item.message}
              </p>
            ))}
            {availability?.warnings.map((item, index) => (
              <p key={`warning-${index}`} className="text-sm text-amber-700">
                {item.message}
              </p>
            ))}
            {!availabilityLoading &&
              availability &&
              availability.blockers.length === 0 &&
              availability.warnings.length === 0 && (
                <p className="text-sm text-emerald-700">
                  No se detectan conflictos para la configuración actual.
                </p>
              )}
          </div>
        ) : null}

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

        <div className="space-y-2">
          <Label htmlFor="enrollment_status">Estado de matrícula</Label>
          <Select
            value={form.enrollment_status}
            onValueChange={(v) => updateField('enrollment_status', v)}
          >
            <SelectTrigger id="enrollment_status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ENROLLMENT_STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Controla si la convocatoria acepta inscripciones en la web pública cuando se publique.
          </p>
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
          <Button variant="outline" onClick={() => router.push('/dashboard/programacion')}>
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
