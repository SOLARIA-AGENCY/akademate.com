import type { Locale } from '@/lib/i18n/routing'

type ProductHeroSlide = {
  id: 'operate' | 'publish' | 'enrol'
  label: string
  title: string
  text: string
  image: string
  alt: string
}

type AcademyMetric = { label: string; value: string; trend: string }
type AcademySession = { time: string; name: string; place: string }

type AcademyExperience = {
  id: 'operations' | 'teachers' | 'learners'
  label: string
  eyebrow: string
  title: string
  description: string
  image: string
  imageAlt: string
  capabilities: readonly string[]
}

export type HomeExperienceContent = {
  productHero: {
    carouselRoleDescription: string
    carouselLabel: string
    tabsLabel: string
    slides: readonly ProductHeroSlide[]
  }
  operations: {
    eyebrow: string
    title: string
    description: string
    imageAlt: string
    imageEyebrow: string
    imageTitle: string
    overviewEyebrow: string
    overviewTitle: string
    connectedSites: string
    metrics: readonly AcademyMetric[]
    scheduleTitle: string
    calendarLabel: string
    sessions: readonly AcademySession[]
    admissionsEyebrow: string
    activeApplications: string
    qualified: string
    applicationsVisible: string
  }
  experiences: {
    eyebrow: string
    title: string
    description: string
    tabsLabel: string
    items: readonly AcademyExperience[]
  }
}

export const homeExperienceContent = {
  en: {
    productHero: {
      carouselRoleDescription: 'carousel',
      carouselLabel: 'Akademate product surfaces',
      tabsLabel: 'Choose a product surface',
      slides: [
        {
          id: 'operate',
          label: 'Operate',
          title: 'See the whole academy.',
          text: 'Courses, people, enrolment, learning and finance in one operational view.',
          image: '/images/marketing/akademate-product-ecosystem-v2.png',
          alt: 'Akademate operating system shown across desktop, tablet and mobile',
        },
        {
          id: 'publish',
          label: 'Publish',
          title: 'Launch your academy online.',
          text: 'Use an Akademate subdomain, connect your domain or embed live modules anywhere.',
          image: '/images/marketing/akademate-website-distribution-v2.png',
          alt: 'Akademate website, domain and embedded-module workspace',
        },
        {
          id: 'enrol',
          label: 'Enrol',
          title: 'Give every offer a page that converts.',
          text: 'Share a course, workshop or camp with registration, social login and payment ready.',
          image: '/images/marketing/akademate-course-registration-v2.png',
          alt: 'Shareable Akademate workshop page on tablet and mobile',
        },
      ],
    },
    operations: {
      eyebrow: 'The academy command centre',
      title: 'Run your academy with clarity.',
      description: 'Coordinate admissions, schedules, people and finance in one live view.',
      imageAlt: 'Academy management team coordinating admissions and daily operations',
      imageEyebrow: 'Made for academy teams',
      imageTitle: 'Every role works from the same academy picture.',
      overviewEyebrow: 'MONDAY · LIVE OPERATION',
      overviewTitle: 'Academy overview',
      connectedSites: 'All sites connected',
      metrics: [
        { label: 'Active learners', value: '1,284', trend: '+12%' },
        { label: 'Today’s sessions', value: '18', trend: '3 sites' },
        { label: 'Attendance', value: '92%', trend: '+4.2%' },
      ],
      scheduleTitle: 'Today across the academy',
      calendarLabel: 'View calendar',
      sessions: [
        { time: '09:00', name: 'Business English B2', place: 'Central · Room 3' },
        { time: '11:30', name: 'Creative Leadership', place: 'Live online' },
        { time: '17:00', name: 'Junior athletics', place: 'North campus' },
      ],
      admissionsEyebrow: 'Admissions pulse',
      activeApplications: 'active applications',
      qualified: 'Qualified',
      applicationsVisible: 'Applications stay visible.',
    },
    experiences: {
      eyebrow: 'One academy, connected around its people',
      title: 'One workspace for every role.',
      description: 'One academy record. A focused workspace for every role.',
      tabsLabel: 'Akademate experiences',
      items: [
        {
          id: 'operations',
          label: 'Academy team',
          eyebrow: 'For directors and centre staff',
          title: 'Run your academy with clarity.',
          description: 'See enrolment, schedules, people and finance in one workspace.',
          image: '/images/marketing/akademate-operations-experience-v1.jpg',
          imageAlt:
            'Academy directors and administrative staff using Akademate to coordinate performance, schedules and learners',
          capabilities: [
            'Admissions and records',
            'Courses and timetables',
            'Multiple campuses',
            'Staff and resources',
            'Finance and reporting',
          ],
        },
        {
          id: 'teachers',
          label: 'Teachers',
          eyebrow: 'For teachers and coaches',
          title: 'Plan, teach and support in one place.',
          description: 'Plan classes, grade work and support learners privately.',
          image: '/images/marketing/akademate-teacher-experience-v1.jpg',
          imageAlt:
            'Teacher using Akademate for a hybrid class, course preparation, attendance, assignments and grades',
          capabilities: [
            'Course workspace',
            'In-person and live online classes',
            'Attendance',
            'Assignments and grades',
            'Private chat and feedback',
          ],
        },
        {
          id: 'learners',
          label: 'Learners',
          eyebrow: 'For learners and families',
          title: 'Know what comes next.',
          description: 'Learn, submit work and track progress from one campus.',
          image: '/images/marketing/akademate-learner-experience-v1.jpg',
          imageAlt:
            'Learner using the Akademate virtual campus on laptop and mobile alongside an in-person class',
          capabilities: [
            'Virtual campus',
            'Next classes and resources',
            'Assignments and grades',
            'Attendance and progress',
            'Private teacher chat',
          ],
        },
      ],
    },
  },
  es: {
    productHero: {
      carouselRoleDescription: 'carrusel',
      carouselLabel: 'Superficies de producto de Akademate',
      tabsLabel: 'Elige una superficie de producto',
      slides: [
        {
          id: 'operate',
          label: 'Gestiona',
          title: 'Ve toda tu academia.',
          text: 'Cursos, personas, matrículas, aprendizaje y finanzas en una única vista operativa.',
          image: '/images/marketing/akademate-product-ecosystem-v2.png',
          alt: 'Sistema operativo de Akademate en escritorio, tableta y móvil',
        },
        {
          id: 'publish',
          label: 'Publica',
          title: 'Lanza tu academia online.',
          text: 'Usa un subdominio de Akademate, conecta tu dominio o integra módulos en directo donde quieras.',
          image: '/images/marketing/akademate-website-distribution-v2.png',
          alt: 'Espacio de trabajo de Akademate para sitio web, dominio y módulos integrados',
        },
        {
          id: 'enrol',
          label: 'Matricula',
          title: 'Da a cada oferta una página que convierte.',
          text: 'Comparte un curso, taller o campamento con inscripción, acceso social y pago preparados.',
          image: '/images/marketing/akademate-course-registration-v2.png',
          alt: 'Página compartible de taller de Akademate en tableta y móvil',
        },
      ],
    },
    operations: {
      eyebrow: 'El centro de control de tu academia',
      title: 'Dirige tu academia con claridad.',
      description: 'Coordina admisiones, horarios, personas y finanzas en una vista en directo.',
      imageAlt: 'Equipo de gestión de una academia coordinando admisiones y operaciones diarias',
      imageEyebrow: 'Creado para equipos de academia',
      imageTitle: 'Cada rol trabaja con la misma visión de la academia.',
      overviewEyebrow: 'LUNES · OPERACIÓN EN DIRECTO',
      overviewTitle: 'Resumen de la academia',
      connectedSites: 'Todas las sedes conectadas',
      metrics: [
        { label: 'Alumnos activos', value: '1,284', trend: '+12%' },
        { label: 'Sesiones de hoy', value: '18', trend: '3 sedes' },
        { label: 'Asistencia', value: '92%', trend: '+4.2%' },
      ],
      scheduleTitle: 'Hoy en toda la academia',
      calendarLabel: 'Ver calendario',
      sessions: [
        { time: '09:00', name: 'Inglés de negocios B2', place: 'Central · Aula 3' },
        { time: '11:30', name: 'Liderazgo creativo', place: 'Online en directo' },
        { time: '17:00', name: 'Atletismo juvenil', place: 'Campus norte' },
      ],
      admissionsEyebrow: 'Pulso de admisiones',
      activeApplications: 'solicitudes activas',
      qualified: 'Cualificadas',
      applicationsVisible: 'Las solicitudes siguen visibles.',
    },
    experiences: {
      eyebrow: 'Una academia conectada en torno a sus personas',
      title: 'Un espacio de trabajo para cada rol.',
      description: 'Un único registro de academia. Un espacio de trabajo enfocado para cada rol.',
      tabsLabel: 'Experiencias de Akademate',
      items: [
        {
          id: 'operations',
          label: 'Equipo de academia',
          eyebrow: 'Para dirección y personal del centro',
          title: 'Dirige tu academia con claridad.',
          description:
            'Consulta matrículas, horarios, personas y finanzas en un único espacio de trabajo.',
          image: '/images/marketing/akademate-operations-experience-v1.jpg',
          imageAlt:
            'Dirección y personal administrativo usando Akademate para coordinar rendimiento, horarios y alumnado',
          capabilities: [
            'Admisiones y expedientes',
            'Cursos y horarios',
            'Múltiples campus',
            'Personal y recursos',
            'Finanzas e informes',
          ],
        },
        {
          id: 'teachers',
          label: 'Docentes',
          eyebrow: 'Para docentes y entrenadores',
          title: 'Planifica, enseña y acompaña desde un solo lugar.',
          description: 'Planifica clases, evalúa trabajos y acompaña al alumnado de forma privada.',
          image: '/images/marketing/akademate-teacher-experience-v1.jpg',
          imageAlt:
            'Docente usando Akademate para una clase híbrida, preparación, asistencia, tareas y calificaciones',
          capabilities: [
            'Espacio de curso',
            'Clases presenciales y online en directo',
            'Asistencia',
            'Tareas y calificaciones',
            'Chat privado y comentarios',
          ],
        },
        {
          id: 'learners',
          label: 'Alumnado',
          eyebrow: 'Para alumnado y familias',
          title: 'Sabe qué viene después.',
          description: 'Aprende, entrega trabajos y sigue tu progreso desde un único campus.',
          image: '/images/marketing/akademate-learner-experience-v1.jpg',
          imageAlt:
            'Alumno usando el campus virtual de Akademate en portátil y móvil junto a una clase presencial',
          capabilities: [
            'Campus virtual',
            'Próximas clases y recursos',
            'Tareas y calificaciones',
            'Asistencia y progreso',
            'Chat privado con el docente',
          ],
        },
      ],
    },
  },
} as const satisfies Record<Locale, HomeExperienceContent>

export function getHomeExperienceContent(locale: Locale): HomeExperienceContent {
  return homeExperienceContent[locale]
}
