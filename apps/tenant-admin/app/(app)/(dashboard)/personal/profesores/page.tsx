'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ProfesoresPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/personal?tab=profesores')
  }, [router])
  return null
}
