'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Input } from '@payload-config/components/ui/input'
import { Badge } from '@payload-config/components/ui/badge'
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

        const result = await response.json()

        if (!result.success) {
          throw new Error('API returned error')
        }

        // Transform API data to UI format
        const transformed: AdminStaff[] = result.data.map((staff: any) => ({
          id: staff.id.toString(),
          first_name: staff.firstName,
          last_name: staff.lastName,
          email: staff.email,
          phone: staff.phone || 'No disponible',
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

    loadAdministrative()
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
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Cargando personal administrativo...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <p className="text-destructive font-semibold">Error al cargar personal administrativo</p>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button onClick={() => window.location.reload()}>Reintentar</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Briefcase className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Personal Administrativo</h1>
            <p className="text-muted-foreground mt-1">
              {filteredAdmins.length} administrativos de {administrativosData.length} totales
            </p>
          </div>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Administrativo
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Personal</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activos</CardTitle>
            <User className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Departamentos</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.departments}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, email o departamento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={filterDepartment} onValueChange={setFilterDepartment}>
              <SelectTrigger>
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
          </div>

          {(searchTerm || filterDepartment !== 'all') && (
            <div className="flex items-center gap-4 mt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm('')
                  setFilterDepartment('all')
                }}
              >
                Limpiar filtros
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredAdmins.map((admin) => (
          <Card
            key={admin.id}
            className="cursor-pointer hover:shadow-lg transition-all duration-300"
            onClick={() => router.push(`/administrativo/${admin.id}`)}
          >
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className="relative">
                  {admin.photo ? (
                    <img
                      src={admin.photo}
                      alt={`${admin.first_name} ${admin.last_name}`}
                      className="h-16 w-16 rounded-full object-cover border-2 border-background shadow-md"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <span className="text-xl font-bold">
                        {admin.first_name[0]}{admin.last_name[0]}
                      </span>
                    </div>
                  )}
                  {admin.active && (
                    <div className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-green-500 border-2 border-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg leading-tight truncate">
                    {admin.first_name} {admin.last_name}
                  </h3>
                  <p className="text-sm text-muted-foreground">{admin.role}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Badge variant="secondary" className="text-xs">
                  {admin.department}
                </Badge>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{admin.email}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4 flex-shrink-0" />
                  <span>{admin.phone}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-3 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(`/administrativo/${admin.id}`)
                  }}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Ver Detalles
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(`/administrativo/${admin.id}/editar`)
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAdmins.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No se encontraron administrativos que coincidan con los filtros seleccionados.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
