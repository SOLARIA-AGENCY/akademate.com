'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Switch } from '@payload-config/components/ui/switch'
import { Input } from '@payload-config/components/ui/input'
import { Button } from '@payload-config/components/ui/button'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { useToast, type UseToastReturn } from '@payload-config/hooks/use-toast'
import { ToggleLeft } from 'lucide-react'

interface FeatureFlag {
  key: string
  type: 'boolean' | 'percentage' | 'variant'
  defaultValue: unknown
  overrideValue: unknown
  effectiveValue: unknown
  planRequirement?: string | null
  eligible: boolean
}

interface FeatureFlagsResponse {
  flags?: FeatureFlag[]
}

export default function FeatureFlagsPage() {
  const tenantId = '123e4567-e89b-12d3-a456-426614174001'
   
  const { toast } = useToast() as UseToastReturn
  const [flags, setFlags] = useState<FeatureFlag[]>([])
  const [loading, setLoading] = useState(true)

  const fetchFlags = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/feature-flags?tenantId=${tenantId}`)
      if (!response.ok) {
        throw new Error('Failed to load flags')
      }
      const data: FeatureFlagsResponse = await response.json() as FeatureFlagsResponse
      setFlags(data.flags ?? [])
    } catch {
       
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los feature flags',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    void fetchFlags()
  }, [fetchFlags])

  const updateFlag = useCallback(async (key: string, value: unknown) => {
    try {
      const response = await fetch('/api/feature-flags', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, key, value }),
      })

      if (!response.ok) {
        throw new Error('Failed to update flag')
      }

      await fetchFlags()
       
      toast({
        title: 'Flag actualizado',
        description: `Se actualizó ${key} correctamente`,
      })
    } catch {
       
      toast({
        title: 'Error',
        description: `No se pudo actualizar ${key}`,
        variant: 'destructive',
      })
    }
  }, [fetchFlags, toast])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Feature Flags</CardTitle>
          <CardDescription>Gestiona activaciones y rollouts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-10">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Feature Flags"
        description="Rollouts por tenant y plan"
        icon={ToggleLeft}
      />

      <Card>
        <CardHeader>
          <CardTitle>Feature Flags</CardTitle>
          <CardDescription>Rollouts por tenant y plan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {flags.map((flag) => (
              <div key={flag.key} className="flex flex-col gap-3 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{flag.key}</p>
                    <p className="text-xs text-muted-foreground">
                      Tipo: {flag.type} {flag.planRequirement ? `· Plan mínimo: ${flag.planRequirement}` : ''}
                    </p>
                  </div>
                  {!flag.eligible && (
                    <span className="text-xs text-destructive">No elegible</span>
                  )}
                </div>

                {flag.type === 'boolean' && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Activado</span>
                    <Switch
                      checked={Boolean(flag.overrideValue ?? flag.effectiveValue)}
                      onCheckedChange={(value) => void updateFlag(flag.key, value)}
                    />
                  </div>
                )}

                {flag.type === 'percentage' && (
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      defaultValue={Number(flag.overrideValue ?? flag.defaultValue ?? 0)}
                      onBlur={(event: React.FocusEvent<HTMLInputElement>) => {
                        const nextValue = Number(event.target.value)
                        if (!Number.isNaN(nextValue)) {
                          void updateFlag(flag.key, nextValue)
                        }
                      }}
                    />
                    <span className="text-xs text-muted-foreground">% rollout</span>
                  </div>
                )}

                {flag.type === 'variant' && (
                  <div className="text-xs text-muted-foreground break-all">
                    {JSON.stringify(flag.overrideValue ?? flag.defaultValue)}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Valor efectivo:</span>
                  <span className="text-xs font-medium">
                    {JSON.stringify(flag.effectiveValue)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end">
            <Button variant="outline" onClick={() => void fetchFlags()}>
              Recargar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
