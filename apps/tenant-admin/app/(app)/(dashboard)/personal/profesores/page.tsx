'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ProfesoresPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/dashboard/profesores')
  }, [router])
  return null
}
