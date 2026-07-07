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
import { formatSpanishPhoneInput } from '@/lib/phone'
import { formatStaffEmailInput, formatStaffNifInput } from '@/lib/staff-contact'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@payload-config/components/ui/select'
import { ArrowLeft, Save, Loader2, Briefcase, MapPin, X } from 'lucide-react'

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
    bio: '',
    hireDate: new Date().toISOString().split('T')[0],
    baseCampusId: null as number | null,
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
      if (!formData.baseCampusId) {
        throw new Error('Selecciona una sede base antes de crear este administrativo.')
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
          staffType: 'administrativo',
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
          position: formData.position,
          contractType: formData.contractType,
          employmentStatus: formData.employmentStatus,
          hireDate: formData.hireDate,
          bio: formData.bio,
          baseCampusId: formData.baseCampusId,
          assignedCampuses: formData.assignedCampuses,
        }),
      })

      const result = (await response.json()) as StaffApiResponse

      if (!response.ok || !result.success) {
        throw new Error(result.error ?? 'Error creating administrative staff')
      }

      // Redirect to detail page
      router.push(`/dashboard/administrativo/${result.data.id}`)
    } catch (err) {
      console.error('Error creating administrative staff:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      setLoading(false)
    }
  }

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

  const selectedCampuses = campuses.filter((campus) => formData.assignedCampuses.includes(campus.id))
  const availableCampuses = campuses.filter(
    (campus) => !formData.assignedCampuses.includes(campus.id)
  )
  const createBlockedReason =
    formData.firstName.trim().length === 0
      ? 'Bloqueado: introduce el nombre.'
      : formData.firstSurname.trim().length === 0
        ? 'Bloqueado: introduce el primer apellido.'
        : formData.position.trim().length === 0
          ? 'Bloqueado: indica el puesto.'
          : !formData.baseCampusId
            ? 'Bloqueado: selecciona una sede base.'
            : formData.assignedCampuses.length === 0
              ? 'Bloqueado: añade al menos una sede asignada.'
              : null

  return (
    <div className="mx-auto max-w-6xl space-y-6" data-oid="bt1gpq8">
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
            <div className="grid gap-4 md:grid-cols-3" data-oid="uwnq3id">
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
                <Label htmlFor="firstSurname" data-oid="z3t-cep">
                  Primer apellido{' '}
                  <span className="text-destructive" data-oid="akuv28v">
                    *
                  </span>
                </Label>
                <Input
                  id="firstSurname"
                  value={formData.firstSurname}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleChange('firstSurname', e.target.value)
                  }
                  required
                  placeholder="González"
                  data-oid="jdc:yja"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondSurname">Segundo apellido</Label>
                <Input
                  id="secondSurname"
                  value={formData.secondSurname}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleChange('secondSurname', e.target.value)
                  }
                  placeholder="López"
                />
              </div>
            </div>

            {/* Contact Info */}
            <div className="grid gap-4 md:grid-cols-3" data-oid="cwaizc1">
              <div className="space-y-2">
                <Label htmlFor="nif">NIF/DNI</Label>
                <Input
                  id="nif"
                  value={formData.nif}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleChange('nif', e.target.value)
                  }
                  onBlur={handleNifBlur}
                  placeholder="12345678Z"
                />
              </div>

              <div className="space-y-2" data-oid="fuk_zqm">
                <Label htmlFor="email" data-oid="fh6okmv">
                  Email{' '}
                  <span className="text-destructive" data-oid="4znt5pi">
                    *
                  </span>
                </Label>
                <Input
                  id="email"
                  type="text"
                  inputMode="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  value={formData.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleChange('email', e.target.value)
                  }
                  onBlur={handleEmailBlur}
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
                  onBlur={handlePhoneBlur}
                  placeholder="+34 922 123 456"
                  data-oid="8abhs:6"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[2fr_1fr_140px]">
              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleChange('address', e.target.value)
                  }
                  placeholder="Calle, número, piso..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Ciudad</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleChange('city', e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postalCode">Código postal</Label>
                <Input
                  id="postalCode"
                  value={formData.postalCode}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleChange('postalCode', e.target.value)
                  }
                  inputMode="numeric"
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
                    <SelectItem value="general_regime">Régimen General</SelectItem>
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

            <div className="grid gap-4 lg:grid-cols-[minmax(220px,320px)_1fr]">
              <div className="space-y-2" data-oid="ods0f7r">
                <Label htmlFor="baseCampus" data-oid="i88_eda">
                  Sede base{' '}
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
                ) : (
                  <p className="text-sm text-muted-foreground" data-oid="7e:dc2w">
                    No hay sedes disponibles
                  </p>
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
                disabled={loading || Boolean(createBlockedReason)}
                title={createBlockedReason ?? undefined}
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
