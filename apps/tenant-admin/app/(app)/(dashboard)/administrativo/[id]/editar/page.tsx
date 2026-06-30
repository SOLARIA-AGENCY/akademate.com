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
import { ArrowLeft, Briefcase, Loader2, Save } from 'lucide-react'

interface Campus {
  id: number
  name: string
  city: string
}

interface StaffDetail {
  id: number
  firstName: string
  lastName: string
  nif?: string | null
  email?: string | null
  phone?: string | null
  position: string
  contractType: string
  employmentStatus: string
  inactiveReason?: string | null
  hireDate?: string | null
  bio?: string | null
  assignedCampuses: Campus[]
}

interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
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
    lastName: '',
    nif: '',
    email: '',
    phone: '',
    position: '',
    contractType: 'full_time',
    employmentStatus: 'active',
    inactiveReason: '',
    hireDate: '',
    bio: '',
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
        setFormData({
          firstName: staff.firstName ?? '',
          lastName: staff.lastName ?? '',
          nif: staff.nif ?? '',
          email: staff.email ?? '',
          phone: staff.phone ?? '',
          position: staff.position ?? '',
          contractType: staff.contractType ?? 'full_time',
          employmentStatus: staff.employmentStatus ?? 'active',
          inactiveReason: staff.inactiveReason ?? '',
          hireDate: staff.hireDate ? staff.hireDate.slice(0, 10) : '',
          bio: staff.bio ?? '',
          assignedCampuses: staff.assignedCampuses?.map((campus) => campus.id) ?? [],
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

  const toggleCampus = (campusId: number) => {
    setFormData((prev) => ({
      ...prev,
      assignedCampuses: prev.assignedCampuses.includes(campusId)
        ? prev.assignedCampuses.filter((id) => id !== campusId)
        : [...prev.assignedCampuses, campusId],
    }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/staff?id=${adminId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          nif: formData.nif || null,
          email: formData.email || null,
          phone: formData.phone || null,
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
    <div className="space-y-6">
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

            <div className="grid gap-4 md:grid-cols-2">
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
                <Label htmlFor="lastName">Apellidos</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(event) => handleChange('lastName', event.target.value)}
                  required
                />
              </div>
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

            <div className="space-y-2">
              <Label>Sedes asignadas</Label>
              <div className="grid gap-3 rounded-lg border p-4 md:grid-cols-2">
                {campuses.map((campus) => (
                  <label
                    key={campus.id}
                    className="flex cursor-pointer items-center gap-2 rounded-md border bg-background p-3 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={formData.assignedCampuses.includes(campus.id)}
                      onChange={() => toggleCampus(campus.id)}
                      className="h-4 w-4 accent-primary"
                    />
                    <span className="font-medium">
                      {campus.name} - {campus.city}
                    </span>
                  </label>
                ))}
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
              <Button
                type="submit"
                disabled={
                  saving ||
                  formData.firstName.trim().length === 0 ||
                  formData.lastName.trim().length === 0 ||
                  formData.position.trim().length === 0 ||
                  formData.assignedCampuses.length === 0
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
