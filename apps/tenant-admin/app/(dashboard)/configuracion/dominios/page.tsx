'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Input } from '@payload-config/components/ui/input'
import { Label } from '@payload-config/components/ui/label'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { Check, Globe, Plus, Save, Trash2 } from 'lucide-react'

export default function DominiosPage() {
  const tenantId = '123e4567-e89b-12d3-a456-426614174001'
  const [domains, setDomains] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showSaveSuccess, setShowSaveSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const fetchDomains = async () => {
      try {
        setErrorMessage(null)
        const response = await fetch(`/api/config?section=domains&tenantId=${tenantId}`)
        if (!response.ok) {
          throw new Error('No se pudo cargar la configuración de dominios')
        }

        const payload = await response.json()
        setDomains(Array.isArray(payload.data) ? payload.data : [])
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Error al cargar dominios')
        setDomains([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchDomains()
  }, [tenantId])

  const updateDomain = (index: number, value: string) => {
    setDomains((prev) => prev.map((domain, i) => (i === index ? value : domain)))
  }

  const addDomain = () => {
    setDomains((prev) => [...prev, ''])
  }

  const removeDomain = (index: number) => {
    setDomains((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      setErrorMessage(null)
      const response = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: 'domains',
          tenantId,
          data: domains.filter((domain) => domain.trim().length > 0),
        }),
      })

      if (!response.ok) {
        throw new Error('No se pudo guardar la configuración de dominios')
      }

      setShowSaveSuccess(true)
      setTimeout(() => setShowSaveSuccess(false), 2500)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Error al guardar dominios')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Dominios"
        description="Gestiona los dominios principales y alternativos del tenant"
        icon={Globe}
        actions={(
          <Button onClick={handleSave} disabled={isSaving || isLoading}>
            <Save className="mr-2 h-4 w-4" />
            Guardar cambios
          </Button>
        )}
      />

      {showSaveSuccess && (
        <div className="bg-success/10 border border-success/20 text-success px-4 py-3 rounded-lg flex items-center gap-2">
          <Check className="h-5 w-5" />
          <span>Dominios guardados correctamente</span>
        </div>
      )}

      {errorMessage && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
          {errorMessage}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Dominios configurados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {domains.length === 0 && !isLoading && (
              <p className="text-sm text-muted-foreground">No hay dominios configurados.</p>
            )}

            {domains.map((domain, index) => (
              <div key={`${domain}-${index}`} className="flex items-center gap-2">
                <div className="flex-1">
                  <Label className="sr-only" htmlFor={`domain-${index}`}>
                    Dominio {index + 1}
                  </Label>
                  <Input
                    id={`domain-${index}`}
                    placeholder="midominio.com"
                    value={domain}
                    onChange={(event) => updateDomain(index, event.target.value)}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => removeDomain(index)}
                  aria-label="Eliminar dominio"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <Button type="button" variant="outline" onClick={addDomain}>
            <Plus className="mr-2 h-4 w-4" />
            Añadir dominio
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
