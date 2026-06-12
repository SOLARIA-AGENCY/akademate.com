'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { DashboardToolbar } from '@payload-config/components/akademate/dashboard'
import { ViewToggle } from '@payload-config/components/ui/ViewToggle'
import { PersonalListItem } from '@payload-config/components/ui/PersonalListItem'
import { StaffCampusBadge, StaffContractBadge, StaffStatusBadge } from '@payload-config/components/ui/StaffBadges'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@payload-config/components/ui/select'
import { Plus, User, Mail, Phone, Briefcase, Eye, Loader2 } from 'lucide-react'
import { useViewPreference } from '@payload-config/hooks/useViewPreference'

type ViewMode = 'grid' | 'list'

interface AdminStaff {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  department: string
  role: string
  contractType: string
  active: boolean
  photo?: string
  assignedCampuses: {
    id: number
    name: string
    city: string
  }[]
}

const isPlaceholderPhoto = (photo?: string | null) =>
  !photo || photo === '/placeholder-avatar.svg' || photo.includes('placeholder-avatar')

function AdminPhotoFallback() {
  return (
    <div
      aria-label="Imagen genérica de administrativo"
      className="relative flex h-16 w-16 items-center justify-center rounded-full border bg-primary/10 text-primary shadow-md"
    >
      <User className="h-7 w-7" aria-hidden="true" />
      <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-background bg-background text-primary shadow-sm">
        <Briefcase className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
    </div>
  )
}

interface ApiStaffData {
  id: string | number
  firstName: string
  lastName: string
  email: string
  phone?: string
  position: string
  contractType?: string
  employmentStatus: string
  photo?: string
  assignedCampuses?: {
    id: number
    name: string
    city: string
  }[]
}

function formatContractType(value?: string | null) {
  const normalized = String(value ?? '').trim().toLowerCase()
  const labels: Record<string, string> = {
    full_time: 'Tiempo completo',
    part_time: 'Tiempo parcial',
    freelance: 'Autónomo',
    contract: 'Contrato',
    employee: 'Empleado',
  }
  return labels[normalized] ?? value ?? 'Contrato por definir'
}

interface ApiResponse {
  success: boolean
  data: ApiStaffData[]
}

export default function AdministrativosPage() {
  const router = useRouter()
  const viewPreference = useViewPreference('administrativo') as [ViewMode, (view: ViewMode) => void]
  const view = viewPreference[0]
  const setView = viewPreference[1]
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDepartment, setFilterDepartment] = useState('all')
  const [administrativosData, setAdministrativosData] = useState<AdminStaff[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load administrative staff from API
  useEffect(() => {
    async function loadAdministrative() {
      try {
        setLoading(true)
        const response = await fetch('/api/staff?type=administrativo&limit=100')

        if (!response.ok) {
          throw new Error('Failed to load administrative staff')
        }

        const result: ApiResponse = (await response.json()) as ApiResponse

        if (!result.success) {
          throw new Error('API returned error')
        }

        // Transform API data to UI format
        const transformed: AdminStaff[] = result.data.map((staff: ApiStaffData) => ({
          id: staff.id.toString(),
          first_name: staff.firstName,
          last_name: staff.lastName,
          email: staff.email,
          phone: staff.phone ?? 'No disponible',
          department: staff.position,
          role: staff.position,
          contractType: staff.contractType ?? 'Contrato por definir',
          active: staff.employmentStatus === 'active',
          photo: staff.photo,
          assignedCampuses: staff.assignedCampuses ?? [],
        }))

        setAdministrativosData(transformed)
        setError(null)
      } catch (err) {
        console.error('Error loading administrative staff:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    void loadAdministrative()
  }, [])

  const handleAdd = () => {
    router.push('/dashboard/administrativo/nuevo')
  }

  const departments = Array.from(new Set(administrativosData.map((a) => a.department)))

  const filteredAdmins = administrativosData.filter((admin) => {
    const matchesSearch =
      admin.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.department.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesDepartment = filterDepartment === 'all' || admin.department === filterDepartment

    return matchesSearch && matchesDepartment
  })

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96" data-oid="nvfkbeu">
        <div className="text-center space-y-4" data-oid="an7.h7u">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" data-oid="akse6wz" />
          <p className="text-muted-foreground" data-oid="6a7syi7">
            Cargando personal administrativo...
          </p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-96" data-oid=":yvs9fm">
        <Card className="max-w-md" data-oid="x5oqx5i">
          <CardContent className="pt-6 text-center space-y-4" data-oid="pqcxx20">
            <p className="text-destructive font-semibold" data-oid=":c784_.">
              Error al cargar personal administrativo
            </p>
            <p className="text-sm text-muted-foreground" data-oid="58u7wev">
              {error}
            </p>
            <Button onClick={() => window.location.reload()} data-oid="27.x0hz">
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6" data-oid="p5r5ky.">
      <PageHeader
        title="Administrativos"
        icon={Briefcase}
        description="Gestión del personal administrativo, sedes asignadas y estado operativo."
        actions={
          <Button onClick={handleAdd} data-oid="7xp380:">
            <Plus className="h-4 w-4" data-oid="koic1br" />
            Nuevo Administrativo
          </Button>
        }
        data-oid="a_ioxi."
      />

      <DashboardToolbar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Buscar por nombre, email o departamento..."
        filters={
          <Select value={filterDepartment} onValueChange={setFilterDepartment} data-oid="-xzyyj3">
            <SelectTrigger className="w-full min-w-[200px] md:w-[240px]" data-oid="7v98u3e">
              <SelectValue placeholder="Todos los departamentos" data-oid="lssmc78" />
            </SelectTrigger>
            <SelectContent data-oid="p9-i57:">
              <SelectItem value="all" data-oid="w5074d7">
                Todos los departamentos
              </SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept} value={dept} data-oid="1rwzxt-">
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
        actions={
          searchTerm || filterDepartment !== 'all' ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm('')
                setFilterDepartment('all')
              }}
              data-oid="zcoz4.4"
            >
              Limpiar filtros
            </Button>
          ) : null
        }
        viewToggle={<ViewToggle view={view} onViewChange={setView} />}
      />

      {view === 'grid' ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" data-oid=".qyvxmm">
          {filteredAdmins.map((admin) => (
            <Card
              key={admin.id}
              className="cursor-pointer transition-all duration-300 hover:shadow-lg"
              onClick={() => router.push(`/dashboard/administrativo/${admin.id}`)}
              data-oid="jq97pgy"
            >
              <CardContent className="space-y-4 p-6" data-oid="c-731r_">
                <div className="flex items-start gap-4" data-oid="z3h91.f">
                  <div className="relative" data-oid="5_myoha">
                    {!isPlaceholderPhoto(admin.photo) ? (
                      <img
                        src={admin.photo}
                        alt={`${admin.first_name} ${admin.last_name}`}
                        className="h-16 w-16 rounded-full border-2 border-background object-cover shadow-md"
                        data-oid="9kjjih1"
                      />
                    ) : (
                      <AdminPhotoFallback />
                    )}
                    {admin.active && (
                      <div
                        className="absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-white bg-green-500"
                        data-oid="a--3fut"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1" data-oid=":4dy::8">
                    <h3 className="truncate text-lg font-bold leading-tight" data-oid="hc:1-ns">
                      {admin.first_name} {admin.last_name}
                    </h3>
                    <p className="text-sm text-muted-foreground" data-oid="yz:7z45">
                      {admin.role}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2" data-oid="6xnyx.f">
                  <StaffStatusBadge status={admin.active} />
                  <StaffContractBadge data-oid="6xz2_jk">
                    {formatContractType(admin.contractType)}
                  </StaffContractBadge>
                </div>

                <div className="space-y-2 text-sm" data-oid="ouwgdtd">
                  <div className="flex flex-wrap gap-1.5">
                    {admin.assignedCampuses.length > 0 ? (
                      admin.assignedCampuses.map((campus) => (
                        <StaffCampusBadge key={campus.id}>{campus.name}</StaffCampusBadge>
                      ))
                    ) : (
                      <StaffCampusBadge>Sin sede</StaffCampusBadge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground" data-oid=".s54pkp">
                    <Mail className="h-4 w-4 flex-shrink-0" data-oid="u8xwikl" />
                    <span className="truncate" data-oid="pwj3pu9">
                      {admin.email}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground" data-oid="a9:9pgq">
                    <Phone className="h-4 w-4 flex-shrink-0" data-oid="d-q80-3" />
                    <span data-oid="cnkl9ot">{admin.phone}</span>
                  </div>
                </div>

                <div className="border-t pt-3" data-oid="-4fclxf">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation()
                      router.push(`/dashboard/administrativo/${admin.id}`)
                    }}
                    data-oid="_0w5mks"
                  >
                    <Eye className="mr-2 h-4 w-4" data-oid="4pw.ske" />
                    Ver ficha administrativo
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2" data-oid=".qyvxmm-list">
          {filteredAdmins.map((admin) => (
            <PersonalListItem
              key={admin.id}
              teacher={{
                id: admin.id,
                firstName: admin.first_name,
                lastName: admin.last_name,
                email: admin.email,
                phone: admin.phone,
                photo: admin.photo,
                position: admin.role,
                staffType: 'administrativo',
                active: admin.active,
                contractLabel: formatContractType(admin.contractType),
                assignedCampuses: admin.assignedCampuses,
              }}
              actionLabel="Ver ficha administrativo"
              onClick={() => router.push(`/dashboard/administrativo/${admin.id}`)}
            />
          ))}
        </div>
      )}

      {filteredAdmins.length === 0 && (
        <Card data-oid="ivnzxuh">
          <CardContent className="py-12 text-center" data-oid="-v0j-ga">
            <p className="text-muted-foreground" data-oid="njlk6oa">
              No se encontraron administrativos que coincidan con los filtros seleccionados.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
