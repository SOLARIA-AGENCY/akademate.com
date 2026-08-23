import { getPublicJsonLd } from '@/lib/public-json-ld'

export function JsonLd() {
  const jsonLd = getPublicJsonLd()

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
    />
  )
}
