import type { Locale } from '@/lib/i18n/routing'
import { solutionDetails, verticals } from '@/lib/marketing-content'
import { spanishVerticalProductStories } from '@/lib/vertical-product-stories.es'
import { verticalProductStories } from '@/lib/vertical-product-stories'

export type LocalizedVertical = {
  slug: string
  title: string
  description: string
  image: string
  imageAlt: string
  capabilities: readonly string[]
}
export type LocalizedSolutionDetail = {
  headline: string
  promise: string
  outcomes: readonly string[]
  workflow: readonly string[]
  modules: readonly string[]
}
export type LocalizedVerticalProductStory = (typeof verticalProductStories)[string]

export const verticalPageChrome = {
  en: {
    heroPrefix: 'Akademate for',
    heroCta: 'Start free trial',
    outcomesTitle: 'A smoother journey for everyone.',
    experienceEyebrow: 'A product experience shaped around your model',
    experienceTitle: 'See the workflow come together.',
    experienceDescription: 'Explore a workflow shaped around this academy model.',
    poweredBy: 'Powered by',
    closingTitle: 'Build a better academy.',
    closingDescription: 'Map your programmes, people and locations.',
    closingCta: 'Start free trial',
    designedFor: 'Designed for your',
    operatingContext: 'Example operating context',
    illustrativeExample: 'Illustrative product example',
    exploreSolution: 'Explore this solution',
  },
  es: {
    heroPrefix: 'Akademate para',
    heroCta: 'Empieza la prueba gratis',
    outcomesTitle: 'Un recorrido más ágil para todos.',
    experienceEyebrow: 'Una experiencia de producto adaptada a tu modelo',
    experienceTitle: 'Descubre cómo se conecta el flujo de trabajo.',
    experienceDescription: 'Explora un flujo de trabajo diseñado para este modelo de academia.',
    poweredBy: 'Con la tecnología de',
    closingTitle: 'Construye una academia mejor.',
    closingDescription: 'Conecta tus programas, personas y sedes.',
    closingCta: 'Empieza la prueba gratis',
    designedFor: 'Diseñado para tu',
    operatingContext: 'Ejemplo de contexto operativo',
    illustrativeExample: 'Ejemplo ilustrativo de producto',
    exploreSolution: 'Explorar esta solución',
  },
} as const

const spanishVerticalMeta: Record<
  string,
  Pick<LocalizedVertical, 'title' | 'description' | 'imageAlt' | 'capabilities'>
> = {
  'professional-training': {
    title: 'Formación profesional y regulada',
    description: 'Admisiones, cohortes, cumplimiento y progreso del alumnado.',
    imageAlt:
      'Personas adultas en formación profesional trabajando con su docente en un centro moderno',
    capabilities: ['Admisiones', 'Cohortes', 'Progreso académico'],
  },
  wellness: {
    title: 'Estudios de yoga, pilates y bienestar',
    description: 'Clases, membresías, aforo y reservas recurrentes.',
    imageAlt: 'Clase de yoga coordinada por una instructora que usa una tableta',
    capabilities: ['Membresías', 'Bonos de sesiones', 'Clases recurrentes'],
  },
  sports: {
    title: 'Academias y clubes deportivos',
    description: 'Equipos, tutores, temporadas y desarrollo del deportista.',
    imageAlt:
      'Niños participando en una academia deportiva al aire libre organizada profesionalmente',
    capabilities: ['Tutores', 'Equipos', 'Temporadas'],
  },
  seasonal: {
    title: 'Campamentos de temporada',
    description: 'Lanza, llena y opera programas con fechas definidas.',
    imageAlt: 'Campus deportivo de verano con registro de participantes y actividades dirigidas',
    capabilities: ['Lanzamiento ágil', 'Depósitos', 'Aforo'],
  },
  'performing-arts': {
    title: 'Música, danza y artes escénicas',
    description: 'Coordina estudios, clases, actuaciones y familias.',
    imageAlt: 'Academia de danza y música que organiza varias clases en un estudio compartido',
    capabilities: ['Estudios', 'Docentes', 'Clases recurrentes'],
  },
  'online-cohorts': {
    title: 'Escuelas online y programas por cohortes',
    description: 'Conecta cohortes, aprendizaje, comunidad y progreso.',
    imageAlt: 'Docente impartiendo una clase online en directo desde un estudio profesional',
    capabilities: ['Campus virtual', 'Tareas', 'Comunidad'],
  },
  languages: {
    title: 'Academias de idiomas',
    description: 'Nivelación, grupos, facturación e impartición híbrida.',
    imageAlt: 'Personas adultas aprendiendo en una clase colaborativa de idiomas',
    capabilities: ['Nivelación', 'Niveles', 'Facturación mensual'],
  },
  'driving-schools': {
    title: 'Autoescuelas',
    description: 'Clases, vehículos, exámenes y progreso del alumnado.',
    imageAlt: 'Instructor de autoescuela con un alumno en un coche de doble mando',
    capabilities: ['Clases', 'Vehículos', 'Seguimiento de examen'],
  },
  'coding-academies': {
    title: 'Academias de programación',
    description: 'Cohortes, proyectos, mentores y portafolios listos para empleo.',
    imageAlt: 'Mentor y alumnado trabajando juntos en un aula de programación',
    capabilities: ['Cohortes', 'Proyectos', 'Mentores'],
  },
  networks: {
    title: 'Grupos multisede y franquicias',
    description: 'Estándares compartidos con control operativo local.',
    imageAlt: 'Líderes de un grupo educativo coordinando una organización de formación multisede',
    capabilities: ['Marcas', 'Sedes', 'Finanzas locales'],
  },
}

const spanishDetails: Record<string, LocalizedSolutionDetail> = {
  'professional-training': {
    headline: 'Llena cohortes. Imparte con confianza.',
    promise: 'Conecta admisiones, impartición y progreso para cada cohorte.',
    outcomes: [
      'Convierte más consultas en solicitudes cualificadas',
      'Mantén documentación y aprobaciones en movimiento',
      'Da a docentes y alumnado un campus fiable',
      'Ve juntos el rendimiento y los ingresos de cada cohorte',
    ],
    workflow: [
      'Captar interés',
      'Revisar requisitos',
      'Confirmar matrícula',
      'Impartir el programa',
    ],
    modules: ['CRM de admisiones', 'Cohortes y horarios', 'Campus del alumno', 'Pagos e informes'],
  },
  languages: {
    headline: 'Llena clases. Simplifica horarios.',
    promise: 'Conecta nivelación, grupos, facturación y aprendizaje híbrido.',
    outcomes: [
      'Orienta al alumnado al nivel adecuado',
      'Abre grupos según la demanda real',
      'Automatiza los cobros mensuales',
      'Alinea el progreso presencial y online',
    ],
    workflow: ['Nivelación', 'Asignación de grupo', 'Reserva recurrente', 'Progreso'],
    modules: ['Nivelación y CRM', 'Niveles y grupos', 'Facturación recurrente', 'Campus híbrido'],
  },
  wellness: {
    headline: 'Crea un estudio al que los socios vuelvan.',
    promise: 'Haz que cada clase sea fácil de descubrir, reservar y renovar.',
    outcomes: [
      'Facilita la reserva recurrente',
      'Protege el aforo de salas e instructores',
      'Haz crecer membresías y bonos',
      'Comprende asistencia y retención',
    ],
    workflow: ['Descubrir clase', 'Reservar plaza', 'Hacer check-in', 'Renovar membresía'],
    modules: ['Reserva de clases', 'Membresías', 'Horarios de instructores', 'Datos de retención'],
  },
  sports: {
    headline: 'Gestiona la temporada. Haz crecer a cada deportista.',
    promise: 'Coordina pruebas, equipos, tutores y progreso deportivo.',
    outcomes: [
      'Convierte pruebas en plazas confirmadas',
      'Mantén informados a los tutores',
      'Coordina equipos e instalaciones',
      'Sigue asistencia y evolución',
    ],
    workflow: ['Prueba', 'Evaluación', 'Asignación de equipo', 'Temporada'],
    modules: [
      'Pruebas y evaluaciones',
      'Equipos y tutores',
      'Instalaciones y horarios',
      'Asistencia y progreso',
    ],
  },
  seasonal: {
    headline: 'Lanza tu próximo campamento en días.',
    promise: 'Publica, llena y gestiona cada programa de temporada.',
    outcomes: [
      'Publica rápidamente un programa reservable',
      'Gestiona semanas, edades y aforo',
      'Cobra depósitos y documentos',
      'Automatiza información de llegada y recordatorios',
    ],
    workflow: ['Publicar', 'Reservar', 'Preparar', 'Dar la bienvenida'],
    modules: [
      'Páginas de lanzamiento',
      'Aforo y lista de espera',
      'Depósitos y documentos',
      'Comunicación familiar',
    ],
  },
  'performing-arts': {
    headline: 'Mantén las actuaciones a ritmo.',
    promise: 'Mantén a ritmo las clases, los estudios, las familias y las actuaciones.',
    outcomes: [
      'Simplifica la matrícula recurrente',
      'Coordina estudios y docentes',
      'Mantén a las familias cerca del progreso',
      'Planifica actuaciones desde una vista de producción',
    ],
    workflow: ['Elegir disciplina', 'Unirse a una clase', 'Crear progreso', 'Actuar'],
    modules: [
      'Clases recurrentes',
      'Planificación de estudios',
      'Cuentas familiares',
      'Eventos y progreso',
    ],
  },
  'online-cohorts': {
    headline: 'Convierte cada cohorte en una comunidad.',
    promise: 'Une matrícula, aprendizaje en directo, comunidad y progreso.',
    outcomes: [
      'Crea un recorrido de matrícula premium',
      'Da al alumnado un único hogar digital',
      'Ayuda al profesorado a actuar según el progreso',
      'Mantén la comunidad activa entre sesiones',
    ],
    workflow: ['Solicitar plaza', 'Incorporarse', 'Aprender juntos', 'Completar'],
    modules: [
      'Admisiones por cohorte',
      'Campus virtual',
      'Tareas y chat',
      'Progreso y finalización',
    ],
  },
  'driving-schools': {
    headline: 'Llena la agenda. Aprueba más exámenes.',
    promise: 'Conecta clases, vehículos, exámenes y cobros en un solo expediente.',
    outcomes: [
      'Convierte consultas en clases confirmadas',
      'Alinea coches, instructores y huecos',
      'Sigue teoría, práctica y fechas de examen',
      'Cobra sin perseguir hojas de cálculo',
    ],
    workflow: ['Reservar clase', 'Asignar coche', 'Seguir progreso', 'Aprobar el examen'],
    modules: [
      'Reserva de clases',
      'Agenda de vehículos e instructores',
      'Exámenes y progreso',
      'Cuotas y recibos',
    ],
  },
  'coding-academies': {
    headline: 'Entrega proyectos. Coloca egresados.',
    promise: 'Conecta cohortes, trabajo de proyecto, mentores y resultados de empleo.',
    outcomes: [
      'Llena la siguiente cohorte sin perder solicitudes',
      'Mantén proyectos y feedback en un campus',
      'Da a cada mentor una vista clara del alumnado',
      'Muestra trabajo listo para contratar sin herramientas extra',
    ],
    workflow: ['Solicitar plaza', 'Unirse a una cohorte', 'Construir proyectos', 'Conseguir empleo'],
    modules: [
      'Admisiones por cohorte',
      'Campus de proyectos',
      'Espacio del mentor',
      'Portafolio y colocación',
    ],
  },
  networks: {
    headline: 'Una marca. Cada sede bajo control.',
    promise: 'Escala estándares compartidos mientras cada sede mantiene el control.',
    outcomes: [
      'Abre sedes con estándares compartidos',
      'Mantén a los equipos locales centrados en su operación',
      'Separa dominios y responsabilidad de cobro',
      'Ve el rendimiento de la red en una vista',
    ],
    workflow: ['Definir estándares', 'Configurar sede', 'Operar localmente', 'Aprender como red'],
    modules: ['Marcas y dominios', 'Espacios por sede', 'Finanzas acotadas', 'Informes de red'],
  },
}

export function getLocalizedVertical(slug: string, locale: Locale): LocalizedVertical | undefined {
  const vertical = verticals.find((item) => item.slug === slug)
  if (!vertical) return undefined
  if (locale === 'en') return vertical
  const localized = spanishVerticalMeta[slug]
  if (!localized) throw new Error(`Missing Spanish vertical metadata: ${slug}`)
  return { ...vertical, ...localized }
}

export function getLocalizedSolutionDetail(
  slug: string,
  locale: Locale
): LocalizedSolutionDetail | undefined {
  const detail = solutionDetails[slug as keyof typeof solutionDetails]
  if (!detail) return undefined
  if (locale === 'en') return detail
  const localized = spanishDetails[slug]
  if (!localized) throw new Error(`Missing Spanish solution detail: ${slug}`)
  return localized
}

export function getLocalizedVerticalProductStory(
  slug: string,
  locale: Locale
): LocalizedVerticalProductStory | undefined {
  return locale === 'es' ? spanishVerticalProductStories[slug] : verticalProductStories[slug]
}
