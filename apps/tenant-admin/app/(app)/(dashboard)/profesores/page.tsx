'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Badge } from '@payload-config/components/ui/badge'
import { StatusDotBadge } from '@payload-config/components/ui/listing-pills'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@payload-config/components/ui/select'
import { Plus, User, Mail, Phone, BookOpen, Eye, Loader2, GraduationCap, MapPin } from 'lucide-react'
import { PersonalListItem } from '@payload-config/components/ui/PersonalListItem'
import { ViewToggle } from '@payload-config/components/ui/ViewToggle'
import { SegmentedToggle } from '@payload-config/components/ui/SegmentedToggle'
import { useViewPreference } from '@/hooks/useViewPreference'
import {
  ListingSearch,
  PremiumDirectoryShell,
} from '@payload-config/components/directory/PremiumDirectoryShell'

interface Certification {
  title: string
  institution: string
  year: number
}

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
  assignedCampuses: {
    id: number
    name: string
    city: string
  }[]
  courseRunsCount?: number
  isActive: boolean
}

const isPlaceholderPhoto = (photo?: string | null) =>
  !photo || photo === '/placeholder-avatar.svg' || photo.includes('placeholder-avatar')

function TeacherPhotoFallback({ className = 'h-16 w-16' }: { className?: string }) {
  return (
    <div
      aria-label="Imagen genérica de docente"
      className={`relative flex ${className} items-center justify-center rounded-full border bg-primary/10 text-primary`}
    >
      <User className="h-7 w-7" aria-hidden="true" />
      <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-background bg-background text-primary shadow-sm">
        <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
    </div>
  )
}

function getDefaultCampusLabel(assignedCampuses: StaffMember['assignedCampuses']) {
  if (!assignedCampuses.length) return 'Sin sede asignada'
  const [campus] = assignedCampuses
  return campus.city ? `${campus.name} · ${campus.city}` : campus.name
}

interface TeacherExpanded extends StaffMember {
  initials: string
  active: boolean
  department: string
  specialties: string[]
  certifications: Certification[]
  courseRunsCount: number
}

interface StaffApiResponse {
  success: boolean
  data: StaffMember[]
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

        const result = (await response.json()) as StaffApiResponse

        if (!result.success) {
          throw new Error('API returned error')
        }

        // Transform API data to UI format
        const transformed: TeacherExpanded[] = result.data.map((staff: StaffMember) => ({
          ...staff,
          initials: getInitials(staff.fullName),
          active: staff.employmentStatus === 'active',
          department: staff.position, // Using position as department for now
          specialties: [], // No specialties in current schema
          certifications: [],
          courseRunsCount: staff.courseRunsCount ?? 0,
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

    void loadProfessors()
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
    router.push('/dashboard/profesores/nuevo')
  }

  const handleViewTeacher = (teacherId: number) => {
    router.push(`/dashboard/profesores/${teacherId}`)
  }

  // Get unique departments
  const departments = Array.from(new Set(teachersExpanded.map((t) => t.department)))

  // Filtrado de profesores
  const filteredTeachers = teachersExpanded.filter((teacher) => {
    const matchesSearch =
      teacher.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
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

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96" data-oid=".7rv9b5">
        <div className="text-center space-y-4" data-oid="3w:ha56">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" data-oid="ry8nko2" />
          <p className="text-muted-foreground" data-oid="vdio5_o">
            Cargando profesores...
          </p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-96" data-oid="khjdx1k">
        <Card className="max-w-md" data-oid=".i6ua6u">
          <CardContent className="pt-6 text-center space-y-4" data-oid="ri4bqni">
            <p className="text-destructive font-semibold" data-oid="qu0t_rj">
              Error al cargar profesores
            </p>
            <p className="text-sm text-muted-foreground" data-oid="rfa6f75">
              {error}
            </p>
            <Button onClick={() => window.location.reload()} data-oid="l32aam:">
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6" data-oid="e2l0769">
      <PageHeader
        title="Profesores"
        icon={User}
        badge={
          <Badge variant="secondary" data-oid="rkjy8pp">
            {filteredTeachers.length} visibles
          </Badge>
        }
        actions={
          <Button onClick={handleAdd} data-oid="p6j7z6w">
            <Plus className="h-4 w-4" data-oid="f-mq7s4" />
            Nuevo Profesor
          </Button>
        }
        data-oid="i_jz_am"
      />

      <PremiumDirectoryShell
        search={
          <ListingSearch
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Buscar profesor..."
          />
        }
        segments={
          <SegmentedToggle
            ariaLabel="Estado"
            value={filterStatus}
            onValueChange={setFilterStatus}
            options={[
              { value: 'all', label: 'Todas' },
              { value: 'active', label: 'Activos' },
              { value: 'inactive', label: 'Inactivos' },
            ]}
          />
        }
        filters={
          <Select value={filterDepartment} onValueChange={setFilterDepartment}>
            <SelectTrigger className="h-10 w-full min-w-0 bg-background md:w-[240px]">
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
        view={<ViewToggle view={view} onViewChange={setView} />}
      />

      {view === 'grid' ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" data-oid="39mqpx7">
          {filteredTeachers.map((teacher) => (
            <Card
              key={teacher.id}
              className="cursor-pointer overflow-hidden transition-shadow hover:shadow-md"
              onClick={() => handleViewTeacher(teacher.id)}
              data-oid="o-nrwq:"
            >
              <CardContent className="p-6 space-y-4" data-oid="..9i8:7">
                <div className="flex items-start gap-4" data-oid="uisstqq">
                  <div className="relative" data-oid="0gj2jev">
                    {!isPlaceholderPhoto(teacher.photo) ? (
                      <img
                        src={teacher.photo}
                        alt={`${teacher.firstName} ${teacher.lastName}`}
                        className="h-16 w-16 rounded-full object-cover"
                        data-oid="fvzsjyv"
                      />
                    ) : (
                      <TeacherPhotoFallback />
                    )}
                    {teacher.active && (
                      <div
                        className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-green-500 border-2 border-white"
                        data-oid="8_vc-xr"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0" data-oid="tlyx7:z">
                    <h3 className="font-bold text-lg leading-tight truncate" data-oid="qql9o:b">
                      {teacher.firstName} {teacher.lastName}
                    </h3>
                    <p className="text-sm text-muted-foreground truncate" data-oid="j9cy:nh">
                      {teacher.department}
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground" data-oid="teacher-campus">
                      <MapPin className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
                      <span className="truncate">{getDefaultCampusLabel(teacher.assignedCampuses)}</span>
                    </p>
                    <StatusDotBadge
                      tone={teacher.active ? 'success' : 'neutral'}
                      className="mt-2"
                    >
                      {teacher.active ? 'Activo' : 'Inactivo'}
                    </StatusDotBadge>
                  </div>
                </div>

                <div className="space-y-2 text-sm" data-oid="c168r1m">
                  <div className="flex items-center gap-2 text-muted-foreground" data-oid="0m4es40">
                    <Mail className="h-4 w-4 flex-shrink-0" data-oid="gv811l:" />
                    <span className="truncate" data-oid="7r7086-">
                      {teacher.email}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground" data-oid="9bdf1cp">
                    <Phone className="h-4 w-4 flex-shrink-0" data-oid="9rawdwn" />
                    <span data-oid="m3p2ole">{teacher.phone}</span>
                  </div>
                </div>

                <div className="border-t pt-3" data-oid="n2dx5nr">
                  <Badge variant="outline" className="gap-1" data-oid="4zvp0-t">
                    <BookOpen className="h-3.5 w-3.5" data-oid="9t33254" />
                    {teacher.courseRunsCount} convocatorias
                  </Badge>
                </div>

                <div className="pt-3 border-t" data-oid="c.v05ji">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                      e.stopPropagation()
                      handleViewTeacher(teacher.id)
                    }}
                    data-oid="..tsp8r"
                  >
                    <Eye className="mr-2 h-4 w-4" data-oid="2z3k-sj" />
                    Ver ficha docente
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2" data-oid="hu22xfr">
          {filteredTeachers.map((teacher) => (
            <PersonalListItem
              key={teacher.id}
              teacher={teacher}
              onClick={() => handleViewTeacher(teacher.id)}
              data-oid="5.iku8o"
            />
          ))}
        </div>
      )}

      {filteredTeachers.length === 0 && (
        <Card data-oid="9ju7i2m">
          <CardContent className="py-12 text-center" data-oid="-4k7.mv">
            <p className="text-muted-foreground" data-oid="wkck59j">
              No se encontraron profesores que coincidan con los filtros seleccionados.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
