'use client'

import React, { useCallback, useEffect, useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@payload-config/components/ui/card'
import { Switch } from '@payload-config/components/ui/switch'
import { Input } from '@payload-config/components/ui/input'
import { Button } from '@payload-config/components/ui/button'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { useToast, type UseToastReturn } from '@payload-config/hooks/use-toast'
import { ToggleLeft } from 'lucide-react'
import { useTenantBranding } from '@/app/providers/tenant-branding'

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
  const { branding } = useTenantBranding()
  const tenantId = branding.tenantId

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
      const data: FeatureFlagsResponse = (await response.json()) as FeatureFlagsResponse
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
  }, [toast, tenantId])

  useEffect(() => {
    void fetchFlags()
  }, [fetchFlags])

  const updateFlag = useCallback(
    async (key: string, value: unknown) => {
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
    },
    [fetchFlags, toast, tenantId]
  )

  if (loading) {
    return (
      <Card data-oid="_68t2oo">
        <CardHeader data-oid=".ntu.99">
          <CardTitle data-oid="u2f-rrl">Feature Flags</CardTitle>
          <CardDescription data-oid="7-0-9ws">Gestiona activaciones y rollouts</CardDescription>
        </CardHeader>
        <CardContent data-oid="07pis_7">
          <div className="flex items-center justify-center py-10" data-oid="il9mncg">
            <div
              className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"
              data-oid="1z-ykm:"
            />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6" data-oid="5b0e9z2">
      <PageHeader
        title="Feature Flags"
        description="Rollouts por tenant y plan"
        icon={ToggleLeft}
        data-oid="9.too6j"
      />

      <Card data-oid="lghf3cd">
        <CardHeader data-oid="dcv:5_c">
          <CardTitle data-oid="wa5d4qt">Feature Flags</CardTitle>
          <CardDescription data-oid="qxw0u37">Rollouts por tenant y plan</CardDescription>
        </CardHeader>
        <CardContent data-oid="6k518d0">
          <div className="space-y-4" data-oid="md55jbm">
            {flags.map((flag) => (
              <div
                key={flag.key}
                className="flex flex-col gap-3 rounded-lg border p-4"
                data-oid="f4i7nam"
              >
                <div className="flex items-center justify-between" data-oid="pyggz2r">
                  <div data-oid="1jmtp0l">
                    <p className="text-sm font-semibold" data-oid="k51fjej">
                      {flag.key}
                    </p>
                    <p className="text-xs text-muted-foreground" data-oid="af64v7v">
                      Tipo: {flag.type}{' '}
                      {flag.planRequirement ? `· Plan mínimo: ${flag.planRequirement}` : ''}
                    </p>
                  </div>
                  {!flag.eligible && (
                    <span className="text-xs text-destructive" data-oid=".ak-hyn">
                      No elegible
                    </span>
                  )}
                </div>

                {flag.type === 'boolean' && (
                  <div className="flex items-center justify-between" data-oid="87scyff">
                    <span className="text-sm" data-oid="c71g4.y">
                      Activado
                    </span>
                    <Switch
                      checked={Boolean(flag.overrideValue ?? flag.effectiveValue)}
                      onCheckedChange={(value) => void updateFlag(flag.key, value)}
                      data-oid="c34t2q1"
                    />
                  </div>
                )}

                {flag.type === 'percentage' && (
                  <div className="flex items-center gap-3" data-oid="2-d70j7">
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
                      data-oid="h_8e0w5"
                    />

                    <span className="text-xs text-muted-foreground" data-oid="08k-9_9">
                      % rollout
                    </span>
                  </div>
                )}

                {flag.type === 'variant' && (
                  <div className="text-xs text-muted-foreground break-all" data-oid="l.x5u:t">
                    {JSON.stringify(flag.overrideValue ?? flag.defaultValue)}
                  </div>
                )}

                <div className="flex items-center gap-2" data-oid="shduc93">
                  <span className="text-xs text-muted-foreground" data-oid="h3ll41z">
                    Valor efectivo:
                  </span>
                  <span className="text-xs font-medium" data-oid="4jw8a.r">
                    {JSON.stringify(flag.effectiveValue)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end" data-oid="7nyeqz7">
            <Button variant="outline" onClick={() => void fetchFlags()} data-oid="9ppqzi7">
              Recargar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
