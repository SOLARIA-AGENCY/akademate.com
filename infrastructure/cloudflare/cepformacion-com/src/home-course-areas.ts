const FORBIDDEN_AREA_COLORS = new Set(['#2563eb', '#0066cc', '#3b82f6', '#1a1a2e'])

export type CepAreaCode = 'SCLN' | 'VETA' | 'SBD' | 'TDD' | 'EAG' | 'SVP'

export type CourseAreaBadge = {
  code: CepAreaCode | null
  label: string
  color: string
}

type DefinedArea = {
  code: CepAreaCode
  label: string
  color: string
  namePattern: RegExp
  titlePattern: RegExp
}

export const CEP_DEFINED_AREAS: DefinedArea[] = [
  {
    code: 'SVP',
    label: 'Seguridad',
    color: '#475569',
    namePattern: /seguridad|vigilancia|proteccion/,
    titlePattern: /(vigilancia|seguridad privada|proteccion de personas|espacios publicos|centros comerciales)/i,
  },
  {
    code: 'VETA',
    label: 'Veterinaria',
    color: '#16A34A',
    namePattern: /veterinaria|bienestar animal/,
    titlePattern: /(veterin|(^|\s)atv(\s|$)|canin|felin|cetace|animal(?!ental)|adiestramiento)/i,
  },
  {
    code: 'SCLN',
    label: 'Sanitaria',
    color: '#E3003A',
    namePattern: /sanitaria|clinica/,
    titlePattern:
      /(enfermer|odont|bucodental|farmacia|dermocosmet|clinica estetic|auxiliar de optica|tanatopraxia|tanatoestetica|clinicas dentales|sanitaria|sanitario)/i,
  },
  {
    code: 'SBD',
    label: 'Salud y deporte',
    color: '#7C3AED',
    namePattern: /salud|bienestar y deporte|deporte/,
    titlePattern: /(entrenamiento|pilates|yoga|quiromasaje|dietetic|nutricion|bienestar|deporte)/i,
  },
  {
    code: 'TDD',
    label: 'Tecnología',
    color: '#0EA5E9',
    namePattern: /tecnologia|digital y diseno|diseno/,
    titlePattern:
      /(inteligencia artificial|(^|\s)ia(\s|$)|digital|web|software|ofimatica|moodle|e learning|elearning|impresion 3d|diseno 3d|videojuegos|cloud|comercio electronico|marketing online|marketing digital|herramientas web 2 0|tratamiento de imagenes|nube ecloud|plataformas lms)/i,
  },
  {
    code: 'EAG',
    label: 'Empresa',
    color: '#F59E0B',
    namePattern: /empresa|administracion|gestion/,
    titlePattern:
      /(contabilidad|fiscal|nominas|rrhh|recursos humanos|liderazgo|logistica|proyectos?|gestion|empresa|administracion|ingles|aleman|frances|hosteler|aliment|cocina|restauracion|vinos|clientes|tributari|financiacion|igualdad|ventas|almacen|transporte|organizacional|conciliacion|ambiental|discapacidad)/i,
  },
]

const FALLBACK_AREA_COLORS = ['#C026D3', '#EA580C', '#0F766E', '#9333EA', '#B45309', '#BE123C']

function fold(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
}

function normalizeHex(value: string | null | undefined): string | null {
  const raw = String(value || '').trim()
  if (!/^#[0-9A-Fa-f]{6}$/.test(raw)) return null
  return raw.toUpperCase()
}

function publicAreaColor(preferred: string | null | undefined, fallback: string): string {
  const hex = normalizeHex(preferred)
  if (!hex) return fallback
  if (FORBIDDEN_AREA_COLORS.has(hex.toLowerCase())) return fallback
  return hex
}

function hashAreaColor(label: string): string {
  let hash = 0
  for (const character of fold(label)) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0
  }
  return FALLBACK_AREA_COLORS[hash % FALLBACK_AREA_COLORS.length] || '#475569'
}

function catalogAreaName(course: {
  area?: string | null
  area_formativa?: { nombre?: string | null; name?: string | null; color?: string | null } | string | null
}): string {
  if (typeof course.area === 'string' && course.area.trim()) return course.area.trim()
  const nested = course.area_formativa
  if (typeof nested === 'string' && nested.trim()) return nested.trim()
  if (nested && typeof nested === 'object') {
    const name = nested.nombre || nested.name
    if (name && name.trim()) return name.trim()
  }
  return ''
}

function catalogAreaColor(course: {
  areaColor?: string | null
  area_formativa?: { color?: string | null } | string | null
}): string | null {
  if (course.areaColor) return course.areaColor
  if (course.area_formativa && typeof course.area_formativa === 'object') return course.area_formativa.color || null
  return null
}

function displayAreaLabel(value: string): string {
  const stripped = value.replace(/^Área\s+/i, '').trim() || value
  const key = fold(stripped)
  if (key.includes('idioma') || key.includes('linguistic')) return 'Idiomas'
  return stripped
}

function matchDefinedArea(name: string): DefinedArea | null {
  const key = fold(name)
  if (!key || key === 'sin area') return null
  return CEP_DEFINED_AREAS.find((area) => area.namePattern.test(key)) || null
}

function matchDefinedAreaFromTitle(name: string): DefinedArea | null {
  const key = fold(name)
  if (!key) return null
  return CEP_DEFINED_AREAS.find((area) => area.titlePattern.test(key)) || null
}

export function resolveCourseArea(course: {
  nombre?: string | null
  area?: string | null
  areaColor?: string | null
  area_formativa?: { nombre?: string | null; name?: string | null; color?: string | null } | string | null
}): CourseAreaBadge | null {
  const catalogName = catalogAreaName(course)
  const preferredColor = catalogAreaColor(course)
  const definedFromCatalog = matchDefinedArea(catalogName)
  if (definedFromCatalog) {
    return {
      code: definedFromCatalog.code,
      label: definedFromCatalog.label,
      color: publicAreaColor(preferredColor, definedFromCatalog.color),
    }
  }
  if (catalogName && fold(catalogName) !== 'sin area') {
    const label = displayAreaLabel(catalogName)
    return {
      code: null,
      label,
      color: publicAreaColor(preferredColor, hashAreaColor(label)),
    }
  }
  const definedFromTitle = matchDefinedAreaFromTitle(course.nombre || '')
  if (!definedFromTitle) return null
  return {
    code: definedFromTitle.code,
    label: definedFromTitle.label,
    color: publicAreaColor(preferredColor, definedFromTitle.color),
  }
}

export function areaLabelsForTitles(titles: string[]): string[] {
  const found = new Set<string>()
  for (const title of titles) {
    const area = resolveCourseArea({ nombre: title })
    if (area?.label) found.add(area.label)
  }
  const ordered = CEP_DEFINED_AREAS.map((area) => area.label).filter((label) => found.has(label))
  for (const label of found) {
    if (!ordered.includes(label)) ordered.push(label)
  }
  return ordered
}

export function areaTitleRules(): Array<{ label: string; source: string; flags: string }> {
  return CEP_DEFINED_AREAS.map((area) => ({
    label: area.label,
    source: area.titlePattern.source,
    flags: area.titlePattern.flags,
  }))
}

export function isFundedFreeSection(section: string): boolean {
  return section === 'ocupados' || section === 'desempleados'
}
