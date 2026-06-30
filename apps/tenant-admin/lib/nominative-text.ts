const CONNECTORS = new Set([
  'a',
  'al',
  'con',
  'da',
  'das',
  'de',
  'del',
  'do',
  'dos',
  'e',
  'el',
  'en',
  'la',
  'las',
  'los',
  'o',
  'para',
  'por',
  'u',
  'y',
])

const UPPERCASE_TOKENS = new Map([
  ['ATV', 'ATV'],
  ['AV', 'AV'],
  ['CEP', 'CEP'],
  ['CFGM', 'CFGM'],
  ['CFGS', 'CFGS'],
  ['DNI', 'DNI'],
  ['FCT', 'FCT'],
  ['FP', 'FP'],
  ['IA', 'IA'],
  ['LMS', 'LMS'],
  ['MAC', 'MAC'],
  ['NIE', 'NIE'],
  ['NIF', 'NIF'],
  ['PRL', 'PRL'],
  ['RRHH', 'RRHH'],
  ['SEM', 'SEM'],
  ['SEO', 'SEO'],
  ['SPD', 'SPD'],
  ['UV', 'U.V'],
  ['U.V', 'U.V'],
])

const ROMAN_NUMERAL_REGEX =
  /^(?=[mdclxvi]+$)m{0,4}(cm|cd|d?c{0,3})(xc|xl|l?x{0,3})(ix|iv|v?i{0,3})$/i
const WORD_DELIMITER_REGEX = /([/()·-])/g
const LETTER_REGEX = /\p{L}/u

function titleCaseCore(core: string): string {
  const lower = core.toLocaleLowerCase('es-ES')
  return lower.replace(/^\p{L}/u, (firstLetter) => firstLetter.toLocaleUpperCase('es-ES'))
}

function normalizeSegment(segment: string, isFirstWord: boolean): string {
  if (!segment || !LETTER_REGEX.test(segment)) return segment

  const match = segment.match(/^([^-\p{L}\p{N}]*)(.*?)([^-\p{L}\p{N}]*)$/u)
  const prefix = match?.[1] ?? ''
  const core = match?.[2] ?? segment
  const suffix = match?.[3] ?? ''

  if (!core || !LETTER_REGEX.test(core)) return segment

  const tokenKey = core.replace(/\./g, '').toLocaleUpperCase('es-ES')
  const literalKey = core.toLocaleUpperCase('es-ES')
  const lowerKey = core.toLocaleLowerCase('es-ES')

  if (UPPERCASE_TOKENS.has(literalKey)) {
    return `${prefix}${UPPERCASE_TOKENS.get(literalKey)}${suffix}`
  }

  if (UPPERCASE_TOKENS.has(tokenKey)) {
    return `${prefix}${UPPERCASE_TOKENS.get(tokenKey)}${suffix}`
  }

  if (ROMAN_NUMERAL_REGEX.test(core)) {
    return `${prefix}${core.toLocaleUpperCase('es-ES')}${suffix}`
  }

  if (!isFirstWord && CONNECTORS.has(lowerKey)) {
    return `${prefix}${lowerKey}${suffix}`
  }

  return `${prefix}${titleCaseCore(core)}${suffix}`
}

export function normalizeNominativeText(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined

  const compact = value.trim().replace(/\s+/g, ' ')
  if (!compact) return undefined

  let hasSeenWord = false

  return compact
    .split(' ')
    .map((word) => {
      const parts = word.split(WORD_DELIMITER_REGEX)

      return parts
        .map((part) => {
          if (!part || WORD_DELIMITER_REGEX.test(part)) return part

          const normalized = normalizeSegment(part, !hasSeenWord)
          if (LETTER_REGEX.test(part)) hasSeenWord = true
          return normalized
        })
        .join('')
    })
    .join(' ')
}

export function normalizeNominativeTextOrOriginal<T>(value: T): T | string {
  return normalizeNominativeText(value) ?? value
}
