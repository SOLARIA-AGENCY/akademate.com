import type { Locale } from '@/lib/i18n/routing'

export type BlogSection = {
  title: string
  paragraphs: readonly string[]
  points?: readonly string[]
}

export type BlogPost = {
  kind: 'insight' | 'news'
  slug: string
  title: string
  seoTitle: string
  excerpt: string
  category: string
  keywords: readonly string[]
  author: string
  date: string
  displayDate: string
  readingTime: string
  image: string
  imageAlt: string
  introduction: string
  sections: readonly BlogSection[]
}

export const blogPosts: readonly BlogPost[] = [
  {
    kind: 'insight',
    slug: 'campaign-click-to-confirmed-place',
    title: 'From click to confirmed place',
    seoTitle: 'Academy enrolment funnel: campaign click to confirmed place',
    excerpt: 'Convert interest into bookings and organised follow-up.',
    category: 'Growth playbook',
    keywords: ['academy enrolment funnel', 'course booking', 'academy CRM', 'lead conversion'],
    author: 'Akademate Editorial Team',
    date: '2026-07-31',
    displayDate: '31 July 2026',
    readingTime: '8 min read',
    image: '/images/marketing/blog-reservation-journey.jpg',
    imageAlt: 'Prospective learner choosing and booking a professional programme online',
    introduction:
      'A learner rarely experiences your funnel as a funnel. They see a promise, imagine a future and decide whether the next step feels clear enough to take. Great academy operations connect that emotional moment to a booking journey that is fast, reassuring and easy to complete.',
    sections: [
      {
        title: 'Make the next step match the decision',
        paragraphs: [
          'Not every programme should ask for the same commitment. A short class may need instant booking, professional training may need an application and a seasonal camp may begin with a deposit and guardian consent.',
          'The strongest journey gives each offer the right path without forcing the team to rebuild forms, emails and spreadsheets every time.',
        ],
      },
      {
        title: 'Let capacity create confidence',
        paragraphs: [
          'Availability should feel clear to the participant and actionable to the academy. Place holds, deadlines and waitlists turn uncertainty into a guided decision rather than a string of manual follow-ups.',
          'When capacity is connected to the programme run, the team can act on real demand and open the next cohort at the right moment.',
        ],
        points: [
          'Show the right availability',
          'Protect a place while requirements are completed',
          'Promote eligible people from the waitlist',
          'Open new capacity around real demand',
        ],
      },
      {
        title: 'Bring payment into the experience',
        paragraphs: [
          'Deposits, instalments, memberships and one-off payments are part of how a learner decides and how an academy builds trust.',
          'A connected payment journey keeps the offer, receiving account, confirmation and finance status together from the start.',
        ],
      },
      {
        title: 'Measure the journey that matters',
        paragraphs: [
          'Campaign clicks are useful, but confirmed places are what make a programme viable. Connect source, enquiry, reservation, payment and attendance to understand which activity creates lasting participation.',
          'That visibility helps growth and operations teams make the same decision from the same story.',
        ],
      },
      {
        title: 'Design follow-up around intent',
        paragraphs: [
          'A person who downloaded a guide, someone who requested a call and a learner who started payment are expressing different levels of intent. Effective academy follow-up reflects that difference. The message, timing and owner should match what the prospective learner has already done and what is still preventing a decision.',
          'This context helps teams replace generic reminders with useful guidance. Admissions can answer the relevant question, explain the next requirement or protect a place for an agreed period. Marketing can see which sources create qualified conversations instead of optimising only for inexpensive clicks.',
        ],
      },
      {
        title: 'Create one accountable enrolment record',
        paragraphs: [
          'The operational record should preserve source, consent, communication, booking state, documents and payment without forcing staff to reconcile several systems. A shared timeline makes ownership visible and reduces the risk that two people contact the same learner with conflicting information.',
          'The result is a more coherent experience for the learner and a more measurable process for the academy. Teams can identify where decisions slow down, improve the offer page or registration flow and compare programme performance using confirmed participation rather than isolated channel metrics.',
        ],
      },
      {
        title: 'Review the journey as one operating team',
        paragraphs: [
          'Growth, admissions, teaching and finance see different parts of enrolment, but the learner experiences one academy. A regular review should connect campaign quality, unanswered questions, incomplete requirements, payment friction and first-session attendance instead of treating each metric as an isolated department report.',
          'This shared review creates practical improvements. The academy can clarify an offer, remove an unnecessary field, change a deposit rule or prepare teachers for the questions new learners raise most often. Small operational changes compound when every team is working from the same enrolment evidence.',
        ],
      },
    ],
  },
  {
    kind: 'news',
    slug: 'akademate-expands-sport-wellness-seasonal',
    title: 'Sport, wellness and camps',
    seoTitle: 'Akademate expands for sports, wellness studios and camps',
    excerpt: 'Memberships, seasons, camps and teams.',
    category: 'Product news',
    keywords: ['sports academy software', 'yoga studio software', 'camp management platform'],
    author: 'Akademate Product Team',
    date: '2026-07-31',
    displayDate: '31 July 2026',
    readingTime: '6 min read',
    image: '/images/marketing/blog-vertical-expansion.jpg',
    imageAlt: 'Sports coaches and wellness instructors planning programmes together',
    introduction:
      'Learning businesses are more diverse than a traditional course catalogue. A yoga studio, youth sports academy and summer camp may use different language, but all need a compelling way to attract people, manage capacity, deliver an experience and build lasting relationships.',
    sections: [
      {
        title: 'One platform, different operating rhythms',
        paragraphs: [
          'Wellness studios think in classes, instructors, rooms, packs and memberships. Sports academies add trials, teams, age groups, guardians and seasons. Camps concentrate demand, documents and payments into a short launch window.',
          'Akademate profiles these differences as configurable capabilities so each organisation can feel purpose-built without becoming an isolated product.',
        ],
      },
      {
        title: 'Booking becomes part of the programme',
        paragraphs: [
          'A recurring yoga class needs fast repeat booking. A sports trial may lead to assessment and team placement. A camp needs week selection, capacity, deposits and guardian information.',
          'The reservation journey now sits at the centre of how these models are presented across Akademate.',
        ],
        points: [
          'Memberships and session packs',
          'Trials, assessments and teams',
          'Guardian relationships and consent',
          'Seasonal capacity and deposits',
        ],
      },
      {
        title: 'A richer participant experience',
        paragraphs: [
          'The participant record can represent a learner, member, athlete, player or attendee while keeping attendance, communication and progress connected.',
          'Teachers, instructors and coaches receive workspaces aligned to the sessions and people they support.',
        ],
      },
      {
        title: 'Built to grow beyond one location',
        paragraphs: [
          'The same profiles can scale into groups and franchises with shared standards, local schedules, custom domains and clear payment responsibility.',
          'This creates a path from one studio or programme to a connected network without losing the experience that made the original operation successful.',
        ],
      },
      {
        title: 'Operations shaped around each vertical',
        paragraphs: [
          'The new profiles organise the language and workflow around the organisation. A wellness operator can work with sessions, passes and instructors. A sports academy can manage trials, teams and guardians. A camp can coordinate dates, activities, documents and a sharply defined capacity window.',
          'These differences appear in public offer pages, registration questions and staff workspaces while the underlying operating model remains connected. That balance supports a tailored experience without creating separate data silos for every programme type.',
        ],
      },
      {
        title: 'What the expansion enables next',
        paragraphs: [
          'This release direction establishes a foundation for richer attendance, membership renewal, seasonal closeout and multi-location reporting. It also gives academies a clearer way to present specialised offers without hiding them inside a generic course catalogue.',
          'Akademate will continue validating these workflows with operators before presenting roadmap capabilities as generally available. The aim is a dependable operating system that adapts to the academy model while keeping payment, communication, learning and reporting connected.',
        ],
      },
      {
        title: 'A clearer public experience for every programme',
        paragraphs: [
          'Each vertical can present the information people need before they commit. A studio may foreground instructor, level and pass options. A sports academy can explain trials, age groups and guardian requirements. A camp can make dates, activities, capacity and payment milestones immediately understandable.',
          'These offer pages connect discovery to the appropriate registration path without asking the operator to rebuild the journey for every programme. The public experience remains recognisably theirs while operational data reaches the schedules, participant records and payment context used by the team.',
          'Operators can then compare interest, confirmed attendance and renewal patterns using language that matches the programme. This makes reporting easier to interpret and gives teams a stronger basis for deciding which timetable, membership or seasonal offer should be expanded next.',
        ],
      },
    ],
  },
  {
    kind: 'insight',
    slug: 'ai-assisted-academy-operations',
    title: 'AI-assisted operations',
    seoTitle: 'AI-assisted academy operations with human oversight',
    excerpt: 'Use AI to remove operational friction, not replace educators.',
    category: 'AI operations',
    keywords: ['AI for academies', 'academy automation', 'education operations software'],
    author: 'Akademate Editorial Team',
    date: '2026-07-29',
    displayDate: '29 July 2026',
    readingTime: '7 min read',
    image: '/images/marketing/blog-ai-assisted-operations.jpg',
    imageAlt: 'Academy operations team coordinating schedules and next actions around a table',
    introduction:
      'Academies rarely struggle because their teams lack commitment. They struggle because crucial context is scattered across inboxes, spreadsheets, calendars and disconnected systems. AI becomes valuable when it works inside that operational reality: finding the right context, preparing the next step and leaving the decision with the person responsible.',
    sections: [
      {
        title: 'Start with the operating system, not the chatbot',
        paragraphs: [
          'A standalone assistant can produce text, but it cannot reliably understand which learner belongs to which cohort, whether a room is available or who is allowed to approve a change. Useful assistance begins with a connected operational model: students, programmes, schedules, staff, communications and permissions.',
          'When that structure exists, AI can help a coordinator review what changed, identify incomplete work and prepare an action in the right context. The interface becomes less about asking a blank chat box a clever question and more about receiving timely support where the work already happens.',
        ],
      },
      {
        title: 'Focus AI on high-friction, reversible work',
        paragraphs: [
          'The first opportunities are usually repetitive and easy to review: summarising an enquiry, drafting a follow-up, grouping unresolved items, preparing a weekly overview or explaining why a schedule needs attention. These tasks consume time without benefiting from unnecessary manual repetition.',
          'A good operating model distinguishes between preparing an action and executing it. The system can assemble context and suggest a response; a team member can inspect, adjust and approve it. That boundary creates speed without turning educational or financial decisions into invisible automation.',
        ],
        points: [
          'Surface the next operational action',
          'Prepare communications with the right context',
          'Summarise activity across a programme or cohort',
          'Keep a human approval point for meaningful changes',
        ],
      },
      {
        title: 'Permissions are part of the product experience',
        paragraphs: [
          'An academy director, teacher and admissions coordinator should not see or change the same information. AI assistance must inherit those boundaries. If a person cannot access a financial record or another campus, an assistant acting for that person should not gain a shortcut around the rule.',
          'This is why permission-aware tools matter more than a long list of model providers. Trust comes from predictable scope: the right organisation, the right role, the right resource and a visible record of what happened.',
        ],
      },
      {
        title: 'Measure recovered attention, not generated words',
        paragraphs: [
          'The outcome to optimise is not how much content an AI produces. It is how much fragmented work disappears from the team’s day. Useful measures include response preparation time, unresolved operational items, duplicate data entry and the time needed to understand the state of a programme.',
          'AI-assisted operations should make the academy calmer. Teams spend less time reconstructing context and more time supporting learners, improving programmes and making considered decisions.',
        ],
      },
      {
        title: 'Keep evidence beside every suggestion',
        paragraphs: [
          'A useful recommendation should show the records that informed it: the relevant programme, recent messages, outstanding requirements or schedule conflict. This lets the operator validate the suggestion quickly and understand when context is incomplete.',
          'Traceable assistance is especially important when a workflow touches payments, learner progress or access. The system should record what was prepared, who reviewed it and which action was finally taken instead of reducing accountability to a conversational transcript.',
        ],
      },
      {
        title: 'Introduce assistance as an operating capability',
        paragraphs: [
          'Academies can begin with one bounded workflow, measure the time recovered and expand only when the review process is reliable. A narrow use case such as enquiry summarisation often creates more value than a broad assistant with unclear responsibilities.',
          'This approach keeps AI optional and makes adoption practical for teams. The connected academy operation remains the product foundation; assistance becomes another governed capability that can be enabled where it improves speed, consistency and service quality.',
        ],
      },
    ],
  },
  {
    kind: 'insight',
    slug: 'one-operation-in-person-online-academies',
    title: 'One academy, on-site and online',
    seoTitle: 'How to manage in-person and online academy operations together',
    excerpt: 'Unify physical and digital teaching in one operation.',
    category: 'Academy operations',
    keywords: ['hybrid academy management', 'virtual campus', 'academy operations'],
    author: 'Akademate Editorial Team',
    date: '2026-07-29',
    displayDate: '29 July 2026',
    readingTime: '6 min read',
    image: '/images/marketing/blog-hybrid-academy.jpg',
    imageAlt: 'Connected adult classroom and online teaching studio inside the same academy',
    introduction:
      'Learners may join from a classroom, from home or through a mixture of both. The operational challenge is not choosing one mode. It is keeping programmes, people, schedules and learner progress coherent as delivery moves between them.',
    sections: [
      {
        title: 'Separate learning environments create duplicated work',
        paragraphs: [
          'When classroom planning and online delivery live in different systems, teams repeat the same setup. Learner records diverge, teachers receive partial information and managers assemble reports manually. The technology reflects channels instead of reflecting the academy.',
          'A connected operating system treats the programme as the stable object. Delivery mode, room, digital lesson and teaching resource become parts of that programme rather than separate administrative worlds.',
        ],
      },
      {
        title: 'Build around the learner journey',
        paragraphs: [
          'The learner journey starts before the first lesson. Enquiries, enrolment, scheduling, attendance, communication and progress all need continuity. A change in delivery mode should not force the academy to recreate that journey or lose its history.',
          'This makes handoffs clearer. Admissions knows which cohort is appropriate, teaching teams see the right learner context and operations can coordinate the room or online session without rebuilding the underlying record.',
        ],
        points: [
          'One programme and cohort structure',
          'Shared learner and enrolment context',
          'Schedules that cover rooms and online sessions',
          'Progress visible across the delivery journey',
        ],
      },
      {
        title: 'Give teachers one reliable working context',
        paragraphs: [
          'Teachers need a concise view of who they are teaching, what has already happened and what comes next. They should not have to reconcile a classroom list, a video platform and an administrative spreadsheet before every session.',
          'The best interface is not the one with the most information. It is the one that presents the relevant cohort, materials, attendance and progress at the moment the teacher needs them.',
        ],
      },
      {
        title: 'Operate the academy as one connected business',
        paragraphs: [
          'For managers, a unified operation makes capacity and demand easier to understand. A physical room, an online group and a hybrid cohort can be planned within the same view of programmes, teachers and enrolments.',
          'That coherence supports better decisions about where to open a new cohort, how to allocate teaching time and which learner journeys need attention. The academy can adapt its delivery without fragmenting its operation.',
        ],
      },
      {
        title: 'Connect communication across delivery modes',
        paragraphs: [
          'A schedule change should reach the right learners whether a session moves to another room, becomes online or is rescheduled entirely. Teachers need one channel for announcements, private feedback and the resources attached to the session.',
          'Keeping communication connected to the programme reduces missed information and preserves context for future support. Learners can understand what changed and what action is required without searching across unrelated message threads.',
        ],
      },
      {
        title: 'Plan capacity as a shared resource',
        paragraphs: [
          'Hybrid delivery adds flexibility but also creates new planning questions. A physical room has a fixed capacity, an online session may have facilitation limits and a teacher cannot be assigned to overlapping groups. These constraints belong in the same operational model.',
          'A shared view helps the academy compare demand with available teaching capacity, rooms and online delivery options. It supports growth without treating digital delivery as unlimited or physical delivery as disconnected from the learner campus.',
          'The same view can inform registration limits, waitlists and the decision to add another session. Capacity becomes a service-quality decision as well as a scheduling constraint, helping teams protect meaningful interaction in every delivery mode.',
        ],
      },
    ],
  },
  {
    kind: 'news',
    slug: 'academy-setup-blueprint-to-live',
    title: 'Academy setup, blueprint to live',
    seoTitle: 'Akademate introduces a visual academy setup journey',
    excerpt: 'Build one academy model through six clear launch stages.',
    category: 'Product news',
    keywords: ['academy onboarding', 'academy setup software', 'education management platform'],
    author: 'Akademate Product Team',
    date: '2026-08-01',
    displayDate: '1 August 2026',
    readingTime: '7 min read',
    image: '/images/academy-setup/academy-stage-06-live.jpg',
    imageAlt: 'A compact Akademate academy rendered live after its visual setup journey',
    introduction:
      'Starting an academy platform should feel like building a coherent operation, not completing an unrelated collection of forms. Akademate is introducing a six-stage visual setup journey that keeps one academy model in view as its structure, spaces, programmes, people, operations and identity come together.',
    sections: [
      {
        title: 'One academy remains visible throughout setup',
        paragraphs: [
          'The journey begins with an isometric blueprint and ends with the same academy illuminated and ready. The footprint, entrance, classrooms and visual perspective remain consistent across every stage so the operator can understand what has been configured and what still needs attention.',
          'This continuity replaces a generic percentage with a concrete model. Progress is represented by the academy becoming more complete: structure appears, surfaces are added, spaces become usable, identity is applied and the final operation goes live.',
        ],
      },
      {
        title: 'Six stages connect setup to real operations',
        paragraphs: [
          'Academy Blueprint defines the operating model and launch priorities. Campuses and Spaces represents locations, rooms and online capacity. Programmes and Offers adds schedules, enrolment rules and pricing. People and Access prepares the responsibilities of teams, teachers, learners and families.',
          'Learning and Operations connects campus delivery, communication, payments and reporting. Academy Live completes brand, website and launch readiness. The stages are designed as an orientation layer rather than a replacement for the detailed settings behind each decision.',
        ],
        points: [
          'Academy blueprint',
          'Campuses and spaces',
          'Programmes and offers',
          'People and access',
          'Learning and operations',
          'Academy Live',
        ],
      },
      {
        title: 'A shared contract for public storytelling and onboarding',
        paragraphs: [
          'The six stages are defined in a reusable Akademate interface contract. The public website uses that contract to explain the product journey, while the future tenant onboarding experience can consume the same stage identifiers, descriptions and visual assets.',
          'Centralising the model avoids two versions of setup drifting apart. A change to the meaning or order of a stage can be reviewed once and then reflected consistently wherever the setup journey appears.',
        ],
      },
      {
        title: 'Progress should reflect completed configuration',
        paragraphs: [
          'The visual sequence is not intended to claim that provisioning is complete because an image has changed. In the operational onboarding flow, each state will be driven by explicit configuration evidence such as a saved campus, a published offer, assigned roles or approved launch settings.',
          'That distinction keeps the experience motivating without turning presentation into false status. Operators should be able to open a stage, see the outstanding decisions and understand which action will move the academy forward.',
        ],
      },
      {
        title: 'Designed for one location or a growing network',
        paragraphs: [
          'The compact academy visual represents the first operating unit, but the setup contract includes multiple campuses, rooms and online capacity. A growing organisation can establish shared standards while configuring the details that belong to each location or entity.',
          'This creates a consistent starting point for an independent academy, a specialist studio, a seasonal programme or a multi-site group. The interface stays recognisable even as the operational model becomes more sophisticated.',
        ],
      },
      {
        title: 'What comes next',
        paragraphs: [
          'The public sequence is now the visual foundation for the onboarding work that follows. The next product phase will connect each stage to saved tenant configuration, readiness checks, permission-aware tasks and a clear return path when information needs to be revised.',
          'Akademate will validate the operational wiring separately before describing the onboarding workflow as complete. The immediate improvement is a clearer product story and a reusable model for turning setup into an understandable, progressive experience.',
        ],
      },
    ],
  },
] as const

const spanishBlogPosts: readonly BlogPost[] = [
  {
    kind: 'insight',
    slug: 'campaign-click-to-confirmed-place',
    title: 'Del clic a la plaza confirmada',
    seoTitle: 'Embudo de matrícula: del clic de campaña a la plaza confirmada',
    excerpt: 'Convierte el interés en reservas y seguimiento ordenado.',
    category: 'Guía de crecimiento',
    keywords: [
      'embudo de matrícula',
      'reserva de cursos',
      'CRM para academias',
      'conversión de leads',
    ],
    author: 'Equipo editorial de Akademate',
    date: '2026-07-31',
    displayDate: '31 de julio de 2026',
    readingTime: '8 min de lectura',
    image: '/images/marketing/blog-reservation-journey.jpg',
    imageAlt: 'Una futura alumna elige y reserva online un programa profesional',
    introduction:
      'Una persona rara vez vive tu embudo como un embudo. Ve una promesa, imagina un futuro y decide si el siguiente paso es lo bastante claro como para darlo. Una buena operación académica conecta ese momento emocional con un recorrido de reserva rápido, tranquilizador y fácil de completar.',
    sections: [
      {
        title: 'Haz que el siguiente paso encaje con la decisión',
        paragraphs: [
          'No todos los programas deben pedir el mismo compromiso. Una clase corta puede requerir reserva inmediata, una formación profesional una solicitud y un campamento estacional puede empezar con un depósito y el consentimiento del tutor.',
          'El mejor recorrido ofrece a cada propuesta el camino adecuado sin obligar al equipo a rehacer formularios, correos y hojas de cálculo cada vez.',
        ],
      },
      {
        title: 'Deja que la capacidad genere confianza',
        paragraphs: [
          'La disponibilidad debe ser clara para la persona participante y accionable para la academia. Las retenciones de plaza, los plazos y las listas de espera transforman la incertidumbre en una decisión guiada, no en una cadena de seguimientos manuales.',
          'Cuando la capacidad se conecta con cada edición del programa, el equipo puede actuar sobre la demanda real y abrir la siguiente cohorte en el momento adecuado.',
        ],
        points: [
          'Muestra la disponibilidad adecuada',
          'Protege una plaza mientras se completan los requisitos',
          'Promueve a las personas elegibles desde la lista de espera',
          'Abre nueva capacidad según la demanda real',
        ],
      },
      {
        title: 'Integra el pago en la experiencia',
        paragraphs: [
          'Depósitos, cuotas, membresías y pagos únicos forman parte de cómo decide una persona y de cómo una academia construye confianza.',
          'Un recorrido de pago conectado mantiene unidas la oferta, la cuenta receptora, la confirmación y el estado financiero desde el primer momento.',
        ],
      },
      {
        title: 'Mide el recorrido que importa',
        paragraphs: [
          'Los clics de campaña son útiles, pero las plazas confirmadas son lo que hace viable un programa. Conecta fuente, consulta, reserva, pago y asistencia para entender qué actividad crea una participación duradera.',
          'Esa visibilidad ayuda a los equipos de crecimiento y operaciones a tomar la misma decisión a partir de la misma historia.',
        ],
      },
      {
        title: 'Diseña el seguimiento según la intención',
        paragraphs: [
          'Quien descarga una guía, quien solicita una llamada y quien inicia un pago expresan niveles de intención distintos. Un seguimiento eficaz refleja esa diferencia. El mensaje, el momento y la persona responsable deben encajar con lo que la futura alumna ya ha hecho y con lo que todavía impide su decisión.',
          'Este contexto ayuda a sustituir recordatorios genéricos por orientación útil. Admisiones puede responder a la pregunta relevante, explicar el siguiente requisito o proteger una plaza durante el periodo acordado. Marketing puede ver qué fuentes generan conversaciones cualificadas en vez de optimizar solo clics baratos.',
        ],
      },
      {
        title: 'Crea un único registro de matrícula responsable',
        paragraphs: [
          'El registro operativo debe conservar fuente, consentimiento, comunicaciones, estado de reserva, documentos y pago sin forzar al personal a conciliar varios sistemas. Una cronología compartida hace visible la responsabilidad y reduce el riesgo de que dos personas contacten a la misma alumna con información contradictoria.',
          'El resultado es una experiencia más coherente para la alumna y un proceso más medible para la academia. Los equipos pueden identificar dónde se ralentizan las decisiones, mejorar la página de oferta o el registro y comparar programas mediante participación confirmada, no métricas aisladas de canal.',
        ],
      },
      {
        title: 'Revisa el recorrido como un único equipo operativo',
        paragraphs: [
          'Crecimiento, admisiones, docencia y finanzas ven partes diferentes de la matrícula, pero la alumna vive una sola academia. Una revisión regular debe conectar calidad de campaña, preguntas sin responder, requisitos incompletos, fricción de pago y asistencia a la primera sesión, en lugar de tratar cada métrica como un informe departamental aislado.',
          'Esta revisión compartida crea mejoras prácticas. La academia puede aclarar una oferta, eliminar un campo innecesario, cambiar una regla de depósito o preparar al profesorado para las preguntas más habituales. Los pequeños cambios operativos se acumulan cuando todos trabajan con la misma evidencia de matrícula.',
        ],
      },
    ],
  },
  {
    kind: 'news',
    slug: 'akademate-expands-sport-wellness-seasonal',
    title: 'Deporte, bienestar y campamentos',
    seoTitle: 'Akademate se amplía para deporte, estudios de bienestar y campamentos',
    excerpt: 'Membresías, temporadas, campamentos y equipos.',
    category: 'Novedades de producto',
    keywords: [
      'software para academias deportivas',
      'software para estudios de yoga',
      'plataforma para campamentos',
    ],
    author: 'Equipo de producto de Akademate',
    date: '2026-07-31',
    displayDate: '31 de julio de 2026',
    readingTime: '6 min de lectura',
    image: '/images/marketing/blog-vertical-expansion.jpg',
    imageAlt: 'Entrenadores deportivos e instructores de bienestar planifican programas juntos',
    introduction:
      'Los negocios de aprendizaje son más diversos que un catálogo de cursos tradicional. Un estudio de yoga, una academia deportiva juvenil y un campamento de verano pueden usar lenguajes distintos, pero todos necesitan una forma convincente de atraer personas, gestionar capacidad, ofrecer una experiencia y construir relaciones duraderas.',
    sections: [
      {
        title: 'Una plataforma, ritmos operativos diferentes',
        paragraphs: [
          'Los estudios de bienestar trabajan con clases, instructores, salas, bonos y membresías. Las academias deportivas añaden pruebas, equipos, grupos de edad, tutores y temporadas. Los campamentos concentran demanda, documentos y pagos en una breve ventana de lanzamiento.',
          'Akademate refleja estas diferencias como capacidades configurables para que cada organización se sienta diseñada a medida sin convertirse en un producto aislado.',
        ],
      },
      {
        title: 'La reserva pasa a formar parte del programa',
        paragraphs: [
          'Una clase recurrente de yoga necesita una reserva repetida y rápida. Una prueba deportiva puede llevar a una evaluación y a la asignación de equipo. Un campamento necesita selección de semanas, capacidad, depósitos e información de tutores.',
          'El recorrido de reserva ocupa ahora el centro de cómo se presentan estos modelos en Akademate.',
        ],
        points: [
          'Membresías y bonos de sesiones',
          'Pruebas, evaluaciones y equipos',
          'Relaciones con tutores y consentimiento',
          'Capacidad y depósitos estacionales',
        ],
      },
      {
        title: 'Una experiencia de participante más rica',
        paragraphs: [
          'El registro de participante puede representar a una alumna, miembro, deportista, jugador o asistente manteniendo conectadas la asistencia, la comunicación y el progreso.',
          'Docentes, instructores y entrenadores reciben espacios de trabajo alineados con las sesiones y las personas a las que apoyan.',
        ],
      },
      {
        title: 'Preparado para crecer más allá de una ubicación',
        paragraphs: [
          'Los mismos perfiles pueden escalar a grupos y franquicias con estándares compartidos, calendarios locales, dominios propios y una responsabilidad de pago clara.',
          'Esto crea un camino desde un estudio o programa hasta una red conectada sin perder la experiencia que hizo exitosa a la operación original.',
        ],
      },
      {
        title: 'Operaciones adaptadas a cada vertical',
        paragraphs: [
          'Los nuevos perfiles organizan el lenguaje y el flujo de trabajo alrededor de cada organización. Un operador de bienestar puede trabajar con sesiones, pases e instructores. Una academia deportiva puede gestionar pruebas, equipos y tutores. Un campamento puede coordinar fechas, actividades, documentos y una ventana de capacidad definida.',
          'Estas diferencias aparecen en páginas públicas de oferta, preguntas de registro y espacios de trabajo del personal, mientras el modelo operativo subyacente permanece conectado. Ese equilibrio permite una experiencia adaptada sin crear silos de datos para cada tipo de programa.',
        ],
      },
      {
        title: 'Lo que la ampliación permite a continuación',
        paragraphs: [
          'Esta dirección de producto establece una base para una asistencia más completa, renovación de membresías, cierre estacional e informes de varias ubicaciones. También ofrece a las academias una forma más clara de presentar ofertas especializadas sin ocultarlas en un catálogo genérico.',
          'Akademate seguirá validando estos flujos con operadores antes de presentar las capacidades de hoja de ruta como disponibles de forma general. El objetivo es un sistema operativo fiable que se adapte al modelo de academia y mantenga conectados pago, comunicación, aprendizaje e informes.',
        ],
      },
      {
        title: 'Una experiencia pública más clara para cada programa',
        paragraphs: [
          'Cada vertical puede presentar la información que las personas necesitan antes de decidirse. Un estudio puede destacar instructor, nivel y opciones de pase. Una academia deportiva puede explicar pruebas, grupos de edad y requisitos de tutor. Un campamento puede hacer comprensibles de inmediato fechas, actividades, capacidad e hitos de pago.',
          'Estas páginas de oferta conectan el descubrimiento con el camino de registro adecuado sin pedir al operador que reconstruya el recorrido para cada programa. La experiencia pública sigue siendo reconociblemente suya mientras los datos operativos llegan a calendarios, registros de participantes y contexto de pago.',
          'Después, los operadores pueden comparar interés, asistencia confirmada y patrones de renovación usando un lenguaje que encaja con el programa. Esto hace más sencillos los informes y da a los equipos una base más sólida para decidir qué horario, membresía u oferta estacional ampliar.',
        ],
      },
    ],
  },
  {
    kind: 'insight',
    slug: 'ai-assisted-academy-operations',
    title: 'Operaciones asistidas por IA',
    seoTitle: 'Operaciones de academia asistidas por IA con supervisión humana',
    excerpt: 'Usa la IA para eliminar fricción operativa, no para reemplazar al profesorado.',
    category: 'Operaciones con IA',
    keywords: [
      'IA para academias',
      'automatización de academias',
      'software de operaciones educativas',
    ],
    author: 'Equipo editorial de Akademate',
    date: '2026-07-29',
    displayDate: '29 de julio de 2026',
    readingTime: '7 min de lectura',
    image: '/images/marketing/blog-ai-assisted-operations.jpg',
    imageAlt:
      'Un equipo de operaciones académicas coordina calendarios y siguientes acciones alrededor de una mesa',
    introduction:
      'Las academias rara vez tienen dificultades porque sus equipos carezcan de compromiso. Las tienen porque el contexto crucial está repartido entre bandejas de entrada, hojas de cálculo, calendarios y sistemas desconectados. La IA aporta valor cuando trabaja dentro de esa realidad operativa: encuentra el contexto adecuado, prepara el siguiente paso y deja la decisión a la persona responsable.',
    sections: [
      {
        title: 'Empieza por el sistema operativo, no por el chatbot',
        paragraphs: [
          'Un asistente aislado puede generar texto, pero no puede entender con fiabilidad qué alumna pertenece a qué cohorte, si una sala está disponible o quién puede aprobar un cambio. La ayuda útil comienza con un modelo operativo conectado: estudiantes, programas, calendarios, personal, comunicaciones y permisos.',
          'Cuando existe esa estructura, la IA puede ayudar a una coordinadora a revisar qué cambió, identificar trabajo incompleto y preparar una acción en el contexto correcto. La interfaz deja de ser una caja de chat vacía y pasa a ofrecer apoyo oportuno donde ya sucede el trabajo.',
        ],
      },
      {
        title: 'Enfoca la IA en trabajo reversible y de alta fricción',
        paragraphs: [
          'Las primeras oportunidades suelen ser repetitivas y fáciles de revisar: resumir una consulta, redactar un seguimiento, agrupar elementos sin resolver, preparar una visión semanal o explicar por qué un calendario necesita atención. Estas tareas consumen tiempo sin beneficiarse de repetición manual innecesaria.',
          'Un buen modelo operativo distingue entre preparar una acción y ejecutarla. El sistema puede reunir contexto y sugerir una respuesta; un miembro del equipo puede revisarla, ajustarla y aprobarla. Ese límite aporta velocidad sin convertir decisiones educativas o financieras en automatización invisible.',
        ],
        points: [
          'Muestra la siguiente acción operativa',
          'Prepara comunicaciones con el contexto adecuado',
          'Resume actividad de un programa o cohorte',
          'Mantén una aprobación humana para cambios relevantes',
        ],
      },
      {
        title: 'Los permisos son parte de la experiencia de producto',
        paragraphs: [
          'Una directora, una docente y una coordinadora de admisiones no deben ver ni modificar la misma información. La asistencia de IA debe heredar esos límites. Si una persona no puede acceder a un registro financiero u otro campus, un asistente que actúe por ella no debe obtener un atajo para saltarse la norma.',
          'Por eso las herramientas conscientes de permisos importan más que una larga lista de proveedores de modelos. La confianza nace de un alcance predecible: la organización correcta, el rol correcto, el recurso correcto y un registro visible de lo ocurrido.',
        ],
      },
      {
        title: 'Mide la atención recuperada, no las palabras generadas',
        paragraphs: [
          'El resultado que hay que optimizar no es cuánto contenido produce una IA. Es cuánto trabajo fragmentado desaparece del día del equipo. Las medidas útiles incluyen tiempo de preparación de respuestas, elementos operativos sin resolver, duplicación de datos y tiempo necesario para entender el estado de un programa.',
          'Las operaciones asistidas por IA deben hacer que la academia esté más tranquila. Los equipos dedican menos tiempo a reconstruir contexto y más a apoyar al alumnado, mejorar programas y tomar decisiones meditadas.',
        ],
      },
      {
        title: 'Mantén la evidencia junto a cada sugerencia',
        paragraphs: [
          'Una recomendación útil debe mostrar los registros que la informaron: el programa relevante, mensajes recientes, requisitos pendientes o un conflicto de calendario. Esto permite a la persona operadora validar la sugerencia con rapidez y entender cuándo el contexto es incompleto.',
          'La asistencia trazable es especialmente importante cuando un flujo toca pagos, progreso del alumnado o accesos. El sistema debe registrar qué se preparó, quién lo revisó y qué acción se tomó finalmente, en lugar de reducir la responsabilidad a una transcripción conversacional.',
        ],
      },
      {
        title: 'Introduce la asistencia como una capacidad operativa',
        paragraphs: [
          'Las academias pueden empezar con un flujo acotado, medir el tiempo recuperado y ampliarlo solo cuando el proceso de revisión sea fiable. Un caso de uso limitado, como resumir consultas, suele crear más valor que un asistente amplio con responsabilidades poco claras.',
          'Este enfoque mantiene la IA como una opción y hace práctica la adopción para los equipos. La operación académica conectada sigue siendo la base del producto; la asistencia se convierte en otra capacidad gobernada que puede activarse donde mejore velocidad, consistencia y calidad de servicio.',
        ],
      },
    ],
  },
  {
    kind: 'insight',
    slug: 'one-operation-in-person-online-academies',
    title: 'Una academia, presencial y online',
    seoTitle: 'Cómo gestionar juntas las operaciones presenciales y online de una academia',
    excerpt: 'Unifica la enseñanza física y digital en una sola operación.',
    category: 'Operaciones académicas',
    keywords: ['gestión de academias híbridas', 'campus virtual', 'operaciones académicas'],
    author: 'Equipo editorial de Akademate',
    date: '2026-07-29',
    displayDate: '29 de julio de 2026',
    readingTime: '6 min de lectura',
    image: '/images/marketing/blog-hybrid-academy.jpg',
    imageAlt:
      'Un aula para adultos y un estudio de enseñanza online conectados en la misma academia',
    introduction:
      'El alumnado puede unirse desde un aula, desde casa o mediante una combinación de ambas. El reto operativo no es elegir un modo. Es mantener coherentes programas, personas, calendarios y progreso a medida que la impartición se mueve entre ellos.',
    sections: [
      {
        title: 'Los entornos separados de aprendizaje duplican trabajo',
        paragraphs: [
          'Cuando la planificación de aula y la impartición online viven en sistemas distintos, los equipos repiten la misma configuración. Los registros del alumnado divergen, el profesorado recibe información parcial y la dirección monta informes manualmente. La tecnología refleja canales en vez de reflejar la academia.',
          'Un sistema operativo conectado trata el programa como el objeto estable. El modo de impartición, la sala, la lección digital y el recurso docente pasan a ser partes de ese programa en lugar de mundos administrativos separados.',
        ],
      },
      {
        title: 'Construye alrededor del recorrido del alumnado',
        paragraphs: [
          'El recorrido empieza antes de la primera lección. Consultas, matrícula, calendario, asistencia, comunicación y progreso necesitan continuidad. Un cambio de modo de impartición no debe obligar a la academia a recrear ese recorrido ni a perder su historial.',
          'Esto aclara los traspasos. Admisiones sabe qué cohorte es adecuada, los equipos docentes ven el contexto correcto y operaciones puede coordinar la sala o la sesión online sin reconstruir el registro base.',
        ],
        points: [
          'Una estructura de programa y cohorte',
          'Contexto compartido de alumnado y matrícula',
          'Calendarios que cubren salas y sesiones online',
          'Progreso visible a lo largo del recorrido de aprendizaje',
        ],
      },
      {
        title: 'Da al profesorado un contexto de trabajo fiable',
        paragraphs: [
          'El profesorado necesita una vista concisa de a quién enseña, qué ya ocurrió y qué viene después. No debería tener que conciliar una lista de aula, una plataforma de vídeo y una hoja administrativa antes de cada sesión.',
          'La mejor interfaz no es la que tiene más información. Es la que presenta la cohorte relevante, materiales, asistencia y progreso en el momento en que la docente lo necesita.',
        ],
      },
      {
        title: 'Opera la academia como un negocio conectado',
        paragraphs: [
          'Para la dirección, una operación unificada facilita entender capacidad y demanda. Una sala física, un grupo online y una cohorte híbrida se pueden planificar dentro de la misma vista de programas, docentes y matrículas.',
          'Esa coherencia permite tomar mejores decisiones sobre dónde abrir una nueva cohorte, cómo asignar tiempo docente y qué recorridos del alumnado necesitan atención. La academia puede adaptar su impartición sin fragmentar su operación.',
        ],
      },
      {
        title: 'Conecta la comunicación entre modos de impartición',
        paragraphs: [
          'Un cambio de calendario debe llegar al alumnado correcto tanto si una sesión pasa a otra sala como si se convierte en online o se reprograma por completo. El profesorado necesita un canal para anuncios, comentarios privados y recursos ligados a la sesión.',
          'Mantener la comunicación conectada al programa reduce la información perdida y conserva contexto para el apoyo futuro. El alumnado puede entender qué cambió y qué acción se requiere sin buscar en hilos de mensajes no relacionados.',
        ],
      },
      {
        title: 'Planifica la capacidad como un recurso compartido',
        paragraphs: [
          'La impartición híbrida añade flexibilidad, pero también nuevas preguntas de planificación. Una sala física tiene capacidad fija, una sesión online puede tener límites de facilitación y una docente no puede asignarse a grupos solapados. Estas restricciones pertenecen al mismo modelo operativo.',
          'Una vista compartida ayuda a comparar la demanda con la capacidad docente disponible, salas y opciones de impartición online. Favorece el crecimiento sin tratar lo digital como ilimitado ni lo físico como desconectado del campus del alumnado.',
          'La misma vista puede informar límites de registro, listas de espera y la decisión de añadir otra sesión. La capacidad se convierte en una decisión de calidad de servicio además de una restricción de calendario, ayudando a proteger una interacción significativa en cada modo de impartición.',
        ],
      },
    ],
  },
  {
    kind: 'news',
    slug: 'academy-setup-blueprint-to-live',
    title: 'Configuración de la academia, del plano al lanzamiento',
    seoTitle: 'Akademate presenta un recorrido visual de configuración de academia',
    excerpt: 'Construye un modelo de academia mediante seis etapas claras de lanzamiento.',
    category: 'Novedades de producto',
    keywords: [
      'onboarding de academias',
      'software de configuración de academias',
      'plataforma de gestión educativa',
    ],
    author: 'Equipo de producto de Akademate',
    date: '2026-08-01',
    displayDate: '1 de agosto de 2026',
    readingTime: '7 min de lectura',
    image: '/images/academy-setup/academy-stage-06-live.jpg',
    imageAlt:
      'Una academia compacta de Akademate preparada para operar tras su recorrido visual de configuración',
    introduction:
      'Empezar con una plataforma para academias debería sentirse como construir una operación coherente, no como completar una colección inconexa de formularios. Akademate presenta un recorrido visual de configuración en seis etapas que mantiene un modelo de academia a la vista mientras se unen estructura, espacios, programas, personas, operaciones e identidad.',
    sections: [
      {
        title: 'Una academia permanece visible durante toda la configuración',
        paragraphs: [
          'El recorrido comienza con un plano isométrico y termina con la misma academia iluminada y preparada. La huella, la entrada, las aulas y la perspectiva visual se mantienen en cada etapa para que la persona operadora entienda qué se ha configurado y qué aún requiere atención.',
          'Esta continuidad sustituye un porcentaje genérico por un modelo concreto. El progreso se representa mediante una academia cada vez más completa: aparece la estructura, se añaden superficies, los espacios se vuelven utilizables, se aplica la identidad y la operación final se pone en marcha.',
        ],
      },
      {
        title: 'Seis etapas conectan la configuración con operaciones reales',
        paragraphs: [
          'Plano de academia define el modelo operativo y las prioridades de lanzamiento. Sedes y espacios representa ubicaciones, salas y capacidad online. Programas y ofertas añade calendarios, reglas de matrícula y precios. Personas y acceso prepara responsabilidades de equipos, docentes, alumnado y familias.',
          'Aprendizaje y operaciones conecta la impartición, comunicación, pagos e informes. Academia en marcha completa la marca, el sitio web y la preparación de lanzamiento. Las etapas se diseñan como una capa de orientación, no como sustituto de los ajustes detallados de cada decisión.',
        ],
        points: [
          'Plano de academia',
          'Sedes y espacios',
          'Programas y ofertas',
          'Personas y acceso',
          'Aprendizaje y operaciones',
          'Academia en marcha',
        ],
      },
      {
        title: 'Un contrato compartido para narrativa pública y onboarding',
        paragraphs: [
          'Las seis etapas se definen en un contrato de interfaz reutilizable de Akademate. El sitio público usa ese contrato para explicar el recorrido de producto, mientras la futura experiencia de onboarding de tenant puede consumir los mismos identificadores, descripciones y activos visuales.',
          'Centralizar el modelo evita que dos versiones de la configuración se separen. Un cambio en el significado o el orden de una etapa se puede revisar una vez y reflejarse después de forma coherente donde aparezca el recorrido.',
        ],
      },
      {
        title: 'El progreso debe reflejar configuración completada',
        paragraphs: [
          'La secuencia visual no pretende afirmar que el aprovisionamiento está completo porque haya cambiado una imagen. En el flujo operativo de onboarding, cada estado se basará en evidencia explícita de configuración, como una sede guardada, una oferta publicada, roles asignados o ajustes de lanzamiento aprobados.',
          'Esta distinción mantiene la experiencia motivadora sin convertir la presentación en un estado falso. Las personas operadoras deben poder abrir una etapa, ver las decisiones pendientes y entender qué acción hará avanzar a la academia.',
        ],
      },
      {
        title: 'Diseñado para una ubicación o una red en crecimiento',
        paragraphs: [
          'La visual de academia compacta representa la primera unidad operativa, pero el contrato de configuración incluye varias sedes, salas y capacidad online. Una organización en crecimiento puede establecer estándares compartidos mientras configura los detalles que pertenecen a cada ubicación o entidad.',
          'Esto crea un punto de partida coherente para una academia independiente, un estudio especializado, un programa estacional o un grupo multisede. La interfaz sigue siendo reconocible incluso cuando el modelo operativo se vuelve más sofisticado.',
        ],
      },
      {
        title: 'Qué viene después',
        paragraphs: [
          'La secuencia pública es ahora la base visual para el trabajo de onboarding que sigue. La siguiente fase de producto conectará cada etapa con configuración de tenant guardada, comprobaciones de preparación, tareas conscientes de permisos y un camino de vuelta claro cuando haya que revisar información.',
          'Akademate validará la conexión operativa por separado antes de describir el flujo de onboarding como completo. La mejora inmediata es una historia de producto más clara y un modelo reutilizable para convertir la configuración en una experiencia comprensible y progresiva.',
        ],
      },
    ],
  },
] as const

const postsByLocale: Record<Locale, readonly BlogPost[]> = { en: blogPosts, es: spanishBlogPosts }

export function getEditorialPosts(locale: Locale): readonly BlogPost[] {
  return postsByLocale[locale]
}

export function getInsightPosts(locale: Locale): readonly BlogPost[] {
  return getEditorialPosts(locale).filter((post) => post.kind === 'insight')
}

export function getNewsPosts(locale: Locale): readonly BlogPost[] {
  return getEditorialPosts(locale).filter((post) => post.kind === 'news')
}

export const insightPosts = getInsightPosts('en')
export const newsPosts = getNewsPosts('en')

export function getBlogPost(slug: string, locale: Locale = 'en') {
  return getInsightPosts(locale).find((post) => post.slug === slug)
}

export function getNewsPost(slug: string, locale: Locale = 'en') {
  return getNewsPosts(locale).find((post) => post.slug === slug)
}

export function getEditorialPost(slug: string, locale: Locale = 'en') {
  return getEditorialPosts(locale).find((post) => post.slug === slug)
}
