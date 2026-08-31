'use client'

import { useEffect, useState } from 'react'

export type CampusIdentityMap = Record<string, string>

function resolveCampusImage(image: unknown): string | null {
  if (typeof image === 'string' && image.trim()) return image.trim()
  if (image && typeof image === 'object' && 'url' in image) {
    const url = (image as { url?: unknown }).url
    if (typeof url === 'string' && url.trim()) return url.trim()
  }
  return null
}

export function isStockAcademicCover(src?: string | null): boolean {
  if (typeof src !== 'string') return true
  const trimmed = src.trim().toLowerCase()
  if (!trimmed) return true
  return (
    trimmed.includes('/website/akademate/') ||
    trimmed.includes('/website/cep/') ||
    trimmed.includes('/stock/') ||
    trimmed.includes('placeholder') ||
    trimmed.includes('unsplash.com')
  )
}

export function buildCampusIdentityMap(
  docs: Array<{ name?: string | null; image?: unknown }>,
): CampusIdentityMap {
  const map: CampusIdentityMap = {}
  for (const doc of docs) {
    const name = String(doc.name ?? '').trim()
    if (!name) continue
    const src = resolveCampusImage(doc.image)
    if (src && !isStockAcademicCover(src)) map[name] = src
  }
  return map
}

export function useCampusIdentityMap(): CampusIdentityMap {
  const [map, setMap] = useState<CampusIdentityMap>({})
  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch('/api/campuses?limit=50&sort=name', {
          credentials: 'include',
          cache: 'no-store',
        })
        if (!res.ok) return
        const json = (await res.json()) as { docs?: unknown[]; data?: unknown[] }
        const docs = (json.docs ?? json.data ?? []) as Array<{ name?: string | null; image?: unknown }>
        if (!cancelled) setMap(buildCampusIdentityMap(docs))
      } catch {
        if (!cancelled) setMap({})
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])
  return map
}
