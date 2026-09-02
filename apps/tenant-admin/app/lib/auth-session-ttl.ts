export const SESSION_TTL_SECONDS = 60 * 60 * 12
export const REMEMBER_TTL_SECONDS = 60 * 60 * 24 * 30

export function sessionTtlSeconds(remember: boolean): number {
  return remember ? REMEMBER_TTL_SECONDS : SESSION_TTL_SECONDS
}

export function parseRememberFlag(value: unknown): boolean {
  return value === true || value === 'true' || value === '1' || value === 'on'
}
