export type StaticBlogPost = {
  slug: string
  title: string
  excerpt: string
  category: string
  date: string
  image: string
  body: string[]
}

export const STATIC_BLOG_POSTS: StaticBlogPost[] = [
  {
    slug: 'como-elegir-formacion-profesional-en-tenerife',
    title: 'Cómo elegir tu próxima formación profesional en Tenerife',
    excerpt:
      'Una guía práctica para valorar modalidad, salidas profesionales, requisitos y acompañamiento antes de matricularte.',
    category: 'Orientación',
    date: '2026-05-12',
    image: '/website/cep/hero/cepformacion-hero-01.png',
    body: [
      'Elegir formación no debería depender solo del nombre del curso. Antes de matricularte conviene revisar qué objetivo profesional tienes, qué disponibilidad real puedes sostener y qué tipo de acompañamiento necesitas durante el proceso.',
      'En CEP Formación trabajamos con itinerarios presenciales, oficiales, subvencionados y de teleformación. La decisión cambia si buscas incorporarte rápido al mercado laboral, mejorar tu perfil actual o preparar una titulación con continuidad académica.',
      'También es importante preguntar por prácticas, requisitos, sede, calendario, bolsa de empleo y orientación. Una buena elección combina contenido útil, ritmo asumible y una salida profesional coherente con tu situación.',
    ],
  },
  {
    slug: 'teleformacion-estudiar-a-tu-ritmo',
    title: 'Teleformación: cuándo tiene sentido estudiar a tu ritmo',
    excerpt:
      'La formación online funciona mejor cuando el curso tiene objetivos claros, recursos ordenados y una planificación realista.',
    category: 'Teleformación',
    date: '2026-05-12',
    image: '/media/tatuaje-profesional-online.webp',
    body: [
      'La teleformación permite empezar sin esperar a una fecha fija y avanzar con más flexibilidad. Es especialmente útil para personas que trabajan, viven lejos de una sede o necesitan compatibilizar estudio y responsabilidades personales.',
      'Para aprovecharla bien, conviene reservar bloques semanales de estudio, revisar los contenidos por módulos y mantener una rutina de entregas o autoevaluación. Estudiar a tu ritmo no significa estudiar sin estructura.',
      'En cursos online como Tatuaje Profesional, el enfoque debe equilibrar creatividad, fundamentos técnicos, seguridad e higiene, preparación del material y criterio profesional.',
    ],
  },
  {
    slug: 'agencia-colocacion-y-bolsa-de-empleo',
    title: 'Agencia de colocación y bolsa de empleo: cómo puede ayudarte',
    excerpt:
      'La agencia de colocación conecta orientación, candidaturas y empresas para mejorar las opciones de inserción laboral.',
    category: 'Empleo',
    date: '2026-05-12',
    image: '/media/admin-1.jpg',
    body: [
      'La formación gana valor cuando se acompaña de orientación laboral. Una agencia de colocación permite registrar el perfil profesional, valorar competencias y participar en procesos que encajan con la trayectoria de cada candidato.',
      'El servicio de CEP Formación está vinculado a la Agencia de Colocación autorizada 0500000212, con registro para candidatos y acceso para empresas desde el portal oficial.',
      'Completar el perfil con datos académicos, experiencia, ocupaciones y disponibilidad facilita que el equipo pueda orientar mejor la búsqueda y conectar candidaturas con ofertas activas.',
    ],
  },
]

export function findStaticBlogPost(slug: string) {
  return STATIC_BLOG_POSTS.find((post) => post.slug === slug) ?? null
}
