function foldCampusKey(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
}

/**
 * Public campus names are CEP Norte, CEP Sur and CEP Santa Cruz.
 * The word "Sede" is a label, never part of the name.
 */
export function displayCampusName(value: string | null | undefined): string {
  const raw = String(value || '').trim()
  if (!raw) return raw
  const folded = foldCampusKey(raw)
  const isPlaceholder = /\b(por confirmar|a confirmar|sin sede|online|teleform|desde casa)\b/.test(folded)
  const hasCampusToken = /\b(norte|sur|santa\s*cruz|orotava|laguna)\b/.test(folded)
  if (isPlaceholder && !hasCampusToken) return raw
  if (/\bsur\b/.test(folded)) return 'CEP Sur'
  if (/\bnorte\b/.test(folded) || /\borotava\b/.test(folded) || /\blaguna\b/.test(folded)) return 'CEP Norte'
  if (/\bsanta\s*cruz\b/.test(folded)) return 'CEP Santa Cruz'
  return raw.replace(/^(sede\s+)+/i, '').trim() || raw
}

export function campusPublicName(
  campus: { name?: unknown } | string | null | undefined,
): string {
  if (!campus) return ''
  if (typeof campus === 'string') return displayCampusName(campus)
  return displayCampusName(campus.name == null ? '' : String(campus.name))
}

export function campusPublicHref(value: string | null | undefined): string {
  const name = displayCampusName(value)
  if (name === 'CEP Sur') return '/p/sedes/cep-sur'
  if (name === 'CEP Norte') return '/p/sedes/sede-norte'
  if (name === 'CEP Santa Cruz') return '/p/sedes/sede-santa-cruz'
  return ''
}
