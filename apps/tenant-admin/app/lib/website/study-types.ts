export type NormalizedStudyType =
  | 'privados'
  | 'ocupados'
  | 'desempleados'
  | 'teleformacion'
  | 'ciclo_medio'
  | 'ciclo_superior'

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
  if (['teleformacion', 'tele_formacion', 'tele', 'online'].includes(normalized)) return 'teleformacion'
  if (['ciclo_medio', 'grado_medio', 'cfgm'].includes(normalized)) return 'ciclo_medio'
  if (['ciclo_superior', 'grado_superior', 'cfgs'].includes(normalized)) return 'ciclo_superior'

  return null
}
