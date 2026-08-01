'use client'

import { useEffect, useState } from 'react'

import { CampusApiError, type CampusDashboard, fetchCampusDashboard } from './campus-client'
import { useSession } from './session-context'

export function useCampusDashboard() {
  const { refreshSession } = useSession()
  const [dashboard, setDashboard] = useState<CampusDashboard | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? ''

  useEffect(() => {
    let active = true
    setDashboard(null)
    setIsLoading(true)
    setError(null)

    fetchCampusDashboard(apiBaseUrl)
      .then((result) => {
        if (!active) return
        setDashboard(result)
        setIsLoading(false)
      })
      .catch((cause) => {
        if (!active) return
        setDashboard(null)
        setIsLoading(false)
        if (cause instanceof CampusApiError && cause.status === 401) void refreshSession()
        else setError(cause instanceof Error ? cause.message : 'No se pudo cargar el campus.')
      })

    return () => {
      active = false
    }
  }, [apiBaseUrl, refreshSession])

  return { dashboard, error, isLoading }
}
