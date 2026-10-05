export type ClientIp = {
  address: string | null
  source: 'x-forwarded-for' | 'x-real-ip' | 'untrusted'
}

export function resolveClientIp(request: Request): ClientIp {
  if (process.env.TRUST_PROXY_HEADERS !== 'true') {
    return { address: null, source: 'untrusted' }
  }
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  if (forwarded) return { address: forwarded, source: 'x-forwarded-for' }
  const realIp = request.headers.get('x-real-ip')?.trim()
  if (realIp) return { address: realIp, source: 'x-real-ip' }
  return { address: null, source: 'untrusted' }
}
