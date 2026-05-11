import type { WebsitePage, WebsiteSection } from './types'

const CEP_FEATURE_STRIP_OVERRIDE: Extract<WebsiteSection, { kind: 'featureStrip' }> = {
  kind: 'featureStrip',
  title: 'Por qué elegir CEP',
  subtitle: 'Formación cercana, práctica y orientada a que avances con seguridad desde el primer contacto hasta el aula.',
  items: [
    {
      title: 'Asesoramiento antes de matricularte',
      description: 'Te ayudamos a elegir curso, modalidad y convocatoria según tu objetivo profesional y tu disponibilidad real.',
    },
    {
      title: 'Aprendizaje aplicado',
      description: 'Programas pensados para trabajar con casos prácticos, grupos controlados y contenidos conectados con el sector.',
    },
    {
      title: 'Oferta para cada etapa',
      description: 'Ciclos oficiales, cursos privados, formación subvencionada y teleformación para avanzar sin perder el foco.',
    },
    {
      title: 'Seguimiento durante la formación',
      description: 'Atención académica y coordinación de centro para que tengas claro horarios, requisitos, documentación y próximos pasos.',
    },
  ],
}

const CEP_CATEGORY_GRID_OVERRIDE: Extract<WebsiteSection, { kind: 'categoryGrid' }> = {
  kind: 'categoryGrid',
  title: 'Áreas de formación',
  subtitle: 'Explora nuestras especialidades y encuentra cursos, ciclos y convocatorias agrupadas por área profesional.',
  items: [
    { title: 'Área Sanitaria y Clínica', image: '/media/farmacia-hero.png', href: '/p/areas/area-sanitaria-y-clinica' },
    { title: 'Área Veterinaria y Bienestar Animal', image: '/website/cep/categories/mundo-animal.jpg', href: '/p/areas/area-veterinaria-y-bienestar-animal' },
    { title: 'Área Salud, Bienestar y Deporte', image: '/website/cep/categories/salud-bienestar-y-deporte.jpg', href: '/p/areas/area-salud-bienestar-y-deporte' },
    { title: 'Área Tecnología, Digital y Diseño', image: '/media/dev-priv-0001.jpg', href: '/p/areas/area-tecnologia-digital-y-diseno' },
    { title: 'Área Empresa, Administración y Gestión', image: '/media/mkt-ocup-0001.jpg', href: '/p/areas/area-empresa-administracion-y-gestion' },
    { title: 'Área Seguridad, Vigilancia y Protección', image: '/media/dev-dese-0001.jpg', href: '/p/areas/area-seguridad-vigilancia-y-proteccion' },
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
