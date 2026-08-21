export const FAQ_CATEGORIES = ['general', 'courses', 'enrollment', 'payments', 'technical'] as const
export const FAQ_LANGUAGES = ['es', 'en', 'ca'] as const
export const FAQ_STATUSES = ['draft', 'published', 'archived'] as const

export type FaqCategory = (typeof FAQ_CATEGORIES)[number]
export type FaqLanguage = (typeof FAQ_LANGUAGES)[number]
export type FaqStatus = (typeof FAQ_STATUSES)[number]

export type SlateAnswer = Array<{ children: Array<{ text: string }> }>

export type FaqEditorValues = {
  question: string
  answer: string
  category: FaqCategory
  language: FaqLanguage
  status: FaqStatus
  featured: boolean
  order: number
  keywords: string[]
}

export type FaqPayloadData = {
  question: string
  answer: SlateAnswer
  category: FaqCategory
  language: FaqLanguage
  status: FaqStatus
  featured: boolean
  order: number
  keywords: string[]
}

const CATEGORY_LABELS: Record<FaqCategory, string> = {
  general: 'General',
  courses: 'Cursos',
  enrollment: 'Inscripción',
  payments: 'Pagos',
  technical: 'Técnico',
}

export function isFaqCategory(value: unknown): value is FaqCategory {
  return typeof value === 'string' && (FAQ_CATEGORIES as readonly string[]).includes(value)
}

export function isFaqLanguage(value: unknown): value is FaqLanguage {
  return typeof value === 'string' && (FAQ_LANGUAGES as readonly string[]).includes(value)
}

export function isFaqStatus(value: unknown): value is FaqStatus {
  return typeof value === 'string' && (FAQ_STATUSES as readonly string[]).includes(value)
}

export function faqCategoryLabel(category: FaqCategory): string {
  switch (category) {
    case 'general':
    case 'courses':
    case 'enrollment':
    case 'payments':
    case 'technical':
      return CATEGORY_LABELS[category]
    default: {
      const exhaustive: never = category
      return exhaustive
    }
  }
}

export function slateFromText(text: string): SlateAnswer {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter(Boolean)
  const blocks = paragraphs.length > 0 ? paragraphs : [text.trim() || ' ']
  return blocks.map((paragraph) => ({ children: [{ text: paragraph }] }))
}

export function textFromSlate(value: unknown): string {
  if (typeof value === 'string') return value
  if (!value) return ''
  if (Array.isArray(value)) {
    return value
      .map((block) => {
        if (!block || typeof block !== 'object') return ''
        const children = (block as { children?: unknown }).children
        if (!Array.isArray(children)) return textFromSlate(block)
        return children
          .map((child) => (child && typeof child === 'object' && 'text' in child ? String(child.text ?? '') : ''))
          .join('')
      })
      .filter(Boolean)
      .join('\n\n')
  }
  if (typeof value === 'object' && value !== null && 'root' in value) {
    return textFromSlate((value as { root?: { children?: unknown } }).root?.children)
  }
  return ''
}

export function parseKeywordList(value: unknown): string[] {
  const raw = Array.isArray(value)
    ? value.map((item) => String(item))
    : String(value ?? '').split(/[\n,]/)
  const unique = new Set(raw.map((item) => item.trim()).filter(Boolean))
  return Array.from(unique).slice(0, 10)
}

export function editorValuesFromUnknown(input: Record<string, unknown> | null | undefined): FaqEditorValues {
  return {
    question: String(input?.question ?? '').trim(),
    answer: textFromSlate(input?.answer),
    category: isFaqCategory(input?.category) ? input.category : 'general',
    language: isFaqLanguage(input?.language) ? input.language : 'es',
    status: isFaqStatus(input?.status) ? input.status : 'draft',
    featured: input?.featured === true,
    order: Number.isFinite(Number(input?.order)) ? Math.max(0, Math.trunc(Number(input?.order))) : 0,
    keywords: parseKeywordList(input?.keywords),
  }
}

export function toFaqPayload(values: FaqEditorValues): FaqPayloadData {
  return {
    question: values.question.trim(),
    answer: slateFromText(values.answer),
    category: values.category,
    language: values.language,
    status: values.status === 'archived' ? 'archived' : values.status,
    featured: values.featured,
    order: Math.max(0, Math.trunc(values.order)),
    keywords: parseKeywordList(values.keywords),
  }
}

export function mergeSeoKeywords(local: string[], globalKeywords: string[]): string[] {
  return parseKeywordList([...local, ...globalKeywords])
}

export function draftFaqFromTopic(
  topic: string,
  seo: { keywords?: string[]; concepts?: string[] },
  category: FaqCategory,
): FaqEditorValues {
  const clean = topic.trim() || faqCategoryLabel(category)
  const concepts = (seo.concepts ?? []).filter(Boolean).slice(0, 3)
  const keywords = mergeSeoKeywords([clean, faqCategoryLabel(category)], seo.keywords ?? [])
  const conceptLine = concepts.length > 0 ? ` Incluye ${concepts.join(', ')}.` : ''
  return {
    question: `¿Qué debo saber sobre ${clean} en CEP Formación?`.slice(0, 200),
    answer:
      `${clean} se gestiona desde orientación y la ficha pública del programa.${conceptLine} Si necesitas una plaza, contacta con el centro para confirmar fechas, documentación y modalidad.`.trim(),
    category,
    language: 'es',
    status: 'draft',
    featured: false,
    order: 0,
    keywords,
  }
}
