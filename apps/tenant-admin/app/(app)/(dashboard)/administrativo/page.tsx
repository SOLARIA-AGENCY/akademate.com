'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Input } from '@payload-config/components/ui/input'
import { Badge } from '@payload-config/components/ui/badge'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@payload-config/components/ui/select'
import { Plus, Search, User, Mail, Phone, Briefcase, Eye, Edit, Loader2 } from 'lucide-react'

interface AdminStaff {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  department: string
  role: string
  active: boolean
  photo?: string
}

interface ApiStaffData {
  id: string | number
  firstName: string
  lastName: string
  email: string
  phone?: string
  position: string
  employmentStatus: string
  photo?: string
}

interface ApiResponse {
  success: boolean
  data: ApiStaffData[]
}

export default function AdministrativosPage() {
  const router = useRouter()
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
          active: staff.employmentStatus === 'active',
          photo: staff.photo,
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
    router.push('/administrativo/nuevo')
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

  const stats = {
    total: administrativosData.length,
    active: administrativosData.filter((a) => a.active).length,
    departments: departments.length,
  }

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
        title="Personal Administrativo"
        description={`${filteredAdmins.length} administrativos de ${administrativosData.length} totales`}
        icon={Briefcase}
        actions={
          <Button onClick={handleAdd} data-oid="7xp380:">
            <Plus className="mr-2 h-4 w-4" data-oid="koic1br" />
            Nuevo Administrativo
          </Button>
        }
        data-oid="a_ioxi."
      />

      <div className="grid gap-4 md:grid-cols-3" data-oid="qtr.0f0">
        <Card data-oid="zs8mvvp">
          <CardHeader
            className="flex flex-row items-center justify-between space-y-0 pb-2"
            data-oid="iym_nfp"
          >
            <CardTitle className="text-sm font-medium" data-oid="bc-f-s.">
              Total Personal
            </CardTitle>
            <User className="h-4 w-4 text-muted-foreground" data-oid="7gcw1g2" />
          </CardHeader>
          <CardContent data-oid="3dag2fh">
            <div className="text-2xl font-bold" data-oid=":i_gyth">
              {stats.total}
            </div>
          </CardContent>
        </Card>

        <Card data-oid="lk6fr-y">
          <CardHeader
            className="flex flex-row items-center justify-between space-y-0 pb-2"
            data-oid="pvcf.:c"
          >
            <CardTitle className="text-sm font-medium" data-oid="6zuns-4">
              Activos
            </CardTitle>
            <User className="h-4 w-4 text-green-600" data-oid="sqmza:o" />
          </CardHeader>
          <CardContent data-oid="arq5i-s">
            <div className="text-2xl font-bold text-green-600" data-oid="w6ci87u">
              {stats.active}
            </div>
          </CardContent>
        </Card>

        <Card data-oid="u0gnvlu">
          <CardHeader
            className="flex flex-row items-center justify-between space-y-0 pb-2"
            data-oid="hr:e0kr"
          >
            <CardTitle className="text-sm font-medium" data-oid="_9bnwq.">
              Departamentos
            </CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" data-oid="vb3pxxy" />
          </CardHeader>
          <CardContent data-oid="3j:0-gd">
            <div className="text-2xl font-bold" data-oid="0c_akd9">
              {stats.departments}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card data-oid="pz5ian6">
        <CardContent className="pt-6" data-oid="ei37n:m">
          <div className="grid gap-4 md:grid-cols-2" data-oid="n87:n39">
            <div className="relative" data-oid="gzhnjcu">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                data-oid="r_ieulf"
              />
              <Input
                placeholder="Buscar por nombre, email o departamento..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-oid="wk9dzf:"
              />
            </div>

            <Select value={filterDepartment} onValueChange={setFilterDepartment} data-oid="-xzyyj3">
              <SelectTrigger data-oid="7v98u3e">
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
          </div>

          {(searchTerm || filterDepartment !== 'all') && (
            <div className="flex items-center gap-4 mt-4" data-oid="zfwgtt1">
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
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" data-oid=".qyvxmm">
        {filteredAdmins.map((admin) => (
          <Card
            key={admin.id}
            className="cursor-pointer hover:shadow-lg transition-all duration-300"
            onClick={() => router.push(`/administrativo/${admin.id}`)}
            data-oid="jq97pgy"
          >
            <CardContent className="p-6 space-y-4" data-oid="c-731r_">
              <div className="flex items-start gap-4" data-oid="z3h91.f">
                <div className="relative" data-oid="5_myoha">
                  {admin.photo ? (
                    <img
                      src={admin.photo}
                      alt={`${admin.first_name} ${admin.last_name}`}
                      className="h-16 w-16 rounded-full object-cover border-2 border-background shadow-md"
                      data-oid="9kjjih1"
                    />
                  ) : (
                    <div
                      className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground"
                      data-oid="jqqihaa"
                    >
                      <span className="text-xl font-bold" data-oid="gfsogm_">
                        {admin.first_name[0]}
                        {admin.last_name[0]}
                      </span>
                    </div>
                  )}
                  {admin.active && (
                    <div
                      className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-green-500 border-2 border-white"
                      data-oid="a--3fut"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0" data-oid=":4dy::8">
                  <h3 className="font-bold text-lg leading-tight truncate" data-oid="hc:1-ns">
                    {admin.first_name} {admin.last_name}
                  </h3>
                  <p className="text-sm text-muted-foreground" data-oid="yz:7z45">
                    {admin.role}
                  </p>
                </div>
              </div>

              <div className="space-y-2" data-oid="6xnyx.f">
                <Badge variant="secondary" className="text-xs" data-oid="6xz2_jk">
                  {admin.department}
                </Badge>
              </div>

              <div className="space-y-2 text-sm" data-oid="ouwgdtd">
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

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-3 border-t" data-oid="-4fclxf">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation()
                    router.push(`/administrativo/${admin.id}`)
                  }}
                  data-oid="_0w5mks"
                >
                  <Eye className="mr-2 h-4 w-4" data-oid="4pw.ske" />
                  Ver Detalles
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  className="w-full"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation()
                    router.push(`/administrativo/${admin.id}/editar`)
                  }}
                  data-oid="xuuc_91"
                >
                  <Edit className="mr-2 h-4 w-4" data-oid="u3a2ln1" />
                  Editar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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
