'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Input } from '@payload-config/components/ui/input'
import { Label } from '@payload-config/components/ui/label'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { ArrowLeft, Save, Loader2, MapPin } from 'lucide-react'

interface CampusApiResponse {
  id?: string
  name?: string
  errors?: { message: string }[]
}

export default function NewSedePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    postal_code: '',
    city: '',
    phone: '',
    email: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/campuses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const result = (await response.json()) as CampusApiResponse
        const errorMsg =
          result.errors?.[0]?.message ?? 'Error al crear la sede'
        throw new Error(errorMsg)
      }

      const result = (await response.json()) as CampusApiResponse

      if (result.id) {
        router.push(`/sedes/${result.id}`)
      } else {
        router.push('/sedes')
      }
    } catch (err) {
      console.error('Error creating campus:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Nueva Sede"
        description="Registra un nuevo centro o sede"
        icon={MapPin}
        actions={
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        }
      />

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Datos de la Sede</CardTitle>
            <CardDescription>
              Completa la informaci&oacute;n del nuevo centro. Los campos marcados con * son
              obligatorios.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="p-4 rounded-md bg-destructive/10 text-destructive text-sm">
                <p className="font-semibold">Error al crear la sede</p>
                <p>{error}</p>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Nombre <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleChange('name', e.target.value)
                  }
                  required
                  placeholder="Sede Central"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">
                  Ciudad <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleChange('city', e.target.value)
                  }
                  required
                  placeholder="Santa Cruz de Tenerife"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">
                Direcci&oacute;n <span className="text-destructive">*</span>
              </Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleChange('address', e.target.value)
                }
                required
                placeholder="Calle Principal 123"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="postal_code">C&oacute;digo Postal</Label>
                <Input
                  id="postal_code"
                  value={formData.postal_code}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleChange('postal_code', e.target.value)
                  }
                  placeholder="38001"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Tel&eacute;fono</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleChange('phone', e.target.value)
                  }
                  placeholder="+34 922 123 456"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleChange('email', e.target.value)
                  }
                  placeholder="info@sede.akademate.com"
                />
              </div>
            </div>

            <div className="flex gap-4 justify-end pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Crear Sede
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
