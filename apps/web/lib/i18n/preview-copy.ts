import type { ConnectorStatus } from '@/lib/integration-brands'
import type { Locale } from '@/lib/i18n/routing'

type DistributionCopy = {
  title: string
  text: string
}

export type PreviewCopy = {
  distribution: readonly [DistributionCopy, DistributionCopy, DistributionCopy, DistributionCopy]
  website: {
    publishYourWay: string
    distributionOptions: string
    connected: string
    academyOnline: string
    programmeCards: readonly [string, string, string, string]
    liveCms: string
    cmsItems: readonly [string, string, string, string]
    domainMapping: string
    domainChecks: readonly [string, string, string]
    guidedDns: string
    statusLabel: string
    securityLabel: string
    status: string
    security: string
    secureExperience: string
    existingWebsite: string
    embedBuilder: string
    liveClasses: string
    embedOptions: readonly [string, string, string]
    offerTitle: string
    offerDetail: string
    reserve: string
    share: string
    readyToShare: string
    shareChecks: readonly [string, string, string]
    previewOffer: string
    copyExampleAddress: string
  }
  course: {
    copyCourseUrl: string
    openCoursePage: string
    shareCourse: string
    imageAlt: string
    exampleCoursePage: string
    title: string
    description: string
    dateDescription: string
    timeDescription: string
    locationTitle: string
    locationDescription: string
    availabilityTitle: string
    availabilityDescription: string
    confirmedAttendees: string
    attendeesAria: string
    attendeeAltPrefix: string
    ratingAria: string
    ratingSummary: string
    registration: string
    joinPrompt: string
    ticketLegend: string
    tickets: readonly [{ title: string; detail: string }, { title: string; detail: string }]
    continueWith: string
    emailAddress: string
    emailPlaceholder: string
    dueToday: string
    continueToPayment: string
    secureRegistration: string
    shareDialog: string
    shareTitle: string
    shareDescription: string
    closeShareOptions: string
    shareActions: readonly [string, string, string, string]
    continueWithProvider: string
    providers: readonly [string, string, string]
  }
  connectors: {
    empty: string
    ariaLabel: string
    status: Record<ConnectorStatus, string>
  }
}

const previewCopy = {
  en: {
    distribution: [
      {
        title: 'Your Akademate website',
        text: 'Launch a branded website connected to your operation.',
      },
      { title: 'Your own domain', text: 'Connect your domain with guided DNS setup.' },
      {
        title: 'Embeds for any website',
        text: 'Embed live classes, forms and payments anywhere.',
      },
      {
        title: 'A page for every offer',
        text: 'Share one page for discovery, registration and payment.',
      },
    ],
    website: {
      publishYourWay: 'Publish your way',
      distributionOptions: 'Website distribution options',
      connected: 'Connected',
      academyOnline: 'Your academy, online',
      programmeCards: [
        'Professional programmes',
        'Weekend workshops',
        'Online cohorts',
        'Upcoming events',
      ],
      liveCms: 'Live CMS',
      cmsItems: ['Pages', 'Courses', 'Forms', 'SEO'],
      domainMapping: 'DOMAIN MAPPING',
      domainChecks: ['DNS verified', 'SSL active', 'Academy connected'],
      guidedDns: 'Guided DNS',
      statusLabel: 'STATUS',
      securityLabel: 'SECURITY',
      status: 'Connected',
      security: 'Managed SSL',
      secureExperience: 'Secure public experience',
      existingWebsite: 'YOUR EXISTING WEBSITE',
      embedBuilder: 'EMBED BUILDER',
      liveClasses: 'Akademate live classes',
      embedOptions: ['Classes', 'Forms', 'Payments'],
      offerTitle: 'Creative Leadership Weekend',
      offerDetail: '12–13 September · 8 places left',
      reserve: 'Reserve',
      share: 'Share',
      readyToShare: 'Ready to share',
      shareChecks: ['Copy public URL', 'Open mobile share', 'Create social preview'],
      previewOffer: 'Preview offer',
      copyExampleAddress: 'Copy example address',
    },
    course: {
      copyCourseUrl: 'Copy course URL',
      openCoursePage: 'Open public course page',
      shareCourse: 'Share course',
      imageAlt: 'Creative leadership workshop participants collaborating with a facilitator',
      exampleCoursePage: 'Example public course page',
      title: 'Creative Leadership Weekend',
      description: 'Two focused days of practice, feedback and useful tools.',
      dateDescription: 'Saturday and Sunday',
      timeDescription: 'Two live sessions',
      locationTitle: 'Central campus',
      locationDescription: 'Studio 2 · Hybrid access',
      availabilityTitle: '8 places available',
      availabilityDescription: '16 of 24 confirmed',
      confirmedAttendees: 'Confirmed attendees',
      attendeesAria: 'Four example confirmed attendees',
      attendeeAltPrefix: 'Example attendee',
      ratingAria: 'Rated 4.9 out of 5 by previous participants',
      ratingSummary: '4.9 from previous participants',
      registration: 'Registration',
      joinPrompt: 'Choose how to join',
      ticketLegend: 'Ticket option',
      tickets: [
        { title: 'Full workshop', detail: 'Two days · materials included' },
        { title: 'Reserve with deposit', detail: 'Secure your place today' },
      ],
      continueWith: 'Continue with',
      emailAddress: 'Email address',
      emailPlaceholder: 'you@example.com',
      dueToday: 'Due today',
      continueToPayment: 'Continue to payment',
      secureRegistration: 'Secure registration with consent controls',
      shareDialog: 'Share course',
      shareTitle: 'Share this course',
      shareDescription: 'Send the public registration page.',
      closeShareOptions: 'Close share options',
      shareActions: ['Copy', 'Message', 'Email', 'More'],
      continueWithProvider: 'Continue with',
      providers: ['Email', 'Google', 'Apple'],
    },
    connectors: {
      empty: 'Built directly into the Akademate operating model.',
      ariaLabel: 'Connected services and supported methods',
      status: {
        Available: 'Available',
        'Connector-ready': 'Connector-ready',
        Roadmap: 'Roadmap',
        'Payment method': 'Payment method',
      },
    },
  },
  es: {
    distribution: [
      {
        title: 'Tu web de Akademate',
        text: 'Lanza una web con tu marca conectada a tu operación.',
      },
      { title: 'Tu propio dominio', text: 'Conecta tu dominio con una configuración DNS guiada.' },
      {
        title: 'Módulos para cualquier web',
        text: 'Integra clases en directo, formularios y pagos en cualquier lugar.',
      },
      {
        title: 'Una página para cada oferta',
        text: 'Comparte una página para descubrir, inscribirse y pagar.',
      },
    ],
    website: {
      publishYourWay: 'Publica a tu manera',
      distributionOptions: 'Opciones de publicación web',
      connected: 'Conectado',
      academyOnline: 'Tu academia, online',
      programmeCards: [
        'Programas profesionales',
        'Talleres de fin de semana',
        'Cohortes online',
        'Próximos eventos',
      ],
      liveCms: 'CMS en directo',
      cmsItems: ['Páginas', 'Cursos', 'Formularios', 'SEO'],
      domainMapping: 'ASIGNACIÓN DE DOMINIO',
      domainChecks: ['DNS verificado', 'SSL activo', 'Academia conectada'],
      guidedDns: 'DNS guiado',
      statusLabel: 'ESTADO',
      securityLabel: 'SEGURIDAD',
      status: 'Conectado',
      security: 'SSL gestionado',
      secureExperience: 'Experiencia pública segura',
      existingWebsite: 'TU WEB ACTUAL',
      embedBuilder: 'GENERADOR DE MÓDULOS',
      liveClasses: 'Clases en directo de Akademate',
      embedOptions: ['Clases', 'Formularios', 'Pagos'],
      offerTitle: 'Fin de semana de liderazgo creativo',
      offerDetail: '12–13 September · quedan 8 plazas',
      reserve: 'Reservar',
      share: 'Compartir',
      readyToShare: 'Listo para compartir',
      shareChecks: ['Copiar URL pública', 'Abrir compartir móvil', 'Crear vista previa social'],
      previewOffer: 'Vista previa de la oferta',
      copyExampleAddress: 'Copiar dirección de ejemplo',
    },
    course: {
      copyCourseUrl: 'Copiar URL del curso',
      openCoursePage: 'Abrir página pública del curso',
      shareCourse: 'Compartir curso',
      imageAlt: 'Participantes de un taller de liderazgo creativo colaborando con una facilitadora',
      exampleCoursePage: 'Página pública de curso de ejemplo',
      title: 'Fin de semana de liderazgo creativo',
      description: 'Dos días prácticos de aprendizaje, feedback y herramientas útiles.',
      dateDescription: 'Sábado y domingo',
      timeDescription: 'Dos sesiones en directo',
      locationTitle: 'Campus central',
      locationDescription: 'Estudio 2 · Acceso híbrido',
      availabilityTitle: '8 plazas disponibles',
      availabilityDescription: '16 de 24 confirmadas',
      confirmedAttendees: 'Asistentes confirmados',
      attendeesAria: 'Cuatro asistentes confirmados de ejemplo',
      attendeeAltPrefix: 'Asistente de ejemplo',
      ratingAria: 'Valorado con 4,9 sobre 5 por participantes anteriores',
      ratingSummary: '4,9 de participantes anteriores',
      registration: 'Inscripción',
      joinPrompt: 'Elige cómo quieres participar',
      ticketLegend: 'Opción de entrada',
      tickets: [
        { title: 'Taller completo', detail: 'Dos días · materiales incluidos' },
        { title: 'Reservar con depósito', detail: 'Asegura tu plaza hoy' },
      ],
      continueWith: 'Continuar con',
      emailAddress: 'Dirección de correo electrónico',
      emailPlaceholder: 'tu@ejemplo.com',
      dueToday: 'A pagar hoy',
      continueToPayment: 'Continuar al pago',
      secureRegistration: 'Inscripción segura con controles de consentimiento',
      shareDialog: 'Compartir curso',
      shareTitle: 'Comparte este curso',
      shareDescription: 'Envía la página pública de inscripción.',
      closeShareOptions: 'Cerrar opciones para compartir',
      shareActions: ['Copiar', 'Mensaje', 'Correo', 'Más'],
      continueWithProvider: 'Continuar con',
      providers: ['Correo electrónico', 'Google', 'Apple'],
    },
    connectors: {
      empty: 'Integrado directamente en el modelo operativo de Akademate.',
      ariaLabel: 'Servicios conectados y métodos compatibles',
      status: {
        Available: 'Disponible',
        'Connector-ready': 'Listo para conector',
        Roadmap: 'Hoja de ruta',
        'Payment method': 'Método de pago',
      },
    },
  },
} as const satisfies Record<Locale, PreviewCopy>

export function getPreviewCopy(locale: Locale): PreviewCopy {
  const copy = previewCopy[locale]
  if (!copy) throw new Error(`Missing preview copy for locale: ${locale}`)
  return copy
}

export { previewCopy }
