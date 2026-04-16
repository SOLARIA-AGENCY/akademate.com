import type { WebsitePage, WebsiteSection } from './types'

const CEP_FEATURE_STRIP_OVERRIDE: Extract<WebsiteSection, { kind: 'featureStrip' }> = {
  kind: 'featureStrip',
  title: 'Por qué CEP',
  subtitle: 'Mismo tono de marca, estructura más mantenible.',
  items: [
    {
      title: 'Prácticas reales',
      description: 'Programas conectados con empresas y entorno profesional.',
    },
    {
      title: 'Oferta mixta',
      description: 'Ciclos oficiales, cursos privados y formación subvencionada.',
    },
    {
      title: 'Sedes activas',
      description: 'Presencia física en Tenerife con atención académica continua.',
    },
  ],
}

const CEP_CATEGORY_GRID_OVERRIDE: Extract<WebsiteSection, { kind: 'categoryGrid' }> = {
  kind: 'categoryGrid',
  title: 'Áreas de formación',
  subtitle: 'Bloques visuales editables, conservando la estructura del sitio original.',
  items: [
    { title: 'Área Sanitaria y Clínica', image: '/website/cep/categories/especializacion-sanitaria.jpg', href: '/cursos' },
    { title: 'Área Veterinaria y Bienestar Animal', image: '/website/cep/categories/mundo-animal.jpg', href: '/cursos' },
    { title: 'Área Salud, Bienestar y Deporte', image: '/website/cep/categories/salud-bienestar-y-deporte.jpg', href: '/cursos' },
    { title: 'Área Tecnología, Digital y Diseño', image: '/website/cep/categories/ciclos-formativos.jpg', href: '/cursos' },
    { title: 'Área Empresa, Administración y Gestión', image: '/website/cep/categories/ciclos-formativos.jpg', href: '/cursos' },
    { title: 'Área Seguridad, Vigilancia y Protección', image: '/website/cep/categories/especializacion-sanitaria.jpg', href: '/cursos' },
  ],
}

function upsertSection<TKind extends WebsiteSection['kind']>(
  sections: WebsiteSection[],
  kind: TKind,
  value: Extract<WebsiteSection, { kind: TKind }>,
  fallbackIndex?: number
) {
  const index = sections.findIndex((section) => section?.kind === kind)
  if (index >= 0) {
    const existing = sections[index]
    if (existing?.kind === kind) {
      sections[index] = {
        ...existing,
        ...value,
      } as WebsiteSection
      return
    }
  }

  if (typeof fallbackIndex === 'number' && fallbackIndex >= 0 && fallbackIndex <= sections.length) {
    sections.splice(fallbackIndex, 0, value)
    return
  }

  sections.push(value)
}

export function applyCepHomeOverrides(page: WebsitePage): WebsitePage {
  const sections = Array.isArray(page.sections) ? [...page.sections] : []

  upsertSection(sections, 'featureStrip', CEP_FEATURE_STRIP_OVERRIDE, 2)
  upsertSection(sections, 'categoryGrid', CEP_CATEGORY_GRID_OVERRIDE)

  return {
    ...page,
    sections,
  }
}

