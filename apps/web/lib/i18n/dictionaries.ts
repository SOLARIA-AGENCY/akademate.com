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
    primaryNavigation: string
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
  home: {
    eyebrow: string
    title: string
    description: string
    primaryCta: string
    secondaryCta: string
  }
  features: {
    eyebrow: string
    title: string
    description: string
    primaryCta: string
    secondaryCta: string
  }
  pricing: { eyebrow: string; title: string; description: string; primaryCta: string }
  solutions: { eyebrow: string; title: string; description: string }
  contact: {
    eyebrow: string
    title: string
    description: string
    formTitle: string
    formDescription: string
    loadingForm: string
    imageAlt: string
    goalsTitle: string
    goalsText: string
    peopleTitle: string
    peopleText: string
    emailTitle: string
    emailText: string
    name: string
    email: string
    phone: string
    phoneOptional: string
    subject: string
    message: string
    subjectPlaceholder: string
    subjects: Record<
      'demo' | 'pricing' | 'support' | 'partnership' | 'privacy' | 'trial' | 'other',
      string
    >
    privacyPrefix: string
    privacyLink: string
    privacySuffix: string
    marketingNotice: string
    submit: string
    sending: string
    privacyRequired: string
    success: string
    requestFailed: string
    website: string
  }
  trial: {
    eyebrow: string
    title: string
    description: string
    formTitle: string
    formDescription: string
  }
}

export const dictionaries: Record<Locale, Dictionary> = {
  en: {
    language: { label: 'Language', english: 'English', spanish: 'Spanish' },
    navigation: {
      features: 'Features',
      solutions: 'Who it’s for',
      pricing: 'Pricing',
      blog: 'Blog',
      news: 'News',
      download: 'Download',
      company: 'Company',
      contact: 'Contact',
    },
    header: {
      skipToContent: 'Skip to content',
      bookDemo: 'Book a demo',
      openMenu: 'Open menu',
      closeMenu: 'Close menu',
      chooseLanguage: 'Choose language',
      exploreCustomers: 'Explore every customer type',
      primaryNavigation: 'Primary navigation',
    },
    footer: {
      product: 'Product',
      company: 'Company',
      legal: 'Legal',
      reservations: 'Reservations',
      whoItsFor: 'Who it’s for',
      downloadApps: 'Download apps',
      socialMedia: 'Akademate social media',
      socialLabel: 'find Akademate',
      description:
        'Turn demand into enrolment, programmes into standout experiences and everyday operations into lasting growth.',
      statement: 'Run a better academy. Create a better experience for everyone in it.',
      detail:
        'Akademate brings growth, operations, learning and finance into one connected rhythm.',
      rights: 'All rights reserved.',
      governance: 'Legal information is maintained as part of our product governance programme.',
    },
    home: {
      eyebrow: 'One connected platform for every academy team',
      title: 'Run your academy. Grow.',
      description: 'Bring enrolment, teaching, payments and performance into one operating system.',
      primaryCta: 'Book a demo',
      secondaryCta: 'Explore the platform',
    },
    features: {
      eyebrow: 'The academy operating platform',
      title: 'Your academy, connected.',
      description: 'Equip every academy role in one platform.',
      primaryCta: 'Book a demo',
      secondaryCta: 'Compare plans',
    },
    pricing: {
      eyebrow: 'Plans shaped around your operation',
      title: 'A clear operating scope for every stage.',
      description: 'Choose the scope for your academy today and tomorrow.',
      primaryCta: 'Book a demo',
    },
    solutions: {
      eyebrow: 'Built around your academy',
      title: 'Your academy. One platform.',
      description: 'Connect your programmes, people and places.',
    },
    contact: {
      eyebrow: 'Let’s build your next chapter',
      title: 'See your academy differently.',
      description: 'Tell us your goals. We’ll shape the walkthrough around them.',
      formTitle: 'Book your walkthrough',
      formDescription: 'Share a little context and we’ll make the conversation immediately useful.',
      loadingForm: 'Loading form…',
      imageAlt:
        'Akademate implementation planner for academy setup, locations, payments, learner experience and domain launch',
      goalsTitle: 'Start with your goals',
      goalsText: 'Grow enrolment, delivery, retention or multi-site operations.',
      peopleTitle: 'Bring the people who matter',
      peopleText: 'Invite leaders from operations, education, finance, technology or growth.',
      emailTitle: 'Prefer email?',
      emailText: 'Write to info@akademate.com',
      name: 'Full name',
      email: 'Email',
      phone: 'Phone',
      phoneOptional: 'optional',
      subject: 'What would you like to discuss?',
      message: 'Tell us about your academy',
      subjectPlaceholder: 'Select a topic',
      subjects: {
        demo: 'Product demo',
        pricing: 'Plans and commercial scope',
        support: 'Customer support',
        partnership: 'Enterprise or partnership',
        privacy: 'Privacy',
        trial: 'Free trial',
        other: 'Other',
      },
      privacyPrefix: 'I accept the',
      privacyLink: 'privacy policy',
      privacySuffix: 'so Akademate can respond to this request.',
      marketingNotice: 'Marketing consent is not selected.',
      submit: 'Send request',
      sending: 'Sending…',
      privacyRequired: 'Please accept the privacy policy before sending your request.',
      success: 'Thanks. Your request has been received.',
      requestFailed: 'We could not send your request.',
      website: 'Website',
    },
    trial: {
      eyebrow: 'Free trial',
      title: 'Start your academy on Akademate.',
      description:
        'Open a trial for your academy model. We will set the walkthrough around your programmes, people and sites.',
      formTitle: 'Create your free trial',
      formDescription: 'Share a little context. We will open the trial around your vertical.',
    },
  },
  es: {
    language: { label: 'Idioma', english: 'Inglés', spanish: 'Español' },
    navigation: {
      features: 'Funciones',
      solutions: 'Para quién es',
      pricing: 'Precios',
      blog: 'Blog',
      news: 'Novedades',
      download: 'Descargar',
      company: 'Empresa',
      contact: 'Contacto',
    },
    header: {
      skipToContent: 'Saltar al contenido',
      bookDemo: 'Reservar una demo',
      openMenu: 'Abrir menú',
      closeMenu: 'Cerrar menú',
      chooseLanguage: 'Elegir idioma',
      exploreCustomers: 'Explora cada tipo de centro',
      primaryNavigation: 'Navegación principal',
    },
    footer: {
      product: 'Producto',
      company: 'Empresa',
      legal: 'Legal',
      reservations: 'Reservas',
      whoItsFor: 'Para quién es',
      downloadApps: 'Descargar aplicaciones',
      socialMedia: 'Redes sociales de Akademate',
      socialLabel: 'encuentra Akademate',
      description:
        'Convierte la demanda en matrículas, los programas en experiencias destacadas y la operación diaria en crecimiento sostenible.',
      statement: 'Gestiona una academia mejor. Crea una experiencia mejor para todos.',
      detail:
        'Akademate conecta crecimiento, operaciones, aprendizaje y finanzas en un mismo ritmo.',
      rights: 'Todos los derechos reservados.',
      governance:
        'La información legal se mantiene dentro de nuestro programa de gobierno de producto.',
    },
    home: {
      eyebrow: 'Una plataforma conectada para todo el equipo',
      title: 'Gestiona tu academia. Crece.',
      description:
        'Conecta matrículas, enseñanza, pagos y rendimiento en un único sistema operativo.',
      primaryCta: 'Reservar una demo',
      secondaryCta: 'Explorar la plataforma',
    },
    features: {
      eyebrow: 'La plataforma operativa para academias',
      title: 'Tu academia, conectada.',
      description: 'Un espacio conectado para cada rol de tu academia.',
      primaryCta: 'Reservar una demo',
      secondaryCta: 'Comparar planes',
    },
    pricing: {
      eyebrow: 'Planes adaptados a tu operación',
      title: 'Un alcance operativo claro para cada etapa.',
      description: 'Elige el alcance adecuado para tu academia hoy y mañana.',
      primaryCta: 'Reservar una demo',
    },
    solutions: {
      eyebrow: 'Construido para tu academia',
      title: 'Tu academia. Una plataforma.',
      description: 'Conecta tus programas, personas y espacios.',
    },
    contact: {
      eyebrow: 'Construyamos tu siguiente etapa',
      title: 'Mira tu academia de otra manera.',
      description: 'Cuéntanos tus objetivos. Prepararemos la demo para ellos.',
      formTitle: 'Reserva tu recorrido',
      formDescription:
        'Comparte un poco de contexto y haremos que la conversación sea útil desde el inicio.',
      loadingForm: 'Cargando formulario…',
      imageAlt:
        'Planificador de implantación de Akademate para configurar la academia, sedes, pagos, experiencia del alumnado y dominio',
      goalsTitle: 'Empieza por tus objetivos',
      goalsText: 'Impulsa matrículas, enseñanza, retención u operaciones multisede.',
      peopleTitle: 'Reúne a las personas clave',
      peopleText:
        'Invita a responsables de operaciones, educación, finanzas, tecnología o crecimiento.',
      emailTitle: '¿Prefieres escribirnos?',
      emailText: 'Escribe a info@akademate.com',
      name: 'Nombre completo',
      email: 'Correo electrónico',
      phone: 'Teléfono',
      phoneOptional: 'opcional',
      subject: '¿Sobre qué te gustaría hablar?',
      message: 'Cuéntanos sobre tu academia',
      subjectPlaceholder: 'Selecciona un tema',
      subjects: {
        demo: 'Demo de producto',
        pricing: 'Planes y alcance comercial',
        support: 'Atención al cliente',
        partnership: 'Enterprise o colaboración',
        privacy: 'Privacidad',
        trial: 'Prueba gratis',
        other: 'Otro',
      },
      privacyPrefix: 'Acepto la',
      privacyLink: 'política de privacidad',
      privacySuffix: 'para que Akademate pueda responder a esta solicitud.',
      marketingNotice: 'No se ha seleccionado consentimiento de marketing.',
      submit: 'Enviar solicitud',
      sending: 'Enviando…',
      privacyRequired: 'Acepta la política de privacidad antes de enviar tu solicitud.',
      success: 'Gracias. Hemos recibido tu solicitud.',
      requestFailed: 'No hemos podido enviar tu solicitud.',
      website: 'Sitio web',
    },
    trial: {
      eyebrow: 'Prueba gratis',
      title: 'Empieza tu academia en Akademate.',
      description:
        'Abre una prueba para tu modelo de academia. Prepararemos el recorrido alrededor de tus programas, personas y sedes.',
      formTitle: 'Crea tu prueba gratis',
      formDescription: 'Comparte un poco de contexto. Abriremos la prueba alrededor de tu vertical.',
    },
  },
}

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale]
}
