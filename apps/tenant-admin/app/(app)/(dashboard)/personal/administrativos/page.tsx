'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdministrativosPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/dashboard/administrativo')
  }, [router])
  return null
}
