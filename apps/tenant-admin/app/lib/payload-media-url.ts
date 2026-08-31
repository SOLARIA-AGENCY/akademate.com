export function canonicalizePayloadMediaUrl(src?: string | null): string | null {
  if (typeof src !== 'string') return null
  const trimmed = src.trim()
  if (!trimmed) return null
  const lower = trimmed.toLowerCase()
  if (lower.includes('placeholder')) return null
  if (lower.includes('/website/cep/')) return null
  if (lower.includes('/website/akademate/')) return null
  if (lower.includes('unsplash.com') || lower.includes('images.unsplash')) return null
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed
  if (trimmed.startsWith('/api/media/file/')) return trimmed
  if (trimmed.startsWith('/media/')) {
    return `/api/media/file/${trimmed.replace(/^\/media\//, '')}`
  }
  if (trimmed.startsWith('/')) return trimmed
  return `/api/media/file/${trimmed.replace(/^\/+/, '')}`
}

export function resolvePayloadMediaSrc(value: unknown): string | null {
  if (!value) return null
  if (typeof value === 'string') return canonicalizePayloadMediaUrl(value)
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>
    if (typeof record.url === 'string') return canonicalizePayloadMediaUrl(record.url)
    if (typeof record.filename === 'string') {
      return canonicalizePayloadMediaUrl(`/api/media/file/${record.filename}`)
    }
  }
  return null
}
