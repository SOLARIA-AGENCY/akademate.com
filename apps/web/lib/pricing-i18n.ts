import type { Locale } from '@/lib/i18n/routing'
import {
  entitlementLabels,
  paidExtensions,
  planComparisonSections,
  separatelyBilledItems,
  type PlanComparisonSection,
  type PlanEntitlement,
} from './pricing-content'

type PlanCard = {
  name: 'Launch' | 'Business' | 'Enterprise'
  label: string
  description: string
  features: readonly string[]
  cta: string
  subject: string
}

type PricingPageCopy = {
  imageAlt: string
  proposal: string
  includedHeading: string
  comparisonLink: string
  proposalNote: string
  extensionsEyebrow: string
  extensionsTitle: string
  extensionsDescription: string
  extensionLabel: string
  comingSoonLabel: string
  extraCosts: string
  deploymentEyebrow: string
  deploymentTitle: string
  deploymentDescription: string
  deploymentOptions: readonly { name: string; text: string; tag: string }[]
  comparisonTitle: string
  comparisonDescription: string
  comparisonLegend: string
  comparisonCaption: string
  capabilityHeading: string
  planNames: readonly ['Launch', 'Business', 'Enterprise']
  scopeEyebrow: string
  scopeTitle: string
  scopeDescription: string
  financeTitle: string
  financeDescription: string
  questionsTitle: string
  cards: readonly PlanCard[]
  financeCards: readonly { title: string; text: string }[]
  faqs: readonly { question: string; answer: string }[]
}

const englishPageCopy: PricingPageCopy = {
  imageAlt: 'Akademate finance and accounting workspace across desktop and tablet',
  proposal: 'Tailored proposal',
  includedHeading: 'WHAT’S INCLUDED',
  comparisonLink: 'View complete inclusion list',
  proposalNote: 'Every proposal reflects your scale, integrations and operating model.',
  extensionsEyebrow: 'Add-ons',
  extensionsTitle: 'Add the modules you need.',
  extensionsDescription: 'Add specialist modules through a separately scoped commercial extension.',
  extensionLabel: 'Paid extension',
  comingSoonLabel: 'Coming soon',
  extraCosts: 'Extra costs:',
  deploymentEyebrow: 'Deployment',
  deploymentTitle: 'Our cloud, a dedicated cloud, or your own servers.',
  deploymentDescription:
    'Managed cloud by default. Enterprise adds a dedicated private cloud or an on-premise installation on your own servers, with versioned update channels and contracted support.',
  deploymentOptions: [
    {
      name: 'Managed cloud',
      text: 'The standard Akademate cloud: updates, backups and monitoring handled for you.',
      tag: 'All plans',
    },
    {
      name: 'Dedicated private cloud',
      text: 'Isolated infrastructure for your organisation, still operated by Akademate.',
      tag: 'Enterprise',
    },
    {
      name: 'On-premise',
      text: 'Akademate installed on your own servers, with versioned update channels and contracted support.',
      tag: 'Enterprise',
    },
  ],
  comparisonTitle: 'Compare every plan.',
  comparisonDescription:
    'Every capability is labelled as included, a paid extension or Enterprise scope.',
  comparisonLegend: 'Plan comparison legend',
  comparisonCaption: 'Detailed comparison of Launch, Business and Enterprise plans',
  capabilityHeading: 'Capability',
  planNames: ['Launch', 'Business', 'Enterprise'],
  scopeEyebrow: 'Commercial scope',
  scopeTitle: 'Costs quoted separately.',
  scopeDescription: 'Proposals separate platform, implementation and external costs.',
  financeTitle: 'Your revenue. Your control.',
  financeDescription: 'Route every payment to the right operating account.',
  questionsTitle: 'Questions',
  cards: [
    {
      name: 'Launch',
      label: 'Seasonal and cohort-ready',
      description: 'Launch polished booking and payment for one programme.',
      features: [
        'Public offer and booking journey',
        'Capacity, waitlist and deadlines',
        'Deposits or one-off payments',
        'Confirmation and reminder emails',
        'Programme closeout and exports',
      ],
      cta: 'Plan a launch',
      subject: 'launch',
    },
    {
      name: 'Business',
      label: 'Managed cloud',
      description: 'Run your complete academy in one managed service.',
      features: [
        'CRM and reservation workflows',
        'Academic and participant operations',
        'Virtual campus and teaching tools',
        'Payments, finance and automation',
        'Managed cloud operations',
      ],
      cta: 'Book a demo',
      subject: 'pricing',
    },
    {
      name: 'Enterprise',
      label: 'Dedicated or on-premise',
      description: 'Scale complex organisations on dedicated infrastructure or your own servers.',
      features: [
        'Multi-brand and multi-location model',
        'Custom domains and payment responsibility',
        'Dedicated private cloud or on-premise',
        'Migration and integration programme',
        'Contracted enterprise support',
      ],
      cta: 'Talk to Enterprise',
      subject: 'partnership',
    },
  ],
  financeCards: [
    {
      title: 'Stripe, PayPal and SEPA',
      text: 'Provider adapters can support card, wallet and direct-debit based payment journeys.',
    },
    {
      title: 'Deposits and instalments',
      text: 'Configure what is due at reservation, before a start date or on a recurring schedule.',
    },
    {
      title: 'Memberships and session packs',
      text: 'Support recurring access, class packs and renewal-oriented models.',
    },
    {
      title: 'Finance APIs and reconciliation',
      text: 'Prepare payment state for invoicing, accounting, banking or ERP workflows.',
    },
  ],
  faqs: [
    {
      question: 'Why are prices not listed?',
      answer: 'Every academy is scoped around its programmes, users and operating model.',
    },
    {
      question: 'Can Launch support a summer camp?',
      answer: 'Yes. Launch supports dates, capacity, booking, deposits and communication.',
    },
    {
      question: 'Can payments use Stripe, PayPal or SEPA?',
      answer: 'Provider adapters support Stripe, PayPal and SEPA where available.',
    },
    {
      question: 'Can Enterprise run on-premise?',
      answer: 'Yes. Enterprise can run on-premise or in a dedicated private cloud.',
    },
    {
      question: 'How does AI fit into a plan?',
      answer:
        'The MCP connection for your own AI client is free on every plan. The built-in Akademate assistant ships with a starter token quota and expands with additional token packs.',
    },
    {
      question: 'Are QR, NFC and Digital Signage included?',
      answer: 'Each is a paid extension. Hardware and licences are separate.',
    },
    {
      question: 'How do we buy an add-on?',
      answer:
        'Add-ons are scoped into your proposal. Once active, they appear in your navigation; nothing else changes in your data or workflows.',
    },
    {
      question: 'Who buys the hardware for access control or signage?',
      answer:
        'You do. Akademate provides the software layer and connects to your readers, cards and screens; hardware, installation and provider licences are billed separately.',
    },
    {
      question: 'Can we connect our own ChatGPT or Claude?',
      answer:
        'Yes. The MCP connection is free on every plan: connect your own AI client to permission-aware academy tools, and your existing AI subscription applies.',
    },
    {
      question: 'What is the Akademate AI assistant?',
      answer:
        'An assistant embedded in the side panel of your workspace. It includes a starter token quota, and you can expand it with additional token packs.',
    },
  ],
}

const spanishPageCopy: PricingPageCopy = {
  imageAlt: 'Espacio de trabajo de finanzas y contabilidad de Akademate en ordenador y tableta',
  proposal: 'Propuesta a medida',
  includedHeading: 'QUÉ INCLUYE',
  comparisonLink: 'Ver lista completa de inclusiones',
  proposalNote: 'Cada propuesta refleja tu escala, integraciones y modelo operativo.',
  extensionsEyebrow: 'Add-ons',
  extensionsTitle: 'Añade los módulos que necesitas.',
  extensionsDescription:
    'Añade módulos especializados mediante una extensión comercial con alcance independiente.',
  extensionLabel: 'Extensión de pago',
  comingSoonLabel: 'Próximamente',
  extraCosts: 'Costes adicionales:',
  deploymentEyebrow: 'Despliegue',
  deploymentTitle: 'Nuestra nube, una nube dedicada o tus propios servidores.',
  deploymentDescription:
    'Nube gestionada por defecto. Enterprise añade una nube privada dedicada o una instalación on-premise en tus propios servidores, con canales de actualización versionados y soporte contratado.',
  deploymentOptions: [
    {
      name: 'Nube gestionada',
      text: 'La nube estándar de Akademate: actualizaciones, copias de seguridad y monitorización gestionadas por nosotros.',
      tag: 'Todos los planes',
    },
    {
      name: 'Nube privada dedicada',
      text: 'Infraestructura aislada para tu organización, operada por Akademate.',
      tag: 'Enterprise',
    },
    {
      name: 'On-premise',
      text: 'Akademate instalado en tus propios servidores, con canales de actualización versionados y soporte contratado.',
      tag: 'Enterprise',
    },
  ],
  comparisonTitle: 'Compara todos los planes.',
  comparisonDescription:
    'Cada capacidad se indica como incluida, extensión de pago o alcance Enterprise.',
  comparisonLegend: 'Leyenda de comparación de planes',
  comparisonCaption: 'Comparación detallada de los planes Launch, Business y Enterprise',
  capabilityHeading: 'Capacidad',
  planNames: ['Launch', 'Business', 'Enterprise'],
  scopeEyebrow: 'Alcance comercial',
  scopeTitle: 'Costes presupuestados por separado.',
  scopeDescription: 'Las propuestas separan los costes de plataforma, implementación y terceros.',
  financeTitle: 'Tus ingresos. Tu control.',
  financeDescription: 'Dirige cada pago a la cuenta operativa adecuada.',
  questionsTitle: 'Preguntas',
  cards: [
    {
      name: 'Launch',
      label: 'Listo para temporadas y cohortes',
      description: 'Lanza reservas y pagos cuidados para un programa.',
      features: [
        'Oferta pública y recorrido de reserva',
        'Capacidad, lista de espera y plazos',
        'Depósitos o pagos únicos',
        'Emails de confirmación y recordatorio',
        'Cierre y exportaciones del programa',
      ],
      cta: 'Planificar un lanzamiento',
      subject: 'launch',
    },
    {
      name: 'Business',
      label: 'Nube gestionada',
      description: 'Gestiona tu academia completa en un único servicio administrado.',
      features: [
        'CRM y flujos de reservas',
        'Operaciones académicas y de participantes',
        'Campus virtual y herramientas docentes',
        'Pagos, finanzas y automatización',
        'Operación en nube gestionada',
      ],
      cta: 'Reservar una demo',
      subject: 'pricing',
    },
    {
      name: 'Enterprise',
      label: 'Dedicado o local',
      description: 'Escala organizaciones complejas sobre infraestructura dedicada o en tus propios servidores.',
      features: [
        'Modelo multimarca y multisede',
        'Dominios propios y responsabilidad de pagos',
        'Nube privada dedicada o local',
        'Programa de migración e integración',
        'Soporte Enterprise contratado',
      ],
      cta: 'Hablar con Enterprise',
      subject: 'partnership',
    },
  ],
  financeCards: [
    {
      title: 'Stripe, PayPal y SEPA',
      text: 'Los adaptadores de proveedores pueden admitir recorridos de pago con tarjeta, cartera y domiciliación.',
    },
    {
      title: 'Depósitos y pagos fraccionados',
      text: 'Configura lo que vence al reservar, antes de una fecha de inicio o en un calendario recurrente.',
    },
    {
      title: 'Membresías y bonos de sesiones',
      text: 'Admite acceso recurrente, bonos de clases y modelos orientados a renovación.',
    },
    {
      title: 'APIs financieras y conciliación',
      text: 'Prepara el estado de pago para flujos de facturación, contabilidad, banca o ERP.',
    },
  ],
  faqs: [
    {
      question: '¿Por qué no se publican los precios?',
      answer: 'Cada academia se presupuesta según sus programas, usuarios y modelo operativo.',
    },
    {
      question: '¿Puede Launch cubrir un campamento de verano?',
      answer: 'Sí. Launch admite fechas, capacidad, reservas, depósitos y comunicación.',
    },
    {
      question: '¿Los pagos pueden usar Stripe, PayPal o SEPA?',
      answer:
        'Los adaptadores de proveedores admiten Stripe, PayPal y SEPA donde estén disponibles.',
    },
    {
      question: '¿Puede Enterprise ejecutarse en local?',
      answer: 'Sí. Enterprise puede ejecutarse en local o en una nube privada dedicada.',
    },
    {
      question: '¿Cómo encaja la IA en un plan?',
      answer:
        'La conexión MCP para tu propio cliente de IA es gratuita en todos los planes. El asistente integrado de Akademate incluye una cuota inicial de tokens ampliable con packs adicionales.',
    },
    {
      question: '¿Se incluyen QR, NFC y Digital Signage?',
      answer:
        'Cada uno es una extensión de pago. El hardware y las licencias se presupuestan por separado.',
    },
    {
      question: '¿Cómo se contrata un add-on?',
      answer:
        'Los add-ons se incluyen en tu propuesta. Una vez activos, aparecen en tu navegación; tus datos y flujos no cambian.',
    },
    {
      question: '¿Quién compra el hardware de control de accesos o signage?',
      answer:
        'Tú. Akademate aporta la capa de software y se conecta a tus lectores, tarjetas y pantallas; el hardware, la instalación y las licencias del proveedor se presupuestan aparte.',
    },
    {
      question: '¿Podemos conectar nuestro propio ChatGPT o Claude?',
      answer:
        'Sí. La conexión MCP es gratuita en todos los planes: conecta tu cliente de IA a las herramientas de la academia con permisos, y se aplica tu suscripción de IA existente.',
    },
    {
      question: '¿Qué es el asistente de IA de Akademate?',
      answer:
        'Un asistente integrado en el panel lateral de tu espacio de trabajo. Incluye una cuota inicial de tokens, ampliable con packs adicionales.',
    },
  ],
}

const spanishEntitlements: Record<PlanEntitlement, string> = {
  included: 'Incluido',
  'paid-extension': 'Extensión de pago',
  'enterprise-scope': 'Alcance Enterprise',
  'not-included': 'No incluido',
}

const spanishSections: Record<string, { title: string; description: string }> = {
  'Website, catalogue and enrolment': {
    title: 'Web, catálogo y matriculación',
    description: 'Publica ofertas y convierte el interés en participación confirmada.',
  },
  'Growth, CRM and admissions': {
    title: 'Crecimiento, CRM y admisiones',
    description: 'Capta, cualifica y convierte demanda a lo largo de la admisión.',
  },
  'Academy operations and people': {
    title: 'Operación de la academia y personas',
    description: 'Coordina programas, personas, horarios y ubicaciones.',
  },
  'Virtual campus and learning': {
    title: 'Campus virtual y aprendizaje',
    description: 'Ofrece contenido, docencia, feedback y progreso.',
  },
  'Payments and financial control': {
    title: 'Pagos y control financiero',
    description: 'Conecta cobros, saldos de participantes e informes operativos.',
  },
  'Platform, security and service': {
    title: 'Plataforma, seguridad y servicio',
    description: 'Elige el modelo operativo, de integración y soporte.',
  },
  'Paid operational extensions': {
    title: 'Extensiones operativas de pago',
    description: 'Módulos especializados añadidos a cualquier alcance comercial elegible.',
  },
}

const spanishCapabilities: Record<string, string> = {
  'Akademate subdomain': 'Subdominio de Akademate',
  'Shareable course and event pages': 'Páginas compartibles de cursos y eventos',
  'Registration, capacity and waitlists': 'Inscripción, capacidad y listas de espera',
  'Embedded forms and payments': 'Formularios y pagos integrados',
  'Complete academy website and CMS': 'Web completa de la academia y CMS',
  'Custom domain connection': 'Conexión de dominio propio',
  'Blog, SEO and social previews': 'Blog, SEO y vistas previas sociales',
  'Lead capture and source tracking': 'Captación de leads y seguimiento de origen',
  'Reservations and admissions workflow': 'Flujo de reservas y admisiones',
  'CRM pipeline and team assignment': 'Embudo CRM y asignación de equipo',
  'Confirmations and operational reminders': 'Confirmaciones y recordatorios operativos',
  'Workflow automation': 'Automatización de flujos',
  'Campaign attribution and growth dashboard': 'Atribución de campañas y panel de crecimiento',
  'Meta Ads and Google Ads connectors': 'Conectores de Meta Ads y Google Ads',
  'Campaign landing pages': 'Landings de campaña',
  'Bring-your-own AI via MCP': 'Tu propia IA vía MCP',
  'AI assistant and automation': 'Asistente de IA y automatización',
  'Courses, cohorts and schedules': 'Cursos, cohortes y horarios',
  'Participant and learner records': 'Fichas de participantes y alumnos',
  'Teacher and staff workspaces': 'Espacios de trabajo docente y de personal',
  'Core attendance and capacity': 'Asistencia y capacidad básicas',
  'Roles and permission workspaces': 'Roles y espacios de permisos',
  'Multiple campuses': 'Múltiples centros',
  'Multi-brand and multi-entity operations': 'Operación multimarca y multientidad',
  'Virtual learner campus': 'Campus virtual del alumno',
  'Teacher course workspace': 'Espacio docente del curso',
  'Lessons and learning materials': 'Lecciones y materiales de aprendizaje',
  'Assignments, assessments and grades': 'Tareas, evaluaciones y calificaciones',
  'Teacher and learner chat': 'Chat entre docentes y alumnos',
  'Certificates and progress records': 'Certificados y registros de progreso',
  'Live video-class integrations': 'Integraciones de clases de vídeo en directo',
  'Checkout and one-off payments': 'Checkout y pagos únicos',
  'Deposits and payment deadlines': 'Depósitos y fechas límite de pago',
  'Instalments and subscriptions': 'Pagos fraccionados y suscripciones',
  'Memberships and session packs': 'Membresías y bonos de sesiones',
  'Receivables and finance reporting': 'Cobros pendientes e informes financieros',
  'Stripe, PayPal and SEPA adapters': 'Adaptadores de Stripe, PayPal y SEPA',
  'Accounting, banking and ERP connectors': 'Conectores contables, bancarios y ERP',
  'Managed cloud service': 'Servicio en nube gestionada',
  'Core operational analytics': 'Analítica operativa básica',
  'Standard onboarding': 'Onboarding estándar',
  'API and webhooks': 'API y webhooks',
  'Dedicated private cloud or on-premise': 'Nube privada dedicada o local',
  'SSO, audit and contracted security controls':
    'SSO, auditoría y controles de seguridad contratados',
  'Migration and custom integration programme': 'Programa de migración e integración personalizada',
  'QR attendance and mobile check-in': 'Asistencia QR y check-in móvil',
  'NFC and RFID identities': 'Identidades NFC y RFID',
  'Physical access readers and sensors': 'Lectores y sensores de acceso físico',
  'Digital Signage': 'Digital Signage',
  'Advanced finance and accounting': 'Finanzas y contabilidad avanzadas',
  'HR and workforce management': 'RR. HH. y gestión de personal',
  'Library, inventory and facilities': 'Biblioteca, inventario e instalaciones',
  'AI workspace and MCP': 'Espacio de trabajo de IA y MCP',
}

const spanishNotes: Record<string, string> = {
  'Domain registration and third-party DNS services are billed separately.':
    'El registro del dominio y los servicios DNS de terceros se facturan por separado.',
  'Advertising spend and provider fees remain separate.':
    'La inversión publicitaria y las tarifas de proveedores se mantienen separadas.',
  'Video-provider licences are billed by the provider.':
    'Las licencias del proveedor de vídeo las factura el proveedor.',
  'Processor onboarding and transaction fees are separate.':
    'El onboarding del procesador y las comisiones por transacción son independientes.',
  'Holded, Xero and QuickBooks are coming soon; provider subscriptions, transaction fees and bespoke mapping are separate.':
    'Holded, Xero y QuickBooks llegarán próximamente; las suscripciones, comisiones por transacción y mapeos a medida del proveedor son independientes.',
  'Connect your own ChatGPT or Claude; your AI provider subscription applies.':
    'Conecta tu propio ChatGPT o Claude; se aplica tu suscripción de proveedor de IA.',
  'Includes a starter token quota; expansion packs are quoted separately.':
    'Incluye una cuota inicial de tokens; los packs de ampliación se presupuestan por separado.',
  'Hardware, installation and provider licences are separate.':
    'El hardware, la instalación y las licencias de proveedor son independientes.',
  'Screens, players, installation and external licences are separate.':
    'Las pantallas, reproductores, instalación y licencias externas son independientes.',
  'Model and AI-provider usage is billed separately where applicable.':
    'El uso de modelos y proveedores de IA se factura por separado cuando corresponda.',
}

const spanishExtensions: Record<
  string,
  {
    title: string
    summary: string
    metering: string
    includes: readonly string[]
    service?: string
    separateCosts: string
  }
> = {
  access: {
    title: 'Asistencia y acceso físico',
    summary: 'Conecta las llegadas con los registros de alumnos, clases y centros.',
    metering: 'Por puerta o lector conectado, mensual',
    includes: ['Check-in móvil QR', 'Identidades NFC y RFID', 'Adaptadores de lectores y sensores'],
    separateCosts: 'Hardware y licencias.',
  },
  signage: {
    title: 'Digital Signage',
    summary: 'Programa comunicaciones de la academia en cada centro.',
    metering: 'Por pantalla conectada, mensual',
    includes: [
      'Calendarios y horarios de salas',
      'Avisos y promociones',
      'Monitorización del estado de pantallas',
    ],
    separateCosts: 'Pantallas, reproductores e instalación.',
  },
  growth: {
    title: 'Crecimiento y anuncios',
    summary: 'Conecta señales de campaña con leads, solicitudes y matrículas.',
    metering: 'Por sede, mensual',
    includes: [
      'Conectores de Meta y Google',
      'Landings de campaña con atribución UTM',
      'Panel de atribución',
      'Flujos de campaña',
    ],
    service: '¿Quieres que te construyamos las landings de campaña? Pide presupuesto.',
    separateCosts: 'Inversión en medios y tarifas de plataforma.',
  },
  finance: {
    title: 'Finanzas y contabilidad avanzadas',
    summary: 'Amplía la facturación de la academia hacia contabilidad y conciliación.',
    metering: 'Por sede, mensual',
    includes: [
      'Libro mayor y centros de coste',
      'Conciliación bancaria',
      'Adaptadores contables y ERP',
    ],
    separateCosts: 'Suscripciones de contabilidad.',
  },
  workforce: {
    title: 'RR. HH. y personal',
    summary: 'Coordina contratos, disponibilidad, carga de trabajo e inputs de nómina.',
    metering: 'Por asiento de personal, mensual',
    includes: ['Fichas de personal', 'Carga de trabajo y sustituciones', 'Preparación de nómina'],
    separateCosts: 'Servicios e integraciones de nómina.',
  },
  resources: {
    title: 'Biblioteca, inventario e instalaciones',
    summary: 'Gestiona recursos de aprendizaje, equipos y espacios compartidos.',
    metering: 'Por sede, mensual',
    includes: [
      'Biblioteca y préstamos',
      'Inventario y equipamiento',
      'Instalaciones y mantenimiento',
    ],
    separateCosts: 'Etiquetas, escáneres y equipos.',
  },
  agentic: {
    title: 'Espacio de trabajo de IA y MCP',
    summary:
      'Conecta tu propia IA mediante una conexión MCP gratuita, o usa el asistente integrado con una cuota inicial incluida.',
    metering: 'Cuota de IA inicial incluida; ampliable con packs de tokens',
    includes: [
      'Conexión MCP gratuita para tu cliente de IA',
      'Asistente de Akademate en el panel lateral',
      'Acciones con aprobación',
    ],
    separateCosts: 'Packs de ampliación de tokens de IA opcionales.',
  },
  implementation: {
    title: 'Migración e integraciones personalizadas',
    summary: 'Mueve datos y conecta sistemas especializados mediante un programa acotado.',
    metering: 'Presupuestado por programa',
    includes: [
      'Mapeo de datos',
      'Ensayos de migración conciliados',
      'Adaptadores API personalizados',
    ],
    separateCosts: 'Limpieza de datos y desarrollo.',
  },
}

const spanishSeparateCosts: Record<string, string> = {
  'Payment-provider transaction and account fees':
    'Comisiones de transacción y cuenta del proveedor de pagos',
  'Advertising spend and external campaign production':
    'Inversión publicitaria y producción externa de campañas',
  'Domains, messaging, video and third-party software licences':
    'Dominios, mensajería, vídeo y licencias de software de terceros',
  'Access-control hardware, cards, readers, sensors and installation':
    'Hardware de control de acceso, tarjetas, lectores, sensores e instalación',
  'Digital Signage screens, players, mounting and installation':
    'Pantallas, reproductores, montaje e instalación de Digital Signage',
  'Custom migration, data remediation and bespoke integration work':
    'Migración personalizada, remediación de datos e integración a medida',
}

function required<T>(value: T | undefined, key: string): T {
  if (value === undefined || value === '')
    throw new Error(`Missing Spanish pricing translation: ${key}`)
  return value
}

export type PricingCatalogueSource = {
  sections: readonly PlanComparisonSection[]
  extensions: typeof paidExtensions
  separatelyBilledItems: readonly string[]
}

export const pricingCatalogueSource: PricingCatalogueSource = {
  sections: planComparisonSections,
  extensions: paidExtensions,
  separatelyBilledItems,
}

function assertEntitlement(value: string, capability: string): asserts value is PlanEntitlement {
  if (!(value in entitlementLabels)) {
    throw new Error(`Invalid pricing entitlement for ${capability}: ${value}`)
  }
}

export function getPricingContent(
  locale: Locale,
  source: PricingCatalogueSource = pricingCatalogueSource
) {
  const spanish = locale === 'es'
  const page = spanish ? spanishPageCopy : englishPageCopy
  const labels = spanish ? spanishEntitlements : entitlementLabels
  const sections: readonly PlanComparisonSection[] = source.sections.map((section) => {
    const translatedSection = spanish
      ? required(spanishSections[section.title], section.title)
      : section
    return {
      title: translatedSection.title,
      description: translatedSection.description,
      rows: section.rows.map((row) => ({
        ...(() => {
          assertEntitlement(row.launch, row.capability)
          assertEntitlement(row.business, row.capability)
          assertEntitlement(row.enterprise, row.capability)
          return {}
        })(),
        capability: spanish
          ? required(spanishCapabilities[row.capability], row.capability)
          : row.capability,
        launch: row.launch,
        business: row.business,
        enterprise: row.enterprise,
        note: row.note
          ? spanish
            ? required(spanishNotes[row.note], row.note)
            : row.note
          : undefined,
      })),
    }
  })
  const extensions = source.extensions.map((extension) => {
    const translated = spanish ? required(spanishExtensions[extension.id], extension.id) : extension
    return { ...extension, ...translated }
  })

  return {
    page,
    entitlementLabels: labels,
    sections,
    extensions,
    separatelyBilledItems: spanish
      ? source.separatelyBilledItems.map((item) => required(spanishSeparateCosts[item], item))
      : source.separatelyBilledItems,
  }
}
