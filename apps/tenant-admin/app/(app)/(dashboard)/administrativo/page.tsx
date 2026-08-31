'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@payload-config/components/ui/select'
import { Plus, Mail, Phone, Briefcase, Eye, Loader2 } from 'lucide-react'
import { EntityThumb } from '@payload-config/components/ui/entity-thumb'
import {
  ListingSearch,
  PremiumDirectoryShell,
} from '@payload-config/components/directory/PremiumDirectoryShell'
import { DirectoryNeutralBadge } from '@payload-config/components/directory/PremiumDirectoryShell'
import { SortableListHeader } from '@payload-config/components/ui/sortable-table-head'
import { useCycleSort } from '@payload-config/hooks/useCycleSort'
import type { SortKind } from '@payload-config/lib/cycle-sort'

const ADMINISTRATIVO_SORT_KINDS = {
  nombre: 'text',
  departamento: 'text',
  rol: 'text',
  estado: 'text',
} as const satisfies Record<string, SortKind>

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

const isPlaceholderPhoto = (photo?: string | null) =>
  !photo || photo === '/placeholder-avatar.svg' || photo.includes('placeholder-avatar')

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
  const { state: sortState, toggle: toggleSort, reset: resetSort, sortRows } = useCycleSort(
    ADMINISTRATIVO_SORT_KINDS,
  )

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

  const filteredAdmins = sortRows(
    administrativosData.filter((admin) => {
      const matchesSearch =
        admin.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.department.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesDepartment = filterDepartment === 'all' || admin.department === filterDepartment

      return matchesSearch && matchesDepartment
    }),
    (admin, column) => {
      switch (column) {
        case 'nombre':
          return `${admin.first_name} ${admin.last_name}`
        case 'departamento':
          return admin.department
        case 'rol':
          return admin.role
        case 'estado':
          return admin.active ? 'Activo' : 'Inactivo'
        default: {
          const _never: never = column
          return _never
        }
      }
    },
  )

  useEffect(() => {
    resetSort()
  }, [searchTerm, filterDepartment, resetSort])

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
        icon={Briefcase}
        actions={
          <Button onClick={handleAdd} data-oid="7xp380:">
            <Plus className="h-4 w-4" data-oid="koic1br" />
            Nuevo Administrativo
          </Button>
        }
        data-oid="a_ioxi."
      />

      <PremiumDirectoryShell
        search={
          <ListingSearch
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Buscar por nombre, email o departamento..."
          />
        }
        filters={
          <Select value={filterDepartment} onValueChange={setFilterDepartment}>
            <SelectTrigger className="h-10 bg-background">
              <SelectValue placeholder="Todos los departamentos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los departamentos</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <div className="space-y-3">
        <SortableListHeader
          sort={sortState}
          onToggle={toggleSort}
          leadingClassName={null}
          columns={[
            { id: 'nombre', label: 'Nombre', className: 'flex-1' },
            { id: 'departamento', label: 'Departamento', className: 'w-40' },
            { id: 'rol', label: 'Cargo', className: 'w-36' },
            { id: 'estado', label: 'Estado', className: 'w-24' },
          ]}
        />
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
                  <div
                    aria-label={
                      isPlaceholderPhoto(admin.photo) ? 'Imagen genérica de administrativo' : undefined
                    }
                  >
                    <EntityThumb
                      src={isPlaceholderPhoto(admin.photo) ? null : admin.photo}
                      alt={`${admin.first_name} ${admin.last_name}`}
                      fallback="admin"
                      size="md"
                      className="h-16 w-16"
                    />
                  </div>
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
                <DirectoryNeutralBadge className="text-xs">
                  {admin.department}
                </DirectoryNeutralBadge>
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
              <div className="pt-3 border-t" data-oid="-4fclxf">
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
                  Ver ficha administrativo
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
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
