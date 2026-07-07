'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Input } from '@payload-config/components/ui/input'
import { Label } from '@payload-config/components/ui/label'
import { Textarea } from '@payload-config/components/ui/textarea'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { QualifiedAreasMultiSelect } from '@payload-config/components/ui/QualifiedAreasMultiSelect'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@payload-config/components/ui/select'
import {
  ArrowLeft,
  GraduationCap,
  Save,
  Loader2,
  MapPin,
  Plus,
  Trash2,
  Upload,
  User,
  X,
} from 'lucide-react'
import { formatSpanishPhoneInput } from '@/lib/phone'
import { formatStaffEmailInput, formatStaffNifInput } from '@/lib/staff-contact'

interface Campus {
  id: number
  name: string
  city: string
}

interface CampusApiResponse {
  success?: boolean
  data?: Campus[]
  docs?: Campus[]
}

interface TrainingArea {
  id: number
  nombre: string
  descripcion?: string
  active?: boolean
}

interface AreasApiResponse {
  success?: boolean
  data?: TrainingArea[]
}

interface StaffPhotoUploadResponse {
  success?: boolean
  doc?: {
    id?: string | number
    filename?: string | null
    url?: string | null
  }
  error?: string
}

function TeacherPhotoFallback() {
  return (
    <div
      aria-label="Imagen genérica de docente"
      className="relative flex h-20 w-20 items-center justify-center rounded-full border bg-primary/10 text-primary"
    >
      <User className="h-9 w-9" aria-hidden="true" />
      <div className="absolute -right-1 -top-1 rounded-full border bg-background p-1 shadow-sm">
        <GraduationCap className="h-5 w-5" aria-hidden="true" />
      </div>
    </div>
  )
}

interface StaffApiResponse {
  success: boolean
  data: { id: number }
  error?: string
}

interface Certification {
  title: string
  institution: string
  year: number | ''
}

export default function NewProfesorPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingCampuses, setLoadingCampuses] = useState(true)
  const [loadingAreas, setLoadingAreas] = useState(true)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [campuses, setCampuses] = useState<Campus[]>([])
  const [areas, setAreas] = useState<TrainingArea[]>([])
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoId, setPhotoId] = useState('')

  const [formData, setFormData] = useState({
    firstName: '',
    firstSurname: '',
    secondSurname: '',
    nif: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    position: 'Docente',
    contractType: 'full_time',
    employmentStatus: 'active',
    bio: '',
    hireDate: new Date().toISOString().split('T')[0],
    baseCampusId: null as number | null,
    assignedCampuses: [] as number[],
    qualifiedAreas: [] as number[],
    certifications: [] as Certification[],
  })

  useEffect(() => {
    async function loadCampuses() {
      try {
        const response = await fetch('/api/campuses?limit=100')
        if (!response.ok) throw new Error('Failed to load campuses')

        const result = (await response.json()) as CampusApiResponse
        setCampuses(result.data ?? result.docs ?? [])
      } catch (err) {
        console.error('Error loading campuses:', err)
      } finally {
        setLoadingCampuses(false)
      }
    }
    void loadCampuses()
  }, [])

  useEffect(() => {
    async function loadAreas() {
      try {
        const response = await fetch('/api/areas-formativas', { cache: 'no-cache' })
        if (!response.ok) throw new Error('Failed to load training areas')

        const result = (await response.json()) as AreasApiResponse
        setAreas((result.data ?? []).filter((area) => area.active !== false))
      } catch (err) {
        console.error('Error loading training areas:', err)
        setAreas([])
      } finally {
        setLoadingAreas(false)
      }
    }
    void loadAreas()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (formData.qualifiedAreas.length === 0) {
        throw new Error('Asigna al menos un área habilitada antes de guardar este docente.')
      }
      if (!formData.baseCampusId) {
        throw new Error('Selecciona una sede base antes de guardar este docente.')
      }

      const normalizedNif = formatStaffNifInput(formData.nif)
      const normalizedEmail = formatStaffEmailInput(formData.email)
      setFormData((prev) => ({ ...prev, nif: normalizedNif, email: normalizedEmail }))

      const lastName = [formData.firstSurname, formData.secondSurname]
        .map((value) => value.trim())
        .filter(Boolean)
        .join(' ')

      const response = await fetch('/api/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          staffType: 'profesor',
          firstName: formData.firstName,
          firstSurname: formData.firstSurname,
          secondSurname: formData.secondSurname,
          lastName,
          nif: normalizedNif || undefined,
          email: normalizedEmail || undefined,
          phone: formData.phone,
          address: formData.address || undefined,
          city: formData.city || undefined,
          postalCode: formData.postalCode || undefined,
          position: 'Docente',
          contractType: formData.contractType,
          employmentStatus: formData.employmentStatus,
          hireDate: formData.hireDate,
          bio: formData.bio,
          certifications: formData.certifications
            .filter((cert) => cert.title.trim())
            .map((cert) => ({
              title: cert.title.trim(),
              institution: cert.institution.trim(),
              year: cert.year ? Number(cert.year) : new Date().getFullYear(),
          })),
          assignedCampuses: formData.assignedCampuses,
          baseCampusId: formData.baseCampusId,
          qualifiedAreas: formData.qualifiedAreas,
          photoId: photoId || undefined,
        }),
      })

      const result = (await response.json()) as StaffApiResponse

      if (!response.ok || !result.success) {
        throw new Error(result.error ?? 'Error creating professor')
      }

      // Redirect to detail page
      router.push(`/dashboard/profesores/${result.data.id}`)
    } catch (err) {
      console.error('Error creating professor:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      setLoading(false)
    }
  }

  const handleInputChange =
    (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }))
    }

  const handlePhoneBlur = () => {
    setFormData((prev) => ({ ...prev, phone: formatSpanishPhoneInput(prev.phone) }))
  }

  const handleNifBlur = () => {
    setFormData((prev) => ({ ...prev, nif: formatStaffNifInput(prev.nif) }))
  }

  const handleEmailBlur = () => {
    setFormData((prev) => ({ ...prev, email: formatStaffEmailInput(prev.email) }))
  }

  const handleSelectChange = (field: string) => (value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleBaseCampusChange = (value: string) => {
    const campusId = Number(value)
    if (Number.isNaN(campusId)) return
    setFormData((prev) => ({
      ...prev,
      baseCampusId: campusId,
      assignedCampuses: prev.assignedCampuses.includes(campusId)
        ? prev.assignedCampuses
        : [...prev.assignedCampuses, campusId],
    }))
  }

  const handleAddAssignedCampus = (value: string) => {
    const campusId = Number(value)
    if (Number.isNaN(campusId)) return
    setFormData((prev) => ({
      ...prev,
      baseCampusId: prev.baseCampusId ?? campusId,
      assignedCampuses: prev.assignedCampuses.includes(campusId)
        ? prev.assignedCampuses
        : [...prev.assignedCampuses, campusId],
    }))
  }

  const handleRemoveAssignedCampus = (campusId: number) => {
    setFormData((prev) => {
      if (prev.baseCampusId === campusId) return prev
      return {
        ...prev,
        assignedCampuses: prev.assignedCampuses.filter((id) => id !== campusId),
      }
    })
  }

  const toggleQualifiedArea = (areaId: number) => {
    setFormData((prev) => ({
      ...prev,
      qualifiedAreas: prev.qualifiedAreas.includes(areaId)
        ? prev.qualifiedAreas.filter((id) => id !== areaId)
        : [...prev.qualifiedAreas, areaId],
    }))
  }

  const handlePhotoUpload = async (file: File) => {
    setUploadingPhoto(true)
    setError(null)
    try {
      setPhotoPreview(URL.createObjectURL(file))
      const body = new FormData()
      body.append('file', file)
      body.append(
        'alt',
        `${formData.firstName || 'Profesor'} ${formData.firstSurname || ''} ${
          formData.secondSurname || ''
        }`.trim()
      )
      const response = await fetch('/api/staff-photo', { method: 'POST', body })
      const result = (await response.json().catch(() => ({}))) as StaffPhotoUploadResponse

      if (!response.ok || !result.success || !result.doc?.id) {
        throw new Error(
          typeof result?.error === 'string' ? result.error : 'No se pudo subir la foto'
        )
      }

      setPhotoId(String(result.doc.id))
      setPhotoPreview(
        result.doc.url || (result.doc.filename ? `/api/media/file/${result.doc.filename}` : null)
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo subir la foto')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const addCertification = () => {
    setFormData((prev) => ({
      ...prev,
      certifications: [...prev.certifications, { title: '', institution: '', year: '' }],
    }))
  }

  const updateCertification = (index: number, field: keyof Certification, value: string) => {
    setFormData((prev) => ({
      ...prev,
      certifications: prev.certifications.map((cert, certIndex) =>
        certIndex === index
          ? { ...cert, [field]: field === 'year' ? (value ? Number(value) : '') : value }
          : cert
      ),
    }))
  }

  const removeCertification = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      certifications: prev.certifications.filter((_, certIndex) => certIndex !== index),
    }))
  }

  const selectedCampuses = campuses.filter((campus) => formData.assignedCampuses.includes(campus.id))
  const availableCampuses = campuses.filter(
    (campus) => !formData.assignedCampuses.includes(campus.id)
  )
  const createBlockedReason =
    formData.qualifiedAreas.length === 0
      ? 'Bloqueado: asigna al menos un área habilitada.'
      : !formData.baseCampusId
        ? 'Bloqueado: selecciona una sede base.'
        : formData.assignedCampuses.length === 0
          ? 'Bloqueado: añade al menos una sede asignada.'
          : null

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6" data-oid="nqgh2_8">
      <PageHeader
        title="Nuevo Profesor"
        description="Añade un nuevo profesor al sistema"
        icon={User}
        actions={
          <Button variant="ghost" size="icon" onClick={() => router.back()} data-oid="k1x7g23">
            <ArrowLeft className="h-5 w-5" data-oid="5wl5ypj" />
          </Button>
        }
        data-oid="yblu_3s"
      />

      <form onSubmit={handleSubmit} data-oid="-u10:f_">
        <Card data-oid="ej96j8j">
          <CardHeader data-oid="bn3ew0-">
            <CardTitle data-oid="mqs4jr5">Información del Profesor</CardTitle>
            <CardDescription data-oid="bdf39bn">
              Completa los datos del nuevo profesor. Los campos marcados con * son obligatorios.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6" data-oid="y4.yy7v">
            {/* Error Message */}
            {error && (
              <div
                className="p-4 rounded-md bg-destructive/10 text-destructive text-sm"
                data-oid="9zti6t5"
              >
                <p className="font-semibold" data-oid="_rm7.a3">
                  Error al crear profesor
                </p>
                <p data-oid="wv07zng">{error}</p>
              </div>
            )}

            <div className="space-y-3">
              <Label htmlFor="photo-upload">Foto del profesor</Label>
              <div className="flex items-center gap-4">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Foto del profesor"
                    className="h-20 w-20 rounded-full object-cover border"
                    onError={() => setPhotoPreview(null)}
                  />
                ) : (
                  <TeacherPhotoFallback />
                )}
                <div>
                  <Input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    disabled={uploadingPhoto || loading}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) void handlePhotoUpload(file)
                    }}
                  />
                  <Label
                    htmlFor="photo-upload"
                    className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium shadow-sm transition-colors hover:bg-primary/10 hover:text-primary"
                  >
                    {uploadingPhoto ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Upload className="h-4 w-4" aria-hidden="true" />
                    )}
                    {uploadingPhoto ? 'Subiendo imagen...' : 'Seleccionar imagen'}
                  </Label>
                </div>
              </div>
            </div>

            {/* Personal Info */}
            <div className="grid gap-4 md:grid-cols-3" data-oid="lchd9n8">
              <div className="space-y-2" data-oid="-79k8qs">
                <Label htmlFor="firstName" data-oid="q27hvoa">
                  Nombre{' '}
                  <span className="text-destructive" data-oid="vi_jym8">
                    *
                  </span>
                </Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange('firstName')}
                  required
                  placeholder="Juan"
                  data-oid="4wd:ggf"
                />
              </div>

              <div className="space-y-2" data-oid="ekzlnto">
                <Label htmlFor="firstSurname" data-oid="mpbpc7d">
                  Primer apellido{' '}
                  <span className="text-destructive" data-oid="61qi481">
                    *
                  </span>
                </Label>
                <Input
                  id="firstSurname"
                  value={formData.firstSurname}
                  onChange={handleInputChange('firstSurname')}
                  required
                  placeholder="Pérez"
                  data-oid="g:lz9bb"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondSurname">Segundo apellido</Label>
                <Input
                  id="secondSurname"
                  value={formData.secondSurname}
                  onChange={handleInputChange('secondSurname')}
                  placeholder="García"
                />
              </div>
            </div>

            {/* Contact Info */}
            <div className="grid gap-4 md:grid-cols-3" data-oid="grbkuel">
              <div className="space-y-2">
                <Label htmlFor="nif">NIF/DNI</Label>
                <Input
                  id="nif"
                  value={formData.nif}
                  onChange={handleInputChange('nif')}
                  onBlur={handleNifBlur}
                  placeholder="00000000A"
                />
              </div>

              <div className="space-y-2" data-oid="4_o4wae">
                <Label htmlFor="email" data-oid="kqrl_j8">
                  Email{' '}
                  <span className="text-destructive" data-oid="ff1hn2p">
                    *
                  </span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  onBlur={handleEmailBlur}
                  required
                  placeholder="juan.perez@akademate.com"
                  data-oid="e2ld8h0"
                />
              </div>

              <div className="space-y-2" data-oid="pxjrp8v">
                <Label htmlFor="phone" data-oid="ui9xf9c">
                  Teléfono
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  value={formData.phone}
                  onChange={handleInputChange('phone')}
                  onBlur={handlePhoneBlur}
                  placeholder="+34 922 123 456"
                  data-oid="if68lhd"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[2fr_1fr_140px]">
              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={handleInputChange('address')}
                  placeholder="Calle, número, piso..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Ciudad</Label>
                <Input id="city" value={formData.city} onChange={handleInputChange('city')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postalCode">Código postal</Label>
                <Input
                  id="postalCode"
                  value={formData.postalCode}
                  onChange={handleInputChange('postalCode')}
                  inputMode="numeric"
                />
              </div>
            </div>

            <div className="space-y-3 rounded-lg border p-4">
              <div className="space-y-1">
                <Label>Áreas habilitadas para docencia</Label>
              </div>
              {loadingAreas ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cargando áreas...
                </div>
              ) : areas.length === 0 ? (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  No hay áreas formativas activas disponibles. Podrás completar esta información
                  desde la edición del docente.
                </div>
              ) : (
                <QualifiedAreasMultiSelect
                  areas={areas}
                  selectedAreaIds={formData.qualifiedAreas}
                  onToggleArea={toggleQualifiedArea}
                />
              )}
            </div>

            {/* Employment Details */}
            <div className="grid gap-4 md:grid-cols-3" data-oid="6b69:.u">
              <div className="space-y-2" data-oid="4uzr0ba">
                <Label htmlFor="contractType" data-oid=":w_787_">
                  Tipo de Contrato
                </Label>
                <Select
                  value={formData.contractType}
                  onValueChange={handleSelectChange('contractType')}
                  data-oid="p3w8buz"
                >
                  <SelectTrigger id="contractType" data-oid="isytw.a">
                    <SelectValue data-oid="ht_l8b2" />
                  </SelectTrigger>
                  <SelectContent data-oid="c:enp_e">
                    <SelectItem value="general_regime">Régimen General</SelectItem>
                    <SelectItem value="full_time" data-oid="37yi7bc">
                      Tiempo Completo
                    </SelectItem>
                    <SelectItem value="part_time" data-oid="p098fqe">
                      Medio Tiempo
                    </SelectItem>
                    <SelectItem value="freelance" data-oid="96g9elm">
                      Autónomo
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2" data-oid="j1f1t3r">
                <Label htmlFor="employmentStatus" data-oid="5gmw:4j">
                  Estado
                </Label>
                <Select
                  value={formData.employmentStatus}
                  onValueChange={handleSelectChange('employmentStatus')}
                  data-oid="a84l2sd"
                >
                  <SelectTrigger id="employmentStatus" data-oid="z88_ia5">
                    <SelectValue data-oid="z2hwsz8" />
                  </SelectTrigger>
                  <SelectContent data-oid="m8c..bd">
                    <SelectItem value="active" data-oid="sqn7qgs">
                      Activo
                    </SelectItem>
                    <SelectItem value="temporary_leave" data-oid="5hdsq4:">
                      Baja Temporal
                    </SelectItem>
                    <SelectItem value="inactive" data-oid="m4wzz7l">
                      Inactivo
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2" data-oid="ca8d_2p">
                <Label htmlFor="hireDate" data-oid="hs8gc2t">
                  Fecha de Contratación{' '}
                  <span className="text-destructive" data-oid="106z1x4">
                    *
                  </span>
                </Label>
                <Input
                  id="hireDate"
                  type="date"
                  value={formData.hireDate}
                  onChange={handleInputChange('hireDate')}
                  required
                  data-oid="4m5c.pq"
                />
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(220px,320px)_1fr]">
              <div className="space-y-2" data-oid="mru1ua6">
                <Label htmlFor="baseCampus" data-oid="y6ceg6d">
                  Sede base{' '}
                  <span className="text-destructive" data-oid="4anwf0v">
                    *
                  </span>
                </Label>
                {loadingCampuses ? (
                  <div
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                    data-oid="9xmhatw"
                  >
                    <Loader2 className="h-4 w-4 animate-spin" data-oid="akxt0cs" />
                    Cargando sedes...
                  </div>
                ) : campuses.length === 0 ? (
                  <p className="text-sm text-muted-foreground" data-oid="l.qq7gv">
                    No hay sedes disponibles
                  </p>
                ) : (
                  <Select
                    value={formData.baseCampusId ? String(formData.baseCampusId) : undefined}
                    onValueChange={handleBaseCampusChange}
                    data-oid="8ed4v20"
                  >
                    <SelectTrigger id="baseCampus" aria-label="Sede base">
                      <SelectValue placeholder="Selecciona una sede base" />
                    </SelectTrigger>
                    <SelectContent>
                      {campuses.map((campus) => (
                        <SelectItem key={campus.id} value={String(campus.id)}>
                          <span className="inline-flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5" />
                            {campus.name}
                            {campus.city ? ` - ${campus.city}` : ''}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-3 rounded-lg border p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Label>Sedes asignadas</Label>
                  <Select onValueChange={handleAddAssignedCampus}>
                    <SelectTrigger className="h-9 w-full sm:w-56" aria-label="Añadir sede">
                      <SelectValue placeholder="Añadir sede" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCampuses.length === 0 ? (
                        <SelectItem value="none" disabled>
                          Todas las sedes asignadas
                        </SelectItem>
                      ) : (
                        availableCampuses.map((campus) => (
                          <SelectItem key={campus.id} value={String(campus.id)}>
                            {campus.name}
                            {campus.city ? ` - ${campus.city}` : ''}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedCampuses.length === 0 ? (
                    <span className="text-sm text-muted-foreground">Sin sedes asignadas</span>
                  ) : (
                    selectedCampuses.map((campus) => {
                      const isBase = campus.id === formData.baseCampusId
                      return (
                        <span
                          key={campus.id}
                          className="inline-flex max-w-full items-center gap-2 rounded-full border bg-muted px-3 py-1 text-sm"
                        >
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">
                            {campus.name}
                            {campus.city ? ` - ${campus.city}` : ''}
                          </span>
                          {isBase ? (
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                              Base
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="rounded-full p-0.5 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                              onClick={() => handleRemoveAssignedCampus(campus.id)}
                              aria-label={`Quitar ${campus.name}`}
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </span>
                      )
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-2" data-oid="l5h._a3">
              <Label htmlFor="bio" data-oid=".-4:r6o">
                Biografía Profesional
              </Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={handleInputChange('bio')}
                rows={4}
                placeholder="Experiencia profesional, formación académica, especialidades..."
                data-oid="u0u6zn3"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <Label>Titulaciones y certificaciones</Label>
                <Button type="button" size="sm" variant="outline" onClick={addCertification}>
                  <Plus className="mr-2 h-4 w-4" />
                  Añadir
                </Button>
              </div>
              {formData.certifications.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Añade titulaciones para mostrarlas en la ficha pública del docente.
                </p>
              ) : (
                <div className="space-y-3">
                  {formData.certifications.map((cert, index) => (
                    <div
                      key={index}
                      className="grid gap-3 rounded-lg border p-3 md:grid-cols-[1fr_1fr_120px_auto]"
                    >
                      <Input
                        value={cert.title}
                        onChange={(event) =>
                          updateCertification(index, 'title', event.target.value)
                        }
                        placeholder="Título o certificación"
                      />
                      <Input
                        value={cert.institution}
                        onChange={(event) =>
                          updateCertification(index, 'institution', event.target.value)
                        }
                        placeholder="Institución"
                      />
                      <Input
                        type="number"
                        value={cert.year}
                        onChange={(event) => updateCertification(index, 'year', event.target.value)}
                        placeholder="Año"
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => removeCertification(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-end pt-4 border-t" data-oid="bzrza:r">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
                data-oid="33fz:eo"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading || uploadingPhoto || Boolean(createBlockedReason)}
                title={createBlockedReason ?? undefined}
                data-oid="_78ql89"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" data-oid="0vdx6u4" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" data-oid="h0djbij" />
                    Crear Profesor
                  </>
                )}
              </Button>
              {createBlockedReason ? (
                <p className="max-w-md text-right text-sm text-destructive">
                  {createBlockedReason}
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
