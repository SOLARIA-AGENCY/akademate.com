import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { 
  Clock, 
  BookOpen, 
  Briefcase, 
  Target, 
  Star, 
  Award, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight,
  ChevronRight,
  Users,
  GraduationCap,
  Calendar,
  MousePointerClick
} from 'lucide-react'
import { LeadForm } from '../../ciclos/[slug]/LeadForm'
import { CourseDossierModal } from './CourseDossierModal'
import { getTenantHostBranding } from '@/app/lib/server/tenant-host-branding'
import {
  getPublishedCourses,
  getPublishedCourseBySlug,
  getStudyTypeColor,
  getStudyTypeVisualMap,
} from '@/app/lib/server/published-courses'
import { getPublicStudyTypeFallbackImage } from '@/app/lib/website/study-types'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

interface Props { params: Promise<{ slug: string }> }

const NUTRICOSMETICA_PREVIEW_SLUG = 'nutricosmetica-priv'
const NUTRICOSMETICA_DOSSIER_URL = '/uploads/cep-course-programs/NUTRICOSMÉTICA.pdf'

type ProgramSection = {
  title: string
  body: string
  items: string[]
}

function splitProgramLine(line: string): ProgramSection {
  // Manejo de bloques con formato "Bloque X · Titulo"
  if (line.includes(' · ') || line.startsWith('Bloque')) {
    const [title, ...rest] = line.split(/[·:]/)
    return {
      title: title.trim(),
      body: rest.join(' ').trim(),
      items: [],
    }
  }

  const [rawTitle, ...rest] = line.split(':')
  const hasTitle = rest.length > 0 && rawTitle.length < 80
  const title = hasTitle ? rawTitle.trim() : 'Contenido'
  const body = hasTitle ? rest.join(':').trim() : line.trim()
  
  const parts = body
    .split(/,\s+(?=[a-záéíóúñü0-9])/i)
    .map((item) => item.trim().replace(/\.$/, ''))
    .filter(Boolean)

  if (parts.length < 3 || body.length < 100) {
    return { title, body, items: [] }
  }

  return {
    title,
    body: '',
    items: parts,
  }
}

function buildCourseFeatures(course: NonNullable<Awaited<ReturnType<typeof getPublishedCourseBySlug>>>) {
  const isTeleformacion = course.studyType === 'teleformacion'
  const durationLabel =
    isTeleformacion
      ? course.duracionReferencia
        ? `${course.duracionReferencia} h online`
        : 'Formación online'
      : course.duracionReferencia === 48
      ? '48 h / 12 sesiones'
      : (course.duracionReferencia ?? 0) > 0
        ? `${course.duracionReferencia} h de formación`
        : 'Carga horaria flexible'
  return [
    {
      label: durationLabel,
      icon: Clock,
      description: isTeleformacion ? 'Avanza desde casa con acceso flexible.' : 'Carga lectiva completa certificada.',
      color: 'text-blue-500'
    },
    {
      label: isTeleformacion ? 'Matrícula permanente' : 'Agencia de colocación oficial',
      icon: Briefcase,
      description: isTeleformacion ? 'Puedes empezar cuando lo necesites.' : 'Acceso exclusivo a ofertas de empleo.',
      color: 'text-emerald-500'
    },
    {
      label: isTeleformacion ? '100% Online' : 'Clases Presenciales',
      icon: Users,
      description: isTeleformacion ? 'Formación completa sin desplazamientos.' : 'Aprendizaje en aula con expertos.',
      color: 'text-indigo-500'
    },
    {
      label: isTeleformacion ? 'Aprendizaje Flexible' : 'Grupos Reducidos',
      icon: Target,
      description: isTeleformacion ? 'Estudia a tu ritmo con acompañamiento tutorial.' : 'Máximo aprovechamiento garantizado.',
      color: 'text-orange-500'
    },
    {
      label: 'Contenido Teórico-Práctico',
      icon: BookOpen,
      description: 'Aprende haciendo con casos reales.',
      color: 'text-purple-500'
    },
    {
      label: 'Certificación Profesional',
      icon: Award,
      description: 'Título acreditado por CEP Formación.',
      color: 'text-amber-500'
    }
  ]
}

function groupSyllabus(lines: string[]): ProgramSection[] {
  const sections: ProgramSection[] = []
  let currentSection: ProgramSection | null = null

  lines.forEach(line => {
    const lowerLine = line.toLowerCase()
    // Si es un Bloque o un Título principal (CONTENIDO)
    if (lowerLine.includes('bloque') || (lowerLine.includes('contenido') && line.length < 30)) {
      if (lowerLine.includes('contenido') && line.length < 30) return
      if (currentSection) sections.push(currentSection)
      const parts = line.split(/[·:]/)
      currentSection = {
        title: parts[0].trim(),
        body: parts.slice(1).join(' ').trim(),
        items: []
      }
    } 
    // Si es un Módulo o un item de lista
    else if (lowerLine.includes('módulo') || lowerLine.includes('u.d') || line.startsWith('✅') || line.startsWith('-')) {
      if (!currentSection) {
        currentSection = { title: 'Contenido del curso', body: '', items: [] }
      }
      currentSection.items.push(line.replace(/^[✅\-]\s*/, '').trim())
    }
    // Texto normal
    else if (line.trim().length > 5) {
      if (!currentSection) {
        currentSection = { title: 'Información general', body: line.trim(), items: [] }
      } else if (!currentSection.body) {
        currentSection.body = line.trim()
      } else {
        currentSection.items.push(line.trim())
      }
    }
  })

  if (currentSection) sections.push(currentSection)
  return sections
}

function normalizeSearchText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function getRelatedCoursePriority(
  relatedCourse: Awaited<ReturnType<typeof getPublishedCourses>>[number],
  currentCourse: NonNullable<Awaited<ReturnType<typeof getPublishedCourseBySlug>>>
) {
  const title = normalizeSearchText(relatedCourse.nombre)
  const currentTitle = normalizeSearchText(currentCourse.nombre)
  const healthContinuityKeywords = [
    'auxiliar de clinicas esteticas',
    'auxiliar de enfermeria',
    'farmacia',
    'nutricion',
    'dietetica'
  ]

  if (currentTitle.includes('nutricosmetica')) {
    const preferredIndex = healthContinuityKeywords.findIndex((keyword) => title.includes(keyword))
    if (preferredIndex >= 0) return preferredIndex
  }

  return 100
}

function isPreferredHealthContinuityCourse(
  relatedCourse: Awaited<ReturnType<typeof getPublishedCourses>>[number],
  currentCourse: NonNullable<Awaited<ReturnType<typeof getPublishedCourseBySlug>>>
) {
  return getRelatedCoursePriority(relatedCourse, currentCourse) < 100
}

function getUniqueRelatedCourses(courses: Awaited<ReturnType<typeof getPublishedCourses>>) {
  const seen = new Set<string>()
  return courses.filter((course) => {
    const key = normalizeSearchText(course.nombre)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const tenant = await getTenantHostBranding()
  const tenantId = tenant.tenantId === 'default' ? null : tenant.tenantId
  const useLocalNutricosmeticaSeed =
    slug === NUTRICOSMETICA_PREVIEW_SLUG && tenantId === null && process.env.NODE_ENV === 'development'
  let course = null;
  if (!useLocalNutricosmeticaSeed) {
    try {
      course = await getPublishedCourseBySlug({
        slug,
        tenantId,
        includeInactive: false,
        includeCycles: false,
      })
    } catch(e) {}
  }

  if (!course && slug === NUTRICOSMETICA_PREVIEW_SLUG) {
    course = {
      nombre: 'Experto en Nutricosmética y Complementos Alimenticios',
      descripcion: 'Especialización técnica en nutricosmética, complementos alimenticios y recomendación profesional basada en evidencia.',
    } as any;
  }
  const title = course.nombre
  const description = course.descripcion || `Curso: ${title}`
  return {
    title: `${title} | CEP Formación`,
    description: description.substring(0, 160),
  }
}

export default async function CursoLandingPage({ params }: Props) {
  const { slug } = await params
  const tenant = await getTenantHostBranding()
  const tenantId = tenant.tenantId === 'default' ? null : tenant.tenantId
  const isNutricosmeticaPreview = slug === NUTRICOSMETICA_PREVIEW_SLUG
  const useLocalNutricosmeticaSeed =
    isNutricosmeticaPreview && tenantId === null && process.env.NODE_ENV === 'development'
  const studyTypeVisualMap = useLocalNutricosmeticaSeed ? ({} as any) : await getStudyTypeVisualMap()
  let course = null;
  if (!useLocalNutricosmeticaSeed) {
    try {
      course = await getPublishedCourseBySlug({
        slug,
        tenantId,
        includeInactive: false,
        includeCycles: false,
      })
    } catch {
      course = null
    }
  }

  // Seed fallback for the first migrated course when local Payload/Postgres is unavailable.
  if (!course && isNutricosmeticaPreview) {
    course = {
      id: 'mock-1',
      nombre: 'Experto en Nutricosmética y Complementos Alimenticios',
      slug: 'nutricosmetica-priv',
      descripcion: 'Aprende a realizar recomendaciones éticas basadas en la evidencia, integrando nutrición, estética y deporte para elevar la calidad de atención y la confianza de tus clientes.',
      descripcionDetallada: '¿A quien va dirigido?\nFormación dirigida a profesionales del ámbito de la salud, la estética, el bienestar y el deporte que deseen ampliar sus conocimientos en nutricosmética y complementos alimenticios, aplicándolos de forma segura y responsable en su práctica profesional.\nPodrás acceder con 2º de la ESO o EGB.\n\nEnfoque Diferenciador\n✅ Visión integral: cuidado clínico preciso, empatía y atención constante al bienestar.\n✅ Aplicación práctica: contextos de salud, estética y deporte.\n✅ Conocimientos actualizados: nutricosmética y complementos alimenticios.\n✅ Formación vivencial: aprendizaje basado en la observación clínica y la práctica de campo.\n✅ Criterios claros: recomendación segura, ética y basada en evidencia.\n✅ Comprensión: relación entre nutrición, piel, estética y rendimiento físico.\n\nCONTENIDO\nBloque 1 · Fundamentos de Nutricosmética\nMódulo 1 Nutrición, suplementación y salud cutánea\nMódulo 2 Marco legal, seguridad y responsabilidad profesional\nBloque 2 · Complementos Alimenticios\nMódulo 1 Vitaminas y minerales aplicados a la estética\nMódulo 2 Proteínas, aminoácidos y colágeno\nMódulo 3 Lípidos y ácidos grasos esenciales\nMódulo 4 Microbiota, prebióticos y probióticos\nBloque 3 · Nutricosmética Aplicada\nMódulo 1 Antioxidantes y envejecimiento saludable\nMódulo 2 Salud de la piel, cabello y uñas\nMódulo 3 Nutricosmética en la mujer\nMódulo 4 Sueño, estrés y adaptógenos\nBloque 4 · Integración Profesional\nMódulo 1 Interacciones, contraindicaciones y derivación\nMódulo 2 Recomendación profesional aplicada\n\nSalidas y continuidad formativa\nAl terminar puedes ampliar conocimientos con Auxiliar de Farmacia, Auxiliar de Enfermería, Auxiliar en Clínicas Estéticas, Quiromasaje Holístico, Entrenamiento Personal, Dietética y Nutrición o Dermocosmética.',
      imagenPortada: '/website/cep/courses/nutricosmetica-priv.webp',
      dossierUrl: NUTRICOSMETICA_DOSSIER_URL,
      landingEnabled: true,
      landingTargetAudience: 'Formación dirigida a profesionales del ámbito de la salud, la estética, el bienestar y el deporte que deseen ampliar sus conocimientos en nutricosmética y complementos alimenticios, aplicándolos de forma segura y responsable en su práctica profesional.',
      landingAccessRequirements: 'Puedes acceder con 2º de ESO o EGB.',
      landingOutcomes: 'Al terminar puedes ampliar conocimientos con Auxiliar de Farmacia, Auxiliar de Enfermería, Auxiliar en Clínicas Estéticas, Quiromasaje Holístico, Entrenamiento Personal, Dietética y Nutrición o Dermocosmética.',
      landingObjectives: [
        'Visión integral: cuidado clínico preciso, empatía y atención constante al bienestar.',
        'Aplicación práctica: contextos de salud, estética y deporte.',
        'Conocimientos actualizados: nutricosmética y complementos alimenticios.',
        'Formación vivencial: aprendizaje basado en la observación clínica y la práctica de campo.',
        'Criterios claros: recomendación segura, ética y basada en evidencia.',
        'Comprensión: relación entre nutrición, piel, estética y rendimiento físico.',
      ],
      landingProgramBlocks: [
        {
          title: 'Bloque 1',
          body: 'Fundamentos de Nutricosmética',
          items: ['Módulo 1 Nutrición, suplementación y salud cutánea', 'Módulo 2 Marco legal, seguridad y responsabilidad profesional'],
        },
        {
          title: 'Bloque 2',
          body: 'Complementos Alimenticios',
          items: ['Módulo 1 Vitaminas y minerales aplicados a la estética', 'Módulo 2 Proteínas, aminoácidos y colágeno', 'Módulo 3 Lípidos y ácidos grasos esenciales', 'Módulo 4 Microbiota, prebióticos y probióticos'],
        },
        {
          title: 'Bloque 3',
          body: 'Nutricosmética Aplicada',
          items: ['Módulo 1 Antioxidantes y envejecimiento saludable', 'Módulo 2 Salud de la piel, cabello y uñas', 'Módulo 3 Nutricosmética en la mujer', 'Módulo 4 Sueño, estrés y adaptógenos'],
        },
        {
          title: 'Bloque 4',
          body: 'Integración Profesional',
          items: ['Módulo 1 Interacciones, contraindicaciones y derivación', 'Módulo 2 Recomendación profesional aplicada'],
        },
      ],
      landingFaqs: [
        {
          question: '¿Qué aprenderé en este curso?',
          answer: 'Aprenderás a recomendar nutricosmética y complementos alimenticios con criterios claros, seguros y basados en evidencia, relacionando nutrición, piel, estética, bienestar y rendimiento físico.',
        },
        {
          question: '¿A quién va dirigido?',
          answer: 'Está dirigido a profesionales del ámbito de la salud, la estética, el bienestar y el deporte que quieran ampliar conocimientos y aplicarlos de forma responsable en su práctica profesional.',
        },
        {
          question: '¿Qué requisitos de acceso tiene?',
          answer: 'Puedes acceder con 2º de ESO o EGB. Si tienes experiencia previa en salud, estética, bienestar o deporte, el equipo de CEP puede orientarte sobre el encaje del curso con tu perfil.',
        },
        {
          question: '¿Cuánto dura y cómo se imparte?',
          answer: 'El curso tiene 48 horas de formación, organizadas en 12 sesiones de 4 horas. La modalidad es presencial, con clases una vez por semana y grupos reducidos.',
        },
        {
          question: '¿Qué contenidos incluye el programa?',
          answer: 'Incluye fundamentos de nutricosmética, complementos alimenticios, vitaminas, minerales, colágeno, microbiota, salud de piel, cabello y uñas, antioxidantes, sueño, estrés, adaptógenos, contraindicaciones y recomendación profesional.',
        },
        {
          question: '¿Qué salidas o continuidad formativa tiene?',
          answer: 'Al terminar puedes ampliar conocimientos con Auxiliar de Farmacia, Auxiliar de Enfermería, Auxiliar en Clínicas Estéticas, Quiromasaje Holístico, Entrenamiento Personal, Dietética y Nutrición o Dermocosmética.',
        },
      ],
      enrollmentStatus: 'none',
      enrollmentLabel: 'Avisarme de próximas fechas',
      nextRun: null,
      studyType: 'privado',
      studyTypeLabel: 'Experto Profesional',
      duracion: '48 horas',
      duracionReferencia: 48,
      area: 'Salud, estética y bienestar',
      metodologia: 'Presencial · 12 sesiones de 4 h · 1 vez por semana',
      requisitos: '2º de ESO o EGB',
      temario: [
        { title: 'Bloque 1: Fundamentos de Nutricosmética', content: 'Nutrición, suplementación, salud cutánea, marco legal y responsabilidad profesional.' },
        { title: 'Bloque 2: Complementos Alimenticios', content: 'Vitaminas, minerales, proteínas, aminoácidos, colágeno, lípidos, microbiota, prebióticos y probióticos.' },
        { title: 'Bloque 3: Nutricosmética Aplicada', content: 'Antioxidantes, envejecimiento saludable, piel, cabello, uñas, salud de la mujer, sueño, estrés y adaptógenos.' },
        { title: 'Bloque 4: Integración Profesional', content: 'Interacciones, contraindicaciones, derivación y recomendación profesional aplicada.' }
      ],
      salidasProfesionales: [
        'Profesionales de salud, estética, bienestar y deporte',
        'Asesoramiento responsable en complementos alimenticios',
        'Continuidad con farmacia, clínicas estéticas, dietética o dermocosmética',
        'Mejora de la atención profesional basada en evidencia'
      ],
      ventajas: [
        '48 h de formación presencial',
        '12 sesiones de 4 h',
        'Grupos reducidos',
        'Contenido teórico-práctico'
      ]
    } as any;
  }

  if (!course) {
    notFound()
  }


  let allRelatedCourses = [];
  if (!isNutricosmeticaPreview) {
    try {
      allRelatedCourses = await getPublishedCourses({
        tenantId,
        includeInactive: false,
        includeCycles: false,
        limit: 200,
        sort: 'name',
      })
    } catch {
      allRelatedCourses = []
    }
  }


  const title = course.nombre
  const description = course.descripcion
  const isTeleformacion = course.studyType === 'teleformacion'
  const detailedDescription = course.descripcionDetallada
  const imageUrl = course.imagenPortada || getPublicStudyTypeFallbackImage(course.studyType)
  const heroColor =
    slug === 'nutricosmetica-priv'
      ? '#f2014b'
      : getStudyTypeColor(course.studyType, studyTypeVisualMap) || tenant.primaryColor || '#0F172A'
  
  // Categorización de contenido mejorada
  const sectionsData: Record<string, string[]> = {
    target: [],
    methodology: [],
    outcomes: [],
    syllabus: []
  }
  
  let currentKey: string | null = null
  
  const detailedDescriptionRaw = course.descripcionDetallada || ''
  const detailedDescriptionArray = Array.isArray(detailedDescriptionRaw) 
    ? detailedDescriptionRaw 
    : typeof detailedDescriptionRaw === 'string' 
      ? detailedDescriptionRaw.split('\n') 
      : []

  detailedDescriptionArray.forEach((line: string) => {
    const lower = normalizeSearchText(line)
    if (lower.includes('dirigido a') || lower.includes('perfil')) {
      currentKey = 'target'
    } else if (lower.includes('enfoque') || lower.includes('metodologia')) {
      currentKey = 'methodology'
    } else if (lower.includes('bloque') || lower.includes('modulo') || lower.includes('u.d') || lower.includes('contenido')) {
      currentKey = 'syllabus'
    } else if (lower.includes('salidas') || lower.includes('al terminar') || lower.includes('profesion')) {
      currentKey = 'outcomes'
    }
    
    if (currentKey && !line.toLowerCase().includes('www.cursostenerife.es') && !/^\d+$/.test(line.trim())) {
      sectionsData[currentKey].push(line)
    }
  })

  const targetAudienceText = course.landingTargetAudience || sectionsData.target.join(' ')
  const methodologyText = sectionsData.methodology.join(' ')
  const parsedMethodologyPoints = sectionsData.methodology
    .flatMap((line) => line.split('✅'))
    .map((point) => point.replace(/Enfoque Diferenciador|Metodología/i, '').trim())
    .filter((point) => point.length > 8)
  const methodologyPoints = course.landingObjectives?.length ? course.landingObjectives : parsedMethodologyPoints
  const outcomesText = course.landingOutcomes || sectionsData.outcomes.join(' ')
  const programSections = course.landingProgramBlocks?.length
    ? course.landingProgramBlocks
    : groupSyllabus(sectionsData.syllabus.length > 0 ? sectionsData.syllabus : detailedDescriptionArray)

  const courseFeatures = buildCourseFeatures(course)
  const heroPrimaryCta = isTeleformacion ? 'Empezar ahora' : 'Solicitar Dossier'
  const sidebarTitle = isTeleformacion ? 'Empieza tu curso online' : 'Solicita información del curso'
  const sidebarCopy = isTeleformacion
    ? 'Déjanos tus datos y te explicamos acceso, matrícula y funcionamiento del curso online.'
    : 'Te llamamos para resolver horarios, requisitos, modalidad y matrícula.'
  const sidebarSubmitLabel = isTeleformacion
    ? 'Quiero empezar ahora'
    : course.enrollmentStatus === 'open'
      ? 'Solicitar información gratuita'
      : (course.enrollmentLabel || 'Avisarme de próximas fechas')
  const formatLabel = isTeleformacion ? 'Formato online' : 'Formato presencial'
  const formatValue = isTeleformacion
    ? 'Inicio inmediato'
    : course.nextRun?.scheduleLabel || (course.duracionReferencia ? `${course.duracionReferencia} h` : 'Próximas fechas')
  
  const eligibleRelatedCourses = allRelatedCourses.filter((relatedCourse) => relatedCourse.slug !== course.slug)
  const preferredHealthContinuityCourses = eligibleRelatedCourses
    .filter((relatedCourse) => isPreferredHealthContinuityCourse(relatedCourse, course))
  
  const sameAreaRelatedCourses = eligibleRelatedCourses
    .filter(
      (relatedCourse) =>
        relatedCourse.area === course.area &&
        !preferredHealthContinuityCourses.some((pc) => pc.slug === relatedCourse.slug)
    )

  const relatedCourses = getUniqueRelatedCourses([
    ...preferredHealthContinuityCourses,
    ...sameAreaRelatedCourses,
    ...eligibleRelatedCourses.slice(0, 20)
  ]).slice(0, 4)

  const teleformacionFallbackFaqs = [
    {
      q: '¿Cuándo puedo empezar?',
      a: 'Puedes empezar cuando quieras una vez formalizada la matrícula. La matrícula está abierta de forma permanente.'
    },
    {
      q: '¿La formación es presencial?',
      a: 'No. La formación se realiza 100% online, desde casa y sin desplazamientos.'
    },
    {
      q: '¿Tengo horarios obligatorios?',
      a: 'No hay horario fijo de aula. Puedes avanzar a tu ritmo dentro de las condiciones del curso.'
    },
    {
      q: '¿Tendré acompañamiento durante el curso?',
      a: 'Sí. Cuentas con acompañamiento tutorial online para resolver dudas y avanzar con seguridad.'
    },
    {
      q: '¿Cómo accedo al curso?',
      a: 'Tras completar la matrícula, el equipo de CEP te indica los pasos de acceso y funcionamiento del curso online.'
    },
    {
      q: '¿Recibo certificado?',
      a: 'Sí. Al finalizar la formación según los requisitos del programa, recibirás la certificación correspondiente.'
    },
  ]

  const fallbackFaqs = isTeleformacion ? teleformacionFallbackFaqs : [
    {
      q: '¿Qué aprenderé en este curso?',
      a: 'Aprenderás a recomendar nutricosmética y complementos alimenticios con criterios claros, seguros y basados en evidencia, relacionando nutrición, piel, estética, bienestar y rendimiento físico.'
    },
    {
      q: '¿A quién va dirigido?',
      a: 'Está dirigido a profesionales del ámbito de la salud, la estética, el bienestar y el deporte que quieran ampliar conocimientos y aplicarlos de forma responsable en su práctica profesional.'
    },
    {
      q: '¿Qué requisitos de acceso tiene?',
      a: 'Puedes acceder con 2º de ESO o EGB. Si tienes experiencia previa en salud, estética, bienestar o deporte, el equipo de CEP puede orientarte sobre el encaje del curso con tu perfil.'
    },
    {
      q: '¿Cuánto dura y cómo se imparte?',
      a: 'El curso tiene 48 horas de formación, organizadas en 12 sesiones de 4 horas. La modalidad es presencial, con clases una vez por semana y grupos reducidos.'
    },
    {
      q: '¿Qué contenidos incluye el programa?',
      a: 'Incluye fundamentos de nutricosmética, complementos alimenticios, vitaminas, minerales, colágeno, microbiota, salud de piel, cabello y uñas, antioxidantes, sueño, estrés, adaptógenos, contraindicaciones y recomendación profesional.'
    },
    {
      q: '¿Qué salidas o continuidad formativa tiene?',
      a: 'Al terminar puedes ampliar conocimientos con Auxiliar de Farmacia, Auxiliar de Enfermería, Auxiliar en Clínicas Estéticas, Quiromasaje Holístico, Entrenamiento Personal, Dietética y Nutrición o Dermocosmética.'
    }
  ]
  const faqs = course.landingFaqs?.length
    ? course.landingFaqs.map((faq: any) => ({ q: faq.question, a: faq.answer }))
    : fallbackFaqs

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: title,
    description: description,
    provider: {
      '@type': 'Organization',
      name: 'CEP Formación',
      sameAs: 'https://cepformacion.es'
    },
    courseCode: course.id,
    courseMode: isTeleformacion ? 'Online' : course.studyTypeLabel,
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: isTeleformacion ? 'Online' : course.studyTypeLabel,
      instructor: {
        '@type': 'Organization',
        name: isTeleformacion ? 'Equipo tutorial CEP' : 'Equipo Docente CEP'
      }
    }
  }

  return (
    <div className="bg-white min-h-screen selection:bg-brand-100 selection:text-brand-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* HERO SECTION - PREMIUM DESIGN */}
      <section className="relative overflow-hidden bg-gray-950">
        {/* Background Image */}
        <div 
          className="absolute inset-0 z-0"
          style={{ 
            background: `linear-gradient(135deg, ${heroColor} 0%, #0f172a 100%)`,
          }}
        >
          <img 
            src={imageUrl} 
            alt={title} 
            className="w-full h-full object-cover opacity-100 scale-105 animate-slow-zoom"
          />
          <div
            className="absolute inset-y-0 left-0 w-[72%] lg:w-[58%]"
            style={{
              background: 'linear-gradient(90deg, rgba(78, 66, 76, 0.68) 0%, rgba(112, 91, 107, 0.54) 38%, rgba(148, 119, 139, 0.28) 70%, transparent 100%)',
            }}
          />
          <div className="absolute inset-y-0 left-0 w-[42%] bg-gradient-to-r from-slate-900/18 to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="animate-in slide-in-from-left duration-700">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-medium mb-8">
                <ShieldCheck className="w-4 h-4 text-brand-accent" />
                <span>Garantía de Calidad CEP Formación</span>
              </div>
              <h1 className="text-5xl lg:text-7xl font-extrabold text-white mb-8 leading-[1.1] tracking-tight drop-shadow-[0_4px_24px_rgba(0,0,0,0.75)]">
                {title}
              </h1>
              <p className="text-xl lg:text-2xl text-white mb-10 leading-relaxed max-w-xl font-light drop-shadow-[0_3px_18px_rgba(0,0,0,0.8)]">
                {description || `Especialízate en ${(course.area ?? 'formación profesional').toLowerCase()} con una metodología práctica orientada al empleo real.`}
              </p>
              
              <div className="flex flex-wrap gap-5">
                <CourseDossierModal
                  courseId={course.id}
                  courseName={title}
                  dossierUrl={course.dossierUrl || (isNutricosmeticaPreview ? NUTRICOSMETICA_DOSSIER_URL : '')}
                  triggerLabel={heroPrimaryCta}
                  title={isTeleformacion ? 'Empieza tu curso online' : 'Recibe el dossier del curso'}
                  description={
                    isTeleformacion
                      ? `Déjanos tus datos y te explicamos cómo empezar ${title} online, a tu ritmo y desde casa.`
                      : `Deja tus datos y te enviaremos la ficha PDF de ${title}. El lead quedará registrado para seguimiento comercial.`
                  }
                  submitLabel={isTeleformacion ? 'Quiero empezar ahora' : 'Enviar y recibir dossier'}
                  sourceForm={isTeleformacion ? 'teleformacion_inicio_inmediato' : 'dossier_curso'}
                  leadType={isTeleformacion ? 'lead' : 'waiting_list'}
                  notes={
                    isTeleformacion
                      ? `Teleformación - inicio inmediato: ${title}`
                      : `Solicitud de dossier: ${title}`
                  }
                  leadMetadata={
                    isTeleformacion
                      ? {
                          lead_intent: 'teleformacion_inicio_inmediato',
                          course_delivery: 'online_async',
                          enrollment_mode: 'permanent_open',
                        }
                      : undefined
                  }
                />
                <div className="flex items-center gap-4 text-white/90 bg-white/5 backdrop-blur-sm px-6 py-3 rounded-full border border-white/10">
                  <div className="flex -space-x-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="w-10 h-10 rounded-full border-2 border-white/80 bg-white flex items-center justify-center overflow-hidden shadow-sm">
                        <img
                          src={`/website/cep/students/nutricosmetica-alumno-${i}.webp`}
                          alt="Alumno de CEP Formación"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold">+28 años</span>
                    <span className="text-[10px] uppercase tracking-wider opacity-60">Líderes en Canarias</span>
                  </div>
                </div>
              </div>

              {/* Scroll Indicator */}
              <a href="#presentacion" className="mt-16 hidden lg:flex items-center gap-4 text-white/40 animate-bounce cursor-pointer no-underline hover:text-white/60 transition-colors">
                <div className="w-6 h-10 rounded-full border-2 border-white/20 flex justify-center p-1">
                  <div className="w-1 h-2 bg-white/40 rounded-full" />
                </div>
                <span className="text-xs uppercase tracking-widest font-medium">Descubre el programa</span>
              </a>
            </div>

            {/* Premium Floating Hero Card */}
            <div className="hidden lg:block animate-in zoom-in duration-1000 delay-200">
              <div className="relative">
                <div className="absolute -inset-3 bg-white/30 rounded-[32px] blur-2xl" />
                <div className="relative bg-white/70 backdrop-blur-xl border border-white/70 rounded-3xl p-7 shadow-xl overflow-hidden group">
                  
                  <div className="grid grid-cols-2 gap-6 relative z-10">
                    {courseFeatures.slice(0, 4).map((feature, i) => (
                      <div key={i} className="flex gap-3 group/item">
                        <div className="w-10 h-10 shrink-0 rounded-xl bg-white/70 flex items-center justify-center border border-white/80 transition-colors group-hover/item:bg-white">
                          <feature.icon className="w-5 h-5 brand-text" />
                        </div>
                        <div>
                          <p className="text-gray-900 font-bold text-sm leading-tight">
                            {feature.label}
                          </p>
                          <p className="text-gray-600 text-[11px] mt-1 leading-tight">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-7 pt-6 border-t border-gray-900/10 relative z-10">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-500 text-[10px] uppercase tracking-[0.2em] mb-2 font-bold">{formatLabel}</p>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-green-500" />
                          <p className="text-gray-900 font-bold text-xl tracking-tight">
                            {formatValue}
                          </p>
                        </div>
                      </div>
                      <div className="bg-white/70 rounded-xl px-3 py-2 border border-white/80">
                         <div className="flex items-center gap-1 text-amber-500">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <Star className="w-3.5 h-3.5 fill-current" />
                        </div>
                        <p className="text-[10px] text-gray-600 text-center mt-1 font-medium">4.9/5 valoración</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Liquid Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
            <path d="M0 120H1440V0C1440 0 1200 80 720 80C240 80 0 0 0 0V120Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* QUICK INFO BAR - DESKTOP ONLY */}
      <div className="hidden lg:block bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm transition-transform duration-300 translate-y-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="font-bold text-gray-900 border-r border-gray-200 pr-8">
              {title}
            </div>
            <nav className="flex gap-6 text-sm font-medium text-gray-500">
              <a href="#presentacion" className="hover:text-brand-600 transition-colors">Presentación</a>
              <a href="#programa" className="hover:text-brand-600 transition-colors">Programa</a>
              {targetAudienceText && <a href="#perfil" className="hover:text-brand-600 transition-colors">Perfil</a>}
              <a href="#faq" className="hover:text-brand-600 transition-colors">Preguntas</a>
            </nav>
          </div>
          <div className="flex items-center gap-6">
              <div className="hidden xl:flex items-center gap-2 text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100">
                <span className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse" />
                {course.enrollmentLabel || 'Avisarme de próximas fechas'}
              </div>
            <a href="#registro" className="brand-btn px-6 py-2 rounded-full text-sm font-bold transition-all">
              {isTeleformacion ? 'Empezar ahora' : 'Inscríbete ahora'}
            </a>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24">
          
          {/* LEFT COLUMN: Course Details */}
          <div className="lg:col-span-8 space-y-24">
            
            {/* Introduction */}
            <section id="presentacion" className="scroll-mt-32">
              <div className="inline-flex items-center gap-3 text-brand-600 font-bold tracking-[0.2em] uppercase text-xs mb-6">
                <span className="w-12 h-0.5 bg-brand-600 rounded-full" />
                Presentación del curso
              </div>
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-8 tracking-tight">
                {isTeleformacion ? 'Estudia online desde casa y avanza a tu ritmo' : 'Impulsa tu futuro profesional con CEP Formación'}
              </h2>
              <div className="prose prose-lg prose-brand max-w-none text-gray-600">
                <p className="text-xl leading-relaxed whitespace-pre-line">
                  {description || `Bienvenido al curso de ${title}. Este programa ha sido diseñado meticulosamente para proporcionar a los alumnos las competencias teóricas y prácticas necesarias para destacar en el sector de ${(course.area ?? 'formación profesional').toLowerCase()}.`}
                </p>
                {methodologyPoints.length > 0 && (
                  <div className="mt-10 p-8 rounded-3xl bg-brand-50 border border-brand-100 flex gap-6 items-start">
                    <div className="w-12 h-12 rounded-2xl bg-white brand-text border brand-border flex items-center justify-center shrink-0 shadow-sm">
                      <Target className="w-6 h-6" aria-hidden="true" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-brand-900 mb-2">Nuestro Enfoque Diferenciador</h4>
                      <ul className="grid gap-3 sm:grid-cols-2">
                        {methodologyPoints.map((point, index) => (
                          <li key={index} className="flex gap-3 text-sm leading-relaxed text-brand-900/80">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 brand-text" />
                            <span>{point.replace(/\.$/, '')}.</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Features Detail Grid */}
            <section className="bg-gray-50 rounded-[40px] p-8 lg:p-16 border border-gray-100">
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">
                  ¿Por qué estudiar con nosotros?
                </h2>
                <p className="text-gray-500">
                  {isTeleformacion
                    ? 'Una formación flexible para empezar cuando quieras, sin desplazamientos y con acompañamiento online.'
                    : 'Beneficios diseñados para tu crecimiento profesional y personal.'}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {courseFeatures.map((feature, i) => (
                  <div key={i} className="flex gap-6 p-6 rounded-3xl bg-white border border-gray-100 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 group">
                    <div className={cn("shrink-0 w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center group-hover:bg-brand-600 transition-all duration-500", feature.color)}>
                      <feature.icon className="w-7 h-7 group-hover:text-white transition-colors" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-gray-900 text-lg group-hover:text-brand-600 transition-colors">{feature.label}</h4>
                      <p className="text-sm text-gray-500 mt-2 leading-relaxed">{feature.description || 'Garantía de calidad formativa superior con seguimiento personalizado.'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Target Audience */}
            {targetAudienceText && (
              <section id="perfil" className="scroll-mt-32">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center bg-gray-900 rounded-[40px] p-8 lg:p-16 text-white overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-brand-600/30 rounded-full blur-3xl -mr-32 -mt-32" />
                  <div className="relative z-10">
                  <h2 className="text-3xl font-bold mb-6 tracking-tight">¿Para quién es este curso?</h2>
                    <div className="space-y-4">
                      {targetAudienceText.replace(/¿A quien va dirigido\?|Perfil/i, '').split(/[·.]/).filter((p: string) => p.trim().length > 5).map((point: string, i: number) => (
                        <div key={i} className="flex gap-3">
                          <CheckCircle2 className="w-5 h-5 text-brand-accent shrink-0" />
                          <p className="text-gray-300 leading-snug">{point.trim()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="relative z-10 flex flex-col items-center justify-center text-center p-8 rounded-[32px] bg-white/5 backdrop-blur-xl border border-white/10">
                    <Users className="w-12 h-12 text-brand-accent mb-4" />
                    <p className="text-2xl font-bold mb-2">{isTeleformacion ? 'Perfil Online' : 'Perfil Profesional'}</p>
                    <p className="text-sm text-gray-400">
                      {isTeleformacion
                        ? 'Pensado para personas que necesitan flexibilidad, autonomía y acompañamiento online.'
                        : 'Dirigido a personas que buscan excelencia y actualización constante en su sector.'}
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* Detailed Content / Syllabus */}
            {programSections.length > 0 && (
              <section id="programa" className="scroll-mt-32">
                <div className="mb-12">
                  <div className="inline-flex items-center gap-3 text-brand-600 font-bold tracking-[0.2em] uppercase text-xs mb-4">
                    <BookOpen className="w-4 h-4" />
                    Plan formativo
                  </div>
                  <h2 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">Estructura del programa</h2>
                  <p className="text-gray-600 text-lg max-w-2xl">
                    Contenidos actualizados y prácticos, divididos en bloques modulares para un aprendizaje progresivo y sólido.
                  </p>
                </div>

                <div className="divide-y divide-gray-200 rounded-2xl border border-gray-200 bg-white">
                  {programSections.map((section, index) => (
                    <div 
                      key={index} 
                      className="grid gap-5 px-5 py-7 sm:grid-cols-[72px_1fr] sm:px-8"
                    >
                      <div className="flex h-11 w-11 items-center justify-center rounded-full brand-bg-light brand-text text-sm font-black sm:mt-1">
                        {String(index + 1).padStart(2, '0')}
                      </div>
                      <div>
                        <h3 className="text-xl font-extrabold text-gray-900">
                          {section.title}
                        </h3>
                        {section.body && (
                          <p className="mt-2 text-sm leading-relaxed text-gray-600">{section.body}</p>
                        )}
                        {section.items.length > 0 && (
                          <ul className="mt-4 space-y-3">
                            {section.items.map((item, i) => (
                              <li key={i} className="flex gap-3 text-base leading-relaxed text-gray-700">
                                <span className="mt-2 h-2 w-2 shrink-0 rounded-full brand-bg" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* FAQ Section */}
            <section id="faq" className="scroll-mt-32">
              <div className="mb-12">
                <h2 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">Preguntas frecuentes</h2>
                <p className="text-gray-500 text-lg">Resolvemos tus dudas sobre el proceso formativo en CEP Formación.</p>
              </div>
              <div className="space-y-4">
                {faqs.map((faq, i) => (
                  <details key={i} className="group p-6 rounded-3xl border border-gray-200 hover:border-brand-200 transition-all [&_summary::-webkit-details-marker]:hidden">
                    <summary className="flex items-center justify-between cursor-pointer list-none">
                      <h4 className="text-lg font-bold text-gray-900 group-open:text-brand-600 transition-colors pr-8">
                        {faq.q}
                      </h4>
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center group-open:rotate-180 transition-transform">
                        <ChevronRight className="w-5 h-5 text-gray-500" />
                      </div>
                    </summary>
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-gray-600 leading-relaxed">{faq.a}</p>
                    </div>
                  </details>
                ))}
              </div>
            </section>

            {/* Related Courses */}
            {relatedCourses.length > 0 && (
              <section className="pt-16 border-t border-gray-100">
                <div className="mb-10">
                  <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <MousePointerClick className="w-6 h-6 text-brand-600" />
                    Completa tu especialización
                  </h3>
                  <p className="text-gray-500 mt-2">Cursos complementarios que mejorarán tu competitividad laboral.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {relatedCourses.map((related) => (
                    <a 
                      key={related.id}
                      href={`/p/cursos/${related.slug}`}
                      className="group grid min-h-[180px] grid-cols-[132px_1fr] overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:border-brand-500 hover:shadow-xl sm:grid-cols-[160px_1fr]"
                    >
                      <div className="relative min-h-full overflow-hidden bg-gray-100">
                        <img
                          src={related.imagenPortada}
                          alt={related.nombre}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      <div className="flex min-w-0 flex-col justify-between p-5">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-3">
                            <span className="max-w-[220px] truncate rounded-full bg-brand-100/50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-brand-600">
                              {related.area || 'Formación'}
                            </span>
                            <ChevronRight className="h-5 w-5 shrink-0 text-gray-300 transition-all group-hover:translate-x-1 group-hover:text-brand-600" />
                          </div>
                          <h4 className="line-clamp-2 text-lg font-extrabold uppercase leading-tight tracking-wide text-gray-900 group-hover:text-brand-900">
                            {related.nombre}
                          </h4>
                        </div>
                        <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold text-gray-600">
                          <span className="rounded-full bg-gray-100 px-3 py-1">
                            {related.duracionReferencia ? `${related.duracionReferencia} h` : 'Duración pendiente'}
                          </span>
                          <span className="rounded-full bg-gray-100 px-3 py-1">
                            {related.modality === 'online' ? 'Online' : 'Presencial'}
                          </span>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* RIGHT COLUMN: Sidebar Form */}
          <div className="lg:col-span-4 lg:sticky lg:top-32 h-fit">
            <div id="registro" className="relative scroll-mt-32">
              <div className="relative bg-white border border-gray-200 rounded-2xl p-7 shadow-xl overflow-hidden">
                <div className="text-center mb-7">
                  <div className="w-14 h-14 rounded-xl bg-red-50 flex items-center justify-center mx-auto mb-5 brand-text shadow-sm border border-red-100">
                    <GraduationCap className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">{sidebarTitle}</h3>
                  <p className="text-gray-700 text-sm leading-relaxed">{sidebarCopy}</p>
                </div>
                
                <LeadForm 
                  variant="card" 
                  cycleId={course.id} 
                  cycleName={title} 
                  hasActiveConvocatorias={isTeleformacion || course.enrollmentStatus === 'open'}
                  labelClassName="text-gray-800"
                  inputClassName="rounded-lg border-gray-300 bg-white focus:border-transparent focus:ring-2 focus:ring-[var(--brand)]"
                  buttonClassName="rounded-lg !bg-[#f2014b] hover:!bg-[#c9003f] !text-white shadow-none uppercase tracking-wide py-4 disabled:opacity-100 disabled:!bg-[#f2014b] disabled:!text-white"
                  linkClassName="brand-text"
                  submitLabel={sidebarSubmitLabel}
                  sourceForm={isTeleformacion ? 'teleformacion_inicio_inmediato' : 'curso_publico_sidebar'}
                  leadType={isTeleformacion ? 'lead' : undefined}
                  notes={isTeleformacion ? `Teleformación - inicio inmediato: ${title}` : `Solicitud de información: ${title}`}
                  leadMetadata={isTeleformacion ? {
                    lead_intent: 'teleformacion_inicio_inmediato',
                    course_delivery: 'online_async',
                    enrollment_mode: 'permanent_open',
                  } : undefined}
                />

                <div className="mt-7 pt-7 border-t border-gray-100 space-y-3">
                  <div className="flex items-center gap-4 text-sm font-bold text-gray-800 p-4 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <span>
                      {isTeleformacion
                        ? (course.duracionReferencia ? `${course.duracionReferencia} h online a tu ritmo` : 'Formación online a tu ritmo')
                        : `${course.duracionReferencia ? `${course.duracionReferencia} h` : 'Formación'} ${course.modality === 'online' ? 'online' : 'presencial'} en grupos reducidos`}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm font-bold text-gray-800 p-4 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center brand-text shrink-0">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <span>{isTeleformacion ? 'Inicio inmediato · matrícula permanente' : (course.nextRun?.scheduleLabel || course.landingAccessRequirements || 'Horarios adaptados según convocatoria')}</span>
                  </div>
                </div>

                <div className="mt-8 text-center">
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-4">¿Prefieres llamarnos?</p>
                  <a href="tel:922219257" className="text-2xl font-black brand-text transition-colors">922 219 257</a>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* STICKY BOTTOM CALL TO ACTION - MOBILE ONLY */}
      <div className="fixed bottom-20 left-0 right-0 z-40 px-4 lg:hidden pointer-events-none">
        <div className="max-w-md mx-auto pointer-events-auto animate-in slide-in-from-bottom duration-500 delay-1000">
          <a 
            href="#registro"
            className="flex items-center justify-between bg-gray-900 text-white p-2 pl-6 rounded-full shadow-2xl border border-white/10 backdrop-blur-xl"
          >
            <span className="font-bold">{isTeleformacion ? '¿Empiezas online?' : '¿Buscas info?'}</span>
            <div className="brand-btn px-6 py-3 rounded-full flex items-center gap-2 font-black text-sm uppercase tracking-wider">
              {isTeleformacion ? 'Empezar' : 'Solicitar'}
              <ArrowRight className="w-4 h-4" />
            </div>
          </a>
        </div>
      </div>

      {/* FINAL CALL TO ACTION */}
      <section className="bg-gray-900 py-32 px-4 relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
          <div className="absolute top-1/2 left-1/4 w-[500px] h-[500px] bg-brand-600 rounded-full blur-[120px] -translate-y-1/2" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-indigo-600 rounded-full blur-[100px]" />
        </div>
        
        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <h2 className="text-5xl md:text-7xl font-black text-white mb-10 tracking-tight">
            Únete a la academia líder en Canarias
          </h2>
          <p className="text-2xl text-gray-400 mb-12 leading-relaxed">
            Más de 26 años formando a los mejores profesionales. ¿Hablamos de tu futuro?
          </p>
          <a 
            href="#registro"
            className="inline-flex items-center gap-4 bg-white text-gray-900 px-12 py-6 rounded-full font-black text-2xl shadow-2xl transition-all hover:bg-brand-50 hover:scale-105 active:scale-95"
          >
            ¡Empezar hoy mismo!
            <ArrowRight className="w-8 h-8 text-brand-600" />
          </a>
          <div className="mt-12 flex flex-wrap justify-center gap-8 opacity-50 grayscale transition-all hover:grayscale-0">
             <div className="text-white font-bold tracking-widest text-sm border border-white/20 px-4 py-2 rounded-lg">ISO 9001</div>
             <div className="text-white font-bold tracking-widest text-sm border border-white/20 px-4 py-2 rounded-lg">EFQM 550</div>
             <div className="text-white font-bold tracking-widest text-sm border border-white/20 px-4 py-2 rounded-lg">ISO 18000</div>
          </div>
        </div>
      </section>

      {/* Animation Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slow-zoom {
          0% { transform: scale(1); }
          100% { transform: scale(1.1); }
        }
        .animate-slow-zoom {
          animation: slow-zoom 30s infinite alternate ease-in-out;
        }
        body > footer {
          margin-top: 0 !important;
        }
      ` }} />
    </div>
  )
}
