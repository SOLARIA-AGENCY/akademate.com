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
import { Checkbox } from '@payload-config/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@payload-config/components/ui/select'
import { ArrowLeft, Save, Loader2, Briefcase } from 'lucide-react'

interface Campus {
  id: number
  name: string
  city: string
}

interface CampusesApiResponse {
  success: boolean
  data: Campus[]
}

interface StaffApiResponse {
  success: boolean
  data: { id: number }
  error?: string
}

export default function NewAdministrativoPage() {
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

        const result = (await response.json()) as CampusesApiResponse
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
          staffType: 'administrativo',
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
        throw new Error('Failed to create administrative staff')
      }

      const result = (await response.json()) as StaffApiResponse

      if (!result.success) {
        throw new Error(result.error ?? 'Error creating administrative staff')
      }

      // Redirect to detail page
      router.push(`/administrativo/${result.data.id}`)
    } catch (err) {
      console.error('Error creating administrative staff:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
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
    <div className="space-y-6 max-w-4xl" data-oid="bt1gpq8">
      <PageHeader
        title="Nuevo Personal Administrativo"
        description="Añade un nuevo miembro del personal administrativo"
        icon={Briefcase}
        actions={
          <Button variant="ghost" size="icon" onClick={() => router.back()} data-oid=":vjcx4-">
            <ArrowLeft className="h-5 w-5" data-oid="sj53gm1" />
          </Button>
        }
        data-oid="bwfw5w2"
      />

      <form onSubmit={handleSubmit} data-oid="zmk_043">
        <Card data-oid="2bx2obi">
          <CardHeader data-oid="z123k2s">
            <CardTitle data-oid="azpkxno">Información del Personal Administrativo</CardTitle>
            <CardDescription data-oid="t2jgv1y">
              Completa los datos del nuevo miembro. Los campos marcados con * son obligatorios.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6" data-oid="q_-2zo0">
            {/* Error Message */}
            {error && (
              <div
                className="p-4 rounded-md bg-destructive/10 text-destructive text-sm"
                data-oid="ynnub_7"
              >
                <p className="font-semibold" data-oid="tb:zlbm">
                  Error al crear personal administrativo
                </p>
                <p data-oid="lhpssn8">{error}</p>
              </div>
            )}

            {/* Personal Info */}
            <div className="grid gap-4 md:grid-cols-2" data-oid="uwnq3id">
              <div className="space-y-2" data-oid="x98blfb">
                <Label htmlFor="firstName" data-oid="0d-r6jt">
                  Nombre{' '}
                  <span className="text-destructive" data-oid="1fft9vl">
                    *
                  </span>
                </Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleChange('firstName', e.target.value)
                  }
                  required
                  placeholder="María"
                  data-oid="a41_q9q"
                />
              </div>

              <div className="space-y-2" data-oid=".457_xx">
                <Label htmlFor="lastName" data-oid="z3t-cep">
                  Apellidos{' '}
                  <span className="text-destructive" data-oid="akuv28v">
                    *
                  </span>
                </Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleChange('lastName', e.target.value)
                  }
                  required
                  placeholder="González López"
                  data-oid="jdc:yja"
                />
              </div>
            </div>

            {/* Contact Info */}
            <div className="grid gap-4 md:grid-cols-2" data-oid="cwaizc1">
              <div className="space-y-2" data-oid="fuk_zqm">
                <Label htmlFor="email" data-oid="fh6okmv">
                  Email{' '}
                  <span className="text-destructive" data-oid="4znt5pi">
                    *
                  </span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleChange('email', e.target.value)
                  }
                  required
                  placeholder="maria.gonzalez@akademate.com"
                  data-oid="5f6pcxp"
                />
              </div>

              <div className="space-y-2" data-oid="d9ypea-">
                <Label htmlFor="phone" data-oid="lu7bsvb">
                  Teléfono
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleChange('phone', e.target.value)
                  }
                  placeholder="+34 922 123 456"
                  data-oid="8abhs:6"
                />
              </div>
            </div>

            {/* Position */}
            <div className="space-y-2" data-oid="c3o5n:k">
              <Label htmlFor="position" data-oid="gkh9mh:">
                Posición / Cargo{' '}
                <span className="text-destructive" data-oid="7:ck1wx">
                  *
                </span>
              </Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleChange('position', e.target.value)
                }
                required
                placeholder="Secretaria Académica"
                data-oid="ex3-giw"
              />
            </div>

            {/* Employment Details */}
            <div className="grid gap-4 md:grid-cols-3" data-oid="erlz4_y">
              <div className="space-y-2" data-oid="p75_77k">
                <Label htmlFor="contractType" data-oid="d9g8dxz">
                  Tipo de Contrato
                </Label>
                <Select
                  value={formData.contractType}
                  onValueChange={(value: string) => handleChange('contractType', value)}
                  data-oid="2aoen77"
                >
                  <SelectTrigger id="contractType" data-oid="q4ae4uh">
                    <SelectValue data-oid="-wrbgrh" />
                  </SelectTrigger>
                  <SelectContent data-oid="logbi19">
                    <SelectItem value="full_time" data-oid="7mt4t__">
                      Tiempo Completo
                    </SelectItem>
                    <SelectItem value="part_time" data-oid="6pvzykh">
                      Medio Tiempo
                    </SelectItem>
                    <SelectItem value="freelance" data-oid="8n7:cgx">
                      Autónomo
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2" data-oid="0mofvh8">
                <Label htmlFor="employmentStatus" data-oid="k:cfyaq">
                  Estado
                </Label>
                <Select
                  value={formData.employmentStatus}
                  onValueChange={(value: string) => handleChange('employmentStatus', value)}
                  data-oid="bu8vo7:"
                >
                  <SelectTrigger id="employmentStatus" data-oid="2glf59z">
                    <SelectValue data-oid="fg:o_r1" />
                  </SelectTrigger>
                  <SelectContent data-oid="u7ceyfc">
                    <SelectItem value="active" data-oid="4-0.1m.">
                      Activo
                    </SelectItem>
                    <SelectItem value="temporary_leave" data-oid="4:frvua">
                      Baja Temporal
                    </SelectItem>
                    <SelectItem value="inactive" data-oid="-m125bo">
                      Inactivo
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2" data-oid=".reygnw">
                <Label htmlFor="hireDate" data-oid="hajg0g8">
                  Fecha de Contratación{' '}
                  <span className="text-destructive" data-oid="1x:f:0s">
                    *
                  </span>
                </Label>
                <Input
                  id="hireDate"
                  type="date"
                  value={formData.hireDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleChange('hireDate', e.target.value)
                  }
                  required
                  data-oid="cordl:6"
                />
              </div>
            </div>

            {/* Assigned Campuses */}
            <div className="space-y-2" data-oid="ods0f7r">
              <Label data-oid="i88_eda">
                Sedes Asignadas{' '}
                <span className="text-destructive" data-oid="5kb8zyw">
                  *
                </span>
              </Label>
              {loadingCampuses ? (
                <div
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                  data-oid="yrrwwmq"
                >
                  <Loader2 className="h-4 w-4 animate-spin" data-oid="rowdl0m" />
                  Cargando sedes...
                </div>
              ) : campuses.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2 p-4 border rounded-lg" data-oid="vqm7ydt">
                  {campuses.map((campus) => (
                    <div key={campus.id} className="flex items-center space-x-2" data-oid="o-sd9dk">
                      <Checkbox
                        id={`campus-${campus.id}`}
                        checked={formData.assignedCampuses.includes(campus.id)}
                        onCheckedChange={() => toggleCampus(campus.id)}
                        data-oid=":s-rq8s"
                      />

                      <label
                        htmlFor={`campus-${campus.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        data-oid="6jqswl8"
                      >
                        {campus.name} - {campus.city}
                      </label>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground" data-oid="7e:dc2w">
                  No hay sedes disponibles
                </p>
              )}
              {formData.assignedCampuses.length === 0 && (
                <p className="text-sm text-destructive" data-oid="8o_.bgi">
                  Debe seleccionar al menos una sede
                </p>
              )}
            </div>

            {/* Bio */}
            <div className="space-y-2" data-oid="wulb-ei">
              <Label htmlFor="bio" data-oid="g8myn-8">
                Biografía / Notas
              </Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  handleChange('bio', e.target.value)
                }
                rows={4}
                placeholder="Información adicional sobre el personal administrativo..."
                data-oid="et1-o05"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-end pt-4 border-t" data-oid="o6qgtil">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
                data-oid="z41prl0"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading || formData.assignedCampuses.length === 0}
                data-oid="08-5v05"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" data-oid="y4:s:ez" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" data-oid="m.z9zua" />
                    Crear Personal Administrativo
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
