const CAMPUS_NAME_VARIANTS: Array<[string, string]> = [
  ['Sede CEP Formación', 'CEP Formación'],
  ['Sede CEP Formacion', 'CEP Formación'],
  ['Sede Sede Santa Cruz', 'CEP Santa Cruz'],
  ['Sede CEP Santa Cruz', 'CEP Santa Cruz'],
  ['Sede Santa Cruz', 'CEP Santa Cruz'],
  ['Sede Norte – La Orotava', 'CEP Norte'],
  ['Sede Norte - La Orotava', 'CEP Norte'],
  ['Sede Norte — La Orotava', 'CEP Norte'],
  ['Sede Norte (La Laguna)', 'CEP Norte'],
  ['Sede CEP Norte', 'CEP Norte'],
  ['Sede Norte', 'CEP Norte'],
  ['Sede CEP Sur', 'CEP Sur'],
  ['Sede Sur', 'CEP Sur'],
  ['SEDE SEDE SANTA CRUZ', 'CEP Santa Cruz'],
  ['SEDE CEP SANTA CRUZ', 'CEP Santa Cruz'],
  ['SEDE SANTA CRUZ', 'CEP Santa Cruz'],
  ['SEDE NORTE – LA OROTAVA', 'CEP Norte'],
  ['SEDE NORTE - LA OROTAVA', 'CEP Norte'],
  ['SEDE NORTE (LA LAGUNA)', 'CEP Norte'],
  ['SEDE CEP NORTE', 'CEP Norte'],
  ['SEDE NORTE', 'CEP Norte'],
  ['SEDE CEP SUR', 'CEP Sur'],
  ['SEDE SUR', 'CEP Sur'],
  ['CEP FORMACION NORTE', 'CEP Norte'],
  ['CEP FORMACIÓN NORTE', 'CEP Norte'],
  ['CEP SANTA CRUZ', 'CEP Santa Cruz'],
  ['CEP NORTE', 'CEP Norte'],
  ['CEP SUR', 'CEP Sur'],
]

export function displayCampusName(value: string | null | undefined): string {
  const raw = String(value || '').trim()
  if (!raw) return raw
  const folded = raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
  const isPlaceholder = /\b(por confirmar|a confirmar|sin sede|online|teleform|desde casa)\b/.test(folded)
  const hasCampusToken = /\b(norte|sur|santa\s*cruz|orotava|laguna)\b/.test(folded)
  if (isPlaceholder && !hasCampusToken) return raw
  if (/\bvirtual\b/.test(folded)) return 'CEP Virtual'
  if (/\bsur\b/.test(folded)) return 'CEP Sur'
  if (/\bnorte\b/.test(folded) || /\borotava\b/.test(folded) || /\blaguna\b/.test(folded)) return 'CEP Norte'
  if (/\bsanta\s*cruz\b/.test(folded)) return 'CEP Santa Cruz'
  return raw.replace(/^(sede\s+)+/i, '').trim() || raw
}

export function campusPublicHref(value: string | null | undefined): string {
  const name = displayCampusName(value)
  if (name === 'CEP Sur') return '/sedes/cep-sur'
  if (name === 'CEP Norte') return '/sedes/sede-norte'
  if (name === 'CEP Santa Cruz') return '/sedes/sede-santa-cruz'
  return ''
}

export function rewriteCampusNames(html: string): string {
  let next = html
  for (const [from, to] of CAMPUS_NAME_VARIANTS) {
    if (!from || from === to) continue
    next = next.split(from).join(to)
  }
  next = next.split('>Santa Cruz<').join('>CEP Santa Cruz<')
  next = next.split('>Norte<').join('>CEP Norte<')
  next = next.split('>Sur<').join('>CEP Sur<')
  return next
}
