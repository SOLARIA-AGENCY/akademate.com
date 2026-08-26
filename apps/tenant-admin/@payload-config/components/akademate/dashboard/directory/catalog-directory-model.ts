import type { DirectoryKpi } from './staff-directory-model'
import {
  resolveCatalogActiveStatus,
  resolveConvocationDirectoryStatus,
} from './directory-status'

export function computeCourseDirectoryKpis(
  courses: ReadonlyArray<{
    active?: boolean | null
    area?: string | null
    totalConvocatorias?: number | null
  }>,
): DirectoryKpi[] {
  const total = courses.length
  const active = courses.filter((course) => resolveCatalogActiveStatus(course.active) === 'activo').length
  const withRuns = courses.filter((course) => (course.totalConvocatorias ?? 0) > 0).length
  const areas = new Set(courses.map((course) => String(course.area ?? '').trim()).filter(Boolean)).size

  return [
    { id: 'total', label: 'Total cursos', value: String(total) },
    { id: 'activos', label: 'Activos', value: String(active) },
    { id: 'convocatorias', label: 'Con convocatorias', value: String(withRuns) },
    { id: 'areas', label: 'Áreas', value: String(areas) },
  ]
}

export function computeCycleDirectoryKpis(
  cycles: ReadonlyArray<{
    nivel?: string | null
    convocatorias?: number | null
  }>,
): DirectoryKpi[] {
  const total = cycles.length
  const superior = cycles.filter((cycle) => cycle.nivel === 'Grado Superior').length
  const medio = cycles.filter((cycle) => cycle.nivel === 'Grado Medio').length
  const withRuns = cycles.filter((cycle) => (cycle.convocatorias ?? 0) > 0).length

  return [
    { id: 'total', label: 'Total programas', value: String(total) },
    { id: 'superior', label: 'Grado Superior', value: String(superior) },
    { id: 'medio', label: 'Grado Medio', value: String(medio) },
    { id: 'convocatorias', label: 'Con convocatorias', value: String(withRuns) },
  ]
}

export function computeCampusDirectoryKpis(
  campuses: ReadonlyArray<{
    campusKind?: 'physical' | 'virtual' | string | null
    capacidad?: number | null
  }>,
): DirectoryKpi[] {
  const total = campuses.length
  const physical = campuses.filter((campus) => campus.campusKind !== 'virtual').length
  const virtual = campuses.filter((campus) => campus.campusKind === 'virtual').length
  const capacity = campuses.reduce((sum, campus) => sum + (campus.capacidad ?? 0), 0)

  return [
    { id: 'total', label: 'Total sedes', value: String(total) },
    { id: 'fisicas', label: 'Físicas', value: String(physical) },
    { id: 'virtuales', label: 'Virtuales', value: String(virtual) },
    { id: 'capacidad', label: 'Capacidad', value: String(capacity) },
  ]
}

export function computeConvocationDirectoryKpis(
  runs: ReadonlyArray<{
    estado?: string | null
    plazas?: number | null
    inscritos?: number | null
  }>,
): DirectoryKpi[] {
  const total = runs.length
  const open = runs.filter((run) => {
    const status = resolveConvocationDirectoryStatus(run.estado)
    return status === 'enrollment_open' || status === 'published'
  }).length
  const inProgress = runs.filter(
    (run) => resolveConvocationDirectoryStatus(run.estado) === 'in_progress',
  ).length
  const plazas = runs.reduce((sum, run) => sum + (run.plazas ?? 0), 0)
  const inscritos = runs.reduce((sum, run) => sum + (run.inscritos ?? 0), 0)
  const occupancy = plazas > 0 ? Math.round((inscritos / plazas) * 100) : 0

  return [
    { id: 'total', label: 'Convocatorias', value: String(total) },
    { id: 'abiertas', label: 'Matrícula abierta', value: String(open) },
    { id: 'curso', label: 'En curso', value: String(inProgress) },
    { id: 'ocupacion', label: 'Ocupación media', value: `${occupancy}%` },
  ]
}
