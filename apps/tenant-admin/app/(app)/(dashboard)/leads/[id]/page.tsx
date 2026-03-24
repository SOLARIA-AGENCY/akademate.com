'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import * as React from 'react'

interface Props { params: Promise<{ id: string }> }

export default function LeadDetailPage({ params }: Props) {
  const router = useRouter()
  const { id } = React.use(params)

  useEffect(() => {
    router.replace(`/inscripciones/${id}`)
  }, [router, id])

  return null
}
