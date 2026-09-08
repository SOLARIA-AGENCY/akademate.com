import { publicJsonLd } from '@/lib/seo-schema'
import type { Locale } from '@/lib/i18n/routing'

export function JsonLd({ locale, pathname = '/' }: { locale: Locale; pathname?: string }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(publicJsonLd(locale, pathname)) }}
    />
  )
}
