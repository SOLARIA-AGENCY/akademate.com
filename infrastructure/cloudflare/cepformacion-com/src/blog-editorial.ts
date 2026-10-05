import { EMPLEO_OFFICE_IMAGE } from './empleo-image'

type Section = { heading: string; paragraphs: string[] }
type Photo = { src: string; alt: string; caption: string }
type Post = {
  slug: string
  title: string
  seoTitle: string
  description: string
  excerpt: string
  category: string
  date: string
  readingTime: string
  keywords: string[]
  photos: Photo[]
  sections: Section[]
  faqs: Array<{ question: string; answer: string }>
}

const ORIGIN = 'https://cepformacion.com'
const SUR_NEWS_PHOTO = '/images/sedes/sede-cep-sur.png'
const BLOG_HERO = '/website/cep/hero/blog-formacion-hero-v2.png'

const POSTS: Post[] = [
  {
    slug: 'conocer-nuestra-historia',
    title: 'La historia familiar de quienes dirigen CEP Formación',
    seoTitle: 'Historia familiar de CEP Formación | Fran y Carol de Amo Olivier',
    description:
      'Fran y Carol de Amo Olivier dirigen CEP Formación. La familia va por la séptima generación de docentes: del primer CEP en 1981 a las tres sedes de Tenerife.',
    excerpt:
      'Fran y Carol de Amo Olivier abrieron el centro en Tenerife en 1998, con diez alumnos. La enseñanza ya venía de siete generaciones.',
    category: 'Historia',
    date: '2026-09-26',
    readingTime: '6 min',
    keywords: [
      'CEP Formación',
      'Fran de Amo Olivier',
      'Carol de Amo Olivier',
      'historia CEP Tenerife',
      'formación profesional Tenerife',
    ],
    photos: [
      {
        src: '/images/fundadores/fran-de-amo.png',
        alt: 'Fran de Amo Olivier',
        caption: 'Fran de Amo Olivier, director.',
      },
      {
        src: '/images/fundadores/carol-de-amo.jpg',
        alt: 'Carol de Amo Olivier',
        caption: 'Carol de Amo Olivier, directora.',
      },
    ],
    sections: [
      {
        heading: 'Siete generaciones enseñando',
        paragraphs: [
          'La enseñanza nos venía de casa. En CEP Formación vamos por la séptima generación dedicada a la docencia. El abuelo materno fue maestro de escuela nacional y participó en las misiones pedagógicas. La abuela materna recorría caminos en bicicleta para enseñar corte y confección.',
          'En 1981 nuestra madre abrió el primer CEP, Centro de Enseñanzas Profesionales, en una localidad pequeña de la península. De aquel aula sale lo que hoy está en Tenerife.',
        ],
      },
      {
        heading: 'Fran y Carol, y diez alumnos en La Orotava',
        paragraphs: [
          'Fran de Amo Olivier y Carol de Amo Olivier dirigen el centro en la isla, con un equipo docente y de gestión. Parecía que nuestros caminos iban por otro lado. En 1998 se abrió CEP Orotava: 1% de capital, 99% de ilusión y diez alumnos. Esa sede es hoy CEP Norte.',
          'Queríamos acompañar a quien nos eligiera. Llegaron, en su mayoría, mujeres que se habían quedado fuera del sistema educativo oficial o que habían parado su vida profesional por la vida familiar.',
        ],
      },
      {
        heading: 'El cruce en el supermercado',
        paragraphs: [
          'Las vimos crecer en conocimientos, en habilidades y en autoestima, y también en el trabajo. El ánimo, cuando nos cruzábamos en un supermercado y escuchábamos cómo había cambiado una vida, empujó la sede siguiente.',
          'En 2010 abrimos CEP Santa Cruz, en un local pequeño. En 2017 nos mudamos a las instalaciones actuales. Ese año el Ministerio de Educación reconoció al centro para impartir el ciclo superior de Higiene Bucodental.',
        ],
      },
      {
        heading: 'Tres sedes en Tenerife',
        paragraphs: [
          'Hoy CEP Formación tiene tres campus: Norte en La Orotava, Santa Cruz y Sur. Impartimos ciclos formativos oficiales, cursos privados, formación para trabajadores ocupados y desempleados, formación bonificada para empresas y talleres de inserción. La agencia de colocación acompaña ese camino.',
          'Durante el año colaboramos con ADEPAC, ADDANCA, SOS Felina, Valle Colino, Sonrisas Canarias y Caretta Caretta. Seguimos siendo los mismos. Sabemos quiénes somos, por qué estamos y para quién.',
        ],
      },
    ],
    faqs: [
      {
        question: '¿Quién dirige CEP Formación?',
        answer:
          'La dirección es de Fran de Amo Olivier y Carol de Amo Olivier, con un equipo docente y de gestión.',
      },
      {
        question: '¿Cuándo abrió CEP en Tenerife?',
        answer: 'En 1998 abrió CEP Orotava, hoy CEP Norte, con diez alumnos. CEP Santa Cruz abrió en 2010.',
      },
    ],
  },
  {
    slug: 'tres-sedes-cep-formacion-tenerife',
    title: 'De diez alumnos a tres sedes en Tenerife',
    seoTitle: 'Tres sedes de CEP Formación en Tenerife: Norte, Santa Cruz y Sur',
    description:
      'Cómo llegó CEP Formación a Tenerife: el primer CEP en 1981, La Orotava en 1998, Santa Cruz en 2010 y tres campus hoy.',
    excerpt:
      'Fechas y sedes del centro, desde el aula de diez alumnos en La Orotava hasta Norte, Santa Cruz y Sur.',
    category: 'Sedes',
    date: '2026-09-26',
    readingTime: '5 min',
    keywords: [
      'CEP Norte',
      'CEP Santa Cruz',
      'CEP Sur',
      'sedes CEP Formación',
      'formación profesional Tenerife',
    ],
    photos: [
      {
        src: '/images/sedes/sede-cep-norte.png',
        alt: 'Fachada de CEP Norte en La Orotava',
        caption: 'CEP Norte, La Orotava. Abrió en 1998 como CEP Orotava.',
      },
      {
        src: '/images/sedes/sede-cep-santa-cruz.png',
        alt: 'Fachada de CEP Santa Cruz',
        caption: 'CEP Santa Cruz. Abrió en 2010 y en 2017 pasó a las instalaciones actuales.',
      },
      {
        src: '/images/sedes/sede-cep-sur.png',
        alt: 'Fachada de CEP Sur',
        caption: 'CEP Sur, el tercer campus del centro en Tenerife.',
      },
    ],
    sections: [
      {
        heading: '1981, el primer CEP',
        paragraphs: [
          'Antes de Tenerife hubo un CEP en la península. El centro fecha ese primer Centro de Enseñanzas Profesionales en 1981, en una localidad pequeña, abierto por la madre de quienes hoy dirigen las sedes de la isla.',
          'La historia familiar, con Fran y Carol de Amo Olivier, está en el artículo de la familia. Aquí van las fechas de las sedes.',
        ],
      },
      {
        heading: '1998, diez alumnos en La Orotava',
        paragraphs: [
          'CEP Orotava abrió en 1998. El centro lo resume así: 1% de capital, 99% de ilusión y diez alumnos. Esa sede es hoy CEP Norte, en La Orotava.',
          'El grupo al que se dirigían era, en su mayoría, mujeres que habían quedado fuera del sistema educativo oficial o que habían dejado el trabajo por la vida familiar. La formación que buscaban era práctica y cercana.',
        ],
      },
      {
        heading: '2010 y 2017 en Santa Cruz',
        paragraphs: [
          'En 2010 abrió CEP Santa Cruz, en un local pequeño de la ciudad. En 2017 el centro se mudó a las instalaciones actuales. Ese mismo año el Ministerio de Educación lo reconoció para impartir el ciclo superior de Higiene Bucodental.',
          'Ese paso fijó Santa Cruz como sede de ciclos oficiales, además de los cursos privados y la formación para el empleo.',
        ],
      },
      {
        heading: 'Tres campus',
        paragraphs: [
          'El centro publica hoy tres campus: CEP Norte en La Orotava, CEP Santa Cruz y CEP Sur. Norte y Santa Cruz tienen web en cursostenerife.es. Sur tiene web en cepsur.es.',
          'Las novedades de convocatorias y fechas no van en este blog. Esa lista es la sección de noticias, pensada para lo que cambia y se puede compartir.',
        ],
      },
    ],
    faqs: [
      {
        question: '¿Cuántas sedes tiene CEP Formación en Tenerife?',
        answer: 'Tres: CEP Norte en La Orotava, CEP Santa Cruz y CEP Sur.',
      },
      {
        question: '¿Cuál fue la primera sede de la isla?',
        answer: 'CEP Orotava, abierta en 1998 con diez alumnos. Hoy es CEP Norte.',
      },
    ],
  },
  {
    slug: 'como-elegir-formacion-profesional-en-tenerife',
    title: 'Cómo elegir formación profesional en Tenerife sin equivocarte',
    seoTitle: 'Cómo elegir formación profesional en Tenerife | CEP Formación',
    description:
      'Guía SEO completa para elegir formación profesional en Tenerife: modalidad, salidas, requisitos, prácticas, empleabilidad y orientación antes de matricularte.',
    excerpt:
      'Aprende a comparar cursos, ciclos y teleformación según tu objetivo laboral, tu disponibilidad y las salidas profesionales reales en Tenerife.',
    category: 'Orientación',
    date: '2026-05-12',
    readingTime: '7 min',
    keywords: [
      'formación profesional Tenerife',
      'cursos en Tenerife',
      'ciclos formativos Tenerife',
      'orientación académica',
      'CEP Formación',
    ],
    photos: [
      {
        src: '/website/cep/hero/cepformacion-hero-01.png',
        alt: 'Formación profesional en un aula de CEP Formación',
        caption: 'La elección empieza por el objetivo profesional, no por el nombre del curso.',
      },
    ],
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
    description:
      'Consejos prácticos para estudiar teleformación: organización, hábitos, contenidos online, seguimiento y claves para completar un curso a distancia.',
    excerpt:
      'La formación online funciona cuando combina flexibilidad con método. Aprende cómo organizarte y elegir un curso online con garantías.',
    category: 'Teleformación',
    date: '2026-05-12',
    readingTime: '6 min',
    keywords: ['teleformación', 'cursos online Tenerife', 'estudiar online', 'formación a distancia', 'curso online CEP'],
    photos: [
      {
        src: '/media/tatuaje-profesional-online.webp',
        alt: 'Formación online de CEP Formación',
        caption: 'La teleformación pide horario propio, no esperar a tener tiempo.',
      },
    ],
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
    description:
      'Descubre cómo funciona la agencia de colocación de CEP Formación: registro de candidatos, ofertas, empresas, orientación laboral y empleabilidad.',
    excerpt:
      'La agencia de colocación conecta formación, orientación y empresas para mejorar las oportunidades de inserción laboral.',
    category: 'Empleo',
    date: '2026-05-12',
    readingTime: '6 min',
    keywords: ['agencia de colocación Tenerife', 'bolsa de empleo', 'empleo Tenerife', 'orientación laboral', 'CEP Formación empleo'],
    photos: [
      {
        src: EMPLEO_OFFICE_IMAGE,
        alt: 'Oficina de la agencia de colocación de CEP Formación',
        caption: 'Agencia de colocación autorizada, número 0500000212.',
      },
    ],
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
    description:
      'Guía para elegir ciclos formativos oficiales en Tenerife: grado medio, grado superior, requisitos, prácticas, modalidad y salidas profesionales.',
    excerpt:
      'Los ciclos oficiales combinan titulación reconocida, formación práctica y continuidad académica. Revisa estos puntos antes de decidir.',
    category: 'Ciclos FP',
    date: '2026-05-12',
    readingTime: '7 min',
    keywords: ['ciclos formativos Tenerife', 'grado medio Tenerife', 'grado superior Tenerife', 'FP oficial', 'prácticas empresa FP'],
    photos: [
      {
        src: '/website/cep/hero/cepformacion-hero-08.png',
        alt: 'Aula de ciclos formativos de CEP Formación',
        caption: 'Un ciclo oficial pide requisitos, modalidad y prácticas antes de la matrícula.',
      },
    ],
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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function pathOf(pathname: string): string {
  return pathname.replace(/\/+$/, '') || '/'
}

export function editorialPost(pathname: string): Post | null {
  const path = pathOf(pathname)
  const slug = path.replace(/^\/(?:p\/)?blog\//, '')
  if (slug === path) return null
  return POSTS.find((post) => post.slug === slug) ?? null
}

export function isFounderAssetPath(pathname: string): boolean {
  return pathname === '/images/fundadores/fran-de-amo.png' || pathname === '/images/fundadores/carol-de-amo.jpg'
}

export function editorialPageId(pathname: string): 'blog' | 'noticias' | 'post' | null {
  const path = pathOf(pathname)
  if (path === '/blog' || path === '/p/blog') return 'blog'
  if (path === '/noticias' || path === '/p/noticias') return 'noticias'
  if (editorialPost(path)) return 'post'
  return null
}

function shareLinks(url: string, title: string): string {
  const encoded = encodeURIComponent(url)
  const text = encodeURIComponent(title)
  return `<p class="cep-share">Compartir: <a href="https://wa.me/?text=${text}%20${encoded}">WhatsApp</a> · <a href="https://www.facebook.com/sharer/sharer.php?u=${encoded}">Facebook</a> · <a href="https://www.linkedin.com/sharing/share-offsite/?url=${encoded}">LinkedIn</a></p>`
}

function photoBlock(photos: Photo[]): string {
  const portraits = photos.length > 0 && photos.every((photo) => photo.src.includes('/images/fundadores/'))
  return `<div class="cep-editorial-photos${portraits ? ' is-portraits' : ''}">${photos
    .map(
      (photo) =>
        `<figure><img src="${escapeHtml(photo.src)}" alt="${escapeHtml(photo.alt)}" width="640" height="420"><figcaption>${escapeHtml(photo.caption)}</figcaption></figure>`,
    )
    .join('')}</div>`
}

function articleHtml(post: Post): string {
  const url = `${ORIGIN}/blog/${post.slug}`
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    inLanguage: 'es',
    mainEntityOfPage: url,
    image: post.photos.map((photo) => `${ORIGIN}${photo.src}`),
    author: { '@type': 'Organization', name: 'CEP Formación' },
    publisher: {
      '@type': 'Organization',
      name: 'CEP Formación',
      logo: { '@type': 'ImageObject', url: `${ORIGIN}/logos/cep-formacion-logo-rectangular.png` },
    },
    keywords: post.keywords.join(', '),
  }
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: post.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  }
  const sections = post.sections
    .map(
      (section) =>
        `<section><h2>${escapeHtml(section.heading)}</h2>${section.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')}</section>`,
    )
    .join('')
  const faqs = post.faqs
    .map((faq) => `<h3>${escapeHtml(faq.question)}</h3><p>${escapeHtml(faq.answer)}</p>`)
    .join('')
  return `<article data-cep-editorial-page="post">
<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>
<script type="application/ld+json">${JSON.stringify(faqLd).replace(/</g, '\\u003c')}</script>
<section class="cep-editorial-hero" data-cep-editorial-hero="blog">
<img class="cep-editorial-hero-photo" src="${BLOG_HERO}" alt="">
<div class="cep-editorial-hero-copy">
<p class="cep-kicker">${escapeHtml(post.category)} · ${escapeHtml(post.readingTime)} · ${escapeHtml(formatLongDate(post.date))}</p>
<h1>${escapeHtml(post.title)}</h1>
<p class="cep-lead">${escapeHtml(post.excerpt)}</p>
</div>
</section>
<div class="cep-editorial">
${photoBlock(post.photos)}
${sections}
<section><h2>Preguntas frecuentes</h2>${faqs}</section>
${shareLinks(url, post.title)}
<p><a href="/blog">Volver al blog</a> · <a href="/noticias">Noticias</a></p>
</div>
</article>`
}

function newsHtml(): string {
  return `<article data-cep-editorial-page="noticias" class="cep-editorial">
<p class="cep-kicker">CEP Formación</p>
<h1>Noticias</h1>
<a data-cep-news-card="1" class="cep-news-card" href="/sedes/cep-sur">
<img src="${SUR_NEWS_PHOTO}" alt="CEP Sur en San Isidro">
<div>
<p class="cep-kicker">Sedes</p>
<h2>CEP Sur, en San Isidro</h2>
<p>La sede de la calle Arguayoda, 3 atiende en el +34 922 393 692. La web de la sede es cepsur.es. Allí se imparten sanitaria, salud y deporte, veterinaria, empresa y tecnología.</p>
</div>
</a>
</article>`
}

function formatCardDate(iso: string): string {
  const [year, month, day] = iso.split('-')
  if (!year || !month || !day) return iso
  return `${Number(day)}/${Number(month)}/${year}`
}

function formatLongDate(iso: string): string {
  const [year, month, day] = iso.split('-')
  const names = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic']
  const name = names[Number(month) - 1]
  if (!year || !name || !day) return iso
  return `${Number(day)} ${name} ${year}`
}

function cardHtml(post: Post): string {
  return `<a data-cep-editorial-card="1" href="/blog/${post.slug}" class="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"><img src="${escapeHtml(post.photos[0].src)}" alt="${escapeHtml(post.photos[0].alt)}" class="h-56 w-full object-cover transition duration-300 group-hover:scale-105"><div class="p-6"><div class="flex items-center gap-3 text-xs font-black uppercase tracking-[0.16em] text-[#f2014b]"><span>${escapeHtml(post.category)}</span><span class="h-1 w-1 rounded-full bg-slate-300"></span><span>${escapeHtml(post.readingTime)}</span><span class="h-1 w-1 rounded-full bg-slate-300"></span><span>${escapeHtml(formatCardDate(post.date))}</span></div><h2 class="mt-4 text-xl font-black leading-tight text-slate-950">${escapeHtml(post.title)}</h2><p class="mt-3 line-clamp-3 text-sm leading-7 text-slate-600">${escapeHtml(post.excerpt)}</p><span class="mt-5 inline-flex text-sm font-black text-slate-950 transition group-hover:text-[#f2014b]">Leer artículo</span></div></a>`
}

const CSS = `<style data-cep-editorial-css="1">
.cep-editorial-hero{position:relative;min-height:420px;overflow:hidden;background:#020617;color:#fff}
.cep-editorial-hero-photo{position:absolute;inset:0;z-index:0;width:100%;height:100%;object-fit:cover;object-position:center}
.cep-editorial-hero::after{content:"";position:absolute;inset:0;z-index:1;background:linear-gradient(90deg,rgba(2,6,23,.78),rgba(2,6,23,.35) 58%,rgba(2,6,23,.08))}
.cep-editorial-hero-copy{position:relative;z-index:2;display:flex;min-height:420px;max-width:46rem;margin:0 auto;flex-direction:column;justify-content:center;padding:4.5rem 1.25rem}
.cep-editorial-hero h1{margin:.45rem 0 0;font-size:2.4rem;line-height:1.15;font-weight:650;color:#fff}
.cep-editorial-hero .cep-kicker{color:#fecdd3}
.cep-editorial-hero .cep-lead{color:rgba(255,255,255,.88)}
.cep-editorial{max-width:46rem;margin:0 auto;padding:2.5rem 1.25rem 4rem;color:#0f172a}
.cep-editorial h1{margin:.4rem 0 0;font-size:2.1rem;line-height:1.15;font-weight:650}
.cep-editorial h2{margin:2rem 0 0;font-size:1.45rem;line-height:1.25}
.cep-editorial h3{margin:1.1rem 0 0;font-size:1.05rem}
.cep-editorial p{margin:.8rem 0 0;font-size:1.05rem;line-height:1.7;color:#334155}
.cep-kicker{color:#f2014b;font-size:.78rem;font-weight:700}
.cep-lead{font-size:1.15rem;color:#1e293b}
.cep-editorial-photos{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.8rem;margin-top:1.4rem}
.cep-editorial-photos figure{margin:0}
.cep-editorial-photos img{width:100%;height:9.5rem;object-fit:cover;border-radius:.8rem;background:#f8fafc}
.cep-editorial-photos.is-portraits{grid-template-columns:repeat(2,minmax(0,1fr));max-width:40rem}
.cep-editorial-photos.is-portraits img{height:22rem;object-position:center 18%}
.cep-editorial-photos figcaption{margin-top:.35rem;font-size:.75rem;line-height:1.35;color:#64748b}
.cep-share a{color:#f2014b;font-weight:700;text-decoration:none}
.cep-news-card{display:grid;grid-template-columns:11rem minmax(0,1fr);gap:1rem;margin-top:1.4rem;overflow:hidden;border:1px solid #e2e8f0;border-radius:.8rem;text-decoration:none;color:inherit}
.cep-news-card img{width:100%;height:100%;min-height:8.5rem;object-fit:cover;background:#f8fafc}
.cep-news-card div{padding:1rem 1rem 1rem 0}
.cep-news-card h2{margin:.35rem 0 0}
@media (max-width:767px){.cep-editorial-photos,.cep-editorial-photos.is-portraits{grid-template-columns:1fr}.cep-editorial-photos.is-portraits img{height:26rem}.cep-editorial-hero{min-height:320px}.cep-editorial-hero-copy{min-height:320px;padding:3rem 1.25rem}.cep-editorial-hero h1{font-size:1.7rem}.cep-news-card{grid-template-columns:1fr}.cep-news-card div{padding:0 1rem 1rem}}
</style>`

function headTags(title: string, description: string, path: string): string {
  const url = `${ORIGIN}${path}`
  return `<title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(description)}"><link rel="canonical" href="${url}"><meta property="og:type" content="article"><meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:url" content="${url}">`
}

function replaceMain(html: string, id: string, body: string): string {
  const main = `<main data-cep-editorial-rendered="${id}">${body}</main>`
  if (/<main\b/i.test(html)) return html.replace(/<main\b[^>]*>[\s\S]*?<\/main>/i, main)
  if (html.includes('</body>')) return html.replace('</body>', `${main}</body>`)
  return html + main
}

function lockScript(): string {
  const cards = POSTS.map(cardHtml).join('')
  const posts = Object.fromEntries(POSTS.map((post) => [post.slug, articleHtml(post)]))
  const payload = JSON.stringify({ cards, posts, news: newsHtml() }).replace(/</g, '\\u003c')
  return `<script data-cep-editorial-lock="1">
(function () {
  if (window.__cepEditorialLock) return;
  window.__cepEditorialLock = 1;
  var data = ${payload};
  function pathName() {
    return (location.pathname || '/').replace(/\\/+$/, '') || '/';
  }
  function paint(main, html) {
    var doc = new DOMParser().parseFromString('<div id="cep-editorial-root">' + html + '</div>', 'text/html');
    var root = doc.getElementById('cep-editorial-root');
    if (!root) return;
    main.replaceChildren();
    while (root.firstChild) main.appendChild(document.importNode(root.firstChild, true));
  }
  var busy = false;
  function apply() {
    if (busy) return;
    busy = true;
    try { applyBody(); } finally { busy = false; }
  }
  function applyBody() {
    var path = pathName();
    if (path === '/blog' || path === '/p/blog') {
      if (document.querySelector('[data-cep-editorial-grid="1"]')) return;
      var empty = null;
      Array.prototype.forEach.call(document.querySelectorAll('p'), function (node) {
        if (empty) return;
        if (/Todavía no hay artículos/i.test(node.textContent || '')) empty = node;
      });
      if (empty) {
        var painted = document.createElement('div');
        painted.setAttribute('data-cep-editorial-grid', '1');
        painted.className = 'grid gap-6 sm:grid-cols-2 lg:grid-cols-3';
        paint(painted, data.cards);
        empty.replaceWith(painted);
        return;
      }
      var grid = null;
      Array.prototype.forEach.call(document.querySelectorAll('a[href^="/blog/"]'), function (link) {
        if (grid) return;
        var parent = link.parentElement;
        if (parent && parent.querySelectorAll('a[href^="/blog/"]').length > 1) grid = parent;
      });
      if (!grid || grid.querySelector('[data-cep-editorial-card="1"]')) return;
      var wrap = document.createElement('div');
      paint(wrap, data.cards);
      while (wrap.firstChild) grid.insertBefore(wrap.firstChild, grid.firstChild);
      return;
    }
    var main = document.querySelector('main');
    if (!main) return;
    if (path === '/noticias' || path === '/p/noticias') {
      if (!main.querySelector('[data-cep-editorial-page="noticias"]')) paint(main, data.news);
      return;
    }
    var match = path.match(/^(?:\\/p)?\\/blog\\/([a-z0-9-]+)$/);
    if (!match || !data.posts[match[1]]) return;
    if (!main.querySelector('[data-cep-editorial-page="post"]')) paint(main, data.posts[match[1]]);
  }
  function start() {
    apply();
    var root = document.documentElement;
    if (!root) return;
    new MutationObserver(function () { apply(); }).observe(root, { childList: true, subtree: true });
    [80, 240, 700, 1500, 3000].forEach(function (ms) { setTimeout(apply, ms); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
</script>`
}

function stripNextFlight(html: string): string {
  return html
    .replace(/<script\b([^>]*)>[\s\S]*?<\/script>/gi, (full, attrs: string) => {
      if (/data-cep-/i.test(attrs)) return full
      if (/type=["']application\/ld\+json["']/i.test(attrs)) return full
      if (/__next|\/_next\//i.test(full)) return ''
      return full
    })
    .replace(/<script\b[^>]*src="[^"]*\/_next\/[^"]*"[^>]*>\s*<\/script>/gi, '')
    .replace(/<link\b[^>]*rel="(?:module)?preload"[^>]*\/_next\/[^>]*>/gi, '')
}

export function rewriteEditorial(html: string, pathname: string): string {
  const kind = editorialPageId(pathname)
  if (!kind) return html
  let next = html
  if (!next.includes('data-cep-editorial-css="1"')) {
    next = next.includes('</head>') ? next.replace('</head>', `${CSS}</head>`) : CSS + next
  }
  if (kind === 'post') {
    const post = editorialPost(pathname)
    if (post && !next.includes('data-cep-editorial-rendered="post"')) {
      next = replaceMain(next, 'post', articleHtml(post))
      next = next.replace(/<title>[^<]*<\/title>/i, '')
      next = next.includes('</head>')
        ? next.replace('</head>', `${headTags(post.seoTitle, post.description, `/blog/${post.slug}`)}</head>`)
        : next
    }
  }
  if (kind === 'blog') {
    const cards = POSTS.map(cardHtml).join('')
    const grid = `<div data-cep-editorial-grid="1" class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">${cards}</div>`
    if (next.includes("Todavía no hay artículos publicados")) {
      next = next.split('<p class="rounded-lg border border-slate-200 bg-slate-50 p-8 text-slate-600">Todavía no hay artículos publicados. Cuando el centro los escriba aparecerán aquí.</p>').join(grid)
    } else if (!next.includes('data-cep-editorial-card="1"')) {
      next = next.replace(/(<a\b[^>]*href="\/blog\/)/i, `${cards}$1`)
    }
  }

  if (kind === 'noticias' && !next.includes('data-cep-editorial-rendered="noticias"')) {
    next = replaceMain(next, 'noticias', newsHtml())
    next = next.replace(/<title>[^<]*<\/title>/i, '')
    next = next.includes('</head>')
      ? next.replace(
          '</head>',
          `${headTags('Noticias de CEP Formación en Tenerife', 'CEP Sur, en la calle Arguayoda 3 de San Isidro. Teléfono +34 922 393 692. Web cepsur.es.', '/noticias')}</head>`,
        )
      : next
  }
  if (!next.includes('data-cep-editorial-lock="1"')) {
    next = next.includes('</body>') ? next.replace('</body>', `${lockScript()}</body>`) : next + lockScript()
  }
  if (kind === 'post' || kind === 'noticias' || kind === 'blog') next = stripNextFlight(next)
  return next
}

export const EDITORIAL_POST_SLUGS = POSTS.map((post) => post.slug)
