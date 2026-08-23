import type { Locale } from '@/lib/i18n/routing'

export type AppDownloadId = 'mac' | 'iphone' | 'ipad'

type SecondaryPublicContent = {
  company: {
    metadata: { title: string; description: string }
    kicker: string
    title: string
    description: string
    cta: string
    imageAlt: string
    whyWeExist: string
    sectionTitle: string
    principles: readonly { title: string; text: string }[]
  }
  courses: {
    metadata: { title: string; description: string }
    kicker: string
    title: string
    description: string
    detail: string
    cta: string
  }
  download: {
    metadata: { title: string; description: string }
    comingSoon: string
    heroKicker: string
    title: string
    description: string
    imageAlt: string
    roadmap: string
    roadmapTitle: string
    roadmapDescription: string
    roadmapCta: string
  }
  apps: {
    kicker: string
    title: string
    description: string
    roadmapLink: string
    tabListLabel: string
    previewOnly: string
    options: readonly {
      id: AppDownloadId
      label: string
      title: string
      description: string
      image: string
      imageAlt: string
      capabilities: readonly string[]
      status: string
    }[]
  }
}

export const secondaryPublicContent: Record<Locale, SecondaryPublicContent> = {
  en: {
    company: {
      metadata: {
        title: 'Company',
        description:
          'Meet Akademate, the academy operating system built to create better learning businesses and better learner experiences.',
      },
      kicker: 'Meet Akademate',
      title: 'Built for academy growth.',
      description: 'Akademate connects growth, learning and daily operations.',
      cta: 'Build the future with us',
      imageAlt:
        'Akademate product blueprint connecting websites, admissions, courses, campus, finance and insights',
      whyWeExist: 'Why we exist',
      sectionTitle: 'Better operations. More space for teaching.',
      principles: [
        {
          title: 'Operate with context',
          text: 'Connect the decisions, people and learner journeys behind the academy.',
        },
        {
          title: 'One system, clear responsibility',
          text: 'Bring teams together while keeping roles and organisational boundaries meaningful.',
        },
        {
          title: 'Automate the work around teaching',
          text: 'Automate repetitive work with clear human oversight.',
        },
      ],
    },
    courses: {
      metadata: {
        title: 'Course discovery and academy catalogues',
        description:
          'Discover how Akademate helps each academy publish programmes, dates, places and booking journeys.',
      },
      kicker: 'Academy-powered catalogues',
      title: 'Turn programmes into enrolment.',
      description: 'Publish courses, schedules and bookings in one academy space.',
      detail:
        'Looking for a specific course? Visit the academy that provides it. Planning your own catalogue? We’ll show you how discovery, admissions, payments and learning delivery connect in one operating flow.',
      cta: 'See the catalogue experience',
    },
    download: {
      metadata: {
        title: 'Download Akademate apps',
        description:
          'Use Akademate in the browser today. Native Mac, iPhone and iPad apps are on the product roadmap.',
      },
      comingSoon: 'Coming soon',
      heroKicker: 'Web workspace today',
      title: 'Akademate on every screen.',
      description: 'Use Akademate in the browser today. Native apps sit on the product roadmap.',
      imageAlt: 'Future Akademate experiences presented across laptop, tablet and smartphone',
      roadmap: 'Product roadmap',
      roadmapTitle: 'Bring Akademate to your academy.',
      roadmapDescription: 'Talk to us about web access today and native app priorities.',
      roadmapCta: 'Discuss your workflow',
    },
    apps: {
      kicker: 'A workspace for every screen',
      title: 'Akademate apps are coming.',
      description: 'Native experiences for academy teams, teachers and learners.',
      roadmapLink: 'Explore the app roadmap',
      tabListLabel: 'Future Akademate applications',
      previewOnly: 'Preview only. Applications are coming soon.',
      options: [
        {
          id: 'mac',
          label: 'Mac',
          title: 'Akademate for Mac',
          description: 'A focused desktop workspace for academy teams.',
          image: '/images/download/akademate-mac-app-v1.jpg',
          imageAlt: 'Akademate desktop workspace presented on a laptop',
          capabilities: ['Daily operations', 'Schedules and people', 'Finance overview'],
          status: 'Coming soon',
        },
        {
          id: 'iphone',
          label: 'iPhone',
          title: 'Akademate for iPhone',
          description: 'Classes, messages and attendance wherever work happens.',
          image: '/images/download/akademate-iphone-app-v1.jpg',
          imageAlt: 'Akademate mobile workspace presented on a smartphone',
          capabilities: ['Today view', 'Messages', 'Attendance'],
          status: 'Coming soon',
        },
        {
          id: 'ipad',
          label: 'iPad',
          title: 'Akademate for iPad',
          description: 'A touch-first workspace for teaching and front desks.',
          image: '/images/download/akademate-ipad-app-v1.jpg',
          imageAlt: 'Akademate touch workspace presented on a tablet',
          capabilities: ['Class workspace', 'Check-in', 'Learner records'],
          status: 'Coming soon',
        },
      ],
    },
  },
  es: {
    company: {
      metadata: {
        title: 'Empresa',
        description:
          'Conoce Akademate, el sistema operativo para academias diseñado para crear mejores organizaciones educativas y experiencias de aprendizaje.',
      },
      kicker: 'Conoce Akademate',
      title: 'Hecho para el crecimiento de tu academia.',
      description: 'Akademate conecta crecimiento, aprendizaje y operación diaria.',
      cta: 'Construyamos el futuro',
      imageAlt:
        'Plano de producto de Akademate que conecta webs, admisiones, cursos, campus, finanzas e información operativa',
      whyWeExist: 'Por qué existimos',
      sectionTitle: 'Mejores operaciones. Más espacio para enseñar.',
      principles: [
        {
          title: 'Opera con contexto',
          text: 'Conecta las decisiones, las personas y los recorridos del alumnado detrás de la academia.',
        },
        {
          title: 'Un sistema, responsabilidades claras',
          text: 'Une a los equipos manteniendo significativos los roles y los límites de la organización.',
        },
        {
          title: 'Automatiza el trabajo alrededor de la enseñanza',
          text: 'Automatiza tareas repetitivas con una supervisión humana clara.',
        },
      ],
    },
    courses: {
      metadata: {
        title: 'Descubrimiento de cursos y catálogos de academias',
        description:
          'Descubre cómo Akademate ayuda a cada academia a publicar programas, fechas, plazas y recorridos de reserva.',
      },
      kicker: 'Catálogos impulsados por academias',
      title: 'Convierte programas en matrículas.',
      description: 'Publica cursos, horarios y reservas en un único espacio de academia.',
      detail:
        '¿Buscas un curso concreto? Visita la academia que lo imparte. ¿Estás planificando tu propio catálogo? Te mostraremos cómo se conectan descubrimiento, admisiones, pagos e impartición en un mismo flujo operativo.',
      cta: 'Conocer la experiencia de catálogo',
    },
    download: {
      metadata: {
        title: 'Descargar aplicaciones de Akademate',
        description:
          'Usa Akademate en el navegador hoy. Las aplicaciones nativas para Mac, iPhone e iPad están en la hoja de ruta.',
      },
      comingSoon: 'Próximamente',
      heroKicker: 'Espacio web disponible hoy',
      title: 'Akademate en cada pantalla.',
      description:
        'Usa Akademate en el navegador hoy. Las aplicaciones nativas están en la hoja de ruta.',
      imageAlt:
        'Futuras experiencias de Akademate presentadas en portátil, tableta y teléfono inteligente',
      roadmap: 'Hoja de ruta de producto',
      roadmapTitle: 'Lleva Akademate a tu academia.',
      roadmapDescription:
        'Hablemos del acceso web disponible hoy y de las prioridades de las aplicaciones nativas.',
      roadmapCta: 'Hablar sobre tu flujo de trabajo',
    },
    apps: {
      kicker: 'Un espacio de trabajo para cada pantalla',
      title: 'Las aplicaciones de Akademate están en camino.',
      description: 'Experiencias nativas para equipos, docentes y alumnado.',
      roadmapLink: 'Explorar la hoja de ruta de aplicaciones',
      tabListLabel: 'Futuras aplicaciones de Akademate',
      previewOnly: 'Solo vista previa. Las aplicaciones llegarán próximamente.',
      options: [
        {
          id: 'mac',
          label: 'Mac',
          title: 'Akademate para Mac',
          description:
            'Un espacio de trabajo de escritorio centrado para los equipos de la academia.',
          image: '/images/download/akademate-mac-app-v1.jpg',
          imageAlt: 'Espacio de trabajo de escritorio de Akademate mostrado en un portátil',
          capabilities: ['Operación diaria', 'Horarios y personas', 'Vista financiera'],
          status: 'Próximamente',
        },
        {
          id: 'iphone',
          label: 'iPhone',
          title: 'Akademate para iPhone',
          description: 'Clases, mensajes y asistencia donde sucede el trabajo.',
          image: '/images/download/akademate-iphone-app-v1.jpg',
          imageAlt: 'Espacio de trabajo móvil de Akademate mostrado en un teléfono inteligente',
          capabilities: ['Vista de hoy', 'Mensajes', 'Asistencia'],
          status: 'Próximamente',
        },
        {
          id: 'ipad',
          label: 'iPad',
          title: 'Akademate para iPad',
          description: 'Un espacio de trabajo táctil para docencia y recepción.',
          image: '/images/download/akademate-ipad-app-v1.jpg',
          imageAlt: 'Espacio de trabajo táctil de Akademate mostrado en una tableta',
          capabilities: ['Espacio de clase', 'Registro de llegada', 'Fichas del alumnado'],
          status: 'Próximamente',
        },
      ],
    },
  },
}

export function getSecondaryPublicContent(locale: Locale): SecondaryPublicContent {
  return secondaryPublicContent[locale]
}
