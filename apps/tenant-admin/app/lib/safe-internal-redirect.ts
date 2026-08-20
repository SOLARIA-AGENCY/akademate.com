const DEFAULT_REDIRECT = '/dashboard'

export function safeInternalRedirect(value: string | null | undefined): string {
  if (!value) return DEFAULT_REDIRECT
  if (!value.startsWith('/')) return DEFAULT_REDIRECT
  if (value.startsWith('//') || value.startsWith('/\\')) return DEFAULT_REDIRECT
  if (value.includes('://')) return DEFAULT_REDIRECT
  if (value.startsWith('/auth/')) return DEFAULT_REDIRECT
  return value
}
