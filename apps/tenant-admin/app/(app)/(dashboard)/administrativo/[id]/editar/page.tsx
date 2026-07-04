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
import { formatSpanishPhoneInput } from '@/lib/phone'
import { formatStaffEmailInput, formatStaffNifInput } from '@/lib/staff-contact'
import { ArrowLeft, Briefcase, Loader2, MapPin, Save, X } from 'lucide-react'

interface Campus {
  id: number
  name: string
  city: string
}

interface StaffDetail {
  id: number
  firstName: string
  lastName: string
  firstSurname?: string | null
  secondSurname?: string | null
  nif?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  city?: string | null
  postalCode?: string | null
  position: string
  contractType: string
  employmentStatus: string
  inactiveReason?: string | null
  hireDate?: string | null
  bio?: string | null
  baseCampusId?: number | null
  baseCampus?: Campus | null
  assignedCampuses: Campus[]
}

interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
}

const splitSurnameParts = (lastName?: string | null) => {
  const parts = String(lastName ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  return {
    firstSurname: parts[0] ?? '',
    secondSurname: parts.slice(1).join(' '),
  }
}

export default function EditAdministrativoPage() {
  const router = useRouter()
  const params = useParams()
  const adminId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [campuses, setCampuses] = useState<Campus[]>([])
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
    position: '',
    contractType: 'full_time',
    employmentStatus: 'active',
    inactiveReason: '',
    hireDate: '',
    bio: '',
    baseCampusId: null as number | null,
    assignedCampuses: [] as number[],
  })

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        setError(null)

        const [staffResponse, campusesResponse] = await Promise.all([
          fetch(`/api/staff/${adminId}`),
          fetch('/api/campuses?limit=100'),
        ])

        const staffResult = (await staffResponse.json()) as ApiResponse<StaffDetail>
        if (!staffResponse.ok || !staffResult.success) {
          throw new Error(staffResult.error ?? 'No se pudo cargar el administrativo')
        }

        const campusesResult = (await campusesResponse.json()) as ApiResponse<Campus[]>
        if (campusesResponse.ok && campusesResult.success) {
          setCampuses(campusesResult.data)
        }

        const staff = staffResult.data
        const surnames = splitSurnameParts(staff.lastName)
        const assignedCampuses = staff.assignedCampuses?.map((campus) => Number(campus.id)) ?? []
        setFormData({
          firstName: staff.firstName ?? '',
          firstSurname: staff.firstSurname ?? surnames.firstSurname,
          secondSurname: staff.secondSurname ?? surnames.secondSurname,
          nif: staff.nif ?? '',
          email: staff.email ?? '',
          phone: staff.phone ?? '',
          address: staff.address ?? '',
          city: staff.city ?? '',
          postalCode: staff.postalCode ?? '',
          position: staff.position ?? '',
          contractType: staff.contractType ?? 'full_time',
          employmentStatus: staff.employmentStatus ?? 'active',
          inactiveReason: staff.inactiveReason ?? '',
          hireDate: staff.hireDate ? staff.hireDate.slice(0, 10) : '',
          bio: staff.bio ?? '',
          baseCampusId: staff.baseCampusId ? Number(staff.baseCampusId) : assignedCampuses[0] || null,
          assignedCampuses,
        })
      } catch (err) {
        console.error('Error loading administrative staff:', err)
        setError(err instanceof Error ? err.message : 'Error al cargar el administrativo')
      } finally {
        setLoading(false)
      }
    }

    if (adminId) void loadData()
  }, [adminId])

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleNifBlur = () => {
    setFormData((prev) => ({ ...prev, nif: formatStaffNifInput(prev.nif) }))
  }

  const handleEmailBlur = () => {
    setFormData((prev) => ({ ...prev, email: formatStaffEmailInput(prev.email) }))
  }

  const handlePhoneBlur = () => {
    setFormData((prev) => ({ ...prev, phone: formatSpanishPhoneInput(prev.phone) }))
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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const lastName = [formData.firstSurname, formData.secondSurname]
        .map((value) => value.trim())
        .filter(Boolean)
        .join(' ')

      const response = await fetch(`/api/staff?id=${adminId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          firstSurname: formData.firstSurname,
          secondSurname: formData.secondSurname,
          lastName,
          nif: formData.nif || null,
          email: formData.email || null,
          phone: formData.phone || null,
          address: formData.address || null,
          city: formData.city || null,
          postalCode: formData.postalCode || null,
          position: formData.position,
          contractType: formData.contractType,
          employmentStatus: formData.employmentStatus,
          inactiveReason: formData.inactiveReason || null,
          inactiveAt:
            formData.employmentStatus !== 'active' ? new Date().toISOString() : null,
          reactivatedAt:
            formData.employmentStatus === 'active' ? new Date().toISOString() : null,
          hireDate: formData.hireDate || null,
          bio: formData.bio || null,
          baseCampusId: formData.baseCampusId,
          assignedCampuses: formData.assignedCampuses,
        }),
      })

      const result = (await response.json()) as ApiResponse<unknown>
      if (!response.ok || !result.success) {
        throw new Error(result.error ?? 'No se pudo guardar el administrativo')
      }

      router.push(`/dashboard/administrativo/${adminId}`)
    } catch (err) {
      console.error('Error updating administrative staff:', err)
      setError(err instanceof Error ? err.message : 'Error al guardar el administrativo')
      setSaving(false)
    }
  }

  const selectedCampuses = campuses.filter((campus) => formData.assignedCampuses.includes(campus.id))
  const availableCampuses = campuses.filter(
    (campus) => !formData.assignedCampuses.includes(campus.id)
  )

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="space-y-3 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Cargando ficha administrativa...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Editar Administrativo"
        icon={Briefcase}
        actions={
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        }
      />

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Ficha del Administrativo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nombre</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(event) => handleChange('firstName', event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="firstSurname">Primer apellido</Label>
                <Input
                  id="firstSurname"
                  value={formData.firstSurname}
                  onChange={(event) => handleChange('firstSurname', event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondSurname">Segundo apellido</Label>
                <Input
                  id="secondSurname"
                  value={formData.secondSurname}
                  onChange={(event) => handleChange('secondSurname', event.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="nif">NIF/DNI</Label>
                <Input
                  id="nif"
                  value={formData.nif}
                  onChange={(event) => handleChange('nif', event.target.value)}
                  onBlur={handleNifBlur}
                  placeholder="12345678Z"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(event) => handleChange('email', event.target.value)}
                  onBlur={handleEmailBlur}
                  placeholder="administracion@cepformacion.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(event) => handleChange('phone', event.target.value)}
                  onBlur={handlePhoneBlur}
                  placeholder="+34 922 123 456"
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-[2fr_1fr_140px]">
              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(event) => handleChange('address', event.target.value)}
                  placeholder="Calle, número, piso..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Ciudad</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(event) => handleChange('city', event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postalCode">Código postal</Label>
                <Input
                  id="postalCode"
                  value={formData.postalCode}
                  onChange={(event) => handleChange('postalCode', event.target.value)}
                  inputMode="numeric"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">Cargo</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(event) => handleChange('position', event.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="contractType">Tipo de Contrato</Label>
                <Select
                  value={formData.contractType}
                  onValueChange={(value) => handleChange('contractType', value)}
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
                  onValueChange={(value) => handleChange('employmentStatus', value)}
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
                  onChange={(event) => handleChange('hireDate', event.target.value)}
                />
              </div>
            </div>

            {formData.employmentStatus !== 'active' && (
              <div className="space-y-2">
                <Label htmlFor="inactiveReason">Motivo de baja</Label>
                <Textarea
                  id="inactiveReason"
                  value={formData.inactiveReason}
                  onChange={(event) => handleChange('inactiveReason', event.target.value)}
                  rows={3}
                />
              </div>
            )}

            <div className="grid gap-4 lg:grid-cols-[minmax(220px,320px)_1fr]">
              <div className="space-y-2">
                <Label htmlFor="baseCampus">Sede base</Label>
                <Select
                  value={formData.baseCampusId ? String(formData.baseCampusId) : undefined}
                  onValueChange={handleBaseCampusChange}
                >
                  <SelectTrigger id="baseCampus" aria-label="Sede base">
                    <SelectValue placeholder="Selecciona una sede base" />
                  </SelectTrigger>
                  <SelectContent>
                    {campuses.map((campus) => (
                      <SelectItem key={campus.id} value={String(campus.id)}>
                        {campus.name}
                        {campus.city ? ` - ${campus.city}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

            <div className="space-y-2">
              <Label htmlFor="bio">Biografía / Notas</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(event) => handleChange('bio', event.target.value)}
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-3 border-t pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={saving}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
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
