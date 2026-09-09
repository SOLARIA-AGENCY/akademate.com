'use client'

import { useLocale } from '@/components/i18n/locale-provider'
import { getPreviewCopy } from '@/lib/i18n/preview-copy'

export function usePreviewCopy() {
  return getPreviewCopy(useLocale())
}
