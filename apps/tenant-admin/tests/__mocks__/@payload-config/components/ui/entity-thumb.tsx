import React from 'react'

export function EntityThumb({
  alt,
}: {
  src?: string | null
  alt: string
  fallback?: string
  size?: string
  className?: string
}) {
  return <div data-testid="entity-thumb" aria-label={alt} />
}
