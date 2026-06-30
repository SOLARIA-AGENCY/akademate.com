export const STAFF_EMAIL_ERROR = 'Introduce un email válido. Ejemplo: nombre@dominio.com.'

export const STAFF_NIF_ERROR =
  'Introduce un DNI, NIF, NIE o documento válido con 3 a 20 caracteres alfanuméricos.'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const nifPattern = /^[A-Z0-9-]{3,20}$/

export function normalizeStaffEmail(value: unknown): string | null {
  if (value === null || value === undefined) return null
  if (typeof value !== 'string') return null
  const normalized = value.trim().toLowerCase()
  return normalized.length > 0 ? normalized : null
}

export function isValidStaffEmail(value: string | null): boolean {
  if (!value) return true
  return emailPattern.test(value)
}

export function normalizeStaffNif(value: unknown): string | null {
  if (value === null || value === undefined) return null
  if (typeof value !== 'string') return null
  const normalized = value.trim().toUpperCase().replace(/\s+/g, '')
  return normalized.length > 0 ? normalized : null
}

export function isValidStaffNif(value: string | null): boolean {
  if (!value) return true
  return nifPattern.test(value)
}

export function formatStaffNifInput(value: string): string {
  return normalizeStaffNif(value) ?? ''
}

export function formatStaffEmailInput(value: string): string {
  return normalizeStaffEmail(value) ?? ''
}
