'use client'

import { useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { canUseHistoryBack, safeFormReturnTo } from '@/app/lib/form-return-to'

export function useFormReturnNavigation(fallback: string) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = safeFormReturnTo(searchParams.get('returnTo'), '')

  const goBack = useCallback(() => {
    if (returnTo) {
      router.push(returnTo)
      return
    }
    if (canUseHistoryBack()) {
      router.back()
      return
    }
    router.push(fallback)
  }, [fallback, returnTo, router])

  return { goBack, returnTo: returnTo || fallback }
}
