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
import { Plus, Search, User, Mail, Phone, BookOpen, MapPin, Award, Eye, Edit, Loader2 } from 'lucide-react'
import { PersonalListItem } from '@payload-config/components/ui/PersonalListItem'
import { ViewToggle } from '@payload-config/components/ui/ViewToggle'
import { useViewPreference } from '@payload-config/hooks/useViewPreference'

interface StaffMember {
  id: number
  staffType: string
  firstName: string
  lastName: string
  fullName: string
  email: string
  phone?: string
  position: string
  contractType: string
  employmentStatus: string
  photo: string
  bio?: string
  assignedCampuses: Array<{
    id: number
    name: string
    city: string
  }>
  courseRunsCount?: number
  isActive: boolean
}

interface TeacherExpanded extends StaffMember {
  initials: string
  active: boolean
  department: string
  specialties: string[]
  certifications: any[]
  courseRunsCount: number
}

export default function ProfesoresPage() {
  const router = useRouter()

  // View preference
  const [view, setView] = useViewPreference('profesores')

  // Data state
  const [teachersExpanded, setTeachersExpanded] = useState<TeacherExpanded[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDepartment, setFilterDepartment] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  // Load staff data from API
  useEffect(() => {
    async function loadProfessors() {
      try {
        setLoading(true)
        const response = await fetch('/api/staff?type=profesor&limit=100')

        if (!response.ok) {
          throw new Error('Failed to load professors')
        }

        const result = await response.json()

        if (!result.success) {
          throw new Error('API returned error')
        }

        // Transform API data to UI format
        const transformed: TeacherExpanded[] = result.data.map((staff: StaffMember) => ({
          ...staff,
          id: staff.id.toString(),
          initials: getInitials(staff.fullName),
          active: staff.employmentStatus === 'active',
          department: staff.position, // Using position as department for now
          specialties: [], // No specialties in current schema
          certifications: [],
          courseRunsCount: staff.courseRunsCount || 0,
          first_name: staff.firstName,
          last_name: staff.lastName,
          photo: staff.photo,
        }))

        setTeachersExpanded(transformed)
        setError(null)
      } catch (err) {
        console.error('Error loading professors:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    loadProfessors()
  }, [])

  function getInitials(fullName: string): string {
    return fullName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleAdd = () => {
    console.log('Crear nuevo profesor')
  }

  const handleViewTeacher = (teacherId: string) => {
    router.push(`/profesores/${teacherId}`)
  }

  // Get unique departments
  const departments = Array.from(new Set(teachersExpanded.map((t) => t.department)))

  // Filtrado de profesores
  const filteredTeachers = teachersExpanded.filter((teacher) => {
    const matchesSearch =
      teacher.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.specialties.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesDepartment = filterDepartment === 'all' || teacher.department === filterDepartment
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && teacher.active) ||
      (filterStatus === 'inactive' && !teacher.active)

    return matchesSearch && matchesDepartment && matchesStatus
  })

  // Stats
  const stats = {
    total: teachersExpanded.length,
    active: teachersExpanded.filter((t) => t.active).length,
    inactive: teachersExpanded.filter((t) => !t.active).length,
    totalCourseRuns: teachersExpanded.reduce((sum, t) => sum + t.courseRunsCount, 0),
    avgCourseRunsPerTeacher: (
      teachersExpanded.reduce((sum, t) => sum + t.courseRunsCount, 0) / teachersExpanded.length
    ).toFixed(1),
  }

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Cargando profesores...</p>
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
            <p className="text-destructive font-semibold">Error al cargar profesores</p>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button onClick={() => window.location.reload()}>Reintentar</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <User className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Profesores</h1>
            <p className="text-muted-foreground mt-1">
              {filteredTeachers.length} profesores de {teachersExpanded.length} totales
            </p>
          </div>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Profesor
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profesores</CardTitle>
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
            <CardTitle className="text-sm font-medium">Inactivos</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{stats.inactive}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Convocatorias</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCourseRuns}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promedio Convocatorias</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgCourseRunsPerTeacher}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            {/* Filtros principales */}
            <div className="flex-1 grid gap-4 md:grid-cols-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, email, departamento..."
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

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="active">Activos</SelectItem>
                  <SelectItem value="inactive">Inactivos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* View Toggle */}
            <div className="hidden lg:block">
              <ViewToggle view={view} onViewChange={setView} />
            </div>
          </div>

          {(searchTerm || filterDepartment !== 'all' || filterStatus !== 'all') && (
            <div className="flex items-center gap-4 mt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm('')
                  setFilterDepartment('all')
                  setFilterStatus('all')
                }}
              >
                Limpiar filtros
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grid o Lista de Profesores */}
      {view === 'grid' ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTeachers.map((teacher) => (
            <Card
              key={teacher.id}
              className="cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden"
              onClick={() => handleViewTeacher(teacher.id)}
            >
              <CardContent className="p-6 space-y-4">
                {/* Header con foto y nombre */}
                <div className="flex items-start gap-4">
                  <div className="relative">
                    {teacher.photo ? (
                      <img
                        src={teacher.photo}
                        alt={`${teacher.first_name} ${teacher.last_name}`}
                        className="h-16 w-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <span className="text-xl font-bold">{teacher.initials}</span>
                      </div>
                    )}
                    {teacher.active && (
                      <div className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-green-500 border-2 border-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg leading-tight truncate">
                      {teacher.first_name} {teacher.last_name}
                    </h3>
                    <p className="text-sm text-muted-foreground">{teacher.department}</p>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{teacher.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4 flex-shrink-0" />
                    <span>{teacher.phone}</span>
                  </div>
                </div>

                {/* Specialties */}
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-semibold uppercase">
                    Especialidades
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {teacher.specialties.slice(0, 3).map((specialty, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {specialty}
                      </Badge>
                    ))}
                    {teacher.specialties.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{teacher.specialties.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <span className="font-bold">{teacher.courseRunsCount}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Convocatorias</p>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Award className="h-4 w-4 text-muted-foreground" />
                      <span className="font-bold">{teacher.certifications.length}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Certificaciones</p>
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
                      handleViewTeacher(teacher.id)
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
                      router.push(`/profesores/${teacher.id}/editar`)
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
      ) : (
        <div className="flex flex-col gap-2">
          {filteredTeachers.map((teacher) => (
            <PersonalListItem
              key={teacher.id}
              teacher={teacher}
              onClick={() => handleViewTeacher(teacher.id)}
            />
          ))}
        </div>
      )}

      {/* Si no hay resultados */}
      {filteredTeachers.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No se encontraron profesores que coincidan con los filtros seleccionados.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
