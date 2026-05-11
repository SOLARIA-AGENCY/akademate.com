import type { WebsitePage, WebsiteSection } from './types'

const CEP_FEATURE_STRIP_OVERRIDE: Extract<WebsiteSection, { kind: 'featureStrip' }> = {
  kind: 'featureStrip',
  title: 'Por qué elegir CEP',
  subtitle: 'Formación cercana, práctica y orientada a que avances con seguridad desde el primer contacto hasta el aula.',
  items: [
    {
      title: 'Formación pensada para trabajar',
      description: 'Programas conectados con sectores reales y competencias útiles para tu próximo paso profesional.',
    },
    {
      title: 'Docentes en activo',
      description: 'Aprende con profesionales que conocen el día a día del sector y trasladan esa experiencia al aula.',
    },
    {
      title: 'Sedes reales en Tenerife',
      description: 'Centros de atención y formación donde puedes resolver dudas, visitar instalaciones y recibir orientación.',
    },
    {
      title: 'Bolsa de empleo y orientación',
      description: 'Acompañamiento para enfocar tu búsqueda laboral y acceder a nuestra agencia de colocación autorizada.',
    },
    {
      title: 'Grupos reducidos',
      description: 'Un entorno de aprendizaje más cercano para seguir tu progreso y trabajar con más atención docente.',
    },
    {
      title: 'Acompañamiento desde la matrícula',
      description: 'Te guiamos en requisitos, documentación, horarios y opciones para elegir con claridad.',
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

const CEP_CTA_BANNER_OVERRIDE: Extract<WebsiteSection, { kind: 'ctaBanner' }> = {
  kind: 'ctaBanner',
  title: '¿Buscas una formación subvencionada o quieres cambiar de rumbo profesional?',
  body: 'Consulta las convocatorias abiertas y reserva tu plaza con el equipo de CEP Formación.',
  cta: { label: 'Ver convocatorias abiertas', href: '/convocatorias' },
  theme: 'dark',
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
  upsertSection(sections, 'ctaBanner', CEP_CTA_BANNER_OVERRIDE, 3)
  upsertSection(sections, 'categoryGrid', CEP_CATEGORY_GRID_OVERRIDE)

  return {
    ...page,
    sections,
  }
}
