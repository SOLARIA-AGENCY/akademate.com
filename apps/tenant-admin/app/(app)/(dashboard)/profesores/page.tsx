'use client'

import { useRef, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import {
  DashboardListingLayout,
  DashboardToolbar,
  type DashboardStatItem,
} from '@payload-config/components/akademate/dashboard'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@payload-config/components/ui/select'
import { Download, Plus, Printer, User, Loader2, Upload } from 'lucide-react'
import { PersonalListItem } from '@payload-config/components/ui/PersonalListItem'
import { StaffCard } from '@payload-config/components/ui/StaffCard'
import { ViewToggle } from '@payload-config/components/ui/ViewToggle'
import { useViewPreference } from '@/hooks/useViewPreference'
import { downloadCsv, printTable, type ExportColumn } from '@/app/lib/dashboard-export'

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
  email?: string | null
  nif?: string | null
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
  qualifiedAreas?: {
    id: number
    codigo?: string | null
    nombre: string
  }[]
  courseRunsCount?: number
  isActive: boolean
  inactiveReason?: string | null
  inactiveAt?: string | null
  importReviewStatus?: 'validated' | 'pending_review' | 'ambiguous' | 'retired_candidate'
  lastImportBatch?: string | null
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

interface StaffImportResult {
  success?: boolean
  mode?: string
  importBatch?: string
  summary?: Record<string, number>
  applied?: number
  error?: string
}

const reviewLabels: Record<string, string> = {
  pending_review: 'Revisar importación',
  ambiguous: 'Coincidencia dudosa',
  retired_candidate: 'Baja detectada',
}

export default function ProfesoresPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // View preference
  const [view, setView] = useViewPreference('profesores', 'list')

  // Data state
  const [teachersExpanded, setTeachersExpanded] = useState<TeacherExpanded[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [selectedImportFile, setSelectedImportFile] = useState<File | null>(null)
  const [importResult, setImportResult] = useState<StaffImportResult | null>(null)

  // Filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDepartment, setFilterDepartment] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  // Load staff data from API
  useEffect(() => {
    document.body.classList.add('profesores-route')
    setView('list')

    return () => {
      document.body.classList.remove('profesores-route')
    }
  }, [setView])

  useEffect(() => {
    async function loadProfessors() {
      try {
        setLoading(true)
        const response = await fetch('/api/staff?type=profesor&limit=200&includeInactive=true')

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
          active: staff.employmentStatus === 'active' && staff.isActive !== false,
          department: staff.position, // Using position as department for now
          specialties: [], // No specialties in current schema
          certifications: [],
          qualifiedAreas: staff.qualifiedAreas ?? [],
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

  async function runImport(apply: boolean) {
    if (!selectedImportFile) {
      fileInputRef.current?.click()
      return
    }

    try {
      setImporting(true)
      setImportResult(null)
      const body = new FormData()
      body.append('file', selectedImportFile)
      const response = await fetch(`/api/staff/import${apply ? '?apply=true' : ''}`, {
        method: 'POST',
        body,
      })
      const result = (await response.json().catch(() => ({}))) as StaffImportResult
      if (!response.ok || result.success === false) {
        throw new Error(result.error || 'No se pudo procesar el Excel')
      }
      setImportResult(result)
      if (apply) {
        window.location.reload()
      }
    } catch (err) {
      setImportResult({
        success: false,
        error: err instanceof Error ? err.message : 'No se pudo importar el Excel',
      })
    } finally {
      setImporting(false)
    }
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
      (teacher.email ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (teacher.nif ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (teacher.qualifiedAreas ?? []).some((area) =>
        area.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      ) ||
      teacher.specialties.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesDepartment = filterDepartment === 'all' || teacher.department === filterDepartment
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && teacher.active) ||
      (filterStatus === 'inactive' && !teacher.active) ||
      (filterStatus === 'temporary_leave' && teacher.employmentStatus === 'temporary_leave') ||
      (filterStatus === 'pending_review' && teacher.importReviewStatus === 'pending_review') ||
      (filterStatus === 'ambiguous' && teacher.importReviewStatus === 'ambiguous') ||
      (filterStatus === 'retired_candidate' &&
        teacher.importReviewStatus === 'retired_candidate') ||
      (filterStatus === 'missing_area' && (teacher.qualifiedAreas ?? []).length === 0)

    return matchesSearch && matchesDepartment && matchesStatus
  })

  const stats: DashboardStatItem[] = [
    { label: 'Total profesores', value: teachersExpanded.length, icon: User },
    {
      label: 'Activos',
      value: teachersExpanded.filter((teacher) => teacher.active).length,
      icon: User,
      tone: 'success',
    },
    {
      label: 'Sin área habilitada',
      value: teachersExpanded.filter((teacher) => (teacher.qualifiedAreas ?? []).length === 0)
        .length,
      icon: User,
      tone: 'warning',
    },
    { label: 'Visibles', value: filteredTeachers.length, icon: User },
  ]

  const exportColumns: ExportColumn<TeacherExpanded>[] = [
    { header: 'Nombre', getValue: (teacher) => teacher.fullName },
    { header: 'Email', getValue: (teacher) => teacher.email ?? 'Sin mail' },
    { header: 'Telefono', getValue: (teacher) => teacher.phone ?? 'Sin telefono' },
    { header: 'Estado', getValue: (teacher) => (teacher.active ? 'Activo' : 'Inactivo') },
    {
      header: 'Areas',
      getValue: (teacher) => (teacher.qualifiedAreas ?? []).map((area) => area.nombre).join(', '),
    },
    {
      header: 'Sedes',
      getValue: (teacher) =>
        (teacher.assignedCampuses ?? []).map((campus) => campus.name).join(', '),
    },
    { header: 'Cursos', getValue: (teacher) => teacher.courseRunsCount ?? 0 },
  ]

  const handlePrint = () => printTable('Profesores', exportColumns, filteredTeachers)
  const handleCsv = () =>
    downloadCsv(
      `profesores-${new Date().toISOString().slice(0, 10)}.csv`,
      exportColumns,
      filteredTeachers
    )

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
    <DashboardListingLayout
      title="Profesores"
      description="Gestión del equipo docente, áreas habilitadas y estado operativo."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(event) => setSelectedImportFile(event.target.files?.[0] ?? null)}
          />
          <Button
            type="button"
            variant="outline"
            disabled={importing}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            {selectedImportFile ? selectedImportFile.name : 'Excel personal'}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={importing || !selectedImportFile}
            onClick={() => void runImport(false)}
          >
            {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Auditar Excel
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={importing || !selectedImportFile}
            onClick={() => void runImport(true)}
          >
            Aplicar Excel
          </Button>
          <Button onClick={handleAdd} data-oid="p6j7z6w">
            <Plus className="h-4 w-4" data-oid="f-mq7s4" />
            Nuevo Profesor
          </Button>
        </div>
      }
      stats={stats}
      toolbar={
        <DashboardToolbar
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Buscar por nombre, email, departamento..."
          filters={
            <>
              <Select
                value={filterDepartment}
                onValueChange={setFilterDepartment}
                data-oid="mrhrz82"
              >
                <SelectTrigger className="w-full min-w-[200px] md:w-[240px]" data-oid="9cxbj.j">
                  <SelectValue placeholder="Todos los departamentos" data-oid="d9jzw43" />
                </SelectTrigger>
                <SelectContent data-oid="el2al_u">
                  <SelectItem value="all" data-oid="r-jroyq">
                    Todos los departamentos
                  </SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept} data-oid="a.:d.aa">
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus} data-oid="h95d028">
                <SelectTrigger className="w-full min-w-[180px] md:w-[210px]" data-oid="hfo3rek">
                  <SelectValue placeholder="Todos los estados" data-oid="sbtozd9" />
                </SelectTrigger>
                <SelectContent data-oid="7b:8uhb">
                  <SelectItem value="all" data-oid="f-e6w5g">
                    Todos los estados
                  </SelectItem>
                  <SelectItem value="active" data-oid="tm3l5zf">
                    Activos
                  </SelectItem>
                  <SelectItem value="inactive" data-oid="z4_gy17">
                    Inactivos
                  </SelectItem>
                  <SelectItem value="temporary_leave">Baja temporal</SelectItem>
                  <SelectItem value="pending_review">Pendientes de revisión</SelectItem>
                  <SelectItem value="ambiguous">Coincidencias dudosas</SelectItem>
                  <SelectItem value="retired_candidate">Bajas detectadas</SelectItem>
                  <SelectItem value="missing_area">Sin área habilitada</SelectItem>
                </SelectContent>
              </Select>
            </>
          }
          clearAction={
            searchTerm || filterDepartment !== 'all' || filterStatus !== 'all' ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm('')
                  setFilterDepartment('all')
                  setFilterStatus('all')
                }}
                data-oid="0d.n:bw"
              >
                Limpiar filtros
              </Button>
            ) : null
          }
          actions={
            <>
              <Button type="button" variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4" />
                Imprimir
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={handleCsv}>
                <Download className="h-4 w-4" />
                Descargar CSV
              </Button>
            </>
          }
          viewToggle={<ViewToggle view={view} onViewChange={setView} data-oid="3q7lfq3" />}
        />
      }
    >
      {importResult ? (
        <Card
          className={
            importResult.success === false
              ? 'border-destructive/30 bg-destructive/5'
              : 'border-emerald-200 bg-emerald-50'
          }
        >
          <CardContent className="pt-6 text-sm">
            {importResult.success === false ? (
              <p className="font-medium text-destructive">{importResult.error}</p>
            ) : (
              <div className="space-y-2 text-emerald-950">
                <p className="font-semibold">
                  Excel procesado en modo{' '}
                  {importResult.mode === 'apply' ? 'aplicación' : 'auditoría'}.
                </p>
                <p className="text-xs">Lote: {importResult.importBatch}</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(importResult.summary ?? {}).map(([key, value]) => (
                    <span
                      key={key}
                      className="rounded-full bg-white px-3 py-1 text-xs font-semibold shadow-sm"
                    >
                      {key}: {value}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {view === 'grid' ? (
        <div
          className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
          data-oid="39mqpx7"
        >
          {filteredTeachers.map((teacher) => (
            <StaffCard
              key={teacher.id}
              id={teacher.id}
              fullName={`${teacher.firstName} ${teacher.lastName}`}
              staffType="profesor"
              position={teacher.department}
              contractType={teacher.contractType}
              employmentStatus={teacher.active ? 'active' : teacher.employmentStatus}
              photo={teacher.photo}
              email={teacher.email}
              phone={teacher.phone}
              assignedCampuses={teacher.assignedCampuses}
              courseRunsCount={teacher.courseRunsCount}
              qualifiedAreas={teacher.qualifiedAreas ?? []}
              reviewLabel={
                teacher.importReviewStatus && teacher.importReviewStatus !== 'validated'
                  ? (reviewLabels[teacher.importReviewStatus] ?? teacher.importReviewStatus)
                  : undefined
              }
              onView={(id) => handleViewTeacher(Number(id))}
              detailLabel="Ver ficha docente"
            />
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
    </DashboardListingLayout>
  )
}
