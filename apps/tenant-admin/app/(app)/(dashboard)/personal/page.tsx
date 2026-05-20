'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function PersonalPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const tab = searchParams.get('tab')
    router.replace(tab === 'administrativos' ? '/dashboard/administrativo' : '/dashboard/profesores')
  }, [router, searchParams])

  return null
}
