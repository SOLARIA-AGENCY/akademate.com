import {
  CalendarDays,
  ClipboardList,
  Globe,
  MessageSquareQuote,
  QrCode,
  Shield,
  Video,
  type LucideIcon,
} from 'lucide-react'

export interface DraftModule {
  slug: string
  title: string
  description: string
  expectedPhase: string
  plannedFeatures: string[]
  note: string
  icon: LucideIcon
}

export const DRAFT_MODULES: Record<string, DraftModule> = {
  tareas: {
    slug: 'tareas',
    title: 'Tareas',
    description: 'Entregas y evaluación de actividades del campus, ya existiendo la ruta /assignments fuera del menú.',
    expectedPhase: 'Campus LMS · siguiente iteración',
    plannedFeatures: [
      'Listado de tareas por convocatoria y curso',
      'Entrega del alumno con fecha límite',
      'Corrección y rúbrica del docente',
      'Estado visible en el progreso del campus',
    ],
    note: 'El código de assignments existe; falta la superficie de menú y el flujo de corrección.',
    icon: ClipboardList,
  },
  asistencia: {
    slug: 'asistencia',
    title: 'Asistencia QR',
    description: 'Check-in del alumno a una sesión presencial o virtual mediante código QR.',
    expectedPhase: 'Campus LMS · siguiente iteración',
    plannedFeatures: [
      'QR por sesión generado por el docente',
      'Check-in del alumno desde el campus',
      'Informe de asistencia por convocatoria',
      'Exportación para justificación SEPE',
    ],
    note: 'Hay collection y tests en el template; el tenant no expone aún la página de alumno.',
    icon: QrCode,
  },
  'sesiones-live': {
    slug: 'sesiones-live',
    title: 'Sesiones en directo',
    description: 'Aulas virtuales por convocatoria, con enlace a Zoom o BigBlueButton.',
    expectedPhase: 'Campus LMS · posterior',
    plannedFeatures: [
      'Alta de sesión ligada a una convocatoria',
      'Enlace de acceso con rol (docente / alumno)',
      'Recordatorio automático',
      'Marca de asistencia al unirse',
    ],
    note: 'Reclamado en ACADEIMATE_SPEC §5. No implementar hasta haber proveedor y política de grabación.',
    icon: Video,
  },
  grabaciones: {
    slug: 'grabaciones',
    title: 'Grabaciones',
    description: 'Archivo de sesiones grabadas, visible para los alumnos matriculados.',
    expectedPhase: 'Campus LMS · posterior',
    plannedFeatures: [
      'Ingesta desde Zoom/BBB',
      'Visibilidad por convocatoria',
      'Caducidad y retención',
      'Descarga controlada',
    ],
    note: 'Depende de sesiones en directo. No construir aislado.',
    icon: Video,
  },
  comunicacion: {
    slug: 'comunicacion',
    title: 'Mensajería',
    description: 'Canal interno centro–alumno: anuncios de curso, hilos y notificaciones push.',
    expectedPhase: 'Comunicación · posterior',
    plannedFeatures: [
      'Anuncios por curso o convocatoria',
      'Hilo alumno–docente',
      'Plantillas de email ya existentes reutilizadas',
      'Push opt-in',
    ],
    note: 'Hoy hay NotificationBell y correo transaccional. No hay chat ni anuncios de curso.',
    icon: MessageSquareQuote,
  },
  'calendario-google': {
    slug: 'calendario-google',
    title: 'Google Calendar',
    description: 'Sincronización de horarios de convocatoria con el calendario del docente y del alumno.',
    expectedPhase: 'Integraciones · posterior',
    plannedFeatures: [
      'OAuth de Google por usuario',
      'Alta/baja de eventos al publicar una convocatoria',
      'Zona horaria de la sede',
      'Revocación de acceso',
    ],
    note: 'Claim de marketing de akademate.com. No hay sync hoy.',
    icon: CalendarDays,
  },
  webhooks: {
    slug: 'webhooks',
    title: 'Centro de webhooks',
    description: 'Eventos del centro (lead.created, enrollment.updated) con reintentos y firma.',
    expectedPhase: 'Integraciones · posterior',
    plannedFeatures: [
      'Alta de endpoint con secreto',
      'Catálogo de eventos',
      'Registro de entregas y reintentos',
      'Firma HMAC',
    ],
    note: 'Existe el webhook de Stripe. No hay bus de eventos del centro.',
    icon: Globe,
  },
  sso: {
    slug: 'sso',
    title: 'SSO / SAML',
    description: 'Login corporativo SAML u OIDC para staff del centro, y SCIM para provisionar cuentas.',
    expectedPhase: 'Enterprise · no autorizado',
    plannedFeatures: [
      'Conector SAML / OIDC',
      'Mapeo de roles a memberships',
      'SCIM de alta/baja',
      'Forzar SSO por dominio',
    ],
    note: 'Promesa enterprise. Fuera de alcance hasta autorización explícita. Multi-entidad sigue default-off.',
    icon: Shield,
  },
}

export const DRAFT_MODULE_SLUGS = Object.keys(DRAFT_MODULES)
