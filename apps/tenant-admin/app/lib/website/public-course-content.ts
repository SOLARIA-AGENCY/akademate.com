export type PublicCourseFaq = {
  q: string
  a: string
}

type LandingFaq = {
  question?: unknown
  answer?: unknown
}

const INTERNAL_FAQ_PATTERN = /fuente\s+can[oó]nica|d[oó]nde\s+se\s+guarda\s+la\s+informaci[oó]n|plataforma\s+interna|payload\b/i

const ONLINE_FAQS: PublicCourseFaq[] = [
  {
    q: '¿Cuándo puedo empezar?',
    a: 'Puedes iniciar la formación cuando se formalice la matrícula. La modalidad online permite avanzar con flexibilidad.',
  },
  {
    q: '¿La formación es presencial?',
    a: 'No. Este curso se realiza online, para que puedas estudiar sin desplazamientos.',
  },
  {
    q: '¿Tengo horarios obligatorios?',
    a: 'El aprendizaje es flexible. Podrás organizar tu avance según tu disponibilidad y las condiciones del programa.',
  },
  {
    q: '¿Tendré acompañamiento durante el curso?',
    a: 'Sí. El equipo de CEP te orientará sobre el acceso, la matrícula y el desarrollo de la formación.',
  },
]

const ONSITE_FAQS: PublicCourseFaq[] = [
  {
    q: '¿Cuándo comienza el curso?',
    a: 'Las fechas de inicio y el horario se confirman en cada convocatoria. Te informaremos de la próxima edición disponible.',
  },
  {
    q: '¿La formación es presencial?',
    a: 'Sí. Las sesiones se desarrollan en las instalaciones de CEP Formación, con un enfoque práctico y acompañamiento docente.',
  },
  {
    q: '¿Cómo puedo reservar una plaza?',
    a: 'Solicita información o completa la matrícula. El equipo de CEP te indicará los pasos y la documentación necesaria.',
  },
  {
    q: '¿Puedo resolver mis dudas antes de matricularme?',
    a: 'Sí. Podemos orientarte sobre horarios, requisitos, modalidad y el encaje del curso con tu perfil.',
  },
]

function asText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function isPublicFaq(faq: PublicCourseFaq): boolean {
  return Boolean(faq.q && faq.a) && !INTERNAL_FAQ_PATTERN.test(`${faq.q} ${faq.a}`)
}

export function getPublicCourseFaqs({
  landingFaqs,
  isOnline,
}: {
  landingFaqs?: readonly LandingFaq[] | null
  isOnline: boolean
}): PublicCourseFaq[] {
  const seen = new Set<string>()
  const curated = (landingFaqs ?? [])
    .map((faq) => ({ q: asText(faq.question), a: asText(faq.answer) }))
    .filter(isPublicFaq)
    .filter((faq) => {
      const key = faq.q.toLocaleLowerCase('es')
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

  const defaults = isOnline ? ONLINE_FAQS : ONSITE_FAQS
  for (const faq of defaults) {
    if (curated.length >= 4) break
    const key = faq.q.toLocaleLowerCase('es')
    if (!seen.has(key)) {
      curated.push(faq)
      seen.add(key)
    }
  }

  return curated
}

export function sanitizePublicCourseCopy(value: string): string {
  return value
    .replace(/\bSalidas\s+detectadas\s*:/gi, 'Salidas profesionales:')
    .replace(/\bDuraci[oó]n\s+detectada\s*:/gi, 'Duración:')
    .replace(/\bRequisitos\s+detectados\s*:/gi, 'Requisitos:')
    .replace(/\bModalidad\s+detectada\s*:/gi, 'Modalidad:')
}
