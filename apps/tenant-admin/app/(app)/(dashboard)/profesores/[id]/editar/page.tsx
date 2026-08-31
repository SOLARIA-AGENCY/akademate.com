'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Input } from '@payload-config/components/ui/input'
import { Label } from '@payload-config/components/ui/label'
import { Textarea } from '@payload-config/components/ui/textarea'
import { Badge } from '@payload-config/components/ui/badge'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@payload-config/components/ui/select'
import { EntityThumb } from '@payload-config/components/ui/entity-thumb'
import { ArrowLeft, Loader2, MapPin, Plus, Save, Trash2, Upload, User, X } from 'lucide-react'

interface Campus {
  id: number
  name: string
  city: string
}

interface StaffRecord {
  id: number
  firstName: string
  lastName: string
  email?: string
  phone?: string
  position: string
  contractType?: string
  employmentStatus?: string
  hireDate?: string
  bio?: string
  assignedCampuses: Campus[]
  photo?: string
  certifications?: Certification[]
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

interface StaffPhotoUploadResponse {
  success?: boolean
  doc?: {
    id?: string | number
    filename?: string | null
    url?: string | null
  }
  error?: string
}

type FieldErrors = {
  firstName?: string
  lastName?: string
  email?: string
  position?: string
  assignedCampuses?: string
}

const isPlaceholderPhoto = (photo?: string | null) =>
  !photo || photo === '/placeholder-avatar.svg' || photo.includes('placeholder-avatar')

const FIELD_ERROR = 'Este campo es obligatorio'
const FORM_TYPE = 'text-sm [&_[data-slot=label]]:text-sm [&_input]:text-sm [&_textarea]:text-sm'
const HELPER = 'text-xs text-muted-foreground'

function RequiredMark() {
  return (
    <span className="text-destructive" aria-hidden="true">
      *
    </span>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-xs text-destructive">{message}</p>
}

function campusLabel(campus: Campus): string {
  return campus.city ? `${campus.name} - ${campus.city}` : campus.name
}

export default function EditProfesorPage() {
  const router = useRouter()
  const params = useParams()
  const professorId = params.id as string
  const photoInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loadingCampuses, setLoadingCampuses] = useState(true)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [attemptedSave, setAttemptedSave] = useState(false)
  const [extraCampusKey, setExtraCampusKey] = useState(0)
  const [campuses, setCampuses] = useState<Campus[]>([])
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoId, setPhotoId] = useState('')
  const [photoRemoved, setPhotoRemoved] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    position: '',
    contractType: 'full_time',
    employmentStatus: 'active',
    bio: '',
    hireDate: '',
    assignedCampuses: [] as number[],
    certifications: [] as Certification[],
  })

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        setLoading(true)
        setError(null)

        const [staffRes, campusRes] = await Promise.all([
          fetch('/api/staff?type=profesor&limit=200', { cache: 'no-cache' }),
          fetch('/api/campuses?limit=100', { cache: 'no-cache' }),
        ])

        if (!staffRes.ok) throw new Error('No se pudo cargar el profesorado')
        if (!campusRes.ok) throw new Error('No se pudieron cargar las sedes')

        const staffJson = (await staffRes.json()) as { success?: boolean; data?: StaffRecord[] }
        const campusJson = (await campusRes.json()) as CampusApiResponse
        const professor = staffJson.data?.find((item) => String(item.id) === professorId)

        if (!professor) throw new Error('Profesor no encontrado')
        if (cancelled) return

        setCampuses(campusJson.data ?? campusJson.docs ?? [])
        setFormData({
          firstName: professor.firstName ?? '',
          lastName: professor.lastName ?? '',
          email: professor.email ?? '',
          phone: professor.phone ?? '',
          position: professor.position ?? '',
          contractType: professor.contractType ?? 'full_time',
          employmentStatus: professor.employmentStatus ?? 'active',
          bio: professor.bio ?? '',
          hireDate: professor.hireDate ? String(professor.hireDate).slice(0, 10) : '',
          assignedCampuses: (professor.assignedCampuses ?? []).map((campus) => Number(campus.id)),
          certifications: (professor.certifications ?? []).map((cert) => ({
            id: cert.id,
            title: cert.title ?? '',
            institution: cert.institution ?? '',
            year: cert.year ?? '',
          })),
        })
        setPhotoPreview(isPlaceholderPhoto(professor.photo) ? null : professor.photo ?? null)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'No se pudo cargar la ficha')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
          setLoadingCampuses(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [professorId])

  const handleInputChange =
    (field: keyof FieldErrors | 'phone' | 'bio' | 'hireDate') =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.value
      setFormData((prev) => ({ ...prev, [field]: value }))
      if (attemptedSave && field in { firstName: true, lastName: true, email: true, position: true }) {
        setFieldErrors((prev) => ({ ...prev, [field]: value.trim() ? undefined : FIELD_ERROR }))
      }
    }

  const handleSelectChange = (field: string) => (value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleBaseCampusChange = (value: string) => {
    const campusId = Number(value)
    if (Number.isNaN(campusId)) return
    setFormData((prev) => ({
      ...prev,
      assignedCampuses: [campusId, ...prev.assignedCampuses.filter((id) => id !== campusId)],
    }))
    if (attemptedSave) {
      setFieldErrors((prev) => ({ ...prev, assignedCampuses: undefined }))
    }
  }

  const addAssignedCampus = (value: string) => {
    const campusId = Number(value)
    if (Number.isNaN(campusId)) return
    setFormData((prev) =>
      prev.assignedCampuses.includes(campusId)
        ? prev
        : { ...prev, assignedCampuses: [...prev.assignedCampuses, campusId] },
    )
    setExtraCampusKey((key) => key + 1)
  }

  const removeAssignedCampus = (campusId: number) => {
    setFormData((prev) => ({
      ...prev,
      assignedCampuses: prev.assignedCampuses.filter((id) => id !== campusId),
    }))
  }

  const addCertification = () => {
    setFormData((prev) => ({
      ...prev,
      certifications: [...prev.certifications, { title: '', institution: '', year: '' }],
    }))
  }

  const updateCertification = (
    index: number,
    field: keyof Certification,
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      certifications: prev.certifications.map((cert, certIndex) =>
        certIndex === index
          ? { ...cert, [field]: field === 'year' ? (value ? Number(value) : '') : value }
          : cert,
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
        throw new Error(typeof result?.error === 'string' ? result.error : 'No se pudo subir la foto')
      }

      setPhotoId(String(result.doc.id))
      setPhotoPreview(result.doc.url || (result.doc.filename ? `/api/media/file/${result.doc.filename}` : null))
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

  const validate = (): FieldErrors => {
    const next: FieldErrors = {}
    if (!formData.firstName.trim()) next.firstName = FIELD_ERROR
    if (!formData.lastName.trim()) next.lastName = FIELD_ERROR
    if (!formData.email.trim()) next.email = FIELD_ERROR
    if (!formData.position.trim()) next.position = FIELD_ERROR
    if (formData.assignedCampuses.length === 0) next.assignedCampuses = FIELD_ERROR
    return next
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAttemptedSave(true)
    const nextErrors = validate()
    setFieldErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      window.requestAnimationFrame(() => {
        document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
      })
      return
    }

    setSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/staff?id=${professorId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone || null,
          position: formData.position,
          contractType: formData.contractType,
          employmentStatus: formData.employmentStatus,
          hireDate: formData.hireDate,
          bio: formData.bio || null,
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
        throw new Error(typeof result?.error === 'string' ? result.error : 'No se pudo guardar la ficha')
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

  const photoAlt = `${formData.firstName} ${formData.lastName}`.trim() || 'Docente'
  const saveDisabled = saving || uploadingPhoto
  const availableExtraCampuses = campuses.filter((campus) => !formData.assignedCampuses.includes(campus.id))
  const assignedCampusRecords = formData.assignedCampuses
    .map((id) => campuses.find((campus) => campus.id === id))
    .filter((campus): campus is Campus => Boolean(campus))

  const saveButton = (
    <Button type="submit" disabled={saveDisabled}>
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
  )

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Editar Profesor"
        icon={User}
        actions={
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        }
      />

      <form onSubmit={handleSubmit} noValidate>
        <Card>
          <CardHeader>
            <CardTitle>Ficha del Profesor</CardTitle>
          </CardHeader>
          <CardContent className={`space-y-6 ${FORM_TYPE}`}>
            {error ? (
              <div className="rounded-md border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
                {error}
              </div>
            ) : null}

            <div className="flex items-center gap-4">
              <div aria-label={photoPreview ? undefined : 'Imagen genérica de docente'}>
                <EntityThumb
                  src={photoPreview}
                  alt={photoAlt}
                  fallback="person"
                  className="h-20 w-20 rounded-full"
                />
              </div>
              <div className="space-y-2">
                <input
                  ref={photoInputRef}
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
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={uploadingPhoto || saving}
                  onClick={() => photoInputRef.current?.click()}
                >
                  {uploadingPhoto ? (
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-3.5 w-3.5" />
                  )}
                  Seleccionar imagen
                </Button>
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

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">
                  Nombre <RequiredMark />
                </Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  aria-invalid={Boolean(fieldErrors.firstName)}
                  className={fieldErrors.firstName ? 'border-destructive' : undefined}
                  onChange={handleInputChange('firstName')}
                />
                <FieldError message={fieldErrors.firstName} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">
                  Primer apellido <RequiredMark />
                </Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  aria-invalid={Boolean(fieldErrors.lastName)}
                  className={fieldErrors.lastName ? 'border-destructive' : undefined}
                  onChange={handleInputChange('lastName')}
                />
                <FieldError message={fieldErrors.lastName} />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <RequiredMark />
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  aria-invalid={Boolean(fieldErrors.email)}
                  className={fieldErrors.email ? 'border-destructive' : undefined}
                  onChange={handleInputChange('email')}
                />
                <FieldError message={fieldErrors.email} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input id="phone" value={formData.phone} onChange={handleInputChange('phone')} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="position">
                Especialidad / Área <RequiredMark />
              </Label>
              <Input
                id="position"
                value={formData.position}
                aria-invalid={Boolean(fieldErrors.position)}
                className={fieldErrors.position ? 'border-destructive' : undefined}
                onChange={handleInputChange('position')}
              />
              <FieldError message={fieldErrors.position} />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="contractType">Tipo de Contrato</Label>
                <Select value={formData.contractType} onValueChange={handleSelectChange('contractType')}>
                  <SelectTrigger id="contractType" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_time">Tiempo Completo</SelectItem>
                    <SelectItem value="part_time">Medio Tiempo</SelectItem>
                    <SelectItem value="freelance">Autónomo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="employmentStatus">Estado</Label>
                <Select value={formData.employmentStatus} onValueChange={handleSelectChange('employmentStatus')}>
                  <SelectTrigger id="employmentStatus" className="w-full">
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
                <Input id="hireDate" type="date" value={formData.hireDate} onChange={handleInputChange('hireDate')} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="baseCampus">
                Sede base <RequiredMark />
              </Label>
              {loadingCampuses ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cargando sedes...
                </div>
              ) : campuses.length === 0 ? (
                <p className={HELPER}>No hay sedes disponibles para asignar.</p>
              ) : (
                <Select
                  value={formData.assignedCampuses[0] ? String(formData.assignedCampuses[0]) : undefined}
                  onValueChange={handleBaseCampusChange}
                >
                  <SelectTrigger
                    id="baseCampus"
                    aria-label="Sede base"
                    aria-invalid={Boolean(fieldErrors.assignedCampuses)}
                    className={`w-full ${fieldErrors.assignedCampuses ? 'border-destructive' : ''}`}
                  >
                    <SelectValue placeholder="Sede base" />
                  </SelectTrigger>
                  <SelectContent>
                    {campuses.map((campus) => (
                      <SelectItem key={campus.id} value={String(campus.id)}>
                        <span className="inline-flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5" />
                          {campusLabel(campus)}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <p className={HELPER}>
                Esta sede determinará también la empresa y base de facturación del docente.
              </p>
              <FieldError message={fieldErrors.assignedCampuses} />
            </div>

            <div className="space-y-2">
              <Label>Sedes asignadas</Label>
              {assignedCampusRecords.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {assignedCampusRecords.map((campus, index) => (
                    <Badge key={campus.id} variant="static" className="gap-1.5 font-medium">
                      {index === 0 ? `${campus.name} · Base` : campus.name}
                      {formData.assignedCampuses.length > 1 ? (
                        <button
                          type="button"
                          className="rounded-sm opacity-70 hover:opacity-100"
                          aria-label={`Quitar ${campus.name}`}
                          onClick={() => removeAssignedCampus(campus.id)}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      ) : null}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className={HELPER}>Aún no hay sedes en esta ficha.</p>
              )}
            </div>
            {availableExtraCampuses.length > 0 ? (
              <div className="space-y-2">
                <Label htmlFor="extraCampus">Añadir sede adicional</Label>
                <Select key={extraCampusKey} onValueChange={addAssignedCampus}>
                  <SelectTrigger id="extraCampus" className="w-full" aria-label="Añadir sede adicional">
                    <SelectValue placeholder="Añadir sede adicional" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableExtraCampuses.map((campus) => (
                      <SelectItem key={campus.id} value={String(campus.id)}>
                        {campusLabel(campus)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="bio">Biografía Profesional</Label>
              <Textarea id="bio" rows={4} value={formData.bio} onChange={handleInputChange('bio')} />
            </div>

            <div className="space-y-3">
              <Label>Titulaciones y certificaciones</Label>
              {formData.certifications.length > 0 ? (
                <div className="space-y-3">
                  {formData.certifications.map((cert, index) => (
                    <div key={cert.id ?? index} className="grid gap-3 md:grid-cols-[1fr_1fr_120px_auto]">
                      <Input
                        value={cert.title}
                        onChange={(event) => updateCertification(index, 'title', event.target.value)}
                        placeholder="Título o certificación"
                      />
                      <Input
                        value={cert.institution}
                        onChange={(event) => updateCertification(index, 'institution', event.target.value)}
                        placeholder="Institución"
                      />
                      <Input
                        type="number"
                        value={cert.year}
                        onChange={(event) => updateCertification(index, 'year', event.target.value)}
                        placeholder="Año"
                      />
                      <Button type="button" size="icon" variant="ghost" onClick={() => removeCertification(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : null}
              <Button type="button" size="sm" variant="outline" onClick={addCertification}>
                <Plus className="mr-2 h-4 w-4" />
                Añadir
              </Button>
            </div>

            <div className="flex justify-end gap-4 border-t pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={saving}>
                Cancelar
              </Button>
              {saveButton}
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
