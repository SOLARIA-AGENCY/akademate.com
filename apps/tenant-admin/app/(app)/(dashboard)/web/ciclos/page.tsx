'use client'

import * as React from 'react'
import { Card, CardContent } from '@payload-config/components/ui/card'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { Badge } from '@payload-config/components/ui/badge'
import { Button } from '@payload-config/components/ui/button'
import { Switch } from '@payload-config/components/ui/switch'
import { useToast, type UseToastReturn } from '@payload-config/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { Globe, GraduationCap, ExternalLink, Pencil, ImageIcon } from 'lucide-react'

interface CycleApiItem {
  id: string
  name?: string
  slug?: string
  level?: 'grado_superior' | 'grado_medio' | 'fp_basica' | 'certificado_profesionalidad'
  active?: boolean
  image?: { url?: string; filename?: string } | string | number | null
}

interface CycleApiResponse {
  docs?: CycleApiItem[]
}

function getLevelLabel(level?: string): string {
  switch (level) {
    case 'grado_superior':
      return 'Grado Superior'
    case 'grado_medio':
      return 'Grado Medio'
    case 'fp_basica':
      return 'FP Basica'
    case 'certificado_profesionalidad':
      return 'Certificado Prof.'
    default:
      return 'Sin nivel'
  }
}

function getLevelVariant(level?: string): 'default' | 'secondary' | 'outline' {
  switch (level) {
    case 'grado_superior':
      return 'default'
    case 'grado_medio':
      return 'secondary'
    default:
      return 'outline'
  }
}

function getImageUrl(image: CycleApiItem['image']): string | null {
  if (!image) return null
  if (typeof image === 'number') return null
  if (typeof image === 'string') return image
  if (typeof image === 'object' && image !== null) {
    if (image.url) return image.url
    if (image.filename) return `/media/${image.filename}`
  }
  return null
}

export default function WebCiclosPage() {
  const router = useRouter()
  const { toast } = useToast() as UseToastReturn
  const [cycles, setCycles] = React.useState<CycleApiItem[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [togglingIds, setTogglingIds] = React.useState<Set<string>>(new Set())

  const fetchCycles = React.useCallback(async () => {
    try {
      setErrorMessage(null)
      const response = await fetch('/api/cycles?limit=100&sort=order_display&depth=1', {
        cache: 'no-cache',
      })
      if (!response.ok) {
        throw new Error('No se pudieron cargar los ciclos')
      }
      const payload: CycleApiResponse = (await response.json()) as CycleApiResponse
      setCycles(Array.isArray(payload.docs) ? payload.docs : [])
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Error al cargar ciclos')
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void fetchCycles()
  }, [fetchCycles])

  const handleToggleActive = React.useCallback(
    async (cycleId: string, newActive: boolean) => {
      setTogglingIds((prev) => new Set(prev).add(cycleId))
      try {
        const response = await fetch(`/api/cycles/${cycleId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ active: newActive }),
        })

        if (!response.ok) {
          throw new Error('No se pudo actualizar el estado')
        }

        setCycles((prev) =>
          prev.map((c) => (c.id === cycleId ? { ...c, active: newActive } : c)),
        )

        toast({
          title: newActive ? 'Pagina publicada' : 'Pagina despublicada',
          description: `El ciclo se ha ${newActive ? 'publicado' : 'ocultado'} en la web`,
        })
      } catch {
        toast({
          title: 'Error',
          description: 'No se pudo cambiar el estado de publicacion',
          variant: 'destructive',
        })
      } finally {
        setTogglingIds((prev) => {
          const next = new Set(prev)
          next.delete(cycleId)
          return next
        })
      }
    },
    [toast],
  )

  const publishedCount = cycles.filter((c) => c.active).length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion de Paginas Web — Ciclos"
        description="Administra la visibilidad de cada ciclo formativo en la web publica. Activa o desactiva las paginas de cada ciclo."
        icon={Globe}
        badge={
          <Badge variant="secondary">
            {publishedCount} / {cycles.length} publicados
          </Badge>
        }
      />

      {isLoading && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </CardContent>
        </Card>
      )}

      {errorMessage && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">
          {errorMessage}
        </div>
      )}

      {!isLoading && !errorMessage && cycles.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center space-y-3">
            <GraduationCap className="h-12 w-12 text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold">No hay ciclos</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Crea ciclos formativos primero desde la seccion de Ciclos.
              </p>
            </div>
            <Button variant="outline" onClick={() => router.push('/dashboard/ciclos')}>
              Ir a Ciclos
            </Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && cycles.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {cycles.map((cycle) => {
                const imageUrl = getImageUrl(cycle.image)
                const isToggling = togglingIds.has(cycle.id)
                const isPublished = Boolean(cycle.active)

                return (
                  <div
                    key={cycle.id}
                    className="flex items-center gap-4 px-4 py-3 sm:px-6"
                  >
                    {/* Thumbnail */}
                    <div className="hidden sm:block h-10 w-[60px] flex-shrink-0 rounded overflow-hidden bg-muted">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={cycle.name ?? 'Ciclo'}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Name & Level */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {cycle.name ?? 'Ciclo sin nombre'}
                      </p>
                      <Badge
                        variant={getLevelVariant(cycle.level)}
                        className="mt-1 text-xs"
                      >
                        {getLevelLabel(cycle.level)}
                      </Badge>
                    </div>

                    {/* Status toggle */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-muted-foreground hidden md:inline">
                        {isPublished ? 'Publicada' : 'No publicada'}
                      </span>
                      <Switch
                        checked={isPublished}
                        disabled={isToggling}
                        onCheckedChange={(value) =>
                          void handleToggleActive(cycle.id, value)
                        }
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={!isPublished}
                        className="h-8 w-8 p-0"
                        title="Ver pagina publica"
                        onClick={() => {
                          if (cycle.slug) {
                            window.open(`/p/ciclos/${cycle.slug}`, '_blank')
                          }
                        }}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        title="Editar ciclo"
                        onClick={() => router.push(`/dashboard/ciclos/${cycle.id}`)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
