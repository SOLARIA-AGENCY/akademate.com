'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Input } from '@payload-config/components/ui/input'
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
import { ArrowLeft, GraduationCap, Loader2, MapPin, Save, Upload, User } from 'lucide-react'

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
}

interface CampusApiResponse {
  success?: boolean
  data?: Campus[]
  docs?: Campus[]
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
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [campuses, setCampuses] = useState<Campus[]>([])
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoId, setPhotoId] = useState('')
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
    (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }))
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

  const handlePhotoUpload = async (file: File) => {
    setUploadingPhoto(true)
    setError(null)
    try {
      setPhotoPreview(URL.createObjectURL(file))
      const body = new FormData()
      body.append('file', file)
      body.append('alt', `${formData.firstName || 'Profesor'} ${formData.lastName || ''}`.trim())
      const response = await fetch('/api/media', { method: 'POST', body })
      const result = await response.json().catch(() => ({}))

      if (!response.ok || !result?.doc?.id) {
        throw new Error(typeof result?.error === 'string' ? result.error : 'No se pudo subir la foto')
      }

      setPhotoId(String(result.doc.id))
      setPhotoPreview(result.doc.url || `/media/${String(result.doc.filename)}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo subir la foto')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
          assignedCampuses: formData.assignedCampuses,
          ...(photoId ? { photoId } : {}),
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

  return (
    <div className="space-y-6 max-w-4xl">
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
                    disabled={uploadingPhoto || saving}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) void handlePhotoUpload(file)
                    }}
                  />
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {uploadingPhoto ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Upload className="h-3.5 w-3.5" />
                    )}
                    <span>{uploadingPhoto ? 'Subiendo foto...' : 'Puedes reemplazar la foto actual desde aquí.'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nombre</Label>
                <Input id="firstName" value={formData.firstName} onChange={handleInputChange('firstName')} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Apellidos</Label>
                <Input id="lastName" value={formData.lastName} onChange={handleInputChange('lastName')} required />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={formData.email} onChange={handleInputChange('email')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input id="phone" value={formData.phone} onChange={handleInputChange('phone')} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="position">Especialidad / Área</Label>
              <Input id="position" value={formData.position} onChange={handleInputChange('position')} required />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="contractType">Tipo de Contrato</Label>
                <Select value={formData.contractType} onValueChange={handleSelectChange('contractType')}>
                  <SelectTrigger id="contractType">
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
                <Input id="hireDate" type="date" value={formData.hireDate} onChange={handleInputChange('hireDate')} />
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
                  value={formData.assignedCampuses[0] ? String(formData.assignedCampuses[0]) : undefined}
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
              <Textarea id="bio" rows={4} value={formData.bio} onChange={handleInputChange('bio')} />
            </div>

            <div className="flex justify-end gap-4 border-t pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={saving}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving || uploadingPhoto || formData.assignedCampuses.length === 0}>
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
