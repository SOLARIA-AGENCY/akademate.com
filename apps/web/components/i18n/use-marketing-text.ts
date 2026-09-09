'use client'

import { useLocale } from '@/components/i18n/locale-provider'
import { marketingText } from '@/lib/i18n/marketing-copy'

/**
 * Localises commercial source copy with the request locale held by LocaleProvider.
 * Spanish copy is deliberately strict: an unregistered phrase throws instead of
 * silently shipping English on an ES route.
 */
export function useMarketingText() {
  const locale = useLocale()
  return (source: string) => marketingText(locale, source)
}
