export type NormalizedStudyType =
  | 'privados'
  | 'ocupados'
  | 'desempleados'
  | 'teleformacion'
  | 'ciclo_medio'
  | 'ciclo_superior'

export type PublicStudyType = Exclude<NormalizedStudyType, 'ciclo_medio' | 'ciclo_superior'>

export const PUBLIC_STUDY_TYPE_CODES: Record<PublicStudyType, string> = {
  privados: 'PRIV',
  desempleados: 'DES',
  ocupados: 'OCU',
  teleformacion: 'TEL',
}

export const PUBLIC_STUDY_TYPE_COURSE_TYPE_VALUES: Record<PublicStudyType, string[]> = {
  privados: ['privado', 'privados'],
  desempleados: ['desempleado', 'desempleados'],
  ocupados: ['ocupado', 'ocupados'],
  teleformacion: ['teleformacion', 'tele_formacion'],
}

export function normalizeStudyType(value: string | null | undefined): NormalizedStudyType | null {
  if (!value) return null
  const normalized = value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9_]+/g, '_')

  if (['privado', 'privados', 'priv', 'pri'].includes(normalized)) return 'privados'
  if (['ocupado', 'ocupados', 'ocu', 'trabajadores_ocupados'].includes(normalized)) return 'ocupados'
  if (['desempleado', 'desempleados', 'des', 'trabajadores_desempleados'].includes(normalized)) return 'desempleados'
  if (['teleformacion', 'tele_formacion', 'tele', 'tel', 'online'].includes(normalized)) return 'teleformacion'
  if (['ciclo_medio', 'grado_medio', 'cfgm'].includes(normalized)) return 'ciclo_medio'
  if (['ciclo_superior', 'grado_superior', 'cfgs'].includes(normalized)) return 'ciclo_superior'

  return null
}

export function isPublicStudyType(value: NormalizedStudyType | null): value is PublicStudyType {
  return Boolean(
    value &&
      value !== 'ciclo_medio' &&
      value !== 'ciclo_superior'
  )
}

export function normalizePublicStudyType(value: string | null | undefined): PublicStudyType | null {
  const normalized = normalizeStudyType(value)
  return isPublicStudyType(normalized) ? normalized : null
}

export function toDashboardStudyType(value: string | null | undefined): PublicStudyType {
  const normalized = normalizeStudyType(value)
  if (normalized === 'ciclo_medio' || normalized === 'ciclo_superior') {
    return 'privados'
  }
  return isPublicStudyType(normalized) ? normalized : 'privados'
}
