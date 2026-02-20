'use client'

import { useEffect, useMemo, useState } from 'react'

type ServiceState = 'online' | 'offline' | 'degraded'

interface ServiceStatus {
  key: string
  label: string
  state: ServiceState
  latencyMs: number | null
}

function dotClass(state: ServiceState): string {
  if (state === 'online') return 'bg-emerald-400'
  if (state === 'degraded') return 'bg-amber-400'
  return 'bg-red-400'
}

export function ServiceStatusBar() {
  const [services, setServices] = useState<ServiceStatus[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const pollStatus = async () => {
      try {
        const response = await fetch('/api/services/status', { cache: 'no-store' })
        if (!response.ok) return
        const data = (await response.json()) as { services?: ServiceStatus[] }
        if (mounted) setServices(data.services ?? [])
      } catch {
        if (mounted) setServices([])
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    void pollStatus()
    const intervalId = setInterval(() => void pollStatus(), 30_000)
    return () => {
      mounted = false
      clearInterval(intervalId)
    }
  }, [])

  const summary = useMemo(() => {
    if (!services.length) return 'sin datos'
    return services
      .map((service) => `${service.label}:${service.state}`)
      .join(' · ')
  }, [services])

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-xl backdrop-blur-sm">
      <div className="flex flex-wrap items-center gap-2.5 text-xs text-muted-foreground md:gap-3">
        <span className="font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Estado de servicios
        </span>
        {isLoading ? (
          <span className="text-muted-foreground/80">comprobando...</span>
        ) : (
          services.map((service) => (
            <span
              key={service.key}
              className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2 py-1"
            >
              <span className={`h-2.5 w-2.5 rounded-full ${dotClass(service.state)}`} />
              <span className="text-foreground">{service.label}</span>
              {typeof service.latencyMs === 'number' ? (
                <span className="text-muted-foreground">({service.latencyMs}ms)</span>
              ) : null}
            </span>
          ))
        )}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{summary}</p>
    </div>
  )
}
