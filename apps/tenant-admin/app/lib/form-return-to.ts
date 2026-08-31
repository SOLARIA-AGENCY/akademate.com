/** Same-origin relative path only. Blocks protocol-relative and public/auth/api targets. */
export function safeFormReturnTo(raw: string | null | undefined, fallback: string): string {
  if (!raw) return fallback
  let value = raw.trim()
  try {
    value = decodeURIComponent(value)
  } catch {
    return fallback
  }
  if (!value.startsWith('/')) return fallback
  if (value.startsWith('//') || value.startsWith('/\\')) return fallback
  if (value.includes('://') || value.includes('\\')) return fallback
  const pathOnly = value.split('?')[0] ?? value
  if (
    pathOnly === '/api' ||
    pathOnly.startsWith('/api/') ||
    pathOnly.startsWith('/auth') ||
    pathOnly.startsWith('/p/')
  ) {
    return fallback
  }
  return value
}

export function convocatoriaNuevaHref(
  returnTo: string,
  extra?: Record<string, string>
): string {
  const params = new URLSearchParams()
  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      if (value) params.set(key, value)
    }
  }
  params.set('returnTo', returnTo)
  return `/programacion/nueva?${params.toString()}`
}

export function canUseHistoryBack(): boolean {
  if (typeof window === 'undefined') return false
  if (window.history.length <= 1) return false
  const ref = document.referrer
  if (!ref) return false
  try {
    return new URL(ref).origin === window.location.origin
  } catch {
    return false
  }
}
