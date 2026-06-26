export const SPANISH_PHONE_ERROR =
  'Introduce un teléfono fijo o móvil español válido. Ejemplos: 922 219 257, 677 615 684 o +34 922 219 257.'

export function normalizeSpanishPhone(value: unknown): string | null {
  if (value === null || value === undefined) return null
  if (typeof value !== 'string') return null

  const digits = value.replace(/\D/g, '')
  const local = digits.startsWith('34') && digits.length === 11 ? digits.slice(2) : digits

  if (!/^[6789]\d{8}$/.test(local)) return null
  return `+34 ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`
}

export function normalizeOptionalSpanishPhone(value: unknown): string | null | undefined {
  if (value === undefined) return undefined
  if (value === null) return null
  if (typeof value === 'string' && value.trim() === '') return null
  return normalizeSpanishPhone(value)
}

export function formatSpanishPhoneInput(value: string): string {
  return normalizeSpanishPhone(value) ?? value.trim()
}
