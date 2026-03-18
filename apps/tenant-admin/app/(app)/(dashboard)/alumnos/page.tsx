'use client'

import { useEffect, useState, type ChangeEvent, type MouseEvent, type KeyboardEvent } from 'react'
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

interface Student {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  active: boolean
  enrolled_courses: number
  completed_courses: number
  sede: string
  curso_actual: string
  ciclo: string
  fecha_inscripcion: string
}

interface StudentApiDoc {
  id: string | number
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  status?: string
  createdAt?: string
}

interface StudentsApiResponse {
  docs?: StudentApiDoc[]
}

export default function AlumnosPage() {
  const router = useRouter()

  // Estados de visualización
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Estados de filtrado
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterSede, setFilterSede] = useState('all')
  const [filterCurso, setFilterCurso] = useState('all')
  const [filterCiclo, setFilterCiclo] = useState('all')

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setErrorMessage(null)
        const response = await fetch('/api/students?limit=100&sort=-createdAt', {
          cache: 'no-cache',
        })
        if (!response.ok) {
          throw new Error('No se pudieron cargar los alumnos')
        }

        const payload = (await response.json()) as StudentsApiResponse
        const docs: StudentApiDoc[] = Array.isArray(payload.docs) ? payload.docs : []
        const mapped: Student[] = docs.map((student: StudentApiDoc) => {
          const status = student.status
          return {
            id: String(student.id),
            first_name: student.first_name ?? '',
            last_name: student.last_name ?? '',
            email: student.email ?? '—',
            phone: student.phone ?? '—',
            active: status ? status === 'active' : true,
            enrolled_courses: 0,
            completed_courses: 0,
            sede: 'Sin sede',
            curso_actual: '-',
            ciclo: '-',
            fecha_inscripcion: student.createdAt ?? '',
          }
        })

        setStudents(mapped)
        if (mapped.length > 0) {
          setSelectedStudent((prev) => prev ?? mapped[0])
        }
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Error al cargar alumnos')
        setStudents([])
      } finally {
        setIsLoading(false)
      }
    }

    void fetchStudents()
  }, [])

  const handleAdd = () => {
    router.push('/alumnos/nuevo')
  }

  const handleViewStudent = (studentId: string) => {
    router.push(`/alumnos/${studentId}`)
  }

  // Extraer valores únicos para filtros
  const sedes = Array.from(new Set(students.map((s) => s.sede))).filter(Boolean)
  const cursos = Array.from(
    new Set(students.map((s) => s.curso_actual).filter((c) => c !== '-'))
  ).filter(Boolean)
  const ciclos = Array.from(new Set(students.map((s) => s.ciclo))).filter(Boolean)

  // Filtrado
  const filteredStudents = students.filter((student) => {
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
    total: students.length,
    active: students.filter((s) => s.active).length,
    inactive: students.filter((s) => !s.active).length,
    totalEnrolled: students.reduce((sum, s) => sum + s.enrolled_courses, 0),
    totalCompleted: students.reduce((sum, s) => sum + s.completed_courses, 0),
  }

  return (
    <div className="space-y-6" data-oid="qc1.kvz">
      {isLoading && (
        <div
          className="rounded-lg border border-dashed bg-muted/40 px-4 py-3 text-sm text-muted-foreground"
          data-oid="zt9:_my"
        >
          Cargando alumnos...
        </div>
      )}

      {errorMessage && (
        <div
          className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg"
          data-oid="eri:6r6"
        >
          {errorMessage}
        </div>
      )}

      <PageHeader
        title="Alumnos"
        description={`${filteredStudents.length} alumnos de ${students.length} totales`}
        icon={User}
        actions={
          <>
            <div className="flex items-center gap-1 bg-muted p-1 rounded-lg" data-oid="mddf.5b">
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                className={
                  viewMode === 'list'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }
                onClick={() => setViewMode('list')}
                data-oid="f.4b31g"
              >
                <List className="h-4 w-4 mr-2" data-oid="skj-s5p" />
                Listado
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                className={
                  viewMode === 'grid'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }
                onClick={() => setViewMode('grid')}
                data-oid="t_--gmp"
              >
                <LayoutGrid className="h-4 w-4 mr-2" data-oid="frog:b0" />
                Fichas
              </Button>
            </div>
            <Button onClick={handleAdd} data-oid="y8vld12">
              <Plus className="h-4 w-4" data-oid="jdkge43" />
              Nuevo Alumno
            </Button>
          </>
        }
        data-oid="2bu4ozx"
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5" data-oid="bmuqe2r">
        <Card data-oid="i9o81nx">
          <CardHeader
            className="flex flex-row items-center justify-between space-y-0 pb-2"
            data-oid="j-ci10l"
          >
            <CardTitle className="text-sm font-medium" data-oid="htxb7pm">
              Total Alumnos
            </CardTitle>
            <User className="h-4 w-4 text-muted-foreground" data-oid="nb1upgw" />
          </CardHeader>
          <CardContent data-oid="rjkm_dm">
            <div className="text-2xl font-bold" data-oid="1ez4bgy">
              {stats.total}
            </div>
          </CardContent>
        </Card>

        <Card data-oid="ae-hi1.">
          <CardHeader
            className="flex flex-row items-center justify-between space-y-0 pb-2"
            data-oid="vvtdu7e"
          >
            <CardTitle className="text-sm font-medium" data-oid="mdh4-q4">
              Activos
            </CardTitle>
            <User className="h-4 w-4 text-green-600" data-oid="adomjjz" />
          </CardHeader>
          <CardContent data-oid="c2pqroj">
            <div className="text-2xl font-bold text-green-600" data-oid="r2kauom">
              {stats.active}
            </div>
          </CardContent>
        </Card>

        <Card data-oid="y3wfsxn">
          <CardHeader
            className="flex flex-row items-center justify-between space-y-0 pb-2"
            data-oid="-uy8c-v"
          >
            <CardTitle className="text-sm font-medium" data-oid="dvlaf_b">
              Inactivos
            </CardTitle>
            <User className="h-4 w-4 text-muted-foreground" data-oid="3h91fjo" />
          </CardHeader>
          <CardContent data-oid="v.52w67">
            <div className="text-2xl font-bold text-muted-foreground" data-oid="6wb8cp5">
              {stats.inactive}
            </div>
          </CardContent>
        </Card>

        <Card data-oid="a5hss9v">
          <CardHeader
            className="flex flex-row items-center justify-between space-y-0 pb-2"
            data-oid="-7bcqip"
          >
            <CardTitle className="text-sm font-medium" data-oid="aroui51">
              Cursando
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" data-oid="vjbebdr" />
          </CardHeader>
          <CardContent data-oid="-sg-5w3">
            <div className="text-2xl font-bold" data-oid="tuhe1c0">
              {stats.totalEnrolled}
            </div>
          </CardContent>
        </Card>

        <Card data-oid=".c0:t2.">
          <CardHeader
            className="flex flex-row items-center justify-between space-y-0 pb-2"
            data-oid="l_vqrpm"
          >
            <CardTitle className="text-sm font-medium" data-oid="hmx8:9i">
              Completados
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" data-oid="i:z-7t4" />
          </CardHeader>
          <CardContent data-oid="a2jw_qu">
            <div className="text-2xl font-bold" data-oid="tl2vlow">
              {stats.totalCompleted}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card data-oid="evhc1ab">
        <CardContent className="pt-6" data-oid="vrvrvg9">
          <div className="grid gap-4 md:grid-cols-5" data-oid="t_sy_:2">
            <div className="relative" data-oid="606pz0d">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                data-oid="0d7hxhx"
              />
              <Input
                placeholder="Buscar por nombre o email..."
                value={searchTerm}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-oid="6l4uu5l"
              />
            </div>

            <Select value={filterStatus} onValueChange={setFilterStatus} data-oid="8gn04-c">
              <SelectTrigger data-oid=":.:.p3e">
                <SelectValue placeholder="Estado" data-oid="wrk4a2x" />
              </SelectTrigger>
              <SelectContent data-oid="neuz-.3">
                <SelectItem value="all" data-oid="itl3tn_">
                  Todos los estados
                </SelectItem>
                <SelectItem value="active" data-oid=":zs2vyc">
                  Activos
                </SelectItem>
                <SelectItem value="inactive" data-oid="2jzbrsm">
                  Inactivos
                </SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterSede} onValueChange={setFilterSede} data-oid="ah85kl0">
              <SelectTrigger data-oid="_-je2:c">
                <SelectValue placeholder="Sede" data-oid="hg5vqi2" />
              </SelectTrigger>
              <SelectContent data-oid=":p47ksq">
                <SelectItem value="all" data-oid="_5ra9.d">
                  Todas las sedes
                </SelectItem>
                {sedes.map((sede) => (
                  <SelectItem key={sede} value={sede} data-oid="mqcbyh_">
                    {sede}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterCurso} onValueChange={setFilterCurso} data-oid="zd.guip">
              <SelectTrigger data-oid="5mx06il">
                <SelectValue placeholder="Curso" data-oid="oj62xzc" />
              </SelectTrigger>
              <SelectContent data-oid="xo2qpfm">
                <SelectItem value="all" data-oid=":4n:frr">
                  Todos los cursos
                </SelectItem>
                {cursos.map((curso) => (
                  <SelectItem key={curso} value={curso} data-oid="o3rms35">
                    {curso}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterCiclo} onValueChange={setFilterCiclo} data-oid="yzzmgac">
              <SelectTrigger data-oid="8w3syz2">
                <SelectValue placeholder="Ciclo" data-oid="x676wrn" />
              </SelectTrigger>
              <SelectContent data-oid="min-q8c">
                <SelectItem value="all" data-oid="c3ijif3">
                  Todos los ciclos
                </SelectItem>
                {ciclos.map((ciclo) => (
                  <SelectItem key={ciclo} value={ciclo} data-oid="oe33wrz">
                    {ciclo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(searchTerm ||
            filterStatus !== 'all' ||
            filterSede !== 'all' ||
            filterCurso !== 'all' ||
            filterCiclo !== 'all') && (
            <div className="flex items-center gap-4 mt-4" data-oid="80uls9:">
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
                data-oid="dqkla-s"
              >
                Limpiar filtros
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vista LISTADO (default) */}
      {viewMode === 'list' && (
        <div
          className={`grid gap-6 ${selectedStudent ? 'md:grid-cols-3' : 'grid-cols-1'}`}
          data-oid="5zazfnf"
        >
          {/* Tabla de alumnos - 2/3 */}
          <div className={selectedStudent ? 'md:col-span-2' : ''} data-oid="9l0cg-c">
            <Card data-oid="zdzib1h">
              <CardHeader data-oid="ou3nw24">
                <CardTitle data-oid="8zzp30h">Listado de Alumnos</CardTitle>
              </CardHeader>
              <CardContent data-oid="8nm_upd">
                <div className="space-y-2" data-oid="_3nf_97">
                  {filteredStudents.map((student) => (
                    <div
                      key={student.id}
                      role="button"
                      tabIndex={0}
                      className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedStudent?.id === student.id
                          ? 'bg-primary/10 border-2 border-primary'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedStudent(student)}
                      onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          setSelectedStudent(student)
                        }
                      }}
                      data-oid="1fs_iks"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0" data-oid="kvz76_j">
                        <div className="relative flex-shrink-0" data-oid="w7pvw9g">
                          <div
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground"
                            data-oid="j_1i8jg"
                          >
                            <span className="text-sm font-bold" data-oid="32zet9l">
                              {student.first_name[0]}
                              {student.last_name[0]}
                            </span>
                          </div>
                          {student.active && (
                            <div
                              className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white"
                              data-oid="inub7v2"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0" data-oid="5cw.1zv">
                          <h4 className="font-semibold text-sm truncate" data-oid="h81:4hw">
                            {student.first_name} {student.last_name}
                          </h4>
                          <p className="text-xs text-muted-foreground truncate" data-oid="1tle69y">
                            {student.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0" data-oid="781miv9">
                        <Badge
                          variant={student.active ? 'default' : 'secondary'}
                          className="text-xs"
                          data-oid="59eo6fh"
                        >
                          {student.active ? 'Activo' : 'Inactivo'}
                        </Badge>
                        <div
                          className="flex items-center gap-1 text-xs text-muted-foreground"
                          data-oid="y06a2rj"
                        >
                          <BookOpen className="h-3 w-3" data-oid="wb1d3ji" />
                          <span data-oid="hk.2njg">{student.enrolled_courses}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredStudents.length === 0 && (
                  <div className="py-12 text-center" data-oid="ioxw5-:">
                    <p className="text-muted-foreground" data-oid="h21g4jj">
                      No se encontraron alumnos que coincidan con los filtros seleccionados.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Panel lateral - 1/3 (solo visible cuando hay alumno seleccionado) */}
          {selectedStudent ? (
            <div className="md:col-span-1" data-oid="_pl0in2">
              <Card className="sticky top-6" data-oid=".-k-ldy">
                <CardHeader data-oid="uig6t_r">
                  <CardTitle className="text-lg" data-oid="k5un1kd">
                    Previsualización
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4" data-oid="xm9.br.">
                  {/* Avatar y nombre */}
                  <div
                    className="flex flex-col items-center text-center space-y-3"
                    data-oid="_zj6xw4"
                  >
                    <div className="relative" data-oid="3gvfxsj">
                      <div
                        className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground"
                        data-oid="bkjw._c"
                      >
                        <span className="text-2xl font-bold" data-oid="8gm6col">
                          {selectedStudent.first_name[0]}
                          {selectedStudent.last_name[0]}
                        </span>
                      </div>
                      {selectedStudent.active && (
                        <div
                          className="absolute bottom-0 right-0 h-5 w-5 rounded-full bg-green-500 border-2 border-white"
                          data-oid="zp7d319"
                        />
                      )}
                    </div>
                    <div data-oid="2usz0nd">
                      <h3 className="font-bold text-lg" data-oid="4tlfq.5">
                        {selectedStudent.first_name} {selectedStudent.last_name}
                      </h3>
                      <Badge
                        variant={selectedStudent.active ? 'default' : 'secondary'}
                        className="mt-1"
                        data-oid="k.6:xpr"
                      >
                        {selectedStudent.active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                  </div>

                  {/* Información de contacto */}
                  <div className="space-y-2 pt-3 border-t" data-oid="xlh:al_">
                    <div className="flex items-center gap-2 text-sm" data-oid="-2wexjl">
                      <Mail
                        className="h-4 w-4 text-muted-foreground flex-shrink-0"
                        data-oid="zftomhu"
                      />
                      <span className="truncate" data-oid="8va3a1s">
                        {selectedStudent.email}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm" data-oid="ul1k3d5">
                      <Phone
                        className="h-4 w-4 text-muted-foreground flex-shrink-0"
                        data-oid="9qh6glg"
                      />
                      <span data-oid="xyhbina">{selectedStudent.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm" data-oid=":4q9-8y">
                      <MapPin
                        className="h-4 w-4 text-muted-foreground flex-shrink-0"
                        data-oid="g_wnq1v"
                      />
                      <span data-oid="f6oj.-g">{selectedStudent.sede}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm" data-oid="u9shji8">
                      <GraduationCap
                        className="h-4 w-4 text-muted-foreground flex-shrink-0"
                        data-oid="3.djqgj"
                      />
                      <span className="truncate" data-oid="22xmz6c">
                        {selectedStudent.ciclo}
                      </span>
                    </div>
                  </div>

                  {/* Curso actual */}
                  <div className="space-y-2 pt-3 border-t" data-oid="39o2316">
                    <p
                      className="text-xs font-semibold text-muted-foreground uppercase"
                      data-oid="p9yaz:6"
                    >
                      Curso Actual
                    </p>
                    <p className="text-sm" data-oid="56hh-qp">
                      {selectedStudent.curso_actual}
                    </p>
                  </div>

                  {/* Estadísticas */}
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t" data-oid="o8bj9:9">
                    <div className="text-center p-2 bg-secondary rounded" data-oid="t8-4kh.">
                      <div
                        className="flex items-center justify-center gap-1 mb-1"
                        data-oid=":phnqc7"
                      >
                        <BookOpen className="h-4 w-4 text-muted-foreground" data-oid=":zn8ecg" />
                        <span className="font-bold text-lg" data-oid="dwh2_43">
                          {selectedStudent.enrolled_courses}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground" data-oid="lfvc1.l">
                        Cursando
                      </p>
                    </div>
                    <div className="text-center p-2 bg-secondary rounded" data-oid="g1ux92m">
                      <div
                        className="flex items-center justify-center gap-1 mb-1"
                        data-oid="p55xsnb"
                      >
                        <CheckCircle2
                          className="h-4 w-4 text-muted-foreground"
                          data-oid="9xfl-a0"
                        />
                        <span className="font-bold text-lg" data-oid="ncnfiwu">
                          {selectedStudent.completed_courses}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground" data-oid="vwwtfct">
                        Completados
                      </p>
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div className="grid grid-cols-2 gap-2 pt-3 border-t" data-oid=".0dvdg5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => handleViewStudent(selectedStudent.id)}
                      data-oid="5iscurj"
                    >
                      <Eye className="mr-2 h-4 w-4" data-oid="118o68k" />
                      Ver Ficha
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full"
                      onClick={() => router.push(`/alumnos/${selectedStudent.id}/editar`)}
                      data-oid="u7lf.71"
                    >
                      <Edit className="mr-2 h-4 w-4" data-oid="gpux11j" />
                      Editar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </div>
      )}

      {/* Vista FICHAS (grid) */}
      {viewMode === 'grid' && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" data-oid=":xr0vw7">
          {filteredStudents.map((student) => (
            <Card
              key={student.id}
              className="cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden"
              onClick={() => handleViewStudent(student.id)}
              data-oid="n0nsj_-"
            >
              <CardContent className="p-6 space-y-4" data-oid="uu8doez">
                <div className="flex items-start gap-4" data-oid="o-x-54n">
                  <div className="relative" data-oid="7g.x9no">
                    <div
                      className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground"
                      data-oid="v15y-dv"
                    >
                      <span className="text-xl font-bold" data-oid="insnk62">
                        {student.first_name[0]}
                        {student.last_name[0]}
                      </span>
                    </div>
                    {student.active && (
                      <div
                        className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-green-500 border-2 border-white"
                        data-oid="f9s55df"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0" data-oid="uqrrjhy">
                    <h3 className="font-bold text-lg leading-tight truncate" data-oid="eobcsk7">
                      {student.first_name} {student.last_name}
                    </h3>
                    <Badge
                      variant={student.active ? 'default' : 'secondary'}
                      className="mt-1 text-xs"
                      data-oid="lbyczpn"
                    >
                      {student.active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2 text-sm" data-oid="xbagnsm">
                  <div className="flex items-center gap-2 text-muted-foreground" data-oid="odqf6lu">
                    <Mail className="h-4 w-4 flex-shrink-0" data-oid="p:5sid1" />
                    <span className="truncate" data-oid="5pk_tp1">
                      {student.email}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground" data-oid="xj1v.0i">
                    <Phone className="h-4 w-4 flex-shrink-0" data-oid="w6c03zs" />
                    <span data-oid="qqnxxsr">{student.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground" data-oid="kpn6o9.">
                    <MapPin className="h-4 w-4 flex-shrink-0" data-oid="0lpo8q6" />
                    <span data-oid="c5no04x">{student.sede}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t" data-oid="tn_k4hf">
                  <div className="text-center" data-oid="2civgy_">
                    <div className="flex items-center justify-center gap-1" data-oid="gopbo.y">
                      <BookOpen className="h-4 w-4 text-muted-foreground" data-oid="mw_6mnc" />
                      <span className="font-bold" data-oid="hpcggr9">
                        {student.enrolled_courses}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1" data-oid="9rivujt">
                      Cursando
                    </p>
                  </div>

                  <div className="text-center" data-oid="6eozkcn">
                    <div className="flex items-center justify-center gap-1" data-oid="f3dsa_f">
                      <CheckCircle2 className="h-4 w-4 text-muted-foreground" data-oid="wt0h2jt" />
                      <span className="font-bold" data-oid="fuwf1o:">
                        {student.completed_courses}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1" data-oid="ynqcqbl">
                      Completados
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-3 border-t" data-oid="oxr0jgm">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={(e: MouseEvent<HTMLButtonElement>) => {
                      e.stopPropagation()
                      handleViewStudent(student.id)
                    }}
                    data-oid="ikpzb2w"
                  >
                    <Eye className="mr-2 h-4 w-4" data-oid="3:mwtcz" />
                    Ver Detalles
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    className="w-full"
                    onClick={(e: MouseEvent<HTMLButtonElement>) => {
                      e.stopPropagation()
                      router.push(`/alumnos/${student.id}/editar`)
                    }}
                    data-oid="bgitn2z"
                  >
                    <Edit className="mr-2 h-4 w-4" data-oid="v0mbiro" />
                    Editar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredStudents.length === 0 && (
            <Card className="col-span-full" data-oid="2lx:bjr">
              <CardContent className="py-12 text-center" data-oid="b1d0:0p">
                <p className="text-muted-foreground" data-oid="k_an-0i">
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
