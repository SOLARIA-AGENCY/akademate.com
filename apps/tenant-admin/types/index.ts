// ============================================================================
// CICLOS FORMATIVOS - TIPOS PRINCIPALES
// ============================================================================

export type TipoCiclo = 'superior' | 'medio'

export interface CursoCiclo {
  id: string
  ciclo_plantilla_id: string
  nombre: string
  codigo: string
  descripcion: string
  duracion_horas: number
  orden: number
  objetivos: string[]
  contenidos: string[]
}

export interface CicloPlantilla {
  id: string
  nombre: string
  codigo: string
  tipo: TipoCiclo
  familia_profesional: string
  descripcion: string
  objetivos: string[]
  perfil_profesional: string
  duracion_total_horas: number
  image: string
  color: string // Tailwind class (e.g., 'bg-purple-600')
  cursos: CursoCiclo[]
  total_instancias: number
  instancias_activas: number
  total_alumnos: number
  created_at: string
  updated_at: string
}

export type EstadoInstancia = 'planificada' | 'abierta' | 'en_curso' | 'finalizada' | 'cancelada'
export type TurnoInstancia = 'mañana' | 'tarde' | 'noche'

export interface InstanciaGrado {
  id: string
  ciclo_plantilla_id: string
  ciclo_plantilla: CicloPlantilla
  nombre_convocatoria: string
  codigo_convocatoria: string
  campus: { id: string; name: string }
  aula?: { id: string; nombre: string }
  fecha_inicio: string
  fecha_fin: string
  horario: string
  turno: TurnoInstancia
  precio: number
  plazas_totales: number
  plazas_ocupadas: number
  lista_espera: number
  estado: EstadoInstancia
  profesores?: Array<{
    id: string
    nombre: string
    foto?: string
    asignatura?: string
  }>
  created_at: string
  updated_at: string
}

export interface CicloDetalleView extends CicloPlantilla {
  instancias: InstanciaGrado[]
  alumnos_actuales: number
  tasa_empleabilidad: number
  salidas_profesionales: string[]
}

// ============================================================================
// CURSOS - TIPOS
// ============================================================================

export type CourseType =
  | 'teleformacion'
  | 'ocupados'
  | 'desempleados'
  | 'privados'
  | 'ciclo-medio'
  | 'ciclo-superior'

export type CourseModality = 'presencial' | 'semipresencial' | 'telematico'

export type CourseStatus = 'borrador' | 'publicado' | 'archivado'

export interface Course {
  id: string
  title: string
  description: string
  type: CourseType
  modality: CourseModality
  status: CourseStatus
  duration: number // hours
  price: number
  image?: string
  campus?: string[]
  published: boolean
  created_at: string
}

// ============================================================================
// CONVOCATORIAS/PROGRAMACIÓN
// ============================================================================

export type ConvocationStatus = 'abierta' | 'lista_espera' | 'cerrada' | 'planificada'

export interface Convocation {
  id: string
  course_id: string
  course_title: string
  start_date: string
  end_date: string
  status: ConvocationStatus
  capacity_min: number
  capacity_max: number
  enrolled: number
  campus_id: string
  campus_name: string
  price?: number
}

// ============================================================================
// SEDES Y AULAS
// ============================================================================

export interface Campus {
  id: string
  name: string
  address: string
  city: string
  postal_code: string
  phone: string
  email: string
  active: boolean
  classrooms_count: number
}

export interface Classroom {
  id: string
  name: string
  campus_id: string
  campus_name: string
  capacity: number
  equipment: string[]
  active: boolean
}

// ============================================================================
// PERSONAL
// ============================================================================

export interface Teacher {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  specialties: string[]
  active: boolean
  courses_count: number
}

export interface TeacherCourse {
  id: string
  name: string
  code: string
  type: string
  modality: string
  students: number
}

export interface TeacherCertification {
  title: string
  institution: string
  year: number
}

export interface TeacherExpanded extends Teacher {
  initials: string
  photo?: string
  department: string
  bio: string
  certifications: TeacherCertification[]
  courses: TeacherCourse[]
  campuses: string[]
}

export interface Student {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  enrollments_count: number
  active: boolean
  created_at: string
}

export interface Administrative {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  role: string
  active: boolean
  created_at: string
}

// ============================================================================
// LEADS Y CAMPAÑAS
// ============================================================================

export type LeadStatus = 'nuevo' | 'contactado' | 'inscrito' | 'descartado'
export type LeadSource = 'web' | 'meta_ads' | 'whatsapp' | 'referido' | 'telefono'

export interface Lead {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  course_interest: string
  status: LeadStatus
  source: LeadSource
  assigned_to?: string
  notes?: string
  created_at: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
}

export type CampaignStatus = 'activa' | 'pausada' | 'finalizada'

export interface Campaign {
  id: string
  name: string
  description: string
  status: CampaignStatus
  budget: number
  leads_generated: number
  conversions: number
  conversion_rate: number
  cost_per_lead: number
  start_date: string
  end_date: string
}

// ============================================================================
// DASHBOARD METRICS
// ============================================================================

export interface DashboardMetrics {
  total_courses: number
  active_courses: number
  total_students: number
  active_students: number
  total_leads: number
  leads_this_month: number
  conversion_rate: number
  total_revenue: number
  active_convocations: number
  total_teachers: number
  total_campuses: number
  classroom_utilization: number
}

// ============================================================================
// PLANTILLAS DE CURSOS (Course Templates) - Genéricas
// ============================================================================

export interface PlantillaCurso {
  id: string
  nombre: string
  descripcion: string
  imagenPortada: string
  area: string // Marketing, Desarrollo, Diseño, Audiovisual, Gestión
  tipo: CourseType
  duracionReferencia: number // horas de referencia
  precioReferencia?: number // precio base de referencia
  objetivos: string[]
  contenidos: string[]
  totalConvocatorias: number // número de instancias activas
  active: boolean
  // Subvenciones y becas
  subvencionado?: boolean
  porcentajeSubvencion?: number
  subvenciones?: Subvencion[]
  created_at: string
  updated_at: string
}

// ============================================================================
// INSTANCIAS DE CURSOS (Course Instances/Convocations) - Específicas
// ============================================================================

export interface EntidadFinanciadora {
  id: string
  nombre: string
  logo: string
}

// ============================================================================
// SUBVENCIONES Y BECAS
// ============================================================================

export type EntidadFinanciadoraKey =
  | 'fundae'
  | 'sepe'
  | 'ministerio_trabajo'
  | 'ministerio_educacion'
  | 'junta_andalucia'
  | 'junta_madrid'
  | 'junta_catalunya'
  | 'fse'
  | 'next_generation'
  | 'camara_comercio'
  | 'empresa_privada'
  | 'otro'

export type TipoSubvencion = 'publica' | 'privada' | 'europea'

export interface EntidadFinanciadoraInfo {
  nombre: string
  descripcion: string
  logo: string
  tipoSubvencion: TipoSubvencion
  urlOficial: string
}

export interface Subvencion {
  id: string
  entidad: EntidadFinanciadoraKey
  porcentaje: number // 0-100
  requisitos?: string
  urlInfo?: string
  activa: boolean
}

export interface InstanciaVistaCompleta {
  id: string
  plantillaId: string
  nombreCurso: string
  descripcionCurso: string
  imagenPortada: string
  codigoCompleto: string
  tipo: CourseType
  modalidad: CourseModality
  estado: ConvocationStatus | 'en_curso' | 'finalizada'
  fechaInicio: string
  fechaFin: string
  horario: string
  duracionHoras: number
  precio: number
  precioConDescuento?: number
  plazasTotales: number
  plazasOcupadas: number
  porcentajeOcupacion: number
  profesorId: string
  profesorNombre: string
  profesorAvatar?: string
  sedeId: string
  sedeNombre: string
  aulaId: string
  aulaNombre: string
  subvencionado: 'no' | 'parcial' | 'total'
  entidadesFinanciadoras: EntidadFinanciadora[]
}

// ============================================================================
// ADMINISTRACIÓN Y PERMISOS
// ============================================================================

export type ModuloSistema =
  | 'cursos'
  | 'programacion'
  | 'ciclos'
  | 'sedes'
  | 'aulas'
  | 'profesores'
  | 'administrativos'
  | 'alumnos'
  | 'leads'
  | 'matriculas'
  | 'campanas'
  | 'creatividades'
  | 'contenido'
  | 'analiticas'
  | 'administracion'

export type AccionPermiso = 'ver' | 'crear' | 'editar' | 'eliminar' | 'exportar'

export interface Permiso {
  modulo: ModuloSistema
  acciones: AccionPermiso[]
}

export interface Rol {
  id: string
  nombre: string
  descripcion: string
  permisos: Permiso[]
  es_sistema: boolean
  usuarios_count: number
  color: string
  created_at: string
  updated_at: string
}

export interface Usuario {
  id: string
  nombre: string
  apellido: string
  email: string
  foto?: string
  rol: Rol
  activo: boolean
  ultimo_acceso?: string
  created_at: string
  updated_at: string
}

export interface ActividadLog {
  id: string
  usuario: Usuario
  accion: string
  modulo: ModuloSistema
  detalle: string
  ip: string
  timestamp: string
}

// ============================================================================
// MENU SIDEBAR
// ============================================================================

export interface MenuItem {
  title: string
  icon: any // lucide-react icon component
  url?: string
  items?: MenuItem[]
}
