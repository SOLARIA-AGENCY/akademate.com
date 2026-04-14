'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Input } from '@payload-config/components/ui/input'
import { Label } from '@payload-config/components/ui/label'
import { Textarea } from '@payload-config/components/ui/textarea'
import { Checkbox } from '@payload-config/components/ui/checkbox'
import { Switch } from '@payload-config/components/ui/switch'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import {
  MapPin,
  ArrowLeft,
  Save,
  Loader2,
  Plus,
  Trash2,
  Building2,
  Car,
  Clock,
  Image as ImageIcon,
  Users,
  Upload,
  X,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Classroom {
  name: string
  capacity: string
  floor: string
  equipment: string[]
  active: boolean
}

interface GalleryPhoto {
  file: File | null
  preview: string | null
  mediaId: number | null
  caption: string
  uploading: boolean
}

interface StaffOption {
  id: string | number
  name?: string
  firstName?: string
  lastName?: string
  fullName?: string
}

interface CycleOption {
  id: string | number
  name: string
}

interface CourseOption {
  id: string | number
  name: string
  title?: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EQUIPMENT_OPTIONS = [
  { value: 'projector', label: 'Proyector' },
  { value: 'digital_board', label: 'Pizarra digital' },
  { value: 'whiteboard', label: 'Pizarra blanca' },
  { value: 'wifi', label: 'WiFi' },
  { value: 'computers', label: 'Ordenadores' },
  { value: 'ac', label: 'Aire acondicionado' },
  { value: 'av_system', label: 'Audio/Video' },
  { value: 'lab', label: 'Laboratorio' },
  { value: 'workshop', label: 'Taller practico' },
]

const SERVICES_OPTIONS = [
  { value: 'wifi', label: 'WiFi gratuito' },
  { value: 'parking', label: 'Aparcamiento' },
  { value: 'cafeteria', label: 'Cafeteria' },
  { value: 'library', label: 'Biblioteca' },
  { value: 'accessibility', label: 'Acceso movilidad reducida' },
  { value: 'elevator', label: 'Ascensor' },
  { value: 'study_room', label: 'Sala de estudio' },
  { value: 'lockers', label: 'Taquillas' },
  { value: 'public_transport', label: 'Transporte publico cercano' },
  { value: 'front_desk', label: 'Secretaria presencial' },
  { value: 'break_area', label: 'Zona descanso' },
]

const TABS = [
  { id: 'general', label: 'General', icon: MapPin },
  { id: 'instalaciones', label: 'Instalaciones', icon: Building2 },
  { id: 'parking', label: 'Parking y Horarios', icon: Car },
  { id: 'imagen', label: 'Imagen', icon: ImageIcon },
  { id: 'asignaciones', label: 'Asignaciones', icon: Users },
] as const

type TabId = (typeof TABS)[number]['id']

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getStaffDisplayName(s: StaffOption): string {
  if (s.fullName) return s.fullName
  if (s.firstName || s.lastName) return `${s.firstName ?? ''} ${s.lastName ?? ''}`.trim()
  return s.name ?? `Staff #${s.id}`
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function NuevaSedeRage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>('general')

  // --- Tab 1: General ---
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [city, setCity] = useState('')
  const [province, setProvince] = useState('')
  const [address, setAddress] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [phone, setPhone] = useState('')
  const [phone2, setPhone2] = useState('')
  const [email, setEmail] = useState('')
  const [web, setWeb] = useState('')
  const [mapsUrl, setMapsUrl] = useState('')
  const [active, setActive] = useState(true)

  // --- Tab 2: Instalaciones ---
  const [capacity, setCapacity] = useState('')
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [services, setServices] = useState<string[]>([])

  // --- Tab 3: Parking & Horarios ---
  const [parkingAvailable, setParkingAvailable] = useState(false)
  const [parkingSpaces, setParkingSpaces] = useState('')
  const [parkingFree, setParkingFree] = useState(false)
  const [parkingNotes, setParkingNotes] = useState('')
  const [scheduleWeekdays, setScheduleWeekdays] = useState('')
  const [scheduleSaturday, setScheduleSaturday] = useState('')
  const [scheduleSunday, setScheduleSunday] = useState('')
  const [scheduleNotes, setScheduleNotes] = useState('')

  // --- Tab 4: Imagen ---
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadedImageId, setUploadedImageId] = useState<number | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [photos, setPhotos] = useState<GalleryPhoto[]>([])

  // --- Tab 5: Asignaciones ---
  const [coordinator, setCoordinator] = useState('')
  const [staffMembers, setStaffMembers] = useState<string[]>([])
  const [cyclesOffered, setCyclesOffered] = useState<string[]>([])
  const [coursesOffered, setCoursesOffered] = useState<string[]>([])

  // --- Options from API ---
  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([])
  const [cyclesOptions, setCyclesOptions] = useState<CycleOption[]>([])
  const [coursesOptions, setCoursesOptions] = useState<CourseOption[]>([])

  // Fetch options
  useEffect(() => {
    fetch('/api/staff?limit=100')
      .then((r) => r.json())
      .then((d) => setStaffOptions(d.docs || []))
      .catch(() => {})
    fetch('/api/cycles?limit=100&depth=0')
      .then((r) => r.json())
      .then((d) => setCyclesOptions(d.docs || []))
      .catch(() => {})
    fetch('/api/courses?limit=100&depth=0')
      .then((r) => r.json())
      .then((d) => setCoursesOptions(d.docs || []))
      .catch(() => {})
  }, [])

  // ---------------------------------------------------------------------------
  // Classroom helpers
  // ---------------------------------------------------------------------------

  function addClassroom() {
    setClassrooms((prev) => [
      ...prev,
      { name: '', capacity: '', floor: '', equipment: [], active: true },
    ])
  }

  function removeClassroom(index: number) {
    setClassrooms((prev) => prev.filter((_, i) => i !== index))
  }

  function updateClassroom(index: number, field: keyof Classroom, value: unknown) {
    setClassrooms((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  function toggleClassroomEquipment(index: number, equipValue: string) {
    setClassrooms((prev) => {
      const next = [...prev]
      const current = next[index].equipment
      next[index] = {
        ...next[index],
        equipment: current.includes(equipValue)
          ? current.filter((e) => e !== equipValue)
          : [...current, equipValue],
      }
      return next
    })
  }

  // ---------------------------------------------------------------------------
  // Multi-select toggle helper
  // ---------------------------------------------------------------------------

  function toggleArrayValue(
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    value: string,
  ) {
    setter((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    )
  }

  // ---------------------------------------------------------------------------
  // Image upload
  // ---------------------------------------------------------------------------

  const handleImageChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      setImagePreview(URL.createObjectURL(file))
      setUploadingImage(true)
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('alt', name || 'Sede')
        const res = await fetch('/api/media', { method: 'POST', body: formData })
        if (res.ok) {
          const uploaded = await res.json()
          if (uploaded.doc?.id) {
            setUploadedImageId(uploaded.doc.id)
          }
        }
      } catch (err) {
        console.error('Error uploading image:', err)
      } finally {
        setUploadingImage(false)
      }
    },
    [name],
  )

  // Gallery photo upload
  const handleGalleryPhotoUpload = useCallback(
    async (index: number, file: File) => {
      setPhotos((prev) => {
        const next = [...prev]
        next[index] = {
          ...next[index],
          file,
          preview: URL.createObjectURL(file),
          uploading: true,
        }
        return next
      })
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('alt', `${name || 'Sede'} - foto`)
        const res = await fetch('/api/media', { method: 'POST', body: formData })
        if (res.ok) {
          const uploaded = await res.json()
          if (uploaded.doc?.id) {
            setPhotos((prev) => {
              const next = [...prev]
              next[index] = { ...next[index], mediaId: uploaded.doc.id, uploading: false }
              return next
            })
            return
          }
        }
      } catch (err) {
        console.error('Error uploading gallery photo:', err)
      }
      setPhotos((prev) => {
        const next = [...prev]
        next[index] = { ...next[index], uploading: false }
        return next
      })
    },
    [name],
  )

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !city.trim()) {
      setError('Los campos Nombre y Ciudad son obligatorios.')
      setActiveTab('general')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const payload: Record<string, unknown> = {
        name,
        description: description || undefined,
        city,
        province: province || undefined,
        address: address || undefined,
        postal_code: postalCode || undefined,
        phone: phone || undefined,
        phone2: phone2 || undefined,
        email: email || undefined,
        web: web || undefined,
        maps_url: mapsUrl || undefined,
        active,
        capacity: capacity ? parseInt(capacity, 10) : undefined,
        classrooms: classrooms.length > 0
          ? classrooms.map((c) => ({
              ...c,
              capacity: c.capacity ? parseInt(c.capacity, 10) : undefined,
            }))
          : undefined,
        services: services.length > 0 ? services : undefined,
        parking: {
          available: parkingAvailable,
          spaces: parkingSpaces ? parseInt(parkingSpaces, 10) : undefined,
          free: parkingFree,
          notes: parkingNotes || undefined,
        },
        schedule: {
          weekdays: scheduleWeekdays || undefined,
          saturday: scheduleSaturday || undefined,
          sunday: scheduleSunday || undefined,
          notes: scheduleNotes || undefined,
        },
        ...(uploadedImageId ? { image: uploadedImageId } : {}),
        photos:
          photos.filter((p) => p.mediaId).length > 0
            ? photos
                .filter((p) => p.mediaId)
                .map((p) => ({ image: p.mediaId, caption: p.caption || undefined }))
            : undefined,
        coordinator: coordinator || undefined,
        staff_members: staffMembers.length > 0 ? staffMembers : undefined,
        cycles_offered: cyclesOffered.length > 0 ? cyclesOffered : undefined,
        courses_offered: coursesOffered.length > 0 ? coursesOffered : undefined,
        tenant: parseInt(process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID ?? '1', 10),
      }

      const res = await fetch('/api/campuses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const result = await res.json()
        throw new Error(result.errors?.[0]?.message ?? 'Error al crear la sede')
      }

      const result = await res.json()
      router.push(result.doc?.id ? `/dashboard/sedes/${result.doc.id}` : '/dashboard/sedes')
    } catch (err) {
      console.error('Error creating campus:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
      setSaving(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nueva Sede"
        description="Registra un nuevo centro o campus"
        icon={MapPin}
      />

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/sedes')}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Volver a Sedes
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-border">
        <div className="flex gap-1 overflow-x-auto pb-px scrollbar-none">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`
                flex items-center gap-2 whitespace-nowrap px-3 py-2.5 text-sm font-medium border-b-2 transition-colors
                ${
                  activeTab === id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }
              `}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-md bg-destructive/10 text-destructive text-sm">
          <p className="font-semibold">Error</p>
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* ============================================================= */}
        {/* TAB 1: GENERAL */}
        {/* ============================================================= */}
        {activeTab === 'general' && (
          <Card>
            <CardHeader>
              <CardTitle>Datos Generales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Nombre <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                    required
                    placeholder="Sede Central"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">
                    Ciudad <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCity(e.target.value)}
                    required
                    placeholder="Santa Cruz de Tenerife"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripcion</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setDescription(e.target.value)
                  }
                  rows={4}
                  placeholder="Descripcion de la sede..."
                />
              </div>

              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="province">Provincia</Label>
                  <Input
                    id="province"
                    value={province}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setProvince(e.target.value)
                    }
                    placeholder="Santa Cruz de Tenerife"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postal_code">Codigo Postal</Label>
                  <Input
                    id="postal_code"
                    value={postalCode}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPostalCode(e.target.value)
                    }
                    placeholder="38001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefono</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
                    placeholder="+34 922 123 456"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Direccion</Label>
                <Textarea
                  id="address"
                  value={address}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setAddress(e.target.value)
                  }
                  rows={2}
                  placeholder="Calle Principal 123, Planta 2"
                />
              </div>

              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="phone2">Telefono secundario</Label>
                  <Input
                    id="phone2"
                    value={phone2}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone2(e.target.value)}
                    placeholder="+34 922 654 321"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                    placeholder="info@sede.akademate.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="web">Web</Label>
                  <Input
                    id="web"
                    value={web}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWeb(e.target.value)}
                    placeholder="https://sede.akademate.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maps_url">Enlace Google Maps</Label>
                <Input
                  id="maps_url"
                  value={mapsUrl}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMapsUrl(e.target.value)}
                  placeholder="https://maps.google.com/..."
                />
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
                <Checkbox
                  id="active"
                  checked={active}
                  onCheckedChange={(v) => setActive(v === true)}
                />
                <Label htmlFor="active" className="cursor-pointer">
                  Sede activa
                </Label>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ============================================================= */}
        {/* TAB 2: INSTALACIONES */}
        {/* ============================================================= */}
        {activeTab === 'instalaciones' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Capacidad General</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-w-xs">
                  <Label htmlFor="capacity">Capacidad total (alumnos)</Label>
                  <Input
                    id="capacity"
                    type="number"
                    min="0"
                    value={capacity}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCapacity(e.target.value)
                    }
                    placeholder="200"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Classrooms */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Aulas</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={addClassroom}>
                  <Plus className="h-4 w-4 mr-1" />
                  Anadir Aula
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {classrooms.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No hay aulas definidas. Anade la primera.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {classrooms.map((cls, i) => (
                      <div
                        key={i}
                        className="p-4 rounded-lg border border-border bg-muted/30 space-y-4"
                      >
                        <div className="flex items-start justify-between">
                          <span className="text-sm font-medium text-muted-foreground">
                            Aula {i + 1}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeClassroom(i)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                          <div className="space-y-1">
                            <Label>
                              Nombre <span className="text-destructive">*</span>
                            </Label>
                            <Input
                              value={cls.name}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                updateClassroom(i, 'name', e.target.value)
                              }
                              placeholder="Aula 101"
                              required
                            />
                          </div>
                          <div className="space-y-1">
                            <Label>Capacidad</Label>
                            <Input
                              type="number"
                              min="0"
                              value={cls.capacity}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                updateClassroom(i, 'capacity', e.target.value)
                              }
                              placeholder="30"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label>Planta</Label>
                            <Input
                              value={cls.floor}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                updateClassroom(i, 'floor', e.target.value)
                              }
                              placeholder="Planta 1"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Equipamiento</Label>
                          <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                            {EQUIPMENT_OPTIONS.map((opt) => (
                              <div key={opt.value} className="flex items-center gap-2">
                                <Checkbox
                                  id={`equip-${i}-${opt.value}`}
                                  checked={cls.equipment.includes(opt.value)}
                                  onCheckedChange={() =>
                                    toggleClassroomEquipment(i, opt.value)
                                  }
                                />
                                <Label
                                  htmlFor={`equip-${i}-${opt.value}`}
                                  className="text-sm cursor-pointer font-normal"
                                >
                                  {opt.label}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`cls-active-${i}`}
                            checked={cls.active}
                            onCheckedChange={(v) =>
                              updateClassroom(i, 'active', v === true)
                            }
                          />
                          <Label
                            htmlFor={`cls-active-${i}`}
                            className="text-sm cursor-pointer font-normal"
                          >
                            Aula activa
                          </Label>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Services */}
            <Card>
              <CardHeader>
                <CardTitle>Servicios</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                  {SERVICES_OPTIONS.map((opt) => (
                    <div key={opt.value} className="flex items-center gap-2">
                      <Checkbox
                        id={`svc-${opt.value}`}
                        checked={services.includes(opt.value)}
                        onCheckedChange={() => toggleArrayValue(setServices, opt.value)}
                      />
                      <Label
                        htmlFor={`svc-${opt.value}`}
                        className="text-sm cursor-pointer font-normal"
                      >
                        {opt.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ============================================================= */}
        {/* TAB 3: PARKING & HORARIOS */}
        {/* ============================================================= */}
        {activeTab === 'parking' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Aparcamiento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Switch
                    id="parking-available"
                    checked={parkingAvailable}
                    onCheckedChange={setParkingAvailable}
                  />
                  <Label htmlFor="parking-available" className="cursor-pointer">
                    Aparcamiento disponible
                  </Label>
                </div>

                {parkingAvailable && (
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 pt-2">
                    <div className="space-y-2">
                      <Label htmlFor="parking-spaces">Numero de plazas</Label>
                      <Input
                        id="parking-spaces"
                        type="number"
                        min="0"
                        value={parkingSpaces}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setParkingSpaces(e.target.value)
                        }
                        placeholder="50"
                      />
                    </div>
                    <div className="flex items-center gap-3 self-end pb-2">
                      <Switch
                        id="parking-free"
                        checked={parkingFree}
                        onCheckedChange={setParkingFree}
                      />
                      <Label htmlFor="parking-free" className="cursor-pointer">
                        Gratuito
                      </Label>
                    </div>
                    <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                      <Label htmlFor="parking-notes">Notas</Label>
                      <Input
                        id="parking-notes"
                        value={parkingNotes}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setParkingNotes(e.target.value)
                        }
                        placeholder="Acceso por calle lateral..."
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Horarios</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="sched-weekdays">Lunes a Viernes</Label>
                    <Input
                      id="sched-weekdays"
                      value={scheduleWeekdays}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setScheduleWeekdays(e.target.value)
                      }
                      placeholder="08:00 - 21:00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sched-saturday">Sabado</Label>
                    <Input
                      id="sched-saturday"
                      value={scheduleSaturday}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setScheduleSaturday(e.target.value)
                      }
                      placeholder="09:00 - 14:00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sched-sunday">Domingo</Label>
                    <Input
                      id="sched-sunday"
                      value={scheduleSunday}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setScheduleSunday(e.target.value)
                      }
                      placeholder="Cerrado"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sched-notes">Notas de horario</Label>
                  <Input
                    id="sched-notes"
                    value={scheduleNotes}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setScheduleNotes(e.target.value)
                    }
                    placeholder="Horario especial en festivos..."
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ============================================================= */}
        {/* TAB 4: IMAGEN */}
        {/* ============================================================= */}
        {activeTab === 'imagen' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Imagen principal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Subir imagen</Label>
                  <label className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors block">
                    {uploadingImage ? (
                      <Loader2 className="h-6 w-6 mx-auto animate-spin text-primary" />
                    ) : (
                      <ImageIcon className="h-6 w-6 mx-auto text-muted-foreground" />
                    )}
                    <p className="text-sm text-muted-foreground mt-1">
                      {uploadingImage ? 'Subiendo...' : 'Arrastra o haz click para seleccionar'}
                    </p>
                    <p className="text-xs text-muted-foreground">PNG, JPG. Recomendado: 1200x400px</p>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        handleImageChange(e)
                        e.target.value = ''
                      }}
                      disabled={uploadingImage}
                    />
                  </label>
                </div>
                {imagePreview && (
                  <div className="relative w-full max-w-md">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="rounded-lg border border-border object-cover w-full h-48"
                    />
                    {uploadedImageId && (
                      <span className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                        Subida
                      </span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Gallery */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Galeria de fotos</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPhotos((prev) => [
                      ...prev,
                      {
                        file: null,
                        preview: null,
                        mediaId: null,
                        caption: '',
                        uploading: false,
                      },
                    ])
                  }
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Anadir foto
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {photos.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No hay fotos en la galeria. Anade la primera.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {photos.map((photo, i) => (
                      <div
                        key={i}
                        className="flex flex-col sm:flex-row items-start gap-4 p-4 rounded-lg border border-border bg-muted/30"
                      >
                        <div className="flex-shrink-0 w-full sm:w-40">
                          {photo.preview ? (
                            <img
                              src={photo.preview}
                              alt={photo.caption || `Foto ${i + 1}`}
                              className="rounded border border-border object-cover w-full h-28"
                            />
                          ) : (
                            <label className="flex flex-col items-center justify-center w-full h-28 rounded border-2 border-dashed border-border cursor-pointer hover:bg-muted/50 transition-colors">
                              <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                              <span className="text-xs text-muted-foreground">Subir</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) handleGalleryPhotoUpload(i, file)
                                }}
                              />
                            </label>
                          )}
                          {photo.uploading && (
                            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Subiendo...
                            </div>
                          )}
                        </div>
                        <div className="flex-1 space-y-2 w-full">
                          <Input
                            value={photo.caption}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setPhotos((prev) => {
                                const next = [...prev]
                                next[i] = { ...next[i], caption: e.target.value }
                                return next
                              })
                            }
                            placeholder="Pie de foto (opcional)"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                          className="text-destructive hover:text-destructive self-start"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ============================================================= */}
        {/* TAB 5: ASIGNACIONES */}
        {/* ============================================================= */}
        {activeTab === 'asignaciones' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Coordinador</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-w-md">
                  <Label htmlFor="coordinator">Coordinador de sede</Label>
                  <select
                    id="coordinator"
                    value={coordinator}
                    onChange={(e) => setCoordinator(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">Sin asignar</option>
                    {staffOptions.map((s) => (
                      <option key={s.id} value={String(s.id)}>
                        {getStaffDisplayName(s)}
                      </option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Personal asignado</CardTitle>
              </CardHeader>
              <CardContent>
                {staffOptions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No hay personal disponible. Crea registros de personal primero.
                  </p>
                ) : (
                  <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {staffOptions.map((s) => (
                      <div key={s.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`staff-${s.id}`}
                          checked={staffMembers.includes(String(s.id))}
                          onCheckedChange={() =>
                            toggleArrayValue(setStaffMembers, String(s.id))
                          }
                        />
                        <Label
                          htmlFor={`staff-${s.id}`}
                          className="text-sm cursor-pointer font-normal"
                        >
                          {getStaffDisplayName(s)}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ciclos ofertados</CardTitle>
              </CardHeader>
              <CardContent>
                {cyclesOptions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No hay ciclos disponibles.
                  </p>
                ) : (
                  <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {cyclesOptions.map((c) => (
                      <div key={c.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`cycle-${c.id}`}
                          checked={cyclesOffered.includes(String(c.id))}
                          onCheckedChange={() =>
                            toggleArrayValue(setCyclesOffered, String(c.id))
                          }
                        />
                        <Label
                          htmlFor={`cycle-${c.id}`}
                          className="text-sm cursor-pointer font-normal"
                        >
                          {c.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cursos ofertados</CardTitle>
              </CardHeader>
              <CardContent>
                {coursesOptions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No hay cursos disponibles.
                  </p>
                ) : (
                  <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {coursesOptions.map((c) => (
                      <div key={c.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`course-${c.id}`}
                          checked={coursesOffered.includes(String(c.id))}
                          onCheckedChange={() =>
                            toggleArrayValue(setCoursesOffered, String(c.id))
                          }
                        />
                        <Label
                          htmlFor={`course-${c.id}`}
                          className="text-sm cursor-pointer font-normal"
                        >
                          {c.title || c.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ============================================================= */}
        {/* FOOTER: Submit */}
        {/* ============================================================= */}
        <div className="flex gap-4 justify-end pt-6 border-t border-border mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/dashboard/sedes')}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Crear Sede
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
