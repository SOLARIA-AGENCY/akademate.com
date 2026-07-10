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
  privados: ['privado'],
  desempleados: ['desempleados'],
  ocupados: ['ocupados'],
  teleformacion: ['teleformacion'],
}

export const PUBLIC_STUDY_TYPE_FALLBACK_IMAGES: Record<PublicStudyType, string> = {
  privados: '/website/cep/courses/fallback-privados.png',
  desempleados: '/website/cep/courses/fallback-desempleados.png',
  ocupados: '/website/cep/courses/fallback-ocupados.png',
  teleformacion: '/website/cep/courses/fallback-teleformacion.png',
}

// Keep an editorial image on public cards even when an operator has not yet
// uploaded a course-specific asset or selected an unknown legacy type.
export const DEFAULT_PUBLIC_COURSE_FALLBACK_IMAGE = '/website/cep/courses/fallback-privados.png'

// Generated editorial covers for legacy CEP records that were imported without
// a Media relation. Keeping this mapping here guarantees a real cover during
// the transition while operators complete the media catalog in the dashboard.
export const CEP_GENERATED_COURSE_IMAGES: Record<string, string> = {
  'PRIV-AUXFARM-PARA': '/website/cep/courses/generated/farmacia-parafarmacia.png',
  'SCLN-CMED-cfgm-farmacia-y-parafarmacia': '/website/cep/courses/generated/farmacia-parafarmacia.png',
  'SBD-TELE-dietetica-y-nutricion-online-priv': '/website/cep/courses/generated/dietetica-nutricion-online.png',
  'SEPE-HOTR0020-DESE': '/website/cep/courses/generated/logistica-cocina-aprovisionamiento.png',
  'SBD-TELE-nutricion-deportiva-online-100h': '/website/cep/courses/generated/nutricion-deportiva-online.png',
  'SBD-TELE-nutricion-en-la-practica-deportiva-online-200h': '/website/cep/courses/generated/nutricion-practica-deportiva-online.png',
  'EAG-PRIV-seminario-practico-gestion-unycop': '/website/cep/courses/generated/seminario-gestion-unycop.png',
  'PRIV-GESTORVET': '/website/cep/courses/generated/seminario-gestorvet.png',
}

export function getGeneratedCourseImage(codigo: string | null | undefined): string | null {
  if (!codigo) return null
  return CEP_GENERATED_COURSE_IMAGES[codigo.trim()] ?? null
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

function toFallbackStudyType(studyType: NormalizedStudyType | null): PublicStudyType | null {
  if (!studyType) return null
  if (studyType === 'ciclo_medio' || studyType === 'ciclo_superior') return 'privados'
  return isPublicStudyType(studyType) ? studyType : null
}

export function getPublicStudyTypeFallbackImage(value: string | null | undefined): string {
  const normalized = normalizeStudyType(value)
  const fallbackType = toFallbackStudyType(normalized)
  if (!fallbackType) return DEFAULT_PUBLIC_COURSE_FALLBACK_IMAGE
  return PUBLIC_STUDY_TYPE_FALLBACK_IMAGES[fallbackType]
}

export function toDashboardStudyType(value: string | null | undefined): PublicStudyType {
  const normalized = normalizeStudyType(value)
  if (normalized === 'ciclo_medio' || normalized === 'ciclo_superior') {
    return 'privados'
  }
  return isPublicStudyType(normalized) ? normalized : 'privados'
}
