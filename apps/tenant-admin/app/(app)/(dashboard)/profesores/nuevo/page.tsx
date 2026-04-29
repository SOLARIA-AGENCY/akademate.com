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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@payload-config/components/ui/select'
import { ArrowLeft, GraduationCap, Save, Loader2, MapPin, Upload, User } from 'lucide-react'

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

export default function NewProfesorPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
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
    hireDate: new Date().toISOString().split('T')[0],
    assignedCampuses: [] as number[],
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          staffType: 'profesor',
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          position: formData.position,
          contractType: formData.contractType,
          employmentStatus: formData.employmentStatus,
          hireDate: formData.hireDate,
          bio: formData.bio,
          assignedCampuses: formData.assignedCampuses,
          photoId: photoId || undefined,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create professor')
      }

      const result = (await response.json()) as StaffApiResponse

      if (!result.success) {
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
      const response = await fetch('/api/staff-photo', { method: 'POST', body })
      const result = (await response.json().catch(() => ({}))) as StaffPhotoUploadResponse

      if (!response.ok || !result.success || !result.doc?.id) {
        throw new Error(typeof result?.error === 'string' ? result.error : 'No se pudo subir la foto')
      }

      setPhotoId(String(result.doc.id))
      setPhotoPreview(result.doc.url || (result.doc.filename ? `/media/${result.doc.filename}` : null))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo subir la foto')
    } finally {
      setUploadingPhoto(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl" data-oid="nqgh2_8">
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
                <div className="space-y-2">
                  <Input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    disabled={uploadingPhoto || loading}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) void handlePhotoUpload(file)
                    }}
                  />
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {uploadingPhoto ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                    <span>{uploadingPhoto ? 'Subiendo foto...' : 'La imagen se vinculará a la ficha del profesor.'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Personal Info */}
            <div className="grid gap-4 md:grid-cols-2" data-oid="lchd9n8">
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
                <Label htmlFor="lastName" data-oid="mpbpc7d">
                  Apellidos{' '}
                  <span className="text-destructive" data-oid="61qi481">
                    *
                  </span>
                </Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange('lastName')}
                  required
                  placeholder="Pérez García"
                  data-oid="g:lz9bb"
                />
              </div>
            </div>

            {/* Contact Info */}
            <div className="grid gap-4 md:grid-cols-2" data-oid="grbkuel">
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
                  value={formData.phone}
                  onChange={handleInputChange('phone')}
                  placeholder="+34 922 123 456"
                  data-oid="if68lhd"
                />
              </div>
            </div>

            {/* Position */}
            <div className="space-y-2" data-oid="9_bli98">
              <Label htmlFor="position" data-oid="ug3wmn_">
                Especialidad / Área{' '}
                <span className="text-destructive" data-oid="0p1oi4w">
                  *
                </span>
              </Label>
              <Input
                id="position"
                value={formData.position}
                onChange={handleInputChange('position')}
                required
                placeholder="Profesor de Marketing Digital"
                data-oid="i37pg:e"
              />
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

            {/* Assigned Campus */}
            <div className="space-y-2" data-oid="mru1ua6">
              <Label htmlFor="baseCampus" data-oid="y6ceg6d">
                Sede base asignada{' '}
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
                  value={formData.assignedCampuses[0] ? String(formData.assignedCampuses[0]) : undefined}
                  onValueChange={handleBaseCampusChange}
                  data-oid="8ed4v20"
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
              {formData.assignedCampuses.length === 0 && (
                <p className="text-sm text-destructive" data-oid="l08yfnq">
                  Debe seleccionar al menos una sede
                </p>
              )}
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
                disabled={loading || uploadingPhoto || formData.assignedCampuses.length === 0}
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
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
