export const STAFF_EMAIL_ERROR = 'Introduce un email válido. Ejemplo: nombre@dominio.com.'

export const STAFF_NIF_ERROR =
  'Introduce un DNI, NIF, NIE o documento válido con 3 a 20 caracteres alfanuméricos.'

export const STAFF_EMAIL_DUPLICATE_ERROR = 'Ya existe una ficha de personal con este email.'
export const STAFF_NIF_DUPLICATE_ERROR = 'Ya existe una ficha de personal con este DNI/NIF/NIE.'

const emailPattern = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i
const nifPattern = /^[A-Z0-9]{3,20}$/
const invisibleCharsPattern = /[\u200B-\u200D\u2060\uFEFF]/g
const unicodeWhitespacePattern = /[\s\u00A0\u1680\u180E\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]+/g
const commonNifSeparatorsPattern = /[\-./_,;:]/g
const nifPrefixPattern = /^(DNI|NIF|NIE|DOCUMENTO|DOC)\.?/i

export type StaffContactValidationReason =
  | 'empty'
  | 'invalid_email_format'
  | 'invalid_nif_characters'
  | 'invalid_nif_length'

export type StaffContactValidationResult =
  | { valid: true; value: string | null; reason?: 'empty' }
  | { valid: false; value: string | null; reason: StaffContactValidationReason; error: string }

function normalizePastedText(value: unknown): string | null {
  if (value === null || value === undefined) return null
  if (typeof value !== 'string') return null

  const normalized = value
    .normalize('NFKC')
    .replace(invisibleCharsPattern, '')
    .replace(/[\u2010-\u2015\u2212]/g, '-')
    .trim()

  return normalized.length > 0 ? normalized : null
}

export function normalizeStaffEmail(value: unknown): string | null {
  const pasted = normalizePastedText(value)
  if (!pasted) return null

  const normalized = pasted.replace(unicodeWhitespacePattern, '').toLowerCase()
  return normalized.length > 0 ? normalized : null
}

export function validateStaffEmail(value: unknown): StaffContactValidationResult {
  const normalized = normalizeStaffEmail(value)
  if (!normalized) return { valid: true, value: null, reason: 'empty' }
  if (!emailPattern.test(normalized)) {
    return {
      valid: false,
      value: normalized,
      reason: 'invalid_email_format',
      error: STAFF_EMAIL_ERROR,
    }
  }

  const [localPart, domain] = normalized.split('@')
  const domainLabels = domain?.split('.') ?? []
  const hasInvalidDomain =
    !localPart ||
    !domain ||
    domain.endsWith('.') ||
    domain.includes('..') ||
    domainLabels.some((label) => !label || label.startsWith('-') || label.endsWith('-'))

  if (hasInvalidDomain) {
    return {
      valid: false,
      value: normalized,
      reason: 'invalid_email_format',
      error: STAFF_EMAIL_ERROR,
    }
  }

  return { valid: true, value: normalized }
}

export function isValidStaffEmail(value: string | null): boolean {
  return validateStaffEmail(value).valid
}

export function normalizeStaffNif(value: unknown): string | null {
  const pasted = normalizePastedText(value)
  if (!pasted) return null

  const normalized = pasted
    .replace(nifPrefixPattern, '')
    .replace(unicodeWhitespacePattern, '')
    .replace(commonNifSeparatorsPattern, '')
    .toUpperCase()

  return normalized.length > 0 ? normalized : null
}

export function validateStaffNif(value: unknown): StaffContactValidationResult {
  const normalized = normalizeStaffNif(value)
  if (!normalized) return { valid: true, value: null, reason: 'empty' }

  if (/[^A-Z0-9]/.test(normalized)) {
    return {
      valid: false,
      value: normalized,
      reason: 'invalid_nif_characters',
      error: STAFF_NIF_ERROR,
    }
  }

  if (!nifPattern.test(normalized)) {
    return {
      valid: false,
      value: normalized,
      reason: 'invalid_nif_length',
      error: STAFF_NIF_ERROR,
    }
  }

  return { valid: true, value: normalized }
}

export function isValidStaffNif(value: string | null): boolean {
  return validateStaffNif(value).valid
}

export function formatStaffNifInput(value: string): string {
  return normalizeStaffNif(value) ?? ''
}

export function formatStaffEmailInput(value: string): string {
  return normalizeStaffEmail(value) ?? ''
}
