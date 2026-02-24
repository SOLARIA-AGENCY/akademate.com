'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Input } from '@payload-config/components/ui/input'
import { Label } from '@payload-config/components/ui/label'
import { Textarea } from '@payload-config/components/ui/textarea'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { Checkbox } from '@payload-config/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@payload-config/components/ui/select'
import { ArrowLeft, Save, Loader2, User } from 'lucide-react'

interface Campus {
  id: number
  name: string
  city: string
}

interface CampusApiResponse {
  success: boolean
  data: Campus[]
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
  const [error, setError] = useState<string | null>(null)
  const [campuses, setCampuses] = useState<Campus[]>([])

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
        if (result.success) {
          setCampuses(result.data)
        }
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
      router.push(`/profesores/${result.data.id}`)
    } catch (err) {
      console.error('Error creating professor:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      setLoading(false)
    }
  }

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const handleSelectChange = (field: string) => (value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const toggleCampus = (campusId: number) => {
    setFormData((prev) => ({
      ...prev,
      assignedCampuses: prev.assignedCampuses.includes(campusId)
        ? prev.assignedCampuses.filter((id) => id !== campusId)
        : [...prev.assignedCampuses, campusId],
    }))
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Nuevo Profesor"
        description="Añade un nuevo profesor al sistema"
        icon={User}
        actions={(
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
      />

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Información del Profesor</CardTitle>
            <CardDescription>
              Completa los datos del nuevo profesor. Los campos marcados con * son obligatorios.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-md bg-destructive/10 text-destructive text-sm">
                <p className="font-semibold">Error al crear profesor</p>
                <p>{error}</p>
              </div>
            )}

            {/* Personal Info */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">
                  Nombre <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange('firstName')}
                  required
                  placeholder="Juan"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">
                  Apellidos <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange('lastName')}
                  required
                  placeholder="Pérez García"
                />
              </div>
            </div>

            {/* Contact Info */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  required
                  placeholder="juan.perez@akademate.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange('phone')}
                  placeholder="+34 922 123 456"
                />
              </div>
            </div>

            {/* Position */}
            <div className="space-y-2">
              <Label htmlFor="position">
                Especialidad / Área <span className="text-destructive">*</span>
              </Label>
              <Input
                id="position"
                value={formData.position}
                onChange={handleInputChange('position')}
                required
                placeholder="Profesor de Marketing Digital"
              />
            </div>

            {/* Employment Details */}
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
                    <SelectItem value="full_time">Tiempo Completo</SelectItem>
                    <SelectItem value="part_time">Medio Tiempo</SelectItem>
                    <SelectItem value="freelance">Freelance</SelectItem>
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
                <Label htmlFor="hireDate">Fecha de Contratación <span className="text-destructive">*</span></Label>
                <Input
                  id="hireDate"
                  type="date"
                  value={formData.hireDate}
                  onChange={handleInputChange('hireDate')}
                  required
                />
              </div>
            </div>

            {/* Assigned Campuses */}
            <div className="space-y-2">
              <Label>
                Campus / Sedes Asignadas <span className="text-destructive">*</span>
              </Label>
              {loadingCampuses ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cargando sedes...
                </div>
              ) : campuses.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2 p-4 border rounded-lg">
                  {campuses.map((campus) => (
                    <div key={campus.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`campus-${campus.id}`}
                        checked={formData.assignedCampuses.includes(campus.id)}
                        onCheckedChange={() => toggleCampus(campus.id)}
                      />
                      <label
                        htmlFor={`campus-${campus.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {campus.name} - {campus.city}
                      </label>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No hay sedes disponibles</p>
              )}
              {formData.assignedCampuses.length === 0 && (
                <p className="text-sm text-destructive">Debe seleccionar al menos una sede</p>
              )}
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio">Biografía Profesional</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={handleInputChange('bio')}
                rows={4}
                placeholder="Experiencia profesional, formación académica, especialidades..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-end pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading || formData.assignedCampuses.length === 0}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
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
