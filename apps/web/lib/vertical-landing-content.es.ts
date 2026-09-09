import type { VerticalLandingCopy, VerticalProofQuote, VerticalSlug } from './vertical-landing-content'

// Espejo en español de vertical-landing-content.ts: mismas claves, misma
// estructura, mismas restricciones de producto. Un test de paridad garantiza
// que ningún slug ni pregunta se queda atrás.
export const spanishVerticalLandingContent: Record<VerticalSlug, VerticalLandingCopy> = {
  'professional-training': {
    seoTitle: 'Software para centros de formación | Akademate',
    metaDescription:
      'Software para centros de formación regulada: admisiones, cohortes, asistencia y certificados con pagos integrados. Reserva una demo con Akademate.',
    faqHeading: 'Software para centros de formación: resolvemos tus dudas',
    integrationNote:
      'Cobra matrícula y plazos con Stripe, PayPal o SEPA, y lleva las inscripciones de Meta Ads directamente a tu CRM.',
    faqs: [
      {
        question: '¿Podemos mantener nuestro campus virtual actual (LMS)?',
        answer:
          'Sí. El campus virtual de Akademate cubre sesiones, feedback y progreso, y está diseñado para convivir con las herramientas que ya usas, mientras admisiones, expedientes y pagos quedan conectados.',
      },
      {
        question: '¿Gestiona convocatorias, plazas y pagos fraccionados?',
        answer:
          'Cursos, cohortes, horarios y sedes dan a cada convocatoria sus plazas y su calendario, y el checkout admite depósitos o pagos únicos con emails de confirmación y recordatorio.',
      },
      {
        question: '¿Los datos del alumnado cumplen el RGPD?',
        answer:
          'Akademate está construido para datos de academias: acceso por roles, expedientes aislados por academia y nube gestionada o infraestructura dedicada cuando la necesites.',
      },
      {
        question: 'Tenemos varias sedes con programas distintos. ¿Una sola cuenta?',
        answer:
          'Sí. El modelo multisede y multimarca comparte estándares con espacios y roles por sede, e informes para todo el grupo.',
      },
      {
        question: '¿Cómo funcionan las reglas de asistencia?',
        answer:
          'La asistencia forma parte de las operaciones académicas: listas por sesión, registro por alumno y analítica que detecta patrones antes de que se conviertan en problemas.',
      },
    ],
  },
  wellness: {
    seoTitle: 'Software para estudios de yoga y pilates | Akademate',
    metaDescription:
      'Software para estudios de yoga que llena cada clase: reservas, listas de espera, membresías y pagos en tu propia web. Reserva una demo con Akademate.',
    faqHeading: 'Software para estudios de yoga: resolvemos tus dudas',
    integrationNote:
      'Membresías recurrentes y bonos se cobran con Stripe, PayPal o SEPA; Meta Ads y CAPI conectan tus campañas con las clases reservadas.',
    faqs: [
      {
        question: '¿Mis clientes pueden reservar sin descargar una app?',
        answer:
          'Sí. La reserva funciona en tu propia web: tu sitio, tu horario, tu checkout. Ningún marketplace se interpone entre tu estudio y tus socios.',
      },
      {
        question: '¿Cómo funciona la lista de espera?',
        answer:
          'Las reservas incluyen aforo y listas de espera con plazos, así que una plaza liberada pasa al siguiente y tus clases se mantienen llenas.',
      },
      {
        question: '¿Cómo se gestionan ausencias y cancelaciones tardías?',
        answer:
          'Ventanas de reserva, reglas de aforo y emails de recordatorio automáticos mantienen la asistencia honesta; la política de cancelación la defines tú por clase.',
      },
      {
        question: '¿Soporta membresías y bonos de clases?',
        answer:
          'Ambos: facturación recurrente para membresías, bonos y pagos únicos desde el checkout, con cobros y conciliación en la misma plataforma.',
      },
      {
        question: '¿Podemos gestionar más de un estudio?',
        answer:
          'Sí. Espacios multi-sede con roles por estudio e informes de red cubren estudios que crecen más allá de una sala.',
      },
    ],
  },
  sports: {
    seoTitle: 'Software para academias deportivas | Akademate',
    metaDescription:
      'Software para academias deportivas: pruebas, equipos, temporadas y tutores, con admisiones, horarios, asistencia y pagos. Reserva una demo.',
    faqHeading: 'Software para academias deportivas: resolvemos tus dudas',
    integrationNote:
      'Cuotas mensuales y material se cobran con Stripe, PayPal o SEPA; Meta Ads y CAPI convierten la demanda local en pruebas reservadas.',
    faqs: [
      {
        question: '¿Cómo convierto pruebas en deportistas inscritos?',
        answer:
          'Las pruebas siguen el mismo flujo de CRM y reservas: la familia reserva, tu equipo hace seguimiento y la prueba pasa a plaza confirmada con su facturación.',
      },
      {
        question: '¿Los tutores pueden seguir a sus deportistas?',
        answer:
          'Las herramientas de comunicación mantienen a los tutores cerca de sesiones y noticias de temporada, con roles que separan personal, entrenadores y familias.',
      },
      {
        question: '¿Soportáis equipos, instalaciones y temporadas?',
        answer:
          'Cursos, cohortes, horarios y sedes modelan equipos, entrenamientos e instalaciones, con temporadas y categorías como cohortes.',
      },
      {
        question: '¿Cómo funciona la facturación?',
        answer:
          'La facturación recurrente y los pagos únicos cubren cuotas, matrícula y material, y los cobros muestran quién debe qué en todo momento.',
      },
      {
        question: 'Entrenamos en varias instalaciones. ¿Una sola cuenta?',
        answer:
          'Sí. Espacios multi-sede con roles por instalación e informes de red mantienen todas las sedes alineadas.',
      },
    ],
  },
  languages: {
    seoTitle: 'Software para academias de idiomas | Akademate',
    metaDescription:
      'Software para academias de idiomas: nivelación, grupos, facturación mensual y modalidad híbrida. Llena cada nivel y cobra sin fricción. Reserva una demo.',
    faqHeading: 'Software para academias de idiomas: resolvemos tus dudas',
    integrationNote:
      'La facturación mensual se cobra con Stripe, PayPal o SEPA; Meta Ads y CAPI llevan tus campañas directamente al CRM.',
    faqs: [
      {
        question: '¿Cómo funciona la nivelación?',
        answer:
          'La nivelación es un paso de admisiones: captas la consulta, haces la prueba de nivel y asignas el grupo adecuado desde el mismo expediente.',
      },
      {
        question: '¿Podemos facturar mensualmente de forma automática?',
        answer:
          'La facturación recurrente gestiona las cuotas mensuales, y los cobros con recordatorios mantienen la recaudación al día.',
      },
      {
        question: '¿Podemos combinar grupos online y presenciales?',
        answer:
          'El campus virtual convive con horarios y sedes, así que los grupos híbridos comparten un expediente y una vista de progreso.',
      },
      {
        question: '¿Qué pasa cuando un grupo se llena?',
        answer:
          'Aforo y lista de espera por grupo: cuando hay demanda, la ves y abres el siguiente grupo con confianza.',
      },
      {
        question: '¿Los docentes ven solo sus grupos?',
        answer:
          'El espacio del docente da a cada profesor su horario, sus listas y su progreso sin exponer el resto de la academia.',
      },
    ],
  },
  'driving-schools': {
    seoTitle: 'Software para autoescuelas | Akademate',
    metaDescription:
      'Software para autoescuelas que llena la agenda: clases, vehículos, exámenes y cobros en un solo expediente. Reserva una demo con Akademate.',
    faqHeading: 'Software para autoescuelas: resolvemos tus dudas',
    integrationNote:
      'Bonos y depósitos se cobran con Stripe, PayPal o SEPA; Meta Ads y CAPI convierten las búsquedas locales en clases reservadas.',
    faqs: [
      {
        question: '¿Los alumnos pueden reservar sus clases sin llamar?',
        answer:
          'Sí. Las páginas de oferta con reserva y aforo permiten reservar desde el móvil, y los recordatorios salen solos.',
      },
      {
        question: '¿Cómo evita la agenda dobles reservas de monitores y coches?',
        answer:
          'Horarios y reservas tratan monitores, vehículos y huecos como aforo: un hueco solo se puede reservar una vez y el calendario se mantiene honesto.',
      },
      {
        question: '¿Registra fechas de examen y recuperaciones?',
        answer:
          'Fechas de examen, progreso y cobros viven en un mismo expediente, así que cada convocatoria y recuperación se ve junto a las clases que la preparan.',
      },
      {
        question: '¿Podemos cobrar depósitos y controlar plazos de pago?',
        answer:
          'El checkout admite depósitos o pagos únicos, la facturación recurrente cubre planes mensuales y los cobros muestran exactamente quién debe qué.',
      },
      {
        question: 'Tenemos dos sedes. ¿Una sola cuenta?',
        answer:
          'Sí. Espacios multi-sede con roles por sede e informes de red mantienen ambas sedes en un expediente por alumno.',
      },
    ],
  },
  seasonal: {
    seoTitle: 'Software para campamentos de verano | Akademate',
    metaDescription:
      'Software para campamentos: lanza, llena y opera tu temporada con páginas de oferta, aforo, listas de espera, depósitos y comunicación familiar. Reserva una demo.',
    faqHeading: 'Software para campamentos: resolvemos tus dudas',
    integrationNote:
      'Depósitos y pagos únicos se cobran con Stripe, PayPal o SEPA; Meta Ads y CAPI llenan tu embudo desde el inicio.',
    faqs: [
      {
        question: '¿Qué rápido podemos publicar un campamento?',
        answer:
          'Launch está hecho para eso: una página de oferta pública con fechas, aforo y plazos se publica en días, con emails de confirmación y recordatorio incluidos.',
      },
      {
        question: '¿Podemos cobrar depósitos?',
        answer:
          'Sí. El checkout admite depósitos o pagos únicos, así que las familias reservan plaza sin pagar la temporada completa por adelantado.',
      },
      {
        question: '¿Qué pasa cuando una semana se llena?',
        answer:
          'Aforo y lista de espera por semana: las familias entran en la lista y tú ves la demanda con claridad para abrir otro grupo.',
      },
      {
        question: '¿Cómo mantenemos informadas a las familias?',
        answer:
          'Las herramientas de comunicación envían información de llegada y recordatorios desde eventos operativos, por programa y por familia.',
      },
      {
        question: '¿Podemos gestionar semanas, edades y grupos?',
        answer: 'Cohortes, horarios y sedes modelan semanas, grupos de edad y salas en un único calendario.',
      },
    ],
  },
  'coding-academies': {
    seoTitle: 'Software para academias de programación | Akademate',
    metaDescription:
      'Software para academias de programación: cohortes, proyectos y mentores, con admisiones, campus, progreso y pagos de la solicitud al empleo. Reserva una demo.',
    faqHeading: 'Software para academias de programación: resolvemos tus dudas',
    integrationNote:
      'Depósitos y planes a plazos se cobran con Stripe, PayPal o SEPA; Meta Ads y CAPI alimentan tu embudo de solicitudes.',
    faqs: [
      {
        question: '¿Cómo funcionan las solicitudes por cohorte?',
        answer:
          'Admisiones va del interés a la plaza confirmada: solicitudes, entrevistas y depósitos en un único embudo por cohorte.',
      },
      {
        question: '¿Los alumnos pueden tener sus proyectos en un solo sitio?',
        answer:
          'El campus virtual guarda tareas, proyectos y feedback, así que cada cohorte tiene un hogar en lugar de cinco herramientas.',
      },
      {
        question: '¿Qué ven los mentores?',
        answer:
          'Cada mentor tiene una vista clara de sus alumnos: progreso, entregas y asistencia, sin el resto de la escuela de por medio.',
      },
      {
        question: '¿Podemos mostrar portafolios listos para empleo?',
        answer:
          'El trabajo de proyecto y la finalización viven en el expediente del alumno, listos para compartir con empresas al terminar la cohorte.',
      },
      {
        question: '¿Podemos cobrar por cohorte o a plazos?',
        answer:
          'Ambos: depósitos, pagos únicos y facturación recurrente cubren modelos anticipados y a plazos, con cobros asociados.',
      },
    ],
  },
  'performing-arts': {
    seoTitle: 'Software para academias de música y danza | Akademate',
    metaDescription:
      'Software para academias de música y danza: clases recurrentes, cuentas familiares, actuaciones y pagos en un mismo lugar. Reserva una demo.',
    faqHeading: 'Software para academias de música: resolvemos tus dudas',
    integrationNote:
      'Cuotas mensuales y cargos de recitales se cobran con Stripe, PayPal o SEPA; Meta Ads y CAPI llenan tus clases.',
    faqs: [
      {
        question: '¿Cómo funcionan las clases recurrentes?',
        answer:
          'Los horarios recurrentes por docente, estudio y disciplina mantienen cada clase reservada, y las familias ven su hueco sin llamarte.',
      },
      {
        question: '¿Las familias pueden gestionar varios hijos?',
        answer: 'Las cuentas familiares agrupan hermanos, horarios y pagos bajo un mismo techo.',
      },
      {
        question: '¿Podemos planificar actuaciones?',
        answer:
          'Eventos y progreso permiten planificar producciones desde una vista, con reparto y familias informados desde el mismo expediente.',
      },
      {
        question: '¿Cómo seguimos el progreso de cada alumno?',
        answer:
          'Progreso y asistencia viven en el expediente de cada alumno, visibles para docentes y familias.',
      },
      {
        question: '¿Podemos facturar mensualmente?',
        answer: 'La facturación recurrente y los cobros mantienen las cuotas al día sin perseguir a nadie.',
      },
    ],
  },
  'online-cohorts': {
    seoTitle: 'Software de cursos por cohortes | Akademate',
    metaDescription:
      'Software de cursos por cohortes para escuelas online: admisiones, campus virtual, comunidad y progreso de la solicitud a la finalización. Reserva una demo.',
    faqHeading: 'Software de cursos por cohortes: resolvemos tus dudas',
    integrationNote:
      'Depósitos y plazos se cobran con Stripe, PayPal o SEPA; Meta Ads y CAPI alimentan tu embudo de solicitudes.',
    faqs: [
      {
        question: '¿Cómo admitimos una cohorte?',
        answer:
          'Admisiones por cohorte: solicitud, depósito y confirmación, con plazas y plazos controlados por la plataforma.',
      },
      {
        question: '¿Dónde aprende el alumnado?',
        answer:
          'Un campus virtual: tareas, chat, progreso y comunidad en un único hogar para cada cohorte.',
      },
      {
        question: '¿Cómo se mantiene activa la comunidad entre sesiones?',
        answer:
          'El chat y las herramientas de comunidad mantienen a las cohortes conversando entre sesiones, en el mismo expediente que su aprendizaje.',
      },
      {
        question: '¿Podemos ver quién se queda atrás?',
        answer:
          'La analítica de aprendizaje muestra progreso y finalización a tiempo para actuar, por alumno y por cohorte.',
      },
      {
        question: '¿Cómo funcionan los pagos?',
        answer:
          'Depósitos, pagos únicos o plazos en el checkout, con cobros y conciliación en la misma plataforma.',
      },
    ],
  },
  networks: {
    seoTitle: 'Software multisede para academias | Akademate',
    metaDescription:
      'Software multisede para grupos y franquicias de academias: estándares compartidos, control local, dominios propios e informes de red. Habla con Enterprise.',
    faqHeading: 'Software multisede: resolvemos tus dudas',
    integrationNote:
      'Cada sede mantiene su responsabilidad de cobro; Stripe, PayPal y SEPA siguen conectados en toda la red.',
    faqs: [
      {
        question: '¿Cada sede puede mantener su dominio y su facturación?',
        answer:
          'Sí. El modelo multimarca y multisede admite dominios propios y responsabilidad de pago separada por sede.',
      },
      {
        question: '¿Cómo mantenemos los estándares consistentes?',
        answer:
          'Los estándares se definen a nivel central y cada sede opera dentro de ellos, así que la calidad escala sin microgestión.',
      },
      {
        question: '¿Quién ve qué?',
        answer:
          'Los roles separan dirección central y equipos locales: espacios por sede para el día a día, informes de red para el grupo.',
      },
      {
        question: '¿Podemos comparar sedes?',
        answer:
          'Los informes de red ponen el rendimiento de todas las sedes en una vista, de la inscripción al cobro.',
      },
      {
        question: '¿Puede funcionar en infraestructura privada?',
        answer:
          'Enterprise funciona en nube gestionada, nube privada dedicada o on-premise, con un programa de migración e integración.',
      },
    ],
  },
}

export const spanishVerticalProofQuotes: Partial<Record<VerticalSlug, readonly VerticalProofQuote[]>> = {
  'professional-training': [
    { quote: 'El servicio es excelente.', author: 'Olga Mercedes' },
    { quote: 'Lo recomiendo al 100%.', author: 'Isabel Clemente' },
    { quote: 'La mejor academia de la isla.', author: 'Mr. Avocato' },
  ],
}
