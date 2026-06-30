'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
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
  Loader2,
  MapPin,
  Plus,
  Save,
  Trash2,
  Upload,
  User,
} from 'lucide-react'
import { formatSpanishPhoneInput } from '@/lib/phone'
import { formatStaffEmailInput, formatStaffNifInput } from '@/lib/staff-contact'

interface Campus {
  id: number
  name: string
  city: string
}

interface TrainingArea {
  id: number
  nombre: string
  codigo?: string | null
  active?: boolean
}

interface StaffRecord {
  id: number
  firstName: string
  lastName: string
  nif?: string | null
  email?: string
  phone?: string
  position: string
  contractType?: string
  employmentStatus?: string
  inactiveReason?: string | null
  inactiveAt?: string | null
  reactivatedAt?: string | null
  importReviewStatus?: string | null
  hireDate?: string
  bio?: string
  assignedCampuses: Campus[]
  photo?: string
  certifications?: Certification[]
  qualifiedAreas?: TrainingArea[]
}

interface Certification {
  id?: string
  title: string
  institution: string
  year: number | ''
}

interface CampusApiResponse {
  success?: boolean
  data?: Campus[]
  docs?: Campus[]
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

const isPlaceholderPhoto = (photo?: string | null) =>
  !photo || photo === '/placeholder-avatar.svg' || photo.includes('placeholder-avatar')

function TeacherPhotoFallback() {
  return (
    <div
      aria-label="Imagen genérica de docente"
      className="relative flex h-20 w-20 items-center justify-center rounded-full border bg-primary/10 text-primary"
    >
      <User className="h-9 w-9" />
      <div className="absolute -right-1 -top-1 rounded-full border bg-background p-1 shadow-sm">
        <GraduationCap className="h-5 w-5" />
      </div>
    </div>
  )
}

export default function EditProfesorPage() {
  const router = useRouter()
  const params = useParams()
  const professorId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loadingCampuses, setLoadingCampuses] = useState(true)
  const [loadingAreas, setLoadingAreas] = useState(true)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [campuses, setCampuses] = useState<Campus[]>([])
  const [areas, setAreas] = useState<TrainingArea[]>([])
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoId, setPhotoId] = useState('')
  const [photoRemoved, setPhotoRemoved] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    nif: '',
    email: '',
    phone: '',
    position: 'Docente',
    contractType: 'full_time',
    employmentStatus: 'active',
    inactiveReason: '',
    bio: '',
    hireDate: '',
    assignedCampuses: [] as number[],
    qualifiedAreas: [] as number[],
    certifications: [] as Certification[],
  })

  const hasQualifiedAreas = formData.qualifiedAreas.length > 0

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        setLoading(true)
        setError(null)

        const [staffRes, campusRes, areaRes] = await Promise.all([
          fetch(`/api/staff/${professorId}`, { cache: 'no-cache' }),
          fetch('/api/campuses?limit=100', { cache: 'no-cache' }),
          fetch('/api/areas-formativas', { cache: 'no-cache' }),
        ])

        if (!staffRes.ok) throw new Error('No se pudo cargar el profesorado')
        if (!campusRes.ok) throw new Error('No se pudieron cargar las sedes')
        if (!areaRes.ok) throw new Error('No se pudieron cargar las áreas formativas')

        const staffJson = (await staffRes.json()) as { success?: boolean; data?: StaffRecord }
        const campusJson = (await campusRes.json()) as CampusApiResponse
        const areaJson = (await areaRes.json()) as AreasApiResponse
        const professor = staffJson.data

        if (!professor) throw new Error('Profesor no encontrado')
        if (cancelled) return

        setCampuses(campusJson.data ?? campusJson.docs ?? [])
        setAreas((areaJson.data ?? []).filter((area) => area.active !== false))
        setFormData({
          firstName: professor.firstName ?? '',
          lastName: professor.lastName ?? '',
          nif: professor.nif ?? '',
          email: professor.email ?? '',
          phone: professor.phone ?? '',
          position: professor.position ?? 'Docente',
          contractType: professor.contractType ?? 'full_time',
          employmentStatus: professor.employmentStatus ?? 'active',
          inactiveReason: professor.inactiveReason ?? '',
          bio: professor.bio ?? '',
          hireDate: professor.hireDate ? String(professor.hireDate).slice(0, 10) : '',
          assignedCampuses: (professor.assignedCampuses ?? []).map((campus) => Number(campus.id)),
          qualifiedAreas: (professor.qualifiedAreas ?? []).map((area) => Number(area.id)),
          certifications: (professor.certifications ?? []).map((cert) => ({
            id: cert.id,
            title: cert.title ?? '',
            institution: cert.institution ?? '',
            year: cert.year ?? '',
          })),
        })
        setPhotoPreview(isPlaceholderPhoto(professor.photo) ? null : (professor.photo ?? null))
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'No se pudo cargar la ficha')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
          setLoadingCampuses(false)
          setLoadingAreas(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [professorId])

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
      assignedCampuses: [campusId],
    }))
  }

  const toggleQualifiedArea = (areaId: number) => {
    setFormData((prev) => ({
      ...prev,
      qualifiedAreas: prev.qualifiedAreas.includes(areaId)
        ? prev.qualifiedAreas.filter((id) => id !== areaId)
        : [...prev.qualifiedAreas, areaId],
    }))
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

  const handlePhotoUpload = async (file: File) => {
    setUploadingPhoto(true)
    setError(null)
    try {
      setPhotoPreview(URL.createObjectURL(file))
      const body = new FormData()
      body.append('file', file)
      body.append('alt', `${formData.firstName || 'Profesor'} ${formData.lastName || ''}`.trim())
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
      setPhotoRemoved(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo subir la foto')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleRemovePhoto = () => {
    setPhotoId('')
    setPhotoPreview(null)
    setPhotoRemoved(true)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      if (formData.qualifiedAreas.length === 0) {
        throw new Error('Asigna al menos un área habilitada antes de guardar este docente.')
      }

      const response = await fetch(`/api/staff?id=${professorId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          nif: formData.nif || null,
          email: formData.email,
          phone: formData.phone || null,
          position: 'Docente',
          contractType: formData.contractType,
          employmentStatus: formData.employmentStatus,
          inactiveReason:
            formData.employmentStatus === 'active'
              ? null
              : formData.inactiveReason || 'Baja manual desde edición de docente',
          inactiveAt: formData.employmentStatus === 'active' ? null : new Date().toISOString(),
          reactivatedAt: formData.employmentStatus === 'active' ? new Date().toISOString() : null,
          hireDate: formData.hireDate,
          bio: formData.bio || null,
          qualifiedAreas: formData.qualifiedAreas,
          certifications: formData.certifications
            .filter((cert) => cert.title.trim())
            .map((cert) => ({
              title: cert.title.trim(),
              institution: cert.institution.trim(),
              year: cert.year ? Number(cert.year) : new Date().getFullYear(),
            })),
          assignedCampuses: formData.assignedCampuses,
          ...(photoRemoved ? { photoId: null } : photoId ? { photoId } : {}),
        }),
      })

      const result = await response.json().catch(() => ({}))
      if (!response.ok || result?.success === false) {
        throw new Error(
          typeof result?.error === 'string' ? result.error : 'No se pudo guardar la ficha'
        )
      }

      router.push(`/dashboard/profesores/${professorId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la ficha')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Cargando ficha del profesor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title="Editar Profesor"
        description="Actualizar información del profesorado"
        icon={User}
        actions={
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        }
      />

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Ficha del Profesor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {error ? (
              <div className="rounded-md border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
                {error}
              </div>
            ) : null}

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
                <div className="space-y-2">
                  <Input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    disabled={uploadingPhoto || saving}
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
                  {photoPreview ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:text-destructive"
                      disabled={uploadingPhoto || saving}
                      onClick={handleRemovePhoto}
                    >
                      <Trash2 className="mr-2 h-3.5 w-3.5" />
                      Eliminar foto
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nombre</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange('firstName')}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Apellidos</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange('lastName')}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
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
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  onBlur={handleEmailBlur}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  value={formData.phone}
                  onChange={handleInputChange('phone')}
                  onBlur={handlePhoneBlur}
                  placeholder="+34 922 123 456"
                />
              </div>
            </div>

            {formData.employmentStatus !== 'active' ? (
              <div className="space-y-2">
                <Label htmlFor="inactiveReason">Motivo de baja o inactividad</Label>
                <Textarea
                  id="inactiveReason"
                  rows={3}
                  value={formData.inactiveReason}
                  onChange={handleInputChange('inactiveReason')}
                  placeholder="Indica el motivo para poder auditar o reactivar más adelante."
                />
              </div>
            ) : null}

            <div className="space-y-3 rounded-lg border p-4">
              <div className="space-y-1">
                <Label>Áreas habilitadas para docencia</Label>
              </div>
              {!hasQualifiedAreas ? (
                <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                  Esta ficha docente está incompleta. Asigna al menos un área habilitada para poder
                  guardar cambios o usar este docente en convocatorias.
                </div>
              ) : null}
              {loadingAreas ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cargando áreas...
                </div>
              ) : areas.length === 0 ? (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  No hay áreas formativas activas disponibles. El sistema permitirá asignaciones,
                  pero mostrará advertencias de validación.
                </div>
              ) : (
                <QualifiedAreasMultiSelect
                  areas={areas}
                  selectedAreaIds={formData.qualifiedAreas}
                  onToggleArea={toggleQualifiedArea}
                />
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="contractType">Tipo de Contrato</Label>
                <Select
                  value={formData.contractType}
                  onValueChange={handleSelectChange('contractType')}
                >
                  <SelectTrigger id="contractType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general_regime">Régimen General</SelectItem>
                    <SelectItem value="full_time">Tiempo Completo</SelectItem>
                    <SelectItem value="part_time">Medio Tiempo</SelectItem>
                    <SelectItem value="freelance">Autónomo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="employmentStatus">Estado</Label>
                <Select
                  value={formData.employmentStatus}
                  onValueChange={handleSelectChange('employmentStatus')}
                >
                  <SelectTrigger id="employmentStatus">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="temporary_leave">Baja Temporal</SelectItem>
                    <SelectItem value="inactive">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hireDate">Fecha de Contratación</Label>
                <Input
                  id="hireDate"
                  type="date"
                  value={formData.hireDate}
                  onChange={handleInputChange('hireDate')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="baseCampus">Sede base asignada</Label>
              {loadingCampuses ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cargando sedes...
                </div>
              ) : campuses.length === 0 ? (
                <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                  No hay sedes disponibles para asignar.
                </div>
              ) : (
                <Select
                  value={
                    formData.assignedCampuses[0] ? String(formData.assignedCampuses[0]) : undefined
                  }
                  onValueChange={handleBaseCampusChange}
                >
                  <SelectTrigger id="baseCampus" aria-label="Sede base asignada">
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

            <div className="space-y-2">
              <Label htmlFor="bio">Biografía Profesional</Label>
              <Textarea
                id="bio"
                rows={4}
                value={formData.bio}
                onChange={handleInputChange('bio')}
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
                      key={cert.id ?? index}
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

            <div className="flex justify-end gap-4 border-t pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={
                  saving ||
                  uploadingPhoto ||
                  formData.assignedCampuses.length === 0 ||
                  !hasQualifiedAreas
                }
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar Cambios
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
