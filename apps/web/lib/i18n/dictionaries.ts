import type { Locale } from '@/lib/i18n/routing'

type Dictionary = {
  language: { label: string; english: string; spanish: string }
  navigation: {
    features: string
    solutions: string
    pricing: string
    blog: string
    news: string
    download: string
    company: string
    contact: string
  }
  header: {
    skipToContent: string
    bookDemo: string
    openMenu: string
    closeMenu: string
    chooseLanguage: string
    exploreCustomers: string
  }
  footer: {
    product: string
    company: string
    legal: string
    reservations: string
    whoItsFor: string
    downloadApps: string
    socialMedia: string
    socialLabel: string
    description: string
    statement: string
    detail: string
    rights: string
    governance: string
  }
  home: { eyebrow: string; title: string; description: string; primaryCta: string; secondaryCta: string }
  features: { eyebrow: string; title: string; description: string; primaryCta: string; secondaryCta: string }
  pricing: { eyebrow: string; title: string; description: string; primaryCta: string }
  solutions: { eyebrow: string; title: string; description: string }
  contact: {
    eyebrow: string
    title: string
    description: string
    formTitle: string
    formDescription: string
    loadingForm: string
  }
}

export const dictionaries: Record<Locale, Dictionary> = {
  en: {
    language: { label: 'Language', english: 'English', spanish: 'Spanish' },
    navigation: {
      features: 'Features', solutions: "Who it’s for", pricing: 'Pricing', blog: 'Blog', news: 'News', download: 'Download', company: 'Company', contact: 'Contact',
    },
    header: { skipToContent: 'Skip to content', bookDemo: 'Book a demo', openMenu: 'Open menu', closeMenu: 'Close menu', chooseLanguage: 'Choose language', exploreCustomers: 'Explore every customer type' },
    footer: {
      product: 'Product', company: 'Company', legal: 'Legal', reservations: 'Reservations', whoItsFor: "Who it’s for", downloadApps: 'Download apps', socialMedia: 'Akademate social media', socialLabel: 'find Akademate',
      description: 'Turn demand into enrolment, programmes into standout experiences and everyday operations into lasting growth.',
      statement: 'Run a better academy. Create a better experience for everyone in it.',
      detail: 'Akademate brings growth, operations, learning and finance into one connected rhythm.',
      rights: 'All rights reserved.', governance: 'Legal information is maintained as part of our product governance programme.',
    },
    home: { eyebrow: 'One connected platform for every academy team', title: 'Run your academy. Grow every experience.', description: 'Bring enrolment, teaching, payments and performance into one operating system.', primaryCta: 'Book a demo', secondaryCta: 'Explore the platform' },
    features: { eyebrow: 'The academy operating platform', title: 'Every academy workflow, connected.', description: 'Give directors, staff, teachers and learners the tools they need in one platform.', primaryCta: 'Book a demo', secondaryCta: 'Compare plans' },
    pricing: { eyebrow: 'Plans shaped around your operation', title: 'A clear operating scope for every stage.', description: 'Launch a programme, run a growing academy or coordinate an enterprise network.', primaryCta: 'Book a demo' },
    solutions: { eyebrow: 'Built around your academy', title: 'Your model. Your workflows. One platform.', description: 'Shape Akademate around the programmes, people and places that make your academy distinctive.' },
    contact: { eyebrow: 'Let’s build your next chapter', title: 'See your academy differently.', description: 'Tell us your goals. We’ll shape the walkthrough around them.', formTitle: 'Book your walkthrough', formDescription: 'Share a little context and we’ll make the conversation immediately useful.', loadingForm: 'Loading form…' },
  },
  es: {
    language: { label: 'Idioma', english: 'Inglés', spanish: 'Español' },
    navigation: {
      features: 'Funciones', solutions: 'Para quién es', pricing: 'Precios', blog: 'Blog', news: 'Novedades', download: 'Descargar', company: 'Empresa', contact: 'Contacto',
    },
    header: { skipToContent: 'Saltar al contenido', bookDemo: 'Reservar una demo', openMenu: 'Abrir menú', closeMenu: 'Cerrar menú', chooseLanguage: 'Elegir idioma', exploreCustomers: 'Explora cada tipo de centro' },
    footer: {
      product: 'Producto', company: 'Empresa', legal: 'Legal', reservations: 'Reservas', whoItsFor: 'Para quién es', downloadApps: 'Descargar aplicaciones', socialMedia: 'Redes sociales de Akademate', socialLabel: 'encuentra Akademate',
      description: 'Convierte la demanda en matrículas, los programas en experiencias destacadas y la operación diaria en crecimiento sostenible.',
      statement: 'Gestiona una academia mejor. Crea una experiencia mejor para todos.',
      detail: 'Akademate conecta crecimiento, operaciones, aprendizaje y finanzas en un mismo ritmo.',
      rights: 'Todos los derechos reservados.', governance: 'La información legal se mantiene dentro de nuestro programa de gobierno de producto.',
    },
    home: { eyebrow: 'Una plataforma conectada para todo el equipo', title: 'Gestiona tu academia. Haz crecer cada experiencia.', description: 'Conecta matrículas, enseñanza, pagos y rendimiento en un único sistema operativo.', primaryCta: 'Reservar una demo', secondaryCta: 'Explorar la plataforma' },
    features: { eyebrow: 'La plataforma operativa para academias', title: 'Cada flujo de tu academia, conectado.', description: 'Ofrece a dirección, personal, profesores y alumnos las herramientas que necesitan en una sola plataforma.', primaryCta: 'Reservar una demo', secondaryCta: 'Comparar planes' },
    pricing: { eyebrow: 'Planes adaptados a tu operación', title: 'Un alcance operativo claro para cada etapa.', description: 'Lanza un programa, gestiona una academia en crecimiento o coordina una red empresarial.', primaryCta: 'Reservar una demo' },
    solutions: { eyebrow: 'Construido para tu academia', title: 'Tu modelo. Tus flujos. Una plataforma.', description: 'Configura Akademate en torno a los programas, las personas y los espacios que hacen única tu academia.' },
    contact: { eyebrow: 'Construyamos tu siguiente etapa', title: 'Mira tu academia de otra manera.', description: 'Cuéntanos tus objetivos. Prepararemos la demo para ellos.', formTitle: 'Reserva tu recorrido', formDescription: 'Comparte un poco de contexto y haremos que la conversación sea útil desde el inicio.', loadingForm: 'Cargando formulario…' },
  },
}

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale]
}
