export type StaticBlogSection = {
  heading: string
  paragraphs: string[]
}

export type StaticBlogPost = {
  slug: string
  title: string
  seoTitle: string
  metaDescription: string
  excerpt: string
  category: string
  date: string
  updatedAt: string
  author: string
  readingTime: string
  keywords: string[]
  image: string
  sections: StaticBlogSection[]
  faqs: Array<{ question: string; answer: string }>
}

export const STATIC_BLOG_POSTS: StaticBlogPost[] = [
  {
    slug: 'como-elegir-formacion-profesional-en-tenerife',
    title: 'Cómo elegir formación profesional en Tenerife sin equivocarte',
    seoTitle: 'Cómo elegir formación profesional en Tenerife | CEP Formación',
    metaDescription:
      'Guía SEO completa para elegir formación profesional en Tenerife: modalidad, salidas, requisitos, prácticas, empleabilidad y orientación antes de matricularte.',
    excerpt:
      'Aprende a comparar cursos, ciclos y teleformación según tu objetivo laboral, tu disponibilidad y las salidas profesionales reales en Tenerife.',
    category: 'Orientación',
    date: '2026-05-12',
    updatedAt: '2026-05-12',
    author: 'Equipo de orientación CEP Formación',
    readingTime: '7 min',
    keywords: [
      'formación profesional Tenerife',
      'cursos en Tenerife',
      'ciclos formativos Tenerife',
      'orientación académica',
      'CEP Formación',
    ],
    image: '/website/cep/hero/cepformacion-hero-01.png',
    sections: [
      {
        heading: 'Empieza por el objetivo profesional, no por el nombre del curso',
        paragraphs: [
          'Elegir formación profesional no debería depender únicamente de que un título suene atractivo. La primera pregunta útil es qué cambio quieres conseguir: incorporarte al mercado laboral, mejorar tu puesto actual, preparar una titulación oficial o especializarte en un sector concreto. Ese objetivo condiciona la modalidad, la duración, el nivel de acompañamiento y el tipo de prácticas que debes buscar.',
          'En Tenerife conviven perfiles muy distintos: personas que buscan una primera oportunidad, profesionales que necesitan actualizar competencias, desempleados que quieren acceder a convocatorias subvencionadas y alumnos que necesitan compatibilizar estudio con trabajo o familia. Una buena elección formativa parte de esa realidad y no de una promesa genérica.',
        ],
      },
      {
        heading: 'Compara modalidad, tiempo disponible y ritmo de estudio',
        paragraphs: [
          'La modalidad presencial es recomendable cuando necesitas práctica guiada, contacto directo con el docente o uso de instalaciones. La teleformación encaja mejor si necesitas flexibilidad, puedes organizarte de forma autónoma y el contenido está estructurado en módulos claros. En ciclos formativos oficiales, además, conviene revisar régimen, prácticas, requisitos de acceso y reconocimiento académico.',
          'Antes de matricularte, calcula cuántas horas reales puedes dedicar cada semana. Un curso corto puede exigir intensidad; una formación más larga puede ser más sostenible si se adapta mejor a tu agenda. Lo importante es evitar una matrícula impulsiva y elegir un itinerario que puedas terminar.',
        ],
      },
      {
        heading: 'Revisa salidas, prácticas y acompañamiento',
        paragraphs: [
          'Una formación orientada al empleo debe explicar qué competencias vas a adquirir, qué sectores pueden valorar ese perfil y cómo se conecta el aprendizaje con situaciones profesionales reales. Si existen prácticas, pregunta por duración, condiciones y tipo de empresa o entorno donde se desarrollan.',
          'También importa el acompañamiento. En CEP Formación, el equipo de admisiones y orientación ayuda a valorar requisitos, horarios, sedes, convocatorias disponibles y opciones de empleabilidad. Esa conversación previa evita errores frecuentes: elegir por precio, por cercanía o por moda sin comprobar si el curso encaja con tu objetivo.',
        ],
      },
      {
        heading: 'Checklist antes de solicitar información',
        paragraphs: [
          'Antes de cerrar tu decisión, revisa cinco puntos: objetivo profesional, modalidad, duración, requisitos y salida laboral. Si alguna respuesta no está clara, solicita asesoramiento. La mejor formación no es siempre la más rápida, sino la que te acerca de forma realista al siguiente paso que quieres dar.',
          'Si estás en Tenerife y dudas entre cursos privados, formación para desempleados, formación para ocupados, teleformación o ciclos formativos, compara cada opción con criterio. La decisión correcta debe darte claridad, no más incertidumbre.',
        ],
      },
    ],
    faqs: [
      {
        question: '¿Qué modalidad de formación me conviene más?',
        answer:
          'Depende de tu disponibilidad, autonomía y necesidad de práctica presencial. Si necesitas flexibilidad, la teleformación puede encajar; si necesitas práctica guiada, una opción presencial puede ser mejor.',
      },
      {
        question: '¿Conviene elegir un curso solo por sus salidas laborales?',
        answer:
          'Las salidas son importantes, pero deben cruzarse con requisitos, habilidades personales, modalidad y tiempo disponible para completar la formación.',
      },
    ],
  },
  {
    slug: 'teleformacion-estudiar-a-tu-ritmo',
    title: 'Teleformación: cómo estudiar online a tu ritmo y terminar el curso',
    seoTitle: 'Teleformación en Tenerife: estudiar online a tu ritmo | CEP Formación',
    metaDescription:
      'Consejos prácticos para estudiar teleformación: organización, hábitos, contenidos online, seguimiento y claves para completar un curso a distancia.',
    excerpt:
      'La formación online funciona cuando combina flexibilidad con método. Aprende cómo organizarte y elegir un curso online con garantías.',
    category: 'Teleformación',
    date: '2026-05-12',
    updatedAt: '2026-05-12',
    author: 'Equipo académico CEP Formación',
    readingTime: '6 min',
    keywords: ['teleformación', 'cursos online Tenerife', 'estudiar online', 'formación a distancia', 'curso online CEP'],
    image: '/media/tatuaje-profesional-online.webp',
    sections: [
      {
        heading: 'Qué significa estudiar a tu ritmo',
        paragraphs: [
          'Estudiar a tu ritmo no significa estudiar sin planificación. La teleformación permite iniciar un curso sin depender de una fecha fija, avanzar desde casa y adaptar el aprendizaje a tu disponibilidad. Pero para que funcione, necesitas objetivos semanales, materiales ordenados y una rutina mínima de estudio.',
          'Esta modalidad es especialmente útil para personas que trabajan, viven lejos de una sede, tienen turnos cambiantes o necesitan combinar formación con responsabilidades personales. La clave está en convertir la flexibilidad en constancia.',
        ],
      },
      {
        heading: 'Cómo organizar una formación online',
        paragraphs: [
          'Reserva bloques concretos de tiempo, aunque sean cortos. Dos o tres sesiones semanales bien mantenidas suelen funcionar mejor que estudiar muchas horas un solo día. Revisa primero el índice del curso, identifica módulos complejos y marca fechas orientativas para avanzar.',
          'Un buen curso online debe tener contenidos claros, recursos descargables o visuales cuando sean necesarios, actividades de repaso y una estructura que permita volver a los temas importantes. Si el curso es técnico, como una formación en tatuaje profesional, también debe cuidar seguridad, higiene, material, dibujo y protocolos.',
        ],
      },
      {
        heading: 'Errores frecuentes en teleformación',
        paragraphs: [
          'El error más común es dejar el curso para cuando haya tiempo. Ese momento rara vez aparece. Otro error es avanzar sin tomar notas o sin revisar conceptos clave. En formación online, el alumno tiene más autonomía, pero también más responsabilidad sobre su progreso.',
          'Para evitar abandonos, conviene fijar una meta concreta: terminar un módulo por semana, preparar un portfolio, completar actividades o reservar un horario estable. La motivación inicial ayuda, pero el sistema de estudio es lo que permite terminar.',
        ],
      },
      {
        heading: 'Cuándo elegir teleformación',
        paragraphs: [
          'La teleformación es una buena opción cuando necesitas flexibilidad, quieres iniciar pronto y puedes seguir una estructura autónoma. También es útil para explorar una nueva área profesional antes de dar un salto mayor.',
          'Antes de matricularte, revisa duración, contenidos, soporte, requisitos y si el curso se ajusta a tu nivel. La formación online debe darte libertad, pero también claridad sobre qué aprenderás y cómo aplicarás esos conocimientos.',
        ],
      },
    ],
    faqs: [
      {
        question: '¿La teleformación tiene fecha fija de inicio?',
        answer:
          'En los cursos online de matrícula abierta puedes empezar cuando quieras y avanzar según tu disponibilidad, siempre siguiendo la estructura del programa.',
      },
      {
        question: '¿Qué necesito para estudiar online?',
        answer:
          'Necesitas conexión a internet, un dispositivo adecuado, planificación semanal y un espacio donde puedas concentrarte de forma regular.',
      },
    ],
  },
  {
    slug: 'agencia-colocacion-y-bolsa-de-empleo',
    title: 'Agencia de colocación y bolsa de empleo: cómo puede ayudarte',
    seoTitle: 'Agencia de colocación y bolsa de empleo en Tenerife | CEP Formación',
    metaDescription:
      'Descubre cómo funciona la agencia de colocación de CEP Formación: registro de candidatos, ofertas, empresas, orientación laboral y empleabilidad.',
    excerpt:
      'La agencia de colocación conecta formación, orientación y empresas para mejorar las oportunidades de inserción laboral.',
    category: 'Empleo',
    date: '2026-05-12',
    updatedAt: '2026-05-12',
    author: 'Equipo de empleo CEP Formación',
    readingTime: '6 min',
    keywords: ['agencia de colocación Tenerife', 'bolsa de empleo', 'empleo Tenerife', 'orientación laboral', 'CEP Formación empleo'],
    image: '/media/admin-1.jpg',
    sections: [
      {
        heading: 'Qué es una agencia de colocación',
        paragraphs: [
          'Una agencia de colocación es un servicio que facilita la conexión entre personas que buscan empleo y empresas que necesitan incorporar talento. Su función no se limita a publicar ofertas: también puede orientar, registrar perfiles, valorar candidaturas y acompañar procesos de selección.',
          'CEP Formación cuenta con agencia de colocación autorizada, número 0500000212, vinculada a su actividad formativa y a la mejora de la empleabilidad de alumnos, antiguos alumnos y candidatos registrados.',
        ],
      },
      {
        heading: 'Cómo ayuda a los candidatos',
        paragraphs: [
          'El primer paso es completar el registro con datos personales, formación, experiencia y ocupaciones de interés. Cuanto más claro esté el perfil, más fácil será identificar oportunidades compatibles. No se trata solo de subir un currículum, sino de construir una candidatura comprensible para procesos reales.',
          'La orientación laboral ayuda a mejorar el enfoque: qué puestos buscar, cómo presentar la experiencia, qué formación complementaria puede reforzar el perfil y cómo preparar entrevistas. Para muchas personas, ese acompañamiento marca la diferencia entre enviar candidaturas sin respuesta y moverse con estrategia.',
        ],
      },
      {
        heading: 'Cómo ayuda a las empresas',
        paragraphs: [
          'Las empresas pueden utilizar el portal para registrar ofertas y solicitar perfiles. Esto facilita la intermediación con candidatos que ya han mostrado interés en mejorar su empleabilidad y que pueden estar vinculados a áreas profesionales concretas.',
          'El valor para la empresa está en reducir ruido: recibir candidaturas más ajustadas, contar con información estructurada y conectar con un centro que conoce la trayectoria formativa de muchos perfiles.',
        ],
      },
      {
        heading: 'Formación y empleo deben trabajar juntos',
        paragraphs: [
          'La formación profesional tiene más impacto cuando se conecta con orientación, prácticas, bolsa de empleo y conocimiento del mercado local. En Tenerife, donde muchos sectores necesitan perfiles cualificados, esta conexión permite tomar mejores decisiones antes, durante y después del curso.',
          'Si quieres mejorar tu empleabilidad, el registro en la agencia de colocación es un paso útil. Y si todavía no tienes claro qué formación elegir, conviene hablar primero con orientación para alinear curso, competencias y objetivo profesional.',
        ],
      },
    ],
    faqs: [
      {
        question: '¿Quién puede registrarse como candidato?',
        answer:
          'Puede registrarse cualquier persona interesada en participar en procesos de empleo y completar su perfil profesional en el portal de candidatos.',
      },
      {
        question: '¿Las empresas pueden publicar ofertas?',
        answer:
          'Sí. El portal dispone de acceso para empresas que quieran registrar ofertas y participar en procesos de intermediación laboral.',
      },
    ],
  },
  {
    slug: 'ciclos-formativos-oficiales-salidas-profesionales',
    title: 'Ciclos formativos oficiales: qué revisar antes de matricularte',
    seoTitle: 'Ciclos formativos oficiales en Tenerife: guía antes de matricularte',
    metaDescription:
      'Guía para elegir ciclos formativos oficiales en Tenerife: grado medio, grado superior, requisitos, prácticas, modalidad y salidas profesionales.',
    excerpt:
      'Los ciclos oficiales combinan titulación reconocida, formación práctica y continuidad académica. Revisa estos puntos antes de decidir.',
    category: 'Ciclos FP',
    date: '2026-05-12',
    updatedAt: '2026-05-12',
    author: 'Equipo académico CEP Formación',
    readingTime: '7 min',
    keywords: ['ciclos formativos Tenerife', 'grado medio Tenerife', 'grado superior Tenerife', 'FP oficial', 'prácticas empresa FP'],
    image: '/website/cep/hero/cepformacion-hero-08.png',
    sections: [
      {
        heading: 'Qué aporta un ciclo formativo oficial',
        paragraphs: [
          'Un ciclo formativo oficial ofrece una titulación reconocida y un itinerario académico estructurado. Es una opción sólida para quienes buscan incorporarse a una profesión regulada o continuar estudios dentro del sistema educativo.',
          'La diferencia frente a otros cursos está en el marco oficial: módulos, duración, evaluación, prácticas y requisitos de acceso. Por eso conviene revisar bien si el ciclo corresponde a grado medio o grado superior y qué posibilidades abre después.',
        ],
      },
      {
        heading: 'Requisitos, modalidad y prácticas',
        paragraphs: [
          'Antes de matricularte, confirma requisitos de acceso, documentación, duración, modalidad y carga presencial. En algunos ciclos, la modalidad semipresencial puede facilitar la compatibilidad con otras responsabilidades, pero exige organización y constancia.',
          'Las prácticas en empresa son una parte clave porque acercan el aprendizaje a contextos profesionales reales. Pregunta cuántas horas incluye el ciclo, cómo se gestionan y qué tipo de competencias se espera desarrollar durante ese periodo.',
        ],
      },
      {
        heading: 'Salidas profesionales y continuidad',
        paragraphs: [
          'Elegir un ciclo solo por empleabilidad inmediata puede ser insuficiente. También debes revisar si te permite seguir estudiando, especializarte o acceder a otros itinerarios. Un grado medio puede ser un primer paso hacia un grado superior; un grado superior puede abrir puertas a empleo cualificado y continuidad académica.',
          'En áreas sanitarias, sociosanitarias y técnicas, la titulación oficial puede ser un elemento diferencial. Lo importante es conectar la elección con un plan: qué puesto quieres ocupar, qué competencias necesitas y qué recorrido quieres construir.',
        ],
      },
      {
        heading: 'Cómo decidir con seguridad',
        paragraphs: [
          'Solicita información antes de tomar la decisión. Una buena orientación debe aclarar requisitos, calendario, modalidad, prácticas, coste, financiación si existe y salidas. Cuanto más concreta sea la información, menos riesgo hay de abandonar o elegir un itinerario que no encaja.',
          'En CEP Formación, los ciclos oficiales se presentan con información académica y orientación para que cada alumno entienda qué implica la matrícula y qué posibilidades puede abrir.',
        ],
      },
    ],
    faqs: [
      {
        question: '¿Qué diferencia hay entre grado medio y grado superior?',
        answer:
          'La diferencia está en el nivel académico, requisitos de acceso, competencias y continuidad. El grado superior suele orientar a perfiles de mayor cualificación técnica.',
      },
      {
        question: '¿Las prácticas son importantes en un ciclo oficial?',
        answer:
          'Sí. Las prácticas conectan la formación con entornos profesionales y permiten aplicar competencias en situaciones reales.',
      },
    ],
  },
]

export function findStaticBlogPost(slug: string) {
  return STATIC_BLOG_POSTS.find((post) => post.slug === slug) ?? null
}
