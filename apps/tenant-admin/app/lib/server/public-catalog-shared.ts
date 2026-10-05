import { createHash } from 'crypto'

export const PUBLIC_CATALOG_VERSION = 'v3'
export const PUBLIC_CATALOG_TTL_SECONDS = 60
export const PUBLIC_CATALOG_FORBIDDEN_KEYS = ['email', 'password', 'dni', 'key_hash', 'token', 'api_key'] as const

export class PublicCatalogError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message)
    this.name = 'PublicCatalogError'
  }
}

export function hashCatalogVersion(parts: Array<string | number | null | undefined>): string {
  return createHash('sha256').update(parts.filter(Boolean).join('|')).digest('hex')
}

export function resolvePublicCatalogHost(request: Request): string {
  const urlHost = new URL(request.url).searchParams.get('host')
  const forwarded = request.headers.get('x-forwarded-host')
  const host = request.headers.get('host')
  const configured = typeof process !== 'undefined' ? process.env.CEP_PUBLIC_HOST : undefined
  const raw = urlHost || forwarded || host || configured || 'cepformacion.akademate.com'
  return raw.toLowerCase().replace(/:\d+$/, '').split(',')[0]?.trim() || 'cepformacion.akademate.com'
}

export function assertPublicCatalogHasNoPii(value: unknown, path = 'root'): void {
  if (!value || typeof value !== 'object') return
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertPublicCatalogHasNoPii(item, `${path}[${index}]`))
    return
  }
  for (const [key, nested] of Object.entries(value)) {
    if ((PUBLIC_CATALOG_FORBIDDEN_KEYS as readonly string[]).includes(key.toLowerCase())) {
      throw new PublicCatalogError('PII_LEAK', `Forbidden key ${key} at ${path}`)
    }
    assertPublicCatalogHasNoPii(nested, `${path}.${key}`)
  }
}
