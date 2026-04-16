const SHARED_COOKIE_BASE_DOMAINS = ['akademate.com', 'akademate.io'] as const

function normalizeHost(hostHeader?: string | null): string {
  const host = (hostHeader ?? '').split(',')[0]?.trim().toLowerCase() ?? ''
  return host.replace(/:\d+$/, '')
}

export function resolveSharedCookieDomain(hostHeader?: string | null): string | undefined {
  const host = normalizeHost(hostHeader)
  if (!host || host === 'localhost' || host === '127.0.0.1') return undefined
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) return undefined

  for (const baseDomain of SHARED_COOKIE_BASE_DOMAINS) {
    if (host === baseDomain || host.endsWith(`.${baseDomain}`)) {
      return `.${baseDomain}`
    }
  }

  return undefined
}
