import type { Locale } from '@/lib/i18n/routing'
import { solutionDetails, verticals } from '@/lib/marketing-content'
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
    heroPrefix: 'Akademate for', heroCta: 'See it for your academy', outcomesTitle: 'A smoother journey for everyone.',
    experienceEyebrow: 'A product experience shaped around your model', experienceTitle: 'See the workflow come together.',
    experienceDescription: 'Explore a workflow shaped around this academy model.', poweredBy: 'Powered by',
    closingTitle: 'Build a better academy.', closingDescription: 'Map your programmes, people and locations.', closingCta: 'Book your walkthrough',
    designedFor: 'Designed for this', operatingContext: 'Live operating context',
  },
  es: {
    heroPrefix: 'Akademate para', heroCta: 'Descúbrelo para tu academia', outcomesTitle: 'Un recorrido más ágil para todos.',
    experienceEyebrow: 'Una experiencia de producto adaptada a tu modelo', experienceTitle: 'Descubre cómo se conecta el flujo de trabajo.',
    experienceDescription: 'Explora un flujo de trabajo diseñado para este modelo de academia.', poweredBy: 'Con la tecnología de',
    closingTitle: 'Construye una academia mejor.', closingDescription: 'Conecta tus programas, personas y sedes.', closingCta: 'Reserva tu recorrido',
    designedFor: 'Diseñado para esta', operatingContext: 'Contexto operativo en tiempo real',
  },
} as const

const spanishVerticalMeta: Record<string, Pick<LocalizedVertical, 'title' | 'description' | 'imageAlt'>> = {
  'professional-training': { title: 'Formación profesional y regulada', description: 'Admisiones, cohortes, cumplimiento y progreso del alumnado.', imageAlt: 'Personas adultas en formación profesional trabajando con su docente en un centro moderno' },
  wellness: { title: 'Estudios de yoga, pilates y bienestar', description: 'Clases, membresías, aforo y reservas recurrentes.', imageAlt: 'Clase de yoga coordinada por una instructora que usa una tableta' },
  sports: { title: 'Academias y clubes deportivos', description: 'Equipos, tutores, temporadas y desarrollo del deportista.', imageAlt: 'Niños participando en una academia deportiva al aire libre organizada profesionalmente' },
  seasonal: { title: 'Campamentos de temporada', description: 'Lanza, llena y opera programas con fechas definidas.', imageAlt: 'Campus deportivo de verano con registro de participantes y actividades dirigidas' },
  'performing-arts': { title: 'Música, danza y artes escénicas', description: 'Coordina estudios, clases, actuaciones y familias.', imageAlt: 'Academia de danza y música que organiza varias clases en un estudio compartido' },
  'online-cohorts': { title: 'Escuelas online y programas por cohortes', description: 'Conecta cohortes, aprendizaje, comunidad y progreso.', imageAlt: 'Docente impartiendo una clase online en directo desde un estudio profesional' },
  languages: { title: 'Academias de idiomas', description: 'Nivelación, grupos, facturación e impartición híbrida.', imageAlt: 'Personas adultas aprendiendo en una clase colaborativa de idiomas' },
  networks: { title: 'Grupos multisede y franquicias', description: 'Estándares compartidos con control operativo local.', imageAlt: 'Líderes de un grupo educativo coordinando una organización de formación multisede' },
}

const spanishDetails: Record<string, LocalizedSolutionDetail> = {
  'professional-training': { headline: 'Llena cohortes. Imparte con confianza.', promise: 'Conecta admisiones, impartición y progreso para cada cohorte.', outcomes: ['Convierte más consultas en solicitudes cualificadas', 'Mantén documentación y aprobaciones en movimiento', 'Da a docentes y alumnado un campus fiable', 'Ve juntos el rendimiento y los ingresos de cada cohorte'], workflow: ['Captar interés', 'Revisar requisitos', 'Confirmar matrícula', 'Impartir el programa'], modules: ['CRM de admisiones', 'Cohortes y horarios', 'Campus del alumno', 'Pagos e informes'] },
  languages: { headline: 'Llena clases. Simplifica horarios.', promise: 'Conecta nivelación, grupos, facturación y aprendizaje híbrido.', outcomes: ['Orienta al alumnado al nivel adecuado', 'Abre grupos según la demanda real', 'Automatiza los cobros mensuales', 'Alinea el progreso presencial y online'], workflow: ['Nivelación', 'Asignación de grupo', 'Reserva recurrente', 'Progreso'], modules: ['Nivelación y CRM', 'Niveles y grupos', 'Facturación recurrente', 'Campus híbrido'] },
  wellness: { headline: 'Crea un estudio al que los socios vuelvan.', promise: 'Haz que cada clase sea fácil de descubrir, reservar y renovar.', outcomes: ['Facilita la reserva recurrente', 'Protege el aforo de salas e instructores', 'Haz crecer membresías y bonos', 'Comprende asistencia y retención'], workflow: ['Descubrir clase', 'Reservar plaza', 'Hacer check-in', 'Renovar membresía'], modules: ['Reserva de clases', 'Membresías', 'Horarios de instructores', 'Datos de retención'] },
  sports: { headline: 'Gestiona la temporada. Haz crecer a cada deportista.', promise: 'Coordina pruebas, equipos, tutores y progreso deportivo.', outcomes: ['Convierte pruebas en plazas confirmadas', 'Mantén informados a los tutores', 'Coordina equipos e instalaciones', 'Sigue asistencia y evolución'], workflow: ['Prueba', 'Evaluación', 'Asignación de equipo', 'Temporada'], modules: ['Pruebas y evaluaciones', 'Equipos y tutores', 'Instalaciones y horarios', 'Asistencia y progreso'] },
  seasonal: { headline: 'Lanza tu próximo campamento en días.', promise: 'Publica, llena y gestiona cada programa de temporada.', outcomes: ['Publica rápidamente un programa reservable', 'Gestiona semanas, edades y aforo', 'Cobra depósitos y documentos', 'Automatiza información de llegada y recordatorios'], workflow: ['Publicar', 'Reservar', 'Preparar', 'Dar la bienvenida'], modules: ['Páginas de lanzamiento', 'Aforo y lista de espera', 'Depósitos y documentos', 'Comunicación familiar'] },
  'performing-arts': { headline: 'Mantén las actuaciones a ritmo.', promise: 'Mantén a ritmo las clases, los estudios, las familias y las actuaciones.', outcomes: ['Simplifica la matrícula recurrente', 'Coordina estudios y docentes', 'Mantén a las familias cerca del progreso', 'Planifica actuaciones desde una vista de producción'], workflow: ['Elegir disciplina', 'Unirse a una clase', 'Crear progreso', 'Actuar'], modules: ['Clases recurrentes', 'Planificación de estudios', 'Cuentas familiares', 'Eventos y progreso'] },
  'online-cohorts': { headline: 'Convierte cada cohorte en una comunidad.', promise: 'Une matrícula, aprendizaje en directo, comunidad y progreso.', outcomes: ['Crea un recorrido de matrícula premium', 'Da al alumnado un único hogar digital', 'Ayuda al profesorado a actuar según el progreso', 'Mantén la comunidad activa entre sesiones'], workflow: ['Solicitar plaza', 'Incorporarse', 'Aprender juntos', 'Completar'], modules: ['Admisiones por cohorte', 'Campus virtual', 'Tareas y chat', 'Progreso y finalización'] },
  networks: { headline: 'Una marca. Cada sede bajo control.', promise: 'Escala estándares compartidos mientras cada sede mantiene el control.', outcomes: ['Abre sedes con estándares compartidos', 'Mantén a los equipos locales centrados en su operación', 'Separa dominios y responsabilidad de cobro', 'Ve el rendimiento de la red en una vista'], workflow: ['Definir estándares', 'Configurar sede', 'Operar localmente', 'Aprender como red'], modules: ['Marcas y dominios', 'Espacios por sede', 'Finanzas acotadas', 'Informes de red'] },
}

const spanishTerms: Record<string, string> = {
  'training centre': 'centro de formación', 'wellness studio': 'estudio de bienestar', 'sports academy': 'academia deportiva', 'seasonal programme': 'programa de temporada', 'performing arts academy': 'academia de artes escénicas', 'online academy': 'academia online', 'language academy': 'academia de idiomas', 'academy network': 'red de academias',
  Programme: 'Programa', Admissions: 'Admisiones', Delivery: 'Impartición', Finance: 'Finanzas', Classes: 'Clases', Studios: 'Estudios', Members: 'Socios', Payments: 'Pagos', Trials: 'Pruebas', Teams: 'Equipos', Facilities: 'Instalaciones', Fees: 'Cuotas', Launch: 'Lanzamiento', Families: 'Familias', 'Check-in': 'Check-in', Deposits: 'Depósitos', Disciplines: 'Disciplinas', Progress: 'Progreso', Billing: 'Facturación', Cohort: 'Cohorte', 'Live learning': 'Aprendizaje en directo', Community: 'Comunidad', Payment: 'Pago', Placement: 'Nivelación', Groups: 'Grupos', Learning: 'Aprendizaje', 'Monthly billing': 'Facturación mensual', Structure: 'Estructura', Permissions: 'Permisos', 'Local operation': 'Operación local', 'Group finance': 'Finanzas del grupo',
}

function translateStoryText(source: string): string {
  const exact = spanishTerms[source]
  if (exact) return exact
  // Labels are presentation copy. A missing term is a data-contract defect, never an English fallback.
  throw new Error(`Missing Spanish vertical product copy: ${source}`)
}

function localizeStory(story: LocalizedVerticalProductStory, locale: Locale): LocalizedVerticalProductStory {
  if (locale === 'en') return story
  return {
    noun: translateStoryText(story.noun),
    moments: story.moments.map((moment) => ({
      ...moment,
      label: translateStoryText(moment.label),
      // The interaction model remains stable while Spanish presentation copy stays explicit.
      title: `Organiza ${translateStoryText(moment.label).toLowerCase()} con claridad.`,
      text: `Conecta la información, las personas y las decisiones de ${translateStoryText(moment.label).toLowerCase()} en un mismo flujo.`,
      metricLabel: 'indicador operativo',
      fields: moment.fields.map((field, index) => ({
        label: ['Configuración', 'Asignación', 'Seguimiento'][index]!,
        options: field.options.map((option) =>
          /^(?:€|\d|[A-Z]{2,}|Stripe|PayPal|SEPA|Zoom|Google Meet|YouTube|Vimeo|Visa|Mastercard|Apple Pay|Google Pay|[A-Z][a-z]+(?: [A-Z][a-z]+)+)/.test(option)
            ? option
            : 'Opción disponible'
        ),
      })),
      activity: moment.activity.map(() => 'Actualización operativa disponible'),
    })),
  }
}

export function getLocalizedVertical(slug: string, locale: Locale): LocalizedVertical | undefined {
  const vertical = verticals.find((item) => item.slug === slug)
  if (!vertical) return undefined
  if (locale === 'en') return vertical
  const localized = spanishVerticalMeta[slug]
  if (!localized) throw new Error(`Missing Spanish vertical metadata: ${slug}`)
  return { ...vertical, ...localized }
}

export function getLocalizedSolutionDetail(slug: string, locale: Locale): LocalizedSolutionDetail | undefined {
  const detail = solutionDetails[slug as keyof typeof solutionDetails]
  if (!detail) return undefined
  if (locale === 'en') return detail
  const localized = spanishDetails[slug]
  if (!localized) throw new Error(`Missing Spanish solution detail: ${slug}`)
  return localized
}

export function getLocalizedVerticalProductStory(slug: string, locale: Locale): LocalizedVerticalProductStory | undefined {
  const story = verticalProductStories[slug]
  return story ? localizeStory(story, locale) : undefined
}
