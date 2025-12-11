'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { MockDataIndicator } from '@payload-config/components/ui/MockDataIndicator'
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
import {
  Plus,
  Search,
  User,
  Mail,
  Phone,
  BookOpen,
  CheckCircle2,
  Eye,
  Edit,
  LayoutGrid,
  List,
  MapPin,
  GraduationCap,
} from 'lucide-react'

// Datos extendidos de estudiantes
const studentsDataExtended = [
  {
    id: '1',
    first_name: 'María',
    last_name: 'González Ruiz',
    email: 'maria.gonzalez@email.com',
    phone: '+34 612 345 001',
    active: true,
    enrolled_courses: 2,
    completed_courses: 3,
    sede: 'CEP Norte',
    curso_actual: 'Marketing Digital Avanzado',
    ciclo: 'Marketing y Publicidad',
    fecha_inscripcion: '2024-09-15',
  },
  {
    id: '2',
    first_name: 'Juan',
    last_name: 'Martínez López',
    email: 'juan.martinez@email.com',
    phone: '+34 612 345 002',
    active: true,
    enrolled_courses: 1,
    completed_courses: 1,
    sede: 'CEP Santa Cruz',
    curso_actual: 'Desarrollo Web Full Stack',
    ciclo: 'Desarrollo de Aplicaciones',
    fecha_inscripcion: '2024-10-01',
  },
  {
    id: '3',
    first_name: 'Ana',
    last_name: 'Rodríguez Sánchez',
    email: 'ana.rodriguez@email.com',
    phone: '+34 612 345 003',
    active: true,
    enrolled_courses: 3,
    completed_courses: 5,
    sede: 'CEP Norte',
    curso_actual: 'Diseño Gráfico Profesional',
    ciclo: 'Diseño y Artes Gráficas',
    fecha_inscripcion: '2024-01-10',
  },
  {
    id: '4',
    first_name: 'Carlos',
    last_name: 'Fernández Torres',
    email: 'carlos.fernandez@email.com',
    phone: '+34 612 345 004',
    active: false,
    enrolled_courses: 0,
    completed_courses: 2,
    sede: 'CEP Sur',
    curso_actual: '-',
    ciclo: 'Marketing y Publicidad',
    fecha_inscripcion: '2023-11-20',
  },
  {
    id: '5',
    first_name: 'Laura',
    last_name: 'García Pérez',
    email: 'laura.garcia@email.com',
    phone: '+34 612 345 005',
    active: true,
    enrolled_courses: 2,
    completed_courses: 4,
    sede: 'CEP Santa Cruz',
    curso_actual: 'Community Manager Profesional',
    ciclo: 'Marketing y Publicidad',
    fecha_inscripcion: '2024-02-15',
  },
  {
    id: '6',
    first_name: 'Pedro',
    last_name: 'López Martínez',
    email: 'pedro.lopez@email.com',
    phone: '+34 612 345 006',
    active: true,
    enrolled_courses: 1,
    completed_courses: 0,
    sede: 'CEP Norte',
    curso_actual: 'SEO y Posicionamiento Web',
    ciclo: 'Marketing y Publicidad',
    fecha_inscripcion: '2024-11-01',
  },
  {
    id: '7',
    first_name: 'Elena',
    last_name: 'Sánchez Ruiz',
    email: 'elena.sanchez@email.com',
    phone: '+34 612 345 007',
    active: true,
    enrolled_courses: 2,
    completed_courses: 6,
    sede: 'CEP Sur',
    curso_actual: 'Producción Audiovisual',
    ciclo: 'Imagen y Sonido',
    fecha_inscripcion: '2023-09-05',
  },
  {
    id: '8',
    first_name: 'Miguel',
    last_name: 'Torres Díaz',
    email: 'miguel.torres@email.com',
    phone: '+34 612 345 008',
    active: true,
    enrolled_courses: 1,
    completed_courses: 2,
    sede: 'CEP Santa Cruz',
    curso_actual: 'Excel Avanzado y Power BI',
    ciclo: 'Administración y Gestión',
    fecha_inscripcion: '2024-08-20',
  },
]

export default function AlumnosPage() {
  const router = useRouter()

  // Estados de visualización
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [selectedStudent, setSelectedStudent] = useState(studentsDataExtended[0])

  // Estados de filtrado
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterSede, setFilterSede] = useState('all')
  const [filterCurso, setFilterCurso] = useState('all')
  const [filterCiclo, setFilterCiclo] = useState('all')

  const handleAdd = () => {
    console.log('Crear nuevo alumno')
  }

  const handleViewStudent = (studentId: string) => {
    router.push(`/alumnos/${studentId}`)
  }

  // Extraer valores únicos para filtros
  const sedes = Array.from(new Set(studentsDataExtended.map((s) => s.sede)))
  const cursos = Array.from(new Set(studentsDataExtended.map((s) => s.curso_actual).filter((c) => c !== '-')))
  const ciclos = Array.from(new Set(studentsDataExtended.map((s) => s.ciclo)))

  // Filtrado
  const filteredStudents = studentsDataExtended.filter((student) => {
    const matchesSearch =
      student.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && student.active) ||
      (filterStatus === 'inactive' && !student.active)

    const matchesSede = filterSede === 'all' || student.sede === filterSede
    const matchesCurso = filterCurso === 'all' || student.curso_actual === filterCurso
    const matchesCiclo = filterCiclo === 'all' || student.ciclo === filterCiclo

    return matchesSearch && matchesStatus && matchesSede && matchesCurso && matchesCiclo
  })

  const stats = {
    total: studentsDataExtended.length,
    active: studentsDataExtended.filter((s) => s.active).length,
    inactive: studentsDataExtended.filter((s) => !s.active).length,
    totalEnrolled: studentsDataExtended.reduce((sum, s) => sum + s.enrolled_courses, 0),
    totalCompleted: studentsDataExtended.reduce((sum, s) => sum + s.completed_courses, 0),
  }

  return (
    <div className="space-y-6">
      {/* Mock Data Banner */}
      <MockDataIndicator
        variant="banner"
        label="Este módulo usa datos de demostración. Pendiente conexión con API de Alumnos."
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <User className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Alumnos</h1>
            <p className="text-muted-foreground mt-1">
              {filteredStudents.length} alumnos de {studentsDataExtended.length} totales
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Toggle visualización */}
          <div className="flex items-center gap-1 bg-secondary p-1 rounded-lg">
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4 mr-2" />
              Listado
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4 mr-2" />
              Fichas
            </Button>
          </div>
          <Button onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Alumno
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alumnos</CardTitle>
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
            <CardTitle className="text-sm font-medium">Cursando</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEnrolled}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completados</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCompleted}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="inactive">Inactivos</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterSede} onValueChange={setFilterSede}>
              <SelectTrigger>
                <SelectValue placeholder="Sede" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las sedes</SelectItem>
                {sedes.map((sede) => (
                  <SelectItem key={sede} value={sede}>
                    {sede}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterCurso} onValueChange={setFilterCurso}>
              <SelectTrigger>
                <SelectValue placeholder="Curso" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los cursos</SelectItem>
                {cursos.map((curso) => (
                  <SelectItem key={curso} value={curso}>
                    {curso}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterCiclo} onValueChange={setFilterCiclo}>
              <SelectTrigger>
                <SelectValue placeholder="Ciclo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los ciclos</SelectItem>
                {ciclos.map((ciclo) => (
                  <SelectItem key={ciclo} value={ciclo}>
                    {ciclo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(searchTerm || filterStatus !== 'all' || filterSede !== 'all' || filterCurso !== 'all' || filterCiclo !== 'all') && (
            <div className="flex items-center gap-4 mt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm('')
                  setFilterStatus('all')
                  setFilterSede('all')
                  setFilterCurso('all')
                  setFilterCiclo('all')
                }}
              >
                Limpiar filtros
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vista LISTADO (default) */}
      {viewMode === 'list' && (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Tabla de alumnos - 2/3 */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Listado de Alumnos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {filteredStudents.map((student) => (
                    <div
                      key={student.id}
                      className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedStudent?.id === student.id
                          ? 'bg-primary/10 border-2 border-primary'
                          : 'bg-secondary hover:bg-secondary/80'
                      }`}
                      onClick={() => setSelectedStudent(student)}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="relative flex-shrink-0">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                            <span className="text-sm font-bold">
                              {student.first_name[0]}{student.last_name[0]}
                            </span>
                          </div>
                          {student.active && (
                            <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm truncate">
                            {student.first_name} {student.last_name}
                          </h4>
                          <p className="text-xs text-muted-foreground truncate">{student.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <Badge variant={student.active ? 'default' : 'secondary'} className="text-xs">
                          {student.active ? 'Activo' : 'Inactivo'}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <BookOpen className="h-3 w-3" />
                          <span>{student.enrolled_courses}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredStudents.length === 0 && (
                  <div className="py-12 text-center">
                    <p className="text-muted-foreground">
                      No se encontraron alumnos que coincidan con los filtros seleccionados.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Panel lateral - 1/3 */}
          <div className="md:col-span-1">
            {selectedStudent && (
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle className="text-lg">Previsualización</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Avatar y nombre */}
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="relative">
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <span className="text-2xl font-bold">
                          {selectedStudent.first_name[0]}{selectedStudent.last_name[0]}
                        </span>
                      </div>
                      {selectedStudent.active && (
                        <div className="absolute bottom-0 right-0 h-5 w-5 rounded-full bg-green-500 border-2 border-white" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">
                        {selectedStudent.first_name} {selectedStudent.last_name}
                      </h3>
                      <Badge variant={selectedStudent.active ? 'default' : 'secondary'} className="mt-1">
                        {selectedStudent.active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                  </div>

                  {/* Información de contacto */}
                  <div className="space-y-2 pt-3 border-t">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">{selectedStudent.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span>{selectedStudent.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span>{selectedStudent.sede}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <GraduationCap className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">{selectedStudent.ciclo}</span>
                    </div>
                  </div>

                  {/* Curso actual */}
                  <div className="space-y-2 pt-3 border-t">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Curso Actual</p>
                    <p className="text-sm">{selectedStudent.curso_actual}</p>
                  </div>

                  {/* Estadísticas */}
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                    <div className="text-center p-2 bg-secondary rounded">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        <span className="font-bold text-lg">{selectedStudent.enrolled_courses}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Cursando</p>
                    </div>
                    <div className="text-center p-2 bg-secondary rounded">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                        <span className="font-bold text-lg">{selectedStudent.completed_courses}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Completados</p>
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div className="grid grid-cols-2 gap-2 pt-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => handleViewStudent(selectedStudent.id)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Ver Ficha
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full"
                      onClick={() => router.push(`/alumnos/${selectedStudent.id}/editar`)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Vista FICHAS (grid) */}
      {viewMode === 'grid' && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredStudents.map((student) => (
            <Card
              key={student.id}
              className="cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden"
              onClick={() => handleViewStudent(student.id)}
            >
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <span className="text-xl font-bold">
                        {student.first_name[0]}{student.last_name[0]}
                      </span>
                    </div>
                    {student.active && (
                      <div className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-green-500 border-2 border-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg leading-tight truncate">
                      {student.first_name} {student.last_name}
                    </h3>
                    <Badge variant={student.active ? 'default' : 'secondary'} className="mt-1 text-xs">
                      {student.active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{student.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4 flex-shrink-0" />
                    <span>{student.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span>{student.sede}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <span className="font-bold">{student.enrolled_courses}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Cursando</p>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                      <span className="font-bold">{student.completed_courses}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Completados</p>
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
                      handleViewStudent(student.id)
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
                      router.push(`/alumnos/${student.id}/editar`)
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredStudents.length === 0 && (
            <Card className="col-span-full">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  No se encontraron alumnos que coincidan con los filtros seleccionados.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
