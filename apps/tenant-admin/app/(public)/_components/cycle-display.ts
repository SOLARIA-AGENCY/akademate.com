import { displayCampusName } from '@/app/lib/public-campus-name'

export type CycleLevelKey = 'fp_basica' | 'grado_medio' | 'grado_superior' | 'certificado_profesionalidad'

export type CycleOpenRun = {
  href: string
  startLabel: string
  campusName: string | null
}

export type CycleCardModel = {
  name: string
  slug: string
  href?: string
  imageUrl: string | null
  level?: string | null
  family?: string | null
  description?: string | null
  officialTitle?: string | null
  duration?: {
    totalHours?: number | null
    practiceHours?: number | null
    modality?: string | null
    classFrequency?: string | null
  } | null
  openRuns?: CycleOpenRun[]
}

const LEVEL_META: Record<CycleLevelKey, { label: string; bgColor: string }> = {
  fp_basica: { label: 'FP básica', bgColor: '#3E091A' },
  grado_medio: { label: 'Grado medio', bgColor: '#3E091A' },
  grado_superior: { label: 'Grado superior', bgColor: '#f2014b' },
  certificado_profesionalidad: { label: 'Certificado', bgColor: '#3E091A' },
}

export function cycleLevelMeta(level: string | null | undefined): { label: string; bgColor: string } | null {
  if (!level) return null
  return LEVEL_META[level as CycleLevelKey] ?? null
}

export function cycleModalityLabel(value: string | null | undefined): string | null {
  const key = String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
  if (!key) return null
  if (key.includes('semi')) return 'Semipresencial'
  if (key.includes('online') || key.includes('teleform')) return 'Online'
  if (key.includes('mixt')) return 'Mixto'
  if (key.includes('presenc')) return 'Presencial'
  return null
}

export function cycleFacts(cycle: CycleCardModel): Array<{ label: string; value: string; hint?: string }> {
  const facts: Array<{ label: string; value: string; hint?: string }> = []
  const official = String(cycle.officialTitle || '').trim()
  if (official) facts.push({ label: 'Titulación', value: official })
  const modality = cycleModalityLabel(cycle.duration?.modality)
  if (modality) {
    const hint = String(cycle.duration?.classFrequency || '').trim()
    facts.push({ label: 'Modalidad', value: modality, hint: hint || undefined })
  }
  const practice = Number(cycle.duration?.practiceHours)
  if (Number.isFinite(practice) && practice > 0) {
    facts.push({ label: 'Prácticas', value: `${Math.round(practice)} h en empresa` })
  }
  const family = String(cycle.family || '').trim()
  if (family) facts.push({ label: 'Familia', value: family })
  return facts
}

export function cycleHoursLabel(cycle: CycleCardModel): string | null {
  const hours = Number(cycle.duration?.totalHours)
  if (!Number.isFinite(hours) || hours <= 0) return null
  return `${Math.round(hours)} h de formación`
}

export function cycleDescription(cycle: CycleCardModel): string | null {
  const raw = String(cycle.description || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return raw || null
}

export function cycleHref(cycle: CycleCardModel): string {
  return cycle.href || `/p/ciclos/${cycle.slug}`
}

export function relationId(relation: unknown): string | null {
  if (!relation) return null
  if (typeof relation === 'object' && relation && 'id' in relation && (relation as { id?: unknown }).id != null) {
    return String((relation as { id: unknown }).id)
  }
  if (typeof relation === 'number' || typeof relation === 'string') return String(relation)
  return null
}

export function formatCycleRunDate(value: unknown): string {
  if (!value) return 'Fecha por confirmar'
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return 'Fecha por confirmar'
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function toCycleCardModel(
  cycle: {
    name?: string | null
    slug?: string | null
    level?: string | null
    family?: string | null
    description?: string | null
    officialTitle?: string | null
    official_title?: string | null
    duration?: CycleCardModel['duration']
  },
  imageUrl: string | null,
  openRuns: CycleOpenRun[] = [],
  href?: string,
): CycleCardModel {
  return {
    name: String(cycle.name || ''),
    slug: String(cycle.slug || ''),
    href,
    imageUrl,
    level: cycle.level || null,
    family: cycle.family || null,
    description: cycle.description || null,
    officialTitle: cycle.officialTitle || cycle.official_title || null,
    duration: cycle.duration || null,
    openRuns,
  }
}

export function collectOpenRunsByCycle(runs: unknown[], cycleIds: string[]): Map<string, CycleOpenRun[]> {
  const openRunsByCycleId = new Map<string, CycleOpenRun[]>()
  for (const raw of runs) {
    const run = raw as {
      id?: unknown
      codigo?: unknown
      start_date?: unknown
      cycle?: unknown
      campus?: { name?: unknown } | string | null
    }
    const cycleId = relationId(run.cycle)
    if (!cycleId || !cycleIds.includes(cycleId)) continue
    const campus = typeof run.campus === 'object' && run.campus ? run.campus : null
    const list = openRunsByCycleId.get(cycleId) || []
    if (list.length >= 3) continue
    list.push({
      href: `/p/convocatorias/${run.codigo || run.id}`,
      startLabel: formatCycleRunDate(run.start_date),
      campusName: campus?.name ? displayCampusName(String(campus.name)) : null,
    })
    openRunsByCycleId.set(cycleId, list)
  }
  return openRunsByCycleId
}
