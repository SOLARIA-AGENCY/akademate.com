import type { Locale } from '@/lib/i18n/routing'

type VerticalExperienceContent = {
  eyebrow: string
  title: string
  description: string
  image: string
  imageAlt: string
  roles: readonly { title: string; text: string }[]
  cta: string
}

const content: Record<string, Record<Locale, VerticalExperienceContent>> = {
  'professional-training': {
    en: {
      eyebrow: 'From application to qualification',
      title: 'Give every team the same cohort picture.',
      description:
        'Admissions, teachers and leaders share one cohort journey.',
      image: '/images/marketing/professional-training-cohort-operations-v2.jpg',
      imageAlt:
        'Academic coordinator and vocational teacher reviewing a cohort while adult learners work in a practical classroom',
      roles: [
        { title: 'Admissions', text: 'Review eligibility, evidence and interviews.' },
        { title: 'Teachers', text: 'Run sessions, attendance and assessment.' },
        { title: 'Leadership', text: 'Follow cohort progress, capacity and finance.' },
      ],
      cta: 'Review my admissions flow',
    },
    es: {
      eyebrow: 'De la solicitud a la titulación',
      title: 'Da a cada equipo la misma visión de la cohorte.',
      description:
        'Admisiones, dirección académica y profesorado acompañan al alumno en un recorrido coordinado.',
      image: '/images/marketing/professional-training-cohort-operations-v2.jpg',
      imageAlt:
        'Coordinadora académica y docente revisando una cohorte durante una clase práctica de formación profesional',
      roles: [
        { title: 'Admisiones', text: 'Revisa requisitos, documentación y entrevistas.' },
        { title: 'Profesorado', text: 'Gestiona sesiones, asistencia y evaluación.' },
        { title: 'Dirección', text: 'Sigue progreso, plazas y finanzas de la cohorte.' },
      ],
      cta: 'Revisar mi flujo de admisiones',
    },
  },
  wellness: {
    en: {
      eyebrow: 'A studio people return to',
      title: 'Make every arrival feel effortless.',
      description:
        'Reception, instructors and members share classes and access.',
      image: '/images/marketing/wellness-member-checkin-v1.jpg',
      imageAlt: 'Wellness studio member checking in by QR while an instructor prepares the class',
      roles: [
        { title: 'Studio owners', text: 'Shape capacity, packs and retention.' },
        { title: 'Instructors', text: 'See rooms, rosters and substitutions.' },
        { title: 'Members', text: 'Book, check in and renew with ease.' },
      ],
      cta: 'Design my studio operation',
    },
    es: {
      eyebrow: 'Un estudio al que apetece volver',
      title: 'Haz que cada llegada resulte natural.',
      description:
        'Recepción, instructores y socios comparten la misma visión de clases, acceso y membresía.',
      image: '/images/marketing/wellness-member-checkin-v1.jpg',
      imageAlt:
        'Socia haciendo check-in con QR mientras la instructora prepara una clase de bienestar',
      roles: [
        { title: 'Dirección', text: 'Configura aforo, bonos y retención.' },
        { title: 'Instructores', text: 'Consulta salas, asistentes y sustituciones.' },
        { title: 'Socios', text: 'Reserva, entra y renueva con facilidad.' },
      ],
      cta: 'Diseñar la operación de mi estudio',
    },
  },
  sports: {
    en: {
      eyebrow: 'One season, clearly coordinated',
      title: 'Turn every trial into the right next step.',
      description:
        'Coaches, coordinators and guardians share team and season.',
      image: '/images/marketing/sports-trial-team-placement-v1.jpg',
      imageAlt:
        'Coach assessing young athletes at a football trial with an academy coordinator and guardian',
      roles: [
        { title: 'Coordinators', text: 'Plan teams, facilities and seasons.' },
        { title: 'Coaches', text: 'Assess progress and record attendance.' },
        { title: 'Guardians', text: 'Confirm places, consent and fees.' },
      ],
      cta: 'Plan my next season',
    },
    es: {
      eyebrow: 'Una temporada coordinada',
      title: 'Convierte cada prueba en el siguiente paso adecuado.',
      description:
        'Entrenadores, coordinación y tutores avanzan juntos desde la evaluación hasta el equipo y la temporada.',
      image: '/images/marketing/sports-trial-team-placement-v1.jpg',
      imageAlt:
        'Entrenador evaluando a deportistas jóvenes con coordinación de la academia y una tutora',
      roles: [
        { title: 'Coordinación', text: 'Planifica equipos, instalaciones y temporadas.' },
        { title: 'Entrenadores', text: 'Evalúa progreso y registra asistencia.' },
        { title: 'Tutores', text: 'Confirma plaza, consentimiento y cuotas.' },
      ],
      cta: 'Planificar mi próxima temporada',
    },
  },
  seasonal: {
    en: {
      eyebrow: 'Ready for the first morning',
      title: 'Open bookings with arrivals connected.',
      description:
        'Families and camp teams share dates, deposits and pickup.',
      image: '/images/marketing/seasonal-family-checkin-v1.jpg',
      imageAlt:
        'Family checking in a child at a seasonal camp with organised activity leaders nearby',
      roles: [
        { title: 'Organisers', text: 'Publish weeks, ages and capacity.' },
        { title: 'Activity leaders', text: 'See groups, arrivals and exceptions.' },
        { title: 'Families', text: 'Complete forms, deposits and pickup details.' },
      ],
      cta: 'Prepare my next camp',
    },
    es: {
      eyebrow: 'Todo listo para el primer día',
      title: 'Abre reservas con cada detalle de llegada conectado.',
      description:
        'Familias y equipo comparten fechas, depósitos, salud, grupos y personas autorizadas.',
      image: '/images/marketing/seasonal-family-checkin-v1.jpg',
      imageAlt:
        'Familia registrando a un niño en un campamento con monitores preparados para recibir al grupo',
      roles: [
        { title: 'Organización', text: 'Publica semanas, edades y plazas.' },
        { title: 'Monitores', text: 'Consulta grupos, llegadas e incidencias.' },
        { title: 'Familias', text: 'Completa formularios, depósito y recogida.' },
      ],
      cta: 'Preparar mi próximo campamento',
    },
  },
  'performing-arts': {
    en: {
      eyebrow: 'Classes and stage in the same rhythm',
      title: 'Coordinate studios, teachers and shows.',
      description:
        'Timetables and performances share rooms, progress and billing.',
      image: '/images/marketing/performing-arts-studio-operations-v1.jpg',
      imageAlt:
        'Performing arts coordinator planning shared studios while dance and piano sessions take place',
      roles: [
        { title: 'Arts directors', text: 'Shape disciplines and performance dates.' },
        { title: 'Teachers', text: 'Share goals, resources and feedback.' },
        { title: 'Families', text: 'Follow progress, rehearsals and billing.' },
      ],
      cta: 'Organise classes and performances',
    },
    es: {
      eyebrow: 'Clases y escenario al mismo ritmo',
      title: 'Coordina cada estudio, docente y actuación.',
      description:
        'El horario semanal y el camino al escenario comparten espacios, recursos, progreso y cuentas familiares.',
      image: '/images/marketing/performing-arts-studio-operations-v1.jpg',
      imageAlt:
        'Coordinadora de artes escénicas planificando estudios mientras se imparten danza y piano',
      roles: [
        { title: 'Dirección artística', text: 'Define disciplinas y fechas de actuación.' },
        { title: 'Docentes', text: 'Comparte objetivos, recursos y feedback.' },
        { title: 'Familias', text: 'Sigue progreso, ensayos y facturación.' },
      ],
      cta: 'Organizar clases y actuaciones',
    },
  },
  'online-cohorts': {
    en: {
      eyebrow: 'More than a video call',
      title: 'Give every cohort a clear learning rhythm.',
      description:
        'Facilitators and learners share sessions, recordings and tasks.',
      image: '/images/marketing/online-cohort-live-production-v1.jpg',
      imageAlt:
        'Educator and learning producer running a live online cohort session in a professional studio',
      roles: [
        { title: 'Programme teams', text: 'Set cohorts, time zones and access.' },
        { title: 'Facilitators', text: 'Run live learning and feedback.' },
        { title: 'Learners', text: 'Follow tasks, chat and progress.' },
      ],
      cta: 'Design my next cohort',
    },
    es: {
      eyebrow: 'Much más que una videollamada',
      title: 'Da a cada cohorte un ritmo de aprendizaje claro.',
      description:
        'Facilitadores, operaciones y alumnado conectan sesiones, grabaciones, tareas y comunidad.',
      image: '/images/marketing/online-cohort-live-production-v1.jpg',
      imageAlt:
        'Docente y productora de aprendizaje impartiendo una sesión online para una cohorte',
      roles: [
        { title: 'Equipo de programa', text: 'Configura cohortes, horarios y acceso.' },
        { title: 'Facilitadores', text: 'Imparte sesiones y comparte feedback.' },
        { title: 'Alumnado', text: 'Sigue tareas, chat y progreso.' },
      ],
      cta: 'Diseñar mi próxima cohorte',
    },
  },
  languages: {
    en: {
      eyebrow: 'The right learner in the right group',
      title: 'Connect placement, schedules and progress.',
      description:
        'Academic teams match level, teacher and location first.',
      image: '/images/marketing/languages-placement-scheduling-v1.jpg',
      imageAlt:
        'Language teacher conducting a placement interview while a coordinator reviews group schedules',
      roles: [
        { title: 'Academic teams', text: 'Manage levels, groups and teachers.' },
        { title: 'Teachers', text: 'Connect attendance, homework and feedback.' },
        { title: 'Learners', text: 'Move between classroom and online learning.' },
      ],
      cta: 'Organise placement and groups',
    },
    es: {
      eyebrow: 'Cada alumno en su grupo adecuado',
      title: 'Conecta nivelación, horarios y progreso.',
      description:
        'El equipo académico combina nivel, disponibilidad, docente y sede antes de confirmar el recorrido.',
      image: '/images/marketing/languages-placement-scheduling-v1.jpg',
      imageAlt:
        'Docente realizando una entrevista de nivel mientras coordinación revisa horarios de grupos',
      roles: [
        { title: 'Coordinación académica', text: 'Gestiona niveles, grupos y docentes.' },
        { title: 'Profesorado', text: 'Conecta asistencia, tareas y feedback.' },
        { title: 'Alumnado', text: 'Avanza entre aula y aprendizaje online.' },
      ],
      cta: 'Ordenar nivelación y grupos',
    },
  },
  networks: {
    en: {
      eyebrow: 'Shared standards, local operation',
      title: 'See the network and respect every location.',
      description:
        'Central and local teams share brands, catalogues and finance.',
      image: '/images/marketing/networks-central-local-operations-v1.jpg',
      imageAlt: 'Central and local academy managers coordinating plans with a remote campus leader',
      roles: [
        { title: 'Group leadership', text: 'Set shared standards and oversight.' },
        { title: 'Campus teams', text: 'Run local schedules and offers.' },
        { title: 'Finance', text: 'Keep entities, settlements and reporting clear.' },
      ],
      cta: 'Map my academy network',
    },
    es: {
      eyebrow: 'Estándares comunes, operación local',
      title: 'Comprende la red y respeta cada sede.',
      description:
        'Equipos centrales y locales coordinan marcas, permisos, catálogos, dominios y alcance financiero.',
      image: '/images/marketing/networks-central-local-operations-v1.jpg',
      imageAlt:
        'Responsables centrales y locales coordinando planes con el director remoto de otra sede',
      roles: [
        { title: 'Dirección de grupo', text: 'Define estándares y visión consolidada.' },
        { title: 'Equipos de sede', text: 'Gestiona horarios y ofertas locales.' },
        { title: 'Finanzas', text: 'Aclara entidades, liquidaciones e informes.' },
      ],
      cta: 'Mapear mi red de centros',
    },
  },
}

export function getVerticalExperienceContent(slug: string, locale: Locale) {
  return content[slug]?.[locale]
}

export const verticalExperienceSlugs = Object.keys(content)
