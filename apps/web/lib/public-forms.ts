const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type ValidationResult = { ok: true } | { ok: false; error: string }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
export function validatePublicLeadInput(input: unknown): ValidationResult {
  if (!isRecord(input)) return { ok: false, error: 'Solicitud inválida' }
  if (typeof input.website === 'string' && input.website.trim()) {
    return { ok: false, error: 'Solicitud inválida' }
  }
  if (input.privacy_policy_accepted !== true || input.gdpr_consent !== true) {
    return { ok: false, error: 'Debes aceptar la política de privacidad' }
  }
  if (typeof input.email !== 'string' || !EMAIL_PATTERN.test(input.email.trim()) || input.email.length > 254) {
    return { ok: false, error: 'Email inválido' }
  }
  const message = input.message ?? input.mensaje
  if (typeof message === 'string' && message.length > 5000) {
    return { ok: false, error: 'El mensaje es demasiado largo' }
  }
  return { ok: true }
}

export function validateWaitlistInput(input: unknown): ValidationResult {
  if (!isRecord(input)) return { ok: false, error: 'Solicitud inválida' }
  if (input.privacy_policy_accepted !== true) {
    return { ok: false, error: 'Debes aceptar la política de privacidad' }
  }
  if (typeof input.email !== 'string' || !EMAIL_PATTERN.test(input.email.trim()) || input.email.length > 254) {
    return { ok: false, error: 'Email inválido' }
  }
  return { ok: true }
}
