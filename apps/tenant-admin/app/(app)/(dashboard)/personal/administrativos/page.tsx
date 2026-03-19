'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdministrativosPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/personal?tab=administrativos')
  }, [router])
  return null
}
