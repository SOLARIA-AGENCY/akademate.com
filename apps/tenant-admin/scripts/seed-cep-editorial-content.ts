import { getPayload } from 'payload'
import configPromise from '@payload-config'

type EligibleRole = 'admin' | 'gestor' | 'marketing'
type FaqCategory = 'general' | 'courses' | 'enrollment' | 'payments' | 'technical'

type UserDoc = {
  id: string | number
  email?: string
  role?: string
}

type LexicalParagraph = {
  type: 'paragraph'
  children: Array<{ text: string }>
}

type BlogPostSeed = {
  slug: string
  title: string
  excerpt: string
  contentLines: string[]
  featured: boolean
  tags: string[]
  meta_title: string
  meta_description: string
  status: 'published'
  language: 'es'
}

type FaqSeed = {
  slug: string
  question: string
  answerLines: string[]
  category: FaqCategory
  order: number
  featured: boolean
  keywords: string[]
  status: 'published'
  language: 'es'
}

type CliOptions = {
  dryRun: boolean
  authorEmail?: string
}

const REQUIRED_BLOG_COUNT = 2
const REQUIRED_FAQ_COUNT = 12

const BLOG_POSTS: BlogPostSeed[] = [
  {
    slug: 'como-elegir-tu-formacion-en-cep-desempleados-ocupados-y-privados',
    title: 'Cómo elegir tu formación en CEP: desempleados, ocupados y privada',
    excerpt:
      'Te ayudamos a elegir entre formación para desempleados, ocupados y privada en CEP, entendiendo modalidades, requisitos y el proceso de preinscripción paso a paso.',
    contentLines: [
      'Elegir bien un curso empieza por identificar tu situación actual: si estás desempleado, trabajando o buscas una opción privada con un itinerario más personalizado.',
      'En CEP Formación conviven tres líneas de acceso: cursos para personas desempleadas, cursos para personas ocupadas y oferta privada. Cada una responde a objetivos y condiciones distintas.',
      'En desempleados y ocupados encontrarás acciones formativas donde cambian tanto la modalidad como el requisito de acceso según cada especialidad y nivel.',
      'La modalidad puede ser presencial, teleformación o combinada, por eso siempre recomendamos revisar la ficha de cada curso para confirmar requisitos, sede y carga horaria.',
      'Si tienes dudas entre varias opciones, la mejor estrategia es comparar tres variables: requisito académico, disponibilidad horaria y objetivo profesional a corto plazo.',
      'El proceso de preinscripción está pensado para ser ágil: eliges el curso, completas el formulario y el equipo de CEP te contacta para validar encaje y próximos pasos.',
      'Una decisión informada reduce abandonos y mejora resultados. Por eso insistimos en empezar por el contexto personal y no solo por el nombre del curso.',
      'Si necesitas orientación adicional, CEP puede ayudarte a seleccionar la ruta formativa más realista para tu perfil y tu momento laboral.',
    ],
    featured: true,
    tags: ['formacion', 'desempleados', 'ocupados', 'preinscripcion', 'orientacion-academica'],
    meta_title: 'Cómo elegir tu formación en CEP según tu situación laboral',
    meta_description:
      'Guía práctica para elegir entre cursos para desempleados, ocupados y formación privada en CEP, con modalidades, requisitos y pasos de preinscripción.',
    status: 'published',
    language: 'es',
  },
  {
    slug: 'metodologia-cep-formacion-practica-evaluacion-continua-y-empleabilidad',
    title: 'Metodología CEP: práctica, evaluación continua y empleabilidad real',
    excerpt:
      'Repasamos cómo trabaja CEP Formación: aprendizaje práctico, evaluación continua, acompañamiento docente y enfoque real en empleabilidad para acelerar tu progreso profesional.',
    contentLines: [
      'La metodología de CEP se apoya en un principio claro: aprender haciendo. La práctica no es un extra, es una parte central del proceso formativo.',
      'El modelo docente combina base teórica con aplicación en contexto real para consolidar competencias y mejorar la transferencia al entorno laboral.',
      'La evaluación continua permite medir progreso de forma sostenida: se valora la evolución del alumnado, su participación y la calidad en tareas teórico-prácticas.',
      'El acompañamiento del profesorado es cercano y adaptado al grupo, con seguimiento activo para corregir desvíos y reforzar habilidades clave.',
      'CEP incorpora además orientación profesional y conexión con prácticas o entornos de trabajo, para que el aprendizaje tenga impacto directo en la empleabilidad.',
      'En su enfoque educativo también se trabajan competencias transversales: comunicación, trabajo en equipo, responsabilidad y adaptación al cambio.',
      'Este equilibrio entre práctica, evaluación y acompañamiento reduce fricción durante el curso y ayuda a llegar mejor preparado al siguiente paso profesional.',
      'La meta final no es solo completar horas de formación, sino mejorar resultados reales en acceso a empleo, desempeño y crecimiento profesional.',
    ],
    featured: false,
    tags: ['metodologia', 'evaluacion-continua', 'empleabilidad', 'aprendizaje-practico', 'cep'],
    meta_title: 'Metodología CEP: aprendizaje práctico con enfoque profesional',
    meta_description:
      'Conoce la metodología de CEP Formación basada en práctica, evaluación continua y acompañamiento docente para mejorar resultados y empleabilidad.',
    status: 'published',
    language: 'es',
  },
]

const FAQS: FaqSeed[] = [
  {
    slug: 'quien-es-cep-formacion-y-que-ofrece',
    question: '¿Quién es CEP Formación y qué tipo de formación ofrece?',
    answerLines: [
      'CEP Formación es un centro de formación en Tenerife con oferta orientada a empleabilidad y desarrollo profesional.',
      'Trabaja con formación para personas desempleadas, para personas ocupadas y también con programas privados según especialidad.',
    ],
    category: 'general',
    order: 1,
    featured: true,
    keywords: ['cep', 'centro-formacion', 'oferta-formativa'],
    status: 'published',
    language: 'es',
  },
  {
    slug: 'donde-estan-las-sedes-de-cep-formacion',
    question: '¿Dónde están las sedes de CEP Formación en Tenerife?',
    answerLines: [
      'CEP dispone de sede en Santa Cruz y sede Norte (La Orotava).',
      'En Santa Cruz se ubica en Plaza José Antonio Barrios Olivero, 38005 (bajo Estadio Heliodoro), y en Norte en C.C. El Trompo, última planta.',
    ],
    category: 'general',
    order: 2,
    featured: true,
    keywords: ['sedes', 'santa-cruz', 'norte', 'la-orotava'],
    status: 'published',
    language: 'es',
  },
  {
    slug: 'horario-atencion-y-contacto-cep-formacion',
    question: '¿Cuál es el horario de atención y cómo puedo contactar?',
    answerLines: [
      'Puedes contactar por teléfono en el 922 21 92 57 o por correo en info@cursostenerife.es.',
      'El horario de atención habitual es de lunes a viernes, de 10:00 a 14:00 y de 16:00 a 20:00.',
    ],
    category: 'general',
    order: 3,
    featured: true,
    keywords: ['contacto', 'telefono', 'correo', 'horario'],
    status: 'published',
    language: 'es',
  },
  {
    slug: 'que-modalidades-ofrece-cep-formacion',
    question: '¿Qué modalidades de estudio ofrece CEP Formación?',
    answerLines: [
      'Según el curso, la formación puede impartirse en modalidad presencial, teleformación o en formatos combinados.',
      'La modalidad exacta siempre aparece en la ficha del curso, junto con duración, sede y otros datos clave.',
    ],
    category: 'courses',
    order: 4,
    featured: true,
    keywords: ['modalidad', 'presencial', 'teleformacion'],
    status: 'published',
    language: 'es',
  },
  {
    slug: 'a-quien-van-dirigidos-los-cursos-de-cep',
    question: '¿A quién van dirigidos los cursos: desempleados, ocupados o privados?',
    answerLines: [
      'CEP publica cursos segmentados por perfil: personas desempleadas, personas ocupadas y alumnado de formación privada.',
      'Antes de preinscribirte, revisa la categoría del curso para confirmar que encaja con tu situación actual.',
    ],
    category: 'courses',
    order: 5,
    featured: false,
    keywords: ['desempleados', 'ocupados', 'privados', 'perfil'],
    status: 'published',
    language: 'es',
  },
  {
    slug: 'que-requisitos-de-acceso-tiene-cada-curso',
    question: '¿Qué requisitos de acceso tiene cada curso?',
    answerLines: [
      'Los requisitos cambian por especialidad y nivel. Hay cursos sin titulación previa y otros que exigen nivel académico concreto.',
      'La referencia oficial siempre es la ficha de cada curso, donde verás requisito, modalidad y condiciones de acceso.',
    ],
    category: 'courses',
    order: 6,
    featured: false,
    keywords: ['requisitos', 'acceso', 'nivel'],
    status: 'published',
    language: 'es',
  },
  {
    slug: 'donde-consulto-la-ficha-pdf-del-curso',
    question: '¿Dónde puedo consultar la ficha PDF y el contenido del curso?',
    answerLines: [
      'En la página de cada curso encontrarás un acceso directo a la ficha PDF oficial.',
      'Ahí se detallan objetivos, módulos, duración, modalidad y requisitos para tomar una decisión informada.',
    ],
    category: 'courses',
    order: 7,
    featured: false,
    keywords: ['ficha-pdf', 'contenido', 'modulos', 'duracion'],
    status: 'published',
    language: 'es',
  },
  {
    slug: 'como-hago-la-preinscripcion-a-un-curso',
    question: '¿Cómo hago la preinscripción a un curso?',
    answerLines: [
      'Debes entrar en la página del curso y completar el formulario de preinscripción con tus datos básicos de contacto.',
      'Es importante seleccionar correctamente el curso y la línea formativa para agilizar la validación posterior.',
    ],
    category: 'enrollment',
    order: 8,
    featured: false,
    keywords: ['preinscripcion', 'formulario', 'inscripcion'],
    status: 'published',
    language: 'es',
  },
  {
    slug: 'que-pasa-despues-de-enviar-la-preinscripcion',
    question: '¿Qué ocurre después de enviar la preinscripción?',
    answerLines: [
      'Tras enviar tus datos, el equipo de CEP revisa la solicitud y contacta contigo para validar encaje y próximos pasos.',
      'Si aplica, te pedirán documentación adicional o confirmarán la incorporación según disponibilidad de plazas.',
    ],
    category: 'enrollment',
    order: 9,
    featured: false,
    keywords: ['seguimiento', 'plazas', 'documentacion'],
    status: 'published',
    language: 'es',
  },
  {
    slug: 'puedo-recibir-orientacion-para-elegir-curso',
    question: '¿Puedo recibir orientación para elegir el curso más adecuado?',
    answerLines: [
      'Sí. Si dudas entre varias opciones, CEP puede orientarte según tu perfil, disponibilidad y objetivo profesional.',
      'La recomendación se basa en requisitos de acceso, modalidad y salida laboral de cada itinerario formativo.',
    ],
    category: 'enrollment',
    order: 10,
    featured: false,
    keywords: ['orientacion', 'eleccion-curso', 'salida-laboral'],
    status: 'published',
    language: 'es',
  },
  {
    slug: 'los-cursos-son-gratuitos-o-tienen-matricula',
    question: '¿Los cursos son siempre gratuitos o hay cursos con matrícula y cuotas?',
    answerLines: [
      'Depende del curso. En CEP conviven cursos subvencionados/gratuitos y formación privada con condiciones económicas específicas.',
      'La información de precio, matrícula o cuotas se publica en el detalle del curso correspondiente.',
    ],
    category: 'payments',
    order: 11,
    featured: false,
    keywords: ['precio', 'matricula', 'cuotas', 'subvencionado'],
    status: 'published',
    language: 'es',
  },
  {
    slug: 'que-necesito-para-teleformacion-y-soporte',
    question: '¿Qué necesito para seguir un curso en teleformación y recibir soporte?',
    answerLines: [
      'Para teleformación necesitas conexión estable a internet y un dispositivo compatible para acceder a contenidos y actividades.',
      'Si surge cualquier incidencia durante el seguimiento, el equipo de CEP te indica el canal de soporte y resolución.',
    ],
    category: 'technical',
    order: 12,
    featured: false,
    keywords: ['teleformacion', 'soporte', 'requisitos-tecnicos'],
    status: 'published',
    language: 'es',
  },
]

function parseCliOptions(argv: string[]): CliOptions {
  const options: CliOptions = { dryRun: false }

  for (const arg of argv) {
    if (arg === '--dry-run') {
      options.dryRun = true
      continue
    }

    if (arg.startsWith('--author-email=')) {
      const value = arg.replace('--author-email=', '').trim()
      if (value.length > 0) options.authorEmail = value
      continue
    }

    if (arg === '--help' || arg === '-h') {
      console.log('Uso: pnpm seed:cep:content [--dry-run] [--author-email=usuario@dominio.com]')
      process.exit(0)
    }
  }

  return options
}

function isEligibleRole(role: unknown): role is EligibleRole {
  return role === 'admin' || role === 'gestor' || role === 'marketing'
}

function toRichText(lines: string[]): LexicalParagraph[] {
  return lines
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => ({
      type: 'paragraph',
      children: [{ text: line }],
    }))
}

function ensureUniqueSlugs<T extends { slug: string }>(items: T[], label: string) {
  const seen = new Set<string>()

  for (const item of items) {
    if (seen.has(item.slug)) {
      throw new Error(`Slug duplicado en ${label}: ${item.slug}`)
    }
    seen.add(item.slug)
  }
}

function validateDatabaseConnectionEnv() {
  const directUrl = process.env.DATABASE_URL?.trim()
  const parts = {
    user: process.env.DATABASE_USER?.trim(),
    password: process.env.DATABASE_PASSWORD?.trim(),
    host: process.env.DATABASE_HOST?.trim(),
    port: process.env.DATABASE_PORT?.trim(),
    name: process.env.DATABASE_NAME?.trim(),
  }

  const fallbackUrl =
    parts.user && parts.password && parts.host && parts.port && parts.name
      ? `postgresql://${parts.user}:${parts.password}@${parts.host}:${parts.port}/${parts.name}`
      : null

  const candidate = directUrl && directUrl.length > 0 ? directUrl : fallbackUrl
  if (!candidate) {
    throw new Error(
      'Falta configuración de base de datos. Define DATABASE_URL o DATABASE_USER/DATABASE_PASSWORD/DATABASE_HOST/DATABASE_PORT/DATABASE_NAME.'
    )
  }

  try {
    // Validación temprana para evitar errores internos opacos de conexión en Payload
    new URL(candidate)
  } catch {
    throw new Error(
      'Configuración de base de datos inválida. Revisa DATABASE_URL (o variables DATABASE_*), debe ser una URL postgres válida.'
    )
  }
}

async function resolveAuthorUser(payload: Awaited<ReturnType<typeof getPayload>>, authorEmail?: string) {
  if (authorEmail) {
    const byEmail = await payload.find({
      collection: 'users',
      where: { email: { equals: authorEmail } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })

    const user = byEmail.docs[0] as UserDoc | undefined
    if (!user) {
      throw new Error(`No existe usuario con email ${authorEmail}`)
    }

    if (!isEligibleRole(user.role)) {
      throw new Error(
        `El usuario ${authorEmail} no tiene rol permitido para crear contenido (admin|gestor|marketing)`
      )
    }

    return user
  }

  const eligible = await payload.find({
    collection: 'users',
    where: {
      or: [
        { role: { equals: 'admin' } },
        { role: { equals: 'gestor' } },
        { role: { equals: 'marketing' } },
      ],
    },
    sort: 'createdAt',
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  const user = eligible.docs[0] as UserDoc | undefined
  if (!user || !isEligibleRole(user.role)) {
    throw new Error('No se encontró usuario con rol admin, gestor o marketing para autoría del contenido')
  }

  return user
}

async function upsertBlogPosts(
  payload: Awaited<ReturnType<typeof getPayload>>,
  user: UserDoc,
  options: CliOptions
) {
  const stats = { created: 0, updated: 0 }

  for (const post of BLOG_POSTS) {
    const existing = await payload.find({
      collection: 'blog_posts',
      where: { slug: { equals: post.slug } },
      limit: 1,
      depth: 0,
      user: user as any,
    })

    const existingDoc = existing.docs[0] as { id: string | number } | undefined
    const data = {
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: toRichText(post.contentLines),
      status: post.status,
      language: post.language,
      featured: post.featured,
      tags: post.tags,
      meta_title: post.meta_title,
      meta_description: post.meta_description,
    }

    if (!existingDoc) {
      if (options.dryRun) {
        console.log(`[dry-run] CREATE blog_posts/${post.slug}`)
      } else {
        await payload.create({
          collection: 'blog_posts',
          data,
          user: user as any,
        })
      }
      stats.created += 1
      continue
    }

    if (options.dryRun) {
      console.log(`[dry-run] UPDATE blog_posts/${post.slug}`)
    } else {
      await payload.update({
        collection: 'blog_posts',
        id: existingDoc.id,
        data,
        user: user as any,
      })
    }
    stats.updated += 1
  }

  return stats
}

async function upsertFaqs(
  payload: Awaited<ReturnType<typeof getPayload>>,
  user: UserDoc,
  options: CliOptions
) {
  const stats = { created: 0, updated: 0 }

  for (const faq of FAQS) {
    const existing = await payload.find({
      collection: 'faqs',
      where: { slug: { equals: faq.slug } },
      limit: 1,
      depth: 0,
      user: user as any,
    })

    const existingDoc = existing.docs[0] as { id: string | number } | undefined
    const data = {
      question: faq.question,
      slug: faq.slug,
      answer: toRichText(faq.answerLines),
      category: faq.category,
      order: faq.order,
      featured: faq.featured,
      keywords: faq.keywords,
      status: faq.status,
      language: faq.language,
    }

    if (!existingDoc) {
      if (options.dryRun) {
        console.log(`[dry-run] CREATE faqs/${faq.slug}`)
      } else {
        await payload.create({
          collection: 'faqs',
          data,
          user: user as any,
        })
      }
      stats.created += 1
      continue
    }

    if (options.dryRun) {
      console.log(`[dry-run] UPDATE faqs/${faq.slug}`)
    } else {
      await payload.update({
        collection: 'faqs',
        id: existingDoc.id,
        data,
        user: user as any,
      })
    }
    stats.updated += 1
  }

  return stats
}

async function main() {
  const options = parseCliOptions(process.argv.slice(2))

  if (BLOG_POSTS.length !== REQUIRED_BLOG_COUNT) {
    throw new Error(`Se esperaban ${REQUIRED_BLOG_COUNT} artículos y hay ${BLOG_POSTS.length}`)
  }
  if (FAQS.length !== REQUIRED_FAQ_COUNT) {
    throw new Error(`Se esperaban ${REQUIRED_FAQ_COUNT} FAQs y hay ${FAQS.length}`)
  }

  ensureUniqueSlugs(BLOG_POSTS, 'blog_posts')
  ensureUniqueSlugs(FAQS, 'faqs')
  validateDatabaseConnectionEnv()

  const payload = await getPayload({ config: configPromise })
  const authorUser = await resolveAuthorUser(payload, options.authorEmail)

  console.log(
    `Iniciando seed editorial CEP (${options.dryRun ? 'dry-run' : 'apply'}) con autor ${authorUser.email ?? authorUser.id}`
  )

  const blogStats = await upsertBlogPosts(payload, authorUser, options)
  const faqStats = await upsertFaqs(payload, authorUser, options)

  console.log('Resumen seed editorial CEP')
  console.log(`- Blog posts: creados=${blogStats.created}, actualizados=${blogStats.updated}`)
  console.log(`- FAQs: creadas=${faqStats.created}, actualizadas=${faqStats.updated}`)
}

void main().catch((error) => {
  console.error('Error en seed-cep-editorial-content:', error)
  process.exitCode = 1
})
