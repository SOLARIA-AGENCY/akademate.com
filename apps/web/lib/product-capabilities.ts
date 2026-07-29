export type CapabilityStatus = 'available' | 'configured' | 'validation'

export type PublicCapability = {
  title: string
  description: string
  status: CapabilityStatus
  statusLabel: string
  evidenceBoundary: string
}

export const publicCapabilities: readonly PublicCapability[] = [
  {
    title: 'Cursos, ciclos y convocatorias',
    description: 'Modelos y flujos para organizar oferta, ediciones, fechas, sedes y equipo docente.',
    status: 'available',
    statusLabel: 'Disponible en el producto',
    evidenceBoundary: 'La publicación y el contenido dependen de la configuración de cada academia.',
  },
  {
    title: 'Alumnos y matrículas',
    description: 'Registro académico, inscripciones y seguimiento operativo con aislamiento por organización.',
    status: 'available',
    statusLabel: 'Disponible en el producto',
    evidenceBoundary: 'Los permisos efectivos dependen del rol y del despliegue contratado.',
  },
  {
    title: 'Campus y experiencia del alumno',
    description: 'Superficie separada para acceso del alumno y seguimiento de su formación.',
    status: 'configured',
    statusLabel: 'Requiere configuración',
    evidenceBoundary: 'No se activa automáticamente para todas las organizaciones.',
  },
  {
    title: 'Leads y comunicaciones',
    description: 'Captura y gestión de solicitudes vinculadas a los procesos del centro.',
    status: 'available',
    statusLabel: 'Disponible en el producto',
    evidenceBoundary: 'Los canales externos requieren credenciales, contrato y configuración propios.',
  },
  {
    title: 'Pagos y facturación',
    description: 'Contratos técnicos para suscripciones, cobros e integración con proveedores de pago.',
    status: 'configured',
    statusLabel: 'Según plan e integración',
    evidenceBoundary: 'No se afirma que pagos o facturación estén activos para todos los clientes.',
  },
  {
    title: 'Analítica operativa',
    description: 'Indicadores y reportes sobre actividad académica y operativa cuando existen datos válidos.',
    status: 'configured',
    statusLabel: 'Según datos y módulos',
    evidenceBoundary: 'No se promete tiempo real, exhaustividad ni un conjunto idéntico de métricas.',
  },
  {
    title: 'Multi-sede y ámbitos operativos',
    description: 'Modelo tenant y relaciones de sede disponibles; el alcance por entidad o campus sigue una activación controlada.',
    status: 'validation',
    statusLabel: 'En validación controlada',
    evidenceBoundary: 'La base shadow de CEP no equivale a permisos multi-entidad activados para el SaaS general.',
  },
] as const

export const aiCapability = {
  title: 'Integración MCP e IA asistida',
  statusLabel: 'Integración técnica; activación controlada',
  description:
    'Akademate incluye un servidor MCP para operaciones acotadas. Su disponibilidad, proveedor compatible, herramientas expuestas y acceso a datos dependen del despliegue, las credenciales y los permisos de cada organización.',
  limitations: [
    'No se afirma compatibilidad universal con todos los asistentes o modelos.',
    'Las acciones deben respetar autorización, alcance tenant y supervisión humana.',
    'Las salidas de IA pueden ser inexactas y no sustituyen decisiones educativas, legales o financieras.',
  ],
} as const
